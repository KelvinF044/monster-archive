-- Run after migration 202611250001 in monster-archive-test.
-- Read-only checks. Expected: all 12 rows exist, have RLS, and follow
-- the intended public/administrative access model.
WITH expected (table_name, public_read, admin_write) AS (
  VALUES
    ('editorial_sources', false, true),
    ('news_articles', true, true),
    ('agenda_events', true, true),
    ('editorial_candidates', false, true),
    ('news_article_sources', true, true),
    ('agenda_event_sources', true, true),
    ('editorial_ai_runs', false, true),
    ('editorial_audit_log', false, false),
    ('news_article_members', true, true),
    ('agenda_event_members', true, true),
    ('news_article_videos', true, true),
    ('agenda_event_videos', true, true)
)
SELECT
  e.table_name,
  c.oid IS NOT NULL AS table_exists,
  COALESCE(c.relrowsecurity, false) AS rls_enabled,
  (SELECT COUNT(*) FROM pg_catalog.pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = e.table_name) AS policy_count,
  COALESCE(has_table_privilege('anon', c.oid, 'SELECT') = e.public_read, false) AS expected_public_read,
  COALESCE(NOT has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE'), false) AS anonymous_read_only,
  COALESCE(has_table_privilege('authenticated', c.oid, 'INSERT') = e.admin_write, false) AS expected_admin_insert,
  COALESCE(NOT has_table_privilege('service_role', c.oid, 'INSERT,UPDATE,DELETE'), false) AS no_service_role_write
FROM expected e
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
  AND c.relname = e.table_name AND c.relkind = 'r'
ORDER BY e.table_name;
