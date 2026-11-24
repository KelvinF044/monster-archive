BEGIN;

-- Reuse any existing immediate, non-partial unique index on the YouTube ID.
-- If a database has duplicate IDs, index creation stops this migration without
-- changing its data. Resolve those conflicts before retrying.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS idx
    JOIN pg_catalog.pg_attribute AS col
      ON col.attrelid = idx.indrelid AND col.attnum = idx.indkey[0]
    WHERE idx.indrelid = 'public.watch_videos'::regclass
      AND col.attname = 'youtube_video_id'
      AND idx.indnkeyatts = 1
      AND idx.indisunique AND idx.indisvalid AND idx.indisready
      AND idx.indimmediate AND idx.indpred IS NULL
  ) THEN
    CREATE UNIQUE INDEX watch_videos_import_youtube_id_unique
      ON public.watch_videos (youtube_video_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.import_watch_video_draft(
  p_source_id uuid,
  p_youtube_video_id text,
  p_title text,
  p_description text,
  p_published_at text,
  p_collection_id uuid,
  p_era_id uuid,
  p_member_ids uuid[],
  p_official_mv_confirmed boolean
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_source_name public.watch_import_sources.name%TYPE;
  v_era_name public.watch_eras.name%TYPE;
  v_collection_category public.watch_collections.category%TYPE;
  v_video_id public.watch_videos.id%TYPE;
  v_published_at public.watch_videos.published_at%TYPE;
  v_member_ids uuid[] := coalesce(p_member_ids, ARRAY[]::uuid[]);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid()) AND is_active
  ) THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;

  IF p_youtube_video_id IS NULL OR p_youtube_video_id !~ '^[A-Za-z0-9_-]{11}$' THEN
    RAISE EXCEPTION 'One or more selected identifiers are invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT name INTO v_source_name
  FROM public.watch_import_sources WHERE id = p_source_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This playlist source is inactive.' USING ERRCODE = '22023';
  END IF;

  SELECT category INTO v_collection_category
  FROM public.watch_collections WHERE id = p_collection_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select an active collection.' USING ERRCODE = '22023';
  END IF;

  IF v_collection_category = 'MV' AND p_official_mv_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Confirm that the video is an official music video before assigning it to MV.' USING ERRCODE = '22023';
  END IF;

  IF p_era_id IS NOT NULL THEN
    SELECT name INTO v_era_name
    FROM public.watch_eras WHERE id = p_era_id AND is_active;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The selected era is inactive or unavailable.' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF cardinality(v_member_ids) > 7 OR cardinality(v_member_ids) <> (
    SELECT count(*) FROM public.members WHERE id = ANY(v_member_ids) AND is_active
  ) THEN
    RAISE EXCEPTION 'One or more selected members are inactive or unavailable.' USING ERRCODE = '22023';
  END IF;

  v_published_at := p_published_at;

  INSERT INTO public.watch_videos (
    slug, title, description, published_at, youtube_video_id,
    source_name, source_url, status, is_featured, era, era_id,
    metadata_source, youtube_metadata_refreshed_at, import_source_id
  ) VALUES (
    'yt-' || encode(convert_to(p_youtube_video_id, 'UTF8'), 'hex'),
    left(p_title, 200), nullif(left(p_description, 3000), ''),
    v_published_at, p_youtube_video_id,
    v_source_name, 'https://www.youtube.com/watch?v=' || p_youtube_video_id,
    'draft', false, v_era_name, p_era_id, 'youtube_api', now(), p_source_id
  )
  ON CONFLICT (youtube_video_id) DO NOTHING
  RETURNING id INTO v_video_id;

  IF v_video_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  INSERT INTO public.watch_video_collections (video_id, collection_id, display_order)
  VALUES (v_video_id, p_collection_id, 0);

  INSERT INTO public.watch_video_members (video_id, member_id)
  SELECT v_video_id, member_id FROM unnest(v_member_ids) AS member_id;

  RETURN 'imported';
END
$$;

REVOKE EXECUTE ON FUNCTION public.import_watch_video_draft
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_watch_video_draft
  TO authenticated;

COMMIT;
