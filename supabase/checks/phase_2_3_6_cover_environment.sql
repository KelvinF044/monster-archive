-- Run in the SQL Editor of the Supabase project used by the Preview.
-- Expected: all three fields are true. This does not alter the database.
SELECT
  EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'archive-images' AND public
  ) AS public_cover_bucket_exists,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Editorial admins insert imported news covers'
      AND cmd = 'INSERT' AND 'authenticated' = ANY (roles)
  ) AS editor_upload_policy_exists,
  to_regprocedure('public.save_editorial_ai_draft_with_cover(uuid,timestamptz,uuid,jsonb,text)') IS NOT NULL
    AS cover_draft_function_exists;
