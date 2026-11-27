-- Run the entire script in SQL Editor, ONLY in monster-archive-test.
-- Test fixtures are created inside one transaction and ALWAYS rolled back on success.
-- A failure aborts the transaction. No real news, event, source or AI run is created.
BEGIN;

DO $$
DECLARE
  admin_id uuid;
  fixture_suffix text := replace(gen_random_uuid()::text, '-', '');
BEGIN
  SELECT user_id INTO admin_id FROM public.admin_users WHERE is_active ORDER BY created_at LIMIT 1;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Create an active test admin before this verification.';
  END IF;
  PERFORM set_config('ma23.test_admin', admin_id::text, true);
  PERFORM set_config('ma23.test_news', gen_random_uuid()::text, true);
  PERFORM set_config('ma23.test_event', gen_random_uuid()::text, true);
  PERFORM set_config('ma23.test_draft', gen_random_uuid()::text, true);
  PERFORM set_config('ma23.test_source', gen_random_uuid()::text, true);
  PERFORM set_config('ma23.test_press', gen_random_uuid()::text, true);
  PERFORM set_config('ma23.test_candidate', gen_random_uuid()::text, true);
  PERFORM set_config('ma23.test_suffix', fixture_suffix, true);
  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
END;
$$;

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  article uuid := current_setting('ma23.test_news')::uuid;
  draft_article uuid := current_setting('ma23.test_draft')::uuid;
  event_row uuid := current_setting('ma23.test_event')::uuid;
  official_source uuid := current_setting('ma23.test_source')::uuid;
  press_source uuid := current_setting('ma23.test_press')::uuid;
  candidate uuid := current_setting('ma23.test_candidate')::uuid;
  suffix text := current_setting('ma23.test_suffix');
  base_url text := 'https://example.invalid/ma23-' || suffix;
  denied boolean;
  test_member uuid;
BEGIN
  IF NOT public.editorial_is_active_admin() THEN RAISE EXCEPTION 'Admin verification failed.'; END IF;

  INSERT INTO public.editorial_sources (id, name, homepage_url, source_kind)
  VALUES (official_source, 'Synthetic official test source', base_url, 'official_organizer'),
         (press_source, 'Synthetic press test source', base_url || '/press', 'trusted_press');

  INSERT INTO public.news_articles (id, slug, title_pt, title_en, summary_pt, summary_en)
  VALUES (article, 'ma23-news-' || suffix, 'Teste', 'Test', 'Resumo de teste', 'Test summary'),
         (draft_article, 'ma23-draft-' || suffix, 'Rascunho', 'Draft', NULL, NULL);

  INSERT INTO public.agenda_events (id, slug, title_pt, title_en, summary_pt, summary_en, starts_on, time_kind, timezone, starts_at)
  VALUES (event_row, 'ma23-event-' || suffix, 'Evento teste', 'Test event', 'Teste', 'Test',
    DATE '2030-01-01', 'timed', 'Asia/Seoul', TIMESTAMPTZ '2030-01-01 00:30:00+09');

  SELECT id INTO test_member FROM public.members WHERE is_active ORDER BY display_order LIMIT 1;
  IF test_member IS NULL THEN RAISE EXCEPTION 'No active test member.'; END IF;
  INSERT INTO public.news_article_members (article_id, member_id) VALUES (article, test_member), (draft_article, test_member);

  denied := false;
  BEGIN
    UPDATE public.agenda_events SET starts_on = DATE '2029-12-31' WHERE id = event_row;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Inconsistent date/time zone was accepted.'; END IF;

  INSERT INTO public.news_article_sources (article_id, source_id, source_name, source_url, canonical_url)
  VALUES (draft_article, official_source, 'Synthetic official test source', base_url || '/draft', base_url || '/draft');
  UPDATE public.news_articles SET status = 'in_review' WHERE id = draft_article;
  denied := false;
  BEGIN
    UPDATE public.news_articles SET status = 'approved' WHERE id = draft_article;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'A missing translation or summary was accepted.'; END IF;
  UPDATE public.news_articles SET status = 'draft' WHERE id = draft_article;

  denied := false;
  BEGIN
    UPDATE public.news_articles SET status = 'published' WHERE id = article;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Direct publication was incorrectly allowed.'; END IF;

  UPDATE public.news_articles SET status = 'in_review' WHERE id = article;
  denied := false;
  BEGIN
    UPDATE public.news_articles SET status = 'approved' WHERE id = article;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Approval without a source was incorrectly allowed.'; END IF;

  INSERT INTO public.news_article_sources (article_id, source_id, source_name, source_url, canonical_url)
  VALUES (article, official_source, 'Synthetic official test source', base_url || '/news', base_url || '/news');
  UPDATE public.news_articles SET status = 'approved' WHERE id = article;

  denied := false;
  BEGIN
    UPDATE public.news_articles SET status = 'published', title_en = 'Unreviewed change' WHERE id = article;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Unreviewed content change was incorrectly allowed.'; END IF;

  UPDATE public.news_articles SET status = 'published' WHERE id = article;
  IF NOT EXISTS (SELECT 1 FROM public.news_articles WHERE id = article AND status = 'published'
    AND approved_at IS NOT NULL AND published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Admin publication failed.';
  END IF;

  denied := false;
  BEGIN
    DELETE FROM public.news_article_sources WHERE article_id = article;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Published evidence could be removed.'; END IF;

  denied := false;
  BEGIN
    INSERT INTO public.agenda_event_sources (event_id, source_id, source_name, source_url, canonical_url, official_evidence)
    VALUES (event_row, press_source, 'Synthetic press test source', base_url || '/press-event', base_url || '/press-event', true);
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'A non-official source could be marked official.'; END IF;

  INSERT INTO public.agenda_event_sources (event_id, source_id, source_name, source_url, canonical_url, official_evidence)
  VALUES (event_row, press_source, 'Synthetic press test source', base_url || '/press-event', base_url || '/press-event', false);
  UPDATE public.agenda_events SET status = 'in_review' WHERE id = event_row;
  denied := false;
  BEGIN
    UPDATE public.agenda_events SET status = 'approved' WHERE id = event_row;
  EXCEPTION WHEN raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Event approved without official confirmation.'; END IF;

  INSERT INTO public.agenda_event_sources (event_id, source_id, source_name, source_url, canonical_url, official_evidence)
  VALUES (event_row, official_source, 'Synthetic official test source', base_url || '/event', base_url || '/event', true);
  UPDATE public.agenda_events SET status = 'approved' WHERE id = event_row;
  UPDATE public.agenda_events SET status = 'published' WHERE id = event_row;

  INSERT INTO public.editorial_candidates (id, source_id, kind, source_url, canonical_url, original_title)
  VALUES (candidate, official_source, 'news', base_url || '/candidate', base_url || '/candidate', 'Synthetic original');

  denied := false;
  BEGIN
    INSERT INTO public.editorial_candidates (source_id, kind, source_url, canonical_url, original_title)
    VALUES (official_source, 'news', base_url || '/candidate?tracking=1', base_url || '/candidate', 'Duplicate');
  EXCEPTION WHEN unique_violation THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Canonical duplicate was accepted.'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.editorial_audit_log WHERE entity_id = article
    AND action = 'status_changed' AND new_status = 'published' AND actor_id = auth.uid()) THEN
    RAISE EXCEPTION 'Publication audit entry is missing.';
  END IF;
END;
$$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{}', true);
SET LOCAL ROLE anon;

DO $$
DECLARE
  article uuid := current_setting('ma23.test_news')::uuid;
  event_row uuid := current_setting('ma23.test_event')::uuid;
  draft_article uuid := current_setting('ma23.test_draft')::uuid;
BEGIN
  IF (SELECT COUNT(*) FROM public.news_articles WHERE id IN (article, draft_article)) <> 1
    OR NOT EXISTS (SELECT 1 FROM public.agenda_events WHERE id = event_row)
    OR NOT EXISTS (SELECT 1 FROM public.news_article_sources WHERE article_id = article)
    OR NOT EXISTS (SELECT 1 FROM public.agenda_event_sources WHERE event_id = event_row)
    OR (SELECT COUNT(*) FROM public.news_article_members WHERE article_id IN (article, draft_article)) <> 1
    OR EXISTS (SELECT 1 FROM public.news_article_sources WHERE article_id = draft_article) THEN
    RAISE EXCEPTION 'Public visibility did not match the published-only workflow.';
  END IF;
  IF has_table_privilege('anon', 'public.editorial_candidates', 'SELECT')
    OR has_table_privilege('anon', 'public.editorial_sources', 'SELECT')
    OR has_table_privilege('anon', 'public.editorial_ai_runs', 'SELECT')
    OR has_table_privilege('anon', 'public.editorial_audit_log', 'SELECT')
    OR has_table_privilege('anon', 'public.news_articles', 'INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'Unexpected public privilege.';
  END IF;
END;
$$;

RESET ROLE;
DO $$
DECLARE stranger uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('request.jwt.claim.sub', stranger::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', stranger, 'role', 'authenticated')::text, true);
END;
$$;
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  article uuid := current_setting('ma23.test_news')::uuid;
  draft_article uuid := current_setting('ma23.test_draft')::uuid;
  private_candidate uuid := current_setting('ma23.test_candidate')::uuid;
  private_source uuid := current_setting('ma23.test_source')::uuid;
  affected integer;
BEGIN
  IF public.editorial_is_active_admin()
    OR (SELECT COUNT(*) FROM public.news_articles WHERE id IN (article, draft_article)) <> 1
    OR EXISTS (SELECT 1 FROM public.editorial_candidates WHERE id = private_candidate)
    OR EXISTS (SELECT 1 FROM public.editorial_sources WHERE id = private_source)
    OR EXISTS (SELECT 1 FROM public.editorial_audit_log WHERE entity_id = article) THEN
    RAISE EXCEPTION 'Non-admin isolation failed.';
  END IF;
  UPDATE public.news_articles SET is_featured = true WHERE id = article;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Non-admin could edit news.'; END IF;
END;
$$;

RESET ROLE;
SELECT 'PASS — editorial workflow, deduplication, attribution, audit and public isolation. Fixture transaction will roll back.' AS result;
ROLLBACK;
