-- MONSTER ARCHIVE
-- Content Import Center: public YouTube playlist sources and metadata refresh tracking.
-- Playlist data is fetched live for review; candidate metadata is not persisted
-- as a separate queue. Imported YouTube metadata is refreshed by the daily
-- Vercel Cron job configured in vercel.json.

BEGIN;

CREATE TABLE IF NOT EXISTS public.watch_import_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  playlist_id text NOT NULL,
  playlist_url text NOT NULL,
  default_collection_id uuid NOT NULL
    REFERENCES public.watch_collections(id) ON DELETE RESTRICT,
  default_era_id uuid
    REFERENCES public.watch_eras(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_scanned_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watch_import_sources_name_not_empty
    CHECK (btrim(name) <> ''),
  CONSTRAINT watch_import_sources_playlist_id_not_empty
    CHECK (btrim(playlist_id) <> ''),
  CONSTRAINT watch_import_sources_playlist_id_unique
    UNIQUE (playlist_id)
);

COMMENT ON TABLE public.watch_import_sources IS
  'Admin-defined public YouTube playlists used as live sources for content discovery.';
COMMENT ON COLUMN public.watch_import_sources.default_collection_id IS
  'Admin-selected default collection for batches reviewed from this playlist.';
COMMENT ON COLUMN public.watch_import_sources.default_era_id IS
  'Optional admin-selected default era. This is a manual source rule, not an AI inference.';

ALTER TABLE public.watch_videos
  ADD COLUMN IF NOT EXISTS metadata_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS youtube_metadata_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS import_source_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.watch_videos'::regclass
      AND conname = 'watch_videos_metadata_source_check'
  ) THEN
    ALTER TABLE public.watch_videos
      ADD CONSTRAINT watch_videos_metadata_source_check
      CHECK (metadata_source IN ('manual', 'youtube_api', 'unavailable'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.watch_videos'::regclass
      AND conname = 'watch_videos_import_source_id_fkey'
  ) THEN
    ALTER TABLE public.watch_videos
      ADD CONSTRAINT watch_videos_import_source_id_fkey
      FOREIGN KEY (import_source_id)
      REFERENCES public.watch_import_sources(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS watch_import_sources_active_idx
  ON public.watch_import_sources (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS watch_videos_youtube_metadata_refresh_idx
  ON public.watch_videos (youtube_metadata_refreshed_at)
  WHERE metadata_source = 'youtube_api';

CREATE INDEX IF NOT EXISTS watch_videos_import_source_idx
  ON public.watch_videos (import_source_id);

ALTER TABLE public.watch_import_sources ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.watch_import_sources FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.watch_import_sources
  TO authenticated;

DROP POLICY IF EXISTS "Active admins manage YouTube import sources"
  ON public.watch_import_sources;

CREATE POLICY "Active admins manage YouTube import sources"
  ON public.watch_import_sources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS admin
      WHERE admin.user_id = (SELECT auth.uid())
        AND admin.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS admin
      WHERE admin.user_id = (SELECT auth.uid())
        AND admin.is_active = true
    )
  );

COMMIT;
