-- Run after 202611260002 on monster-archive-test.
-- The fixture rolls back. No external image request or AI call is made.
BEGIN;

DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM public.admin_users WHERE is_active LIMIT 1;
  IF admin_id IS NULL THEN RAISE EXCEPTION 'An active test admin is required.'; END IF;
  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  IF has_function_privilege('anon', 'public.save_editorial_ai_draft_with_cover(uuid,timestamptz,uuid,jsonb,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous users must not save covers.';
  END IF;
END;
$$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE
  source_id uuid := gen_random_uuid();
  candidate_id uuid := gen_random_uuid();
  revision timestamptz;
  poster_url text := 'https://test.example.invalid/storage/v1/object/public/archive-images/news/' || candidate_id || '-' || repeat('a', 24) || '.jpg';
  original text := 'https://ygfamily.com/en/news/report/' || (910000000000 + floor(random() * 80000000000))::bigint::text;
  run_id uuid;
  saved_article_id uuid;
  response jsonb;
  fields jsonb := jsonb_build_object(
    'slug', 'test-cover-' || replace(candidate_id::text, '-', ''),
    'category', 'achievements', 'title_pt', 'Comunicado de teste', 'title_en', 'Test report',
    'summary_pt', 'Resumo de teste', 'summary_en', 'Test summary'
  );
BEGIN
  INSERT INTO public.editorial_sources(id, name, homepage_url, source_kind)
  VALUES (source_id, 'YG fixture ' || source_id, 'https://ygfamily.com/', 'official_group');
  INSERT INTO public.editorial_candidates(id, source_id, kind, source_url, canonical_url, original_title, status)
  VALUES (candidate_id, source_id, 'news', original, original, 'Synthetic BABYMONSTER candidate', 'accepted')
  RETURNING updated_at INTO revision;

  response := public.reserve_editorial_ai(candidate_id, revision, repeat('d', 64));
  IF response->>'state' <> 'reserved' THEN RAISE EXCEPTION 'Reservation failed: %', response->>'state'; END IF;
  run_id := (response->>'id')::uuid;
  IF NOT public.finish_editorial_ai(run_id, fields - 'slug', 100, 100, NULL) THEN RAISE EXCEPTION 'Fixture generation failed.'; END IF;

  response := public.save_editorial_ai_draft_with_cover(candidate_id, revision, run_id, fields, 'https://unrelated.test/cover.jpg');
  IF response->>'state' <> 'invalid_request' THEN RAISE EXCEPTION 'A foreign cover path was accepted.'; END IF;

  response := public.save_editorial_ai_draft_with_cover(candidate_id, revision, run_id, fields, poster_url);
  IF response->>'state' <> 'draft' OR (response->>'existing')::boolean THEN RAISE EXCEPTION 'Draft creation failed: %', response->>'state'; END IF;
  saved_article_id := (response->>'id')::uuid;
  IF NOT EXISTS (
    SELECT 1 FROM public.news_articles a JOIN public.news_article_sources s ON s.article_id = a.id
    WHERE a.id = saved_article_id AND a.status = 'draft' AND a.cover_image_url = poster_url
      AND a.cover_image_credit = 'YG Entertainment' AND a.cover_image_source_url = original AND s.source_url = original
  ) THEN RAISE EXCEPTION 'Cover credit, link, source or draft state is missing.'; END IF;
  UPDATE public.news_articles SET cover_image_url = NULL WHERE id = saved_article_id;
  response := public.save_editorial_ai_draft_with_cover(candidate_id, revision, run_id, fields, poster_url);
  IF NOT (response->>'existing')::boolean OR (response->>'id')::uuid <> article_id
    OR EXISTS (SELECT 1 FROM public.news_articles WHERE id = saved_article_id AND cover_image_url IS NOT NULL) THEN
    RAISE EXCEPTION 'Retry did not preserve the existing edit.';
  END IF;
  PERFORM set_config('ma236.cover_article', saved_article_id::text, true);
END;
$$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.news_articles WHERE id = current_setting('ma236.cover_article')::uuid) THEN
    RAISE EXCEPTION 'The draft was visible to anonymous users.';
  END IF;
END;
$$;
RESET ROLE;

SELECT 'PASS — imported cover, credit, source link, idempotent save and private draft' AS result;
ROLLBACK;
