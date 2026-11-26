-- Apply to monster-archive-test after 202611260001.
BEGIN;

-- Reuse the Visual Studio bucket and add a dedicated path for imported
-- editorial covers. Leave all existing bucket settings and policies intact.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('archive-images', 'archive-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Editorial admins insert imported news covers" ON storage.objects;
CREATE POLICY "Editorial admins insert imported news covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'archive-images'
  AND name ~ '^news/[a-f0-9-]{36}-[a-f0-9]{24}\.(jpg|png|webp)$'
  AND (SELECT public.editorial_is_active_admin())
);

CREATE OR REPLACE FUNCTION public.save_editorial_ai_draft_with_cover(
  p_candidate uuid, p_expected_updated_at timestamptz, p_run uuid,
  p_fields jsonb, p_cover_url text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  candidate public.editorial_candidates%ROWTYPE;
  result jsonb;
  linked_article uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.editorial_is_active_admin() THEN
    RAISE insufficient_privilege;
  END IF;
  SELECT * INTO candidate FROM public.editorial_candidates WHERE id = p_candidate FOR UPDATE;
  IF NOT FOUND OR candidate.kind <> 'news' OR candidate.source_url !~ '^https?://(www\.)?ygfamily\.com/en/news/report/[0-9]+(/)?([?#].*)?$' THEN
    RETURN jsonb_build_object('state', 'candidate_unavailable');
  END IF;
  IF p_cover_url IS NULL OR p_cover_url !~ ('^https://[a-zA-Z0-9.-]+/storage/v1/object/public/archive-images/news/' ||
    p_candidate::text || '-[a-f0-9]{24}\.(jpg|png|webp)$') THEN
    RETURN jsonb_build_object('state', 'invalid_request');
  END IF;
  result := public.save_editorial_ai_draft(
    p_candidate, p_expected_updated_at, p_run, p_fields->>'slug', p_fields->>'category',
    p_fields->>'title_pt', p_fields->>'title_en', p_fields->>'summary_pt', p_fields->>'summary_en'
  );
  IF result->>'state' = 'draft' AND (result->>'existing')::boolean = false THEN
    linked_article := (result->>'id')::uuid;
    UPDATE public.news_articles SET
      cover_image_url = p_cover_url,
      cover_image_credit = 'YG Entertainment',
      cover_image_source_url = candidate.source_url,
      cover_image_alt_pt = left('Imagem do comunicado: ' || (p_fields->>'title_pt'), 300),
      cover_image_alt_en = left('Image from the original report: ' || (p_fields->>'title_en'), 300)
    WHERE id = linked_article AND status = 'draft';
    IF NOT FOUND THEN RAISE EXCEPTION 'Editorial cover could not be linked.'; END IF;
  END IF;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_editorial_ai_draft_with_cover(uuid, timestamptz, uuid, jsonb, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_editorial_ai_draft_with_cover(uuid, timestamptz, uuid, jsonb, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
