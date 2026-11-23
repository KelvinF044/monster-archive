-- MONSTER ARCHIVE
-- Migration: allow active administrators to manage the central era catalog.
--
-- Public visitors can read active eras. Only active administrators can see
-- inactive eras and create/update catalog entries. Eras are deactivated rather
-- than deleted so existing video relationships are preserved.

BEGIN;

-- Reassert the least-privilege grants explicitly.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.watch_eras
  FROM anon, authenticated;

GRANT SELECT ON TABLE public.watch_eras
  TO anon, authenticated;

GRANT INSERT, UPDATE ON TABLE public.watch_eras
  TO authenticated;

-- Active visitors can read active eras (created in migration 001).
-- Active administrators can also read inactive eras to reactivate them.
DROP POLICY IF EXISTS "Admins can read all watch eras"
  ON public.watch_eras;

CREATE POLICY "Admins can read all watch eras"
  ON public.watch_eras
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS admin
      WHERE admin.user_id = (SELECT auth.uid())
        AND admin.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert watch eras"
  ON public.watch_eras;

CREATE POLICY "Admins can insert watch eras"
  ON public.watch_eras
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_users AS admin
      WHERE admin.user_id = (SELECT auth.uid())
        AND admin.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update watch eras"
  ON public.watch_eras;

CREATE POLICY "Admins can update watch eras"
  ON public.watch_eras
  FOR UPDATE
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
