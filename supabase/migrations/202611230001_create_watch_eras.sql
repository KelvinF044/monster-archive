-- MONSTER ARCHIVE
-- Migration: centralize video eras without removing the legacy text field.
--
-- Safe rollout:
-- 1. This migration creates the era catalog.
-- 2. It imports every non-empty value currently stored in watch_videos.era.
-- 3. It adds watch_videos.era_id and backfills the new relationship.
-- 4. It intentionally keeps watch_videos.era so the current production app
--    continues working until the application code is migrated in a later step.

BEGIN;

CREATE TABLE IF NOT EXISTS public.watch_eras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  normalized_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watch_eras_name_not_empty CHECK (btrim(name) <> ''),
  CONSTRAINT watch_eras_slug_not_empty CHECK (btrim(slug) <> ''),
  CONSTRAINT watch_eras_normalized_name_not_empty
    CHECK (btrim(normalized_name) <> ''),
  CONSTRAINT watch_eras_slug_unique UNIQUE (slug),
  CONSTRAINT watch_eras_normalized_name_unique UNIQUE (normalized_name)
);

COMMENT ON TABLE public.watch_eras IS
  'Central catalog of BABYMONSTER eras used to classify archive videos.';

COMMENT ON COLUMN public.watch_eras.normalized_name IS
  'Uppercase name with repeated whitespace collapsed; used to prevent duplicates.';

-- Add the nullable foreign key. Keeping it nullable preserves videos without
-- an era and allows the migration to be deployed without changing old records.
ALTER TABLE public.watch_videos
  ADD COLUMN IF NOT EXISTS era_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'watch_videos_era_id_fkey'
      AND conrelid = 'public.watch_videos'::regclass
  ) THEN
    ALTER TABLE public.watch_videos
      ADD CONSTRAINT watch_videos_era_id_fkey
      FOREIGN KEY (era_id)
      REFERENCES public.watch_eras(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- Create the initial known era options. Existing custom era names are imported
-- in the next step, so no current video value is discarded.
INSERT INTO public.watch_eras (
  name,
  slug,
  normalized_name,
  display_order
)
VALUES
  ('BATTER UP', 'batter-up', 'BATTER UP', 10),
  ('SHEESH', 'sheesh', 'SHEESH', 20),
  ('DRIP', 'drip', 'DRIP', 30),
  ('WE GO UP', 'we-go-up', 'WE GO UP', 40)
ON CONFLICT (normalized_name) DO NOTHING;

-- Import any other distinct era labels already used in the video catalog.
-- A short stable hash suffix avoids slug collisions between different labels.
WITH existing_eras AS (
  SELECT DISTINCT
    upper(
      regexp_replace(
        btrim(era),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) AS normalized_name
  FROM public.watch_videos
  WHERE era IS NOT NULL
    AND btrim(era) <> ''
),
custom_eras AS (
  SELECT
    normalized_name,
    coalesce(
      nullif(
        trim(
          both '-' FROM regexp_replace(
            lower(normalized_name),
            '[^a-z0-9]+',
            '-',
            'g'
          )
        ),
        ''
      ),
      'era'
    ) || '-' || substr(md5(normalized_name), 1, 6) AS slug,
    100 + row_number() OVER (ORDER BY normalized_name)::integer AS display_order
  FROM existing_eras
  WHERE normalized_name <> ''
)
INSERT INTO public.watch_eras (
  name,
  slug,
  normalized_name,
  display_order
)
SELECT
  normalized_name,
  slug,
  normalized_name,
  display_order
FROM custom_eras
ON CONFLICT (normalized_name) DO NOTHING;

-- Backfill the new relationship using the existing text value.
UPDATE public.watch_videos AS video
SET era_id = era.id
FROM public.watch_eras AS era
WHERE video.era_id IS NULL
  AND video.era IS NOT NULL
  AND btrim(video.era) <> ''
  AND upper(
    regexp_replace(
      btrim(video.era),
      '[[:space:]]+',
      ' ',
      'g'
    )
  ) = era.normalized_name;

CREATE INDEX IF NOT EXISTS watch_videos_era_id_idx
  ON public.watch_videos (era_id);

CREATE INDEX IF NOT EXISTS watch_eras_active_order_idx
  ON public.watch_eras (is_active, display_order, name);

-- Public pages and the admin form use the publishable/anonymous Supabase key
-- to read active era options. Writes are intentionally not exposed here.
ALTER TABLE public.watch_eras ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.watch_eras TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read active watch eras"
  ON public.watch_eras;

CREATE POLICY "Anyone can read active watch eras"
  ON public.watch_eras
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

COMMIT;

-- Post-migration verification:
-- Both values should be zero after a successful backfill:
SELECT
  (SELECT count(*)
   FROM public.watch_videos
   WHERE era IS NOT NULL
     AND btrim(era) <> ''
     AND era_id IS NULL) AS videos_with_legacy_era_not_linked,
  (SELECT count(*)
   FROM public.watch_eras
   WHERE is_active = true) AS active_eras;
