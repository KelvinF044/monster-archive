-- Run in monster-archive-test with the SQL Editor owner role after phase 2.3.6.
-- Test records, ledger reservations and drafts are rolled back.
BEGIN;

DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM public.admin_users WHERE is_active LIMIT 1;
  IF admin_id IS NULL THEN RAISE EXCEPTION 'An active test admin is required.'; END IF;
  PERFORM set_config('ma236.admin', admin_id::text, true);
  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  IF has_table_privilege('authenticated', 'public.editorial_ai_runs', 'INSERT,UPDATE')
    OR has_function_privilege('anon', 'public.reserve_editorial_ai(uuid,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'AI ledger controls were bypassable.';
  END IF;
END;
$$;

SET LOCAL ROLE authenticated;
DO $$
DECLARE
  source_id uuid := gen_random_uuid();
  candidate_id uuid;
  revision timestamptz;
  kind text;
  category text;
  fixture_url text;
  run_id uuid;
  saved_id uuid;
  suffix text := replace(gen_random_uuid()::text, '-', '');
  response jsonb;
  suggestion jsonb;
BEGIN
  INSERT INTO public.editorial_sources (id, name, homepage_url, source_kind)
  VALUES (source_id, 'Synthetic assistance source', 'https://example.invalid/' || suffix, 'official_organizer');
  FOREACH kind IN ARRAY ARRAY['news','event'] LOOP
    candidate_id := gen_random_uuid();
    category := CASE kind WHEN 'news' THEN 'music_releases' ELSE 'concert' END;
    fixture_url := 'https://example.invalid/' || suffix || '/' || kind;
    suggestion := jsonb_build_object('category', category, 'title_pt', 'Título', 'title_en', 'Title',
      'summary_pt', 'Resumo', 'summary_en', 'Summary');
    INSERT INTO public.editorial_candidates (id, source_id, kind, source_url, canonical_url, original_title)
    VALUES (candidate_id, source_id, kind, fixture_url, fixture_url, 'Synthetic candidate') RETURNING updated_at INTO revision;
    response := public.reserve_editorial_ai(candidate_id, revision, repeat('a', 64));
    IF response->>'state' <> 'candidate_unavailable' THEN RAISE EXCEPTION 'Pending candidate was accepted.'; END IF;
    UPDATE public.editorial_candidates SET status = 'accepted' WHERE id = candidate_id RETURNING updated_at INTO revision;
    response := public.reserve_editorial_ai(candidate_id, revision, CASE kind WHEN 'news' THEN repeat('a', 64) ELSE repeat('b', 64) END);
    IF response->>'state' <> 'reserved' THEN RAISE EXCEPTION 'Reservation failed: %', response->>'state'; END IF;
    run_id := (response->>'id')::uuid;
    response := public.reserve_editorial_ai(candidate_id, revision, CASE kind WHEN 'news' THEN repeat('a', 64) ELSE repeat('b', 64) END);
    IF response->>'state' <> 'ai_in_progress' THEN RAISE EXCEPTION 'Repeated in-flight request was not blocked.'; END IF;
    IF NOT public.finish_editorial_ai(run_id, suggestion, 123, 100, NULL) THEN RAISE EXCEPTION 'Completion failed.'; END IF;
    response := public.reserve_editorial_ai(candidate_id, revision, CASE kind WHEN 'news' THEN repeat('a', 64) ELSE repeat('b', 64) END);
    IF response->>'state' <> 'reused' OR response->'suggestion' IS DISTINCT FROM suggestion THEN RAISE EXCEPTION 'Suggestion was not reused.'; END IF;
    response := public.save_editorial_ai_draft(candidate_id, revision, run_id, 'ma236-' || kind || '-' || suffix,
      category, 'Título editado', 'Edited title', 'Resumo editado', 'Edited summary');
    IF response->>'state' <> 'draft' OR (response->>'existing')::boolean THEN RAISE EXCEPTION 'Draft was not created.'; END IF;
    saved_id := (response->>'id')::uuid;
    IF kind = 'news' THEN
      IF NOT EXISTS (SELECT 1 FROM public.news_articles a JOIN public.news_article_sources s ON s.article_id = a.id
        WHERE a.id = saved_id AND a.status = 'draft' AND a.title_en = 'Edited title' AND s.canonical_url = fixture_url) THEN
        RAISE EXCEPTION 'News draft or attribution is incorrect.';
      END IF;
      PERFORM set_config('ma236.news_id', saved_id::text, true);
    ELSE
      IF NOT EXISTS (SELECT 1 FROM public.agenda_events a JOIN public.agenda_event_sources s ON s.event_id = a.id
        WHERE a.id = saved_id AND a.status = 'draft' AND a.starts_on IS NULL AND a.time_kind = 'time_tba' AND NOT s.official_evidence) THEN
        RAISE EXCEPTION 'Event draft invented a date or verified evidence.';
      END IF;
      PERFORM set_config('ma236.event_id', saved_id::text, true);
    END IF;
    response := public.save_editorial_ai_draft(candidate_id, revision, run_id, 'ma236-retry',
      category, 'Título', 'Title', 'Resumo', 'Summary');
    IF NOT (response->>'existing')::boolean OR (response->>'id')::uuid <> saved_id THEN
      RAISE EXCEPTION 'Retry created another draft.';
    END IF;
  END LOOP;
  candidate_id := gen_random_uuid();
  fixture_url := 'https://example.invalid/' || suffix || '/budget';
  INSERT INTO public.editorial_candidates (id, source_id, kind, source_url, canonical_url, original_title, status)
  VALUES (candidate_id, source_id, 'news', fixture_url, fixture_url, 'Budget test candidate', 'accepted') RETURNING updated_at INTO revision;
  PERFORM set_config('ma236.budget_candidate', candidate_id::text, true);
  PERFORM set_config('ma236.budget_revision', revision::text, true);
END;
$$;

RESET ROLE;
INSERT INTO public.editorial_ai_runs (operation, model, input_hash, status, reserved_cost_usd)
VALUES ('combined', 'fixture', gen_random_uuid()::text, 'failed', 1);

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF public.reserve_editorial_ai(current_setting('ma236.budget_candidate')::uuid,
    current_setting('ma236.budget_revision')::timestamptz, repeat('c', 64))->>'state' <> 'ai_budget' THEN
    RAISE EXCEPTION 'Monthly cap was not enforced.';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
  PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  BEGIN
    PERFORM public.reserve_editorial_ai(current_setting('ma236.budget_candidate')::uuid,
      current_setting('ma236.budget_revision')::timestamptz, repeat('c', 64));
    RAISE EXCEPTION 'Non-admin bypassed the reservation gate.';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.news_articles WHERE id = current_setting('ma236.news_id')::uuid)
    OR EXISTS (SELECT 1 FROM public.agenda_events WHERE id = current_setting('ma236.event_id')::uuid) THEN
    RAISE EXCEPTION 'An assisted draft leaked into the public feed.';
  END IF;
END;
$$;
RESET ROLE;
SELECT 'PASS — AI reservation, reuse, budget, private draft and attribution' AS result;
ROLLBACK;
