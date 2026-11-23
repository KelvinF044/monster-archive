-- MONSTER ARCHIVE
-- Add the MV category and its dedicated official music video collection.
-- MV is reserved exclusively for official music videos. Performance videos,
-- dance practices, music-show stages and awards stay in their existing categories.

DO $$
DECLARE
  category_column_type text;
  existing_check RECORD;
BEGIN
  SELECT data_type
  INTO category_column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'watch_collections'
    AND column_name = 'category';

  IF category_column_type IS NULL THEN
    RAISE EXCEPTION 'Could not find public.watch_collections.category.';
  END IF;

  IF category_column_type = 'USER-DEFINED' THEN
    RAISE EXCEPTION
      'watch_collections.category uses a database enum. Extend that enum with MV before running this collection seed.';
  END IF;

  -- Expand any existing CHECK constraint that explicitly lists the six
  -- current categories. Constraints unrelated to that allow-list are untouched.
  FOR existing_check IN
    SELECT
      constraint_row.conname,
      pg_get_constraintdef(constraint_row.oid) AS definition
    FROM pg_constraint AS constraint_row
    WHERE constraint_row.conrelid = 'public.watch_collections'::regclass
      AND constraint_row.contype = 'c'
  LOOP
    IF existing_check.definition ILIKE '%category%'
       AND existing_check.definition ILIKE '%Pre-debut%'
       AND existing_check.definition ILIKE '%Stages%'
       AND existing_check.definition ILIKE '%Variety%'
       AND existing_check.definition ILIKE '%Behind%'
       AND existing_check.definition ILIKE '%Events%'
       AND existing_check.definition ILIKE '%Awards%' THEN
      EXECUTE format(
        'ALTER TABLE public.watch_collections DROP CONSTRAINT %I',
        existing_check.conname
      );
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.watch_collections'::regclass
      AND conname = 'watch_collections_category_mv_check'
  ) THEN
    ALTER TABLE public.watch_collections
      ADD CONSTRAINT watch_collections_category_mv_check
      CHECK (
        category IN (
          'Pre-debut',
          'Stages',
          'Variety',
          'Behind',
          'Events',
          'Awards',
          'MV'
        )
      );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.watch_collections
    WHERE slug = 'music-videos'
  ) THEN
    UPDATE public.watch_collections
    SET
      title = 'Official Music Videos',
      category = 'MV',
      label = 'OFFICIAL M/V',
      description = 'Official BABYMONSTER music videos and official music video versions.',
      display_order = 7,
      is_active = true
    WHERE slug = 'music-videos';
  ELSE
    INSERT INTO public.watch_collections (
      slug,
      title,
      category,
      label,
      description,
      display_order,
      is_active
    )
    VALUES (
      'music-videos',
      'Official Music Videos',
      'MV',
      'OFFICIAL M/V',
      'Official BABYMONSTER music videos and official music video versions.',
      7,
      true
    );
  END IF;
END
$$;
