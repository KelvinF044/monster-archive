-- Phase 2.3.6. Apply to the test database first.
BEGIN;

ALTER TABLE public.editorial_candidates
  ADD COLUMN IF NOT EXISTS draft_news_id uuid REFERENCES public.news_articles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS draft_event_id uuid REFERENCES public.agenda_events(id) ON DELETE SET NULL;

-- Keep reads under existing RLS. All ledger writes use the checked RPCs.
REVOKE INSERT, UPDATE ON public.editorial_ai_runs FROM authenticated;

CREATE OR REPLACE FUNCTION public.reserve_editorial_ai(
  p_candidate uuid, p_expected_updated_at timestamptz, p_input_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  candidate public.editorial_candidates%ROWTYPE;
  run public.editorial_ai_runs%ROWTYPE;
  model_id constant text := 'google/gemini-2.5-flash-lite';
  reserve_usd constant numeric := 0.005;
  monthly_limit constant numeric := 1;
  month_start timestamptz := pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
BEGIN
  IF auth.uid() IS NULL OR NOT public.editorial_is_active_admin() THEN
    RAISE insufficient_privilege;
  END IF;
  IF p_input_hash IS NULL OR p_input_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('state', 'invalid_request');
  END IF;

  SELECT * INTO candidate FROM public.editorial_candidates WHERE id = p_candidate FOR UPDATE;
  IF NOT FOUND OR candidate.status <> 'accepted' OR candidate.updated_at IS DISTINCT FROM p_expected_updated_at
    OR NOT EXISTS (SELECT 1 FROM public.editorial_sources WHERE id = candidate.source_id AND is_active) THEN
    RETURN jsonb_build_object('state', 'candidate_unavailable');
  END IF;
  IF candidate.draft_news_id IS NOT NULL OR candidate.draft_event_id IS NOT NULL THEN
    RETURN jsonb_build_object('state', 'draft', 'id', coalesce(candidate.draft_news_id, candidate.draft_event_id));
  END IF;

  -- Serialize the budget check and reservation across administrators.
  PERFORM pg_catalog.pg_advisory_xact_lock(18371016, 263);
  SELECT * INTO run FROM public.editorial_ai_runs
    WHERE candidate_id = p_candidate AND model = model_id AND operation = 'combined'
      AND input_hash = p_input_hash AND status IN ('pending', 'succeeded') FOR UPDATE;
  IF FOUND THEN
    IF run.status = 'succeeded' THEN
      RETURN jsonb_build_object('state', 'reused', 'id', run.id, 'suggestion', run.suggestion);
    END IF;
    IF run.created_at > pg_catalog.now() - interval '2 minutes' THEN
      RETURN jsonb_build_object('state', 'ai_in_progress');
    END IF;
    UPDATE public.editorial_ai_runs SET status = 'failed', error_kind = 'expired', completed_at = pg_catalog.now()
      WHERE id = run.id AND status = 'pending';
  END IF;

  -- Charge the conservative reservation even on failed or abandoned attempts.
  -- This prevents retries, timeouts, or inaccurate provider usage from freeing
  -- already authorized capacity. Reuse above is free, even at the limit.
  IF coalesce((SELECT sum(reserved_cost_usd) FROM public.editorial_ai_runs
                WHERE operation = 'combined' AND created_at >= month_start), 0) + reserve_usd > monthly_limit THEN
    RETURN jsonb_build_object('state', 'ai_budget');
  END IF;
  INSERT INTO public.editorial_ai_runs(candidate_id, requested_by, operation, model, input_hash, reserved_cost_usd)
  VALUES (p_candidate, auth.uid(), 'combined', model_id, p_input_hash, reserve_usd)
  RETURNING * INTO run;
  RETURN jsonb_build_object('state', 'reserved', 'id', run.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_editorial_ai(
  p_run uuid, p_suggestion jsonb, p_input_tokens integer, p_output_tokens integer, p_error text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.editorial_is_active_admin() THEN
    RAISE insufficient_privilege;
  END IF;
  IF (p_suggestion IS NOT NULL AND (jsonb_typeof(p_suggestion) <> 'object' OR octet_length(p_suggestion::text) > 16000))
    OR coalesce(p_input_tokens, 0) NOT BETWEEN 0 AND 1000000
    OR coalesce(p_output_tokens, 0) NOT BETWEEN 0 AND 1000000
    OR length(coalesce(p_error, '')) > 64 THEN
    RETURN false;
  END IF;
  UPDATE public.editorial_ai_runs
  SET status = CASE WHEN p_suggestion IS NULL THEN 'failed' ELSE 'succeeded' END,
      suggestion = p_suggestion, input_tokens = p_input_tokens, output_tokens = p_output_tokens,
      estimated_cost_usd = CASE WHEN p_input_tokens IS NOT NULL AND p_output_tokens IS NOT NULL
        THEN p_input_tokens * 0.00000010 + p_output_tokens * 0.00000040 END,
      error_kind = CASE WHEN p_suggestion IS NULL THEN coalesce(p_error, 'unknown') END,
      completed_at = pg_catalog.now()
  WHERE id = p_run AND requested_by = auth.uid() AND status = 'pending'
    AND operation = 'combined' AND model = 'google/gemini-2.5-flash-lite';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_editorial_ai_draft(
  p_candidate uuid, p_expected_updated_at timestamptz, p_run uuid,
  p_slug text, p_category text, p_title_pt text, p_title_en text, p_summary_pt text, p_summary_en text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  candidate public.editorial_candidates%ROWTYPE;
  source public.editorial_sources%ROWTYPE;
  draft_id uuid;
  draft_slug text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.editorial_is_active_admin() THEN
    RAISE insufficient_privilege;
  END IF;
  SELECT * INTO candidate FROM public.editorial_candidates WHERE id = p_candidate FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'candidate_unavailable');
  END IF;
  IF candidate.draft_news_id IS NOT NULL OR candidate.draft_event_id IS NOT NULL THEN
    RETURN jsonb_build_object('state', 'draft', 'id', coalesce(candidate.draft_news_id, candidate.draft_event_id), 'existing', true);
  END IF;
  IF candidate.status <> 'accepted' OR candidate.updated_at IS DISTINCT FROM p_expected_updated_at
    OR NOT EXISTS (SELECT 1 FROM public.editorial_ai_runs WHERE id = p_run AND candidate_id = p_candidate
      AND operation = 'combined' AND status = 'succeeded') THEN
    RETURN jsonb_build_object('state', 'candidate_unavailable');
  END IF;
  SELECT * INTO source FROM public.editorial_sources WHERE id = candidate.source_id AND is_active FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'candidate_unavailable');
  END IF;
  IF p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug) > 82
    OR length(coalesce(btrim(p_title_pt), '')) NOT BETWEEN 1 AND 200
    OR length(coalesce(btrim(p_title_en), '')) NOT BETWEEN 1 AND 200
    OR length(coalesce(btrim(p_summary_pt), '')) NOT BETWEEN 1 AND 800
    OR length(coalesce(btrim(p_summary_en), '')) NOT BETWEEN 1 AND 800 THEN
    RETURN jsonb_build_object('state', 'invalid_request');
  END IF;

  draft_slug := p_slug;
  IF candidate.kind = 'news' THEN
    IF EXISTS (SELECT 1 FROM public.news_article_sources WHERE canonical_url = candidate.canonical_url) THEN
      RETURN jsonb_build_object('state', 'candidate_duplicate');
    END IF;
    INSERT INTO public.news_articles(slug, category, title_pt, title_en, summary_pt, summary_en, status)
    VALUES (draft_slug, p_category, p_title_pt, p_title_en, p_summary_pt, p_summary_en, 'draft')
    ON CONFLICT (slug) DO NOTHING RETURNING id INTO draft_id;
    IF draft_id IS NULL THEN
      INSERT INTO public.news_articles(slug, category, title_pt, title_en, summary_pt, summary_en, status)
      VALUES (draft_slug || '-' || p_candidate::text, p_category, p_title_pt, p_title_en, p_summary_pt, p_summary_en, 'draft')
      RETURNING id INTO draft_id;
    END IF;
    INSERT INTO public.news_article_sources(article_id, source_id, source_name, source_url, canonical_url, source_published_at)
    VALUES (draft_id, source.id, source.name, candidate.source_url, candidate.canonical_url, candidate.source_published_at);
    UPDATE public.editorial_candidates SET draft_news_id = draft_id WHERE id = p_candidate;
  ELSE
    IF EXISTS (SELECT 1 FROM public.agenda_event_sources WHERE canonical_url = candidate.canonical_url) THEN
      RETURN jsonb_build_object('state', 'candidate_duplicate');
    END IF;
    INSERT INTO public.agenda_events(slug, category, title_pt, title_en, summary_pt, summary_en, status, time_kind)
    VALUES (draft_slug, p_category, p_title_pt, p_title_en, p_summary_pt, p_summary_en, 'draft', 'time_tba')
    ON CONFLICT (slug) DO NOTHING RETURNING id INTO draft_id;
    IF draft_id IS NULL THEN
      INSERT INTO public.agenda_events(slug, category, title_pt, title_en, summary_pt, summary_en, status, time_kind)
      VALUES (draft_slug || '-' || p_candidate::text, p_category, p_title_pt, p_title_en, p_summary_pt, p_summary_en, 'draft', 'time_tba')
      RETURNING id INTO draft_id;
    END IF;
    INSERT INTO public.agenda_event_sources(event_id, source_id, source_name, source_url, canonical_url, source_published_at, official_evidence)
    VALUES (draft_id, source.id, source.name, candidate.source_url, candidate.canonical_url, candidate.source_published_at, false);
    UPDATE public.editorial_candidates SET draft_event_id = draft_id WHERE id = p_candidate;
  END IF;
  RETURN jsonb_build_object('state', 'draft', 'id', draft_id, 'existing', false);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_editorial_ai(uuid, timestamptz, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.finish_editorial_ai(uuid, jsonb, integer, integer, text) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.save_editorial_ai_draft(uuid, timestamptz, uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_editorial_ai(uuid, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_editorial_ai(uuid, jsonb, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_editorial_ai_draft(uuid, timestamptz, uuid, text, text, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
