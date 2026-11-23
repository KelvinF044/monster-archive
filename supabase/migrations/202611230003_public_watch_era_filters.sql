-- MONSTER ARCHIVE
-- Migration: allow the public Watch archive to read eras that still have
-- published videos linked to them, even when those eras are inactive.
--
-- Deactivated eras remain unavailable for new video assignments, but their
-- published archive entries stay discoverable through the public era filters.

BEGIN;

DROP POLICY IF EXISTS "Anyone can read eras linked to published videos"
  ON public.watch_eras;

CREATE POLICY "Anyone can read eras linked to published videos"
  ON public.watch_eras
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.watch_videos AS video
      WHERE video.era_id = watch_eras.id
        AND video.status = 'published'
    )
  );

COMMIT;
