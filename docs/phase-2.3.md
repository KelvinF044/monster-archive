# Phase 2.3 — News & Events

Roadmap 3.0: phase 2.2 (Eras and Smart Import) was released on 2026-11-25. Phase 2.3 is developed in isolation from production. All existing Watch, members, admin, and localization behavior must remain compatible.

## Initial navigation delivery

- Home: compact News and Events submenu; keep Home itself clickable.
- Members: direct links to all seven existing member pages.
- Watch: keep current category links; center submenu text and size to content.
- Mobile: expandable navigation groups.
- Admin: Dashboard, expandable Watch group (Videos, Add New Video, Content Import Center, Era Management), Visual Studio, News, Events, Editorial. Automatically reveal an active Watch subpage. The additional modules can use the same group pattern later.
- Temporary News, Events and Editorial landing pages are explicitly preview-only workspaces under development. They contain no fabricated data, must not be indexed, and must be replaced by real implementations before release.

## Phase 2.3.1 — Editorial database

Navigation was approved by the owner on 2026-11-25. The separate test database
was populated with references to the existing public image assets, including
the missing `home_hero` row. No production data was edited.

### Additive migration

`supabase/migrations/202611250001_editorial_news_schedule.sql` defines:

| Entity | Purpose |
| --- | --- |
| `news_articles` and `agenda_events` | Public editorial content, PT-BR/EN, statuses, publication, existing era ID |
| `editorial_sources` and `editorial_candidates` | Private discovery registry and deduplicated editorial queue |
| `news_article_sources` and `agenda_event_sources` | Public attribution snapshot, locked during review approval/publication |
| `editorial_ai_runs` | Private cost/token and suggestion records; actual Gateway quota enforcement is a later step |
| `editorial_audit_log` | Private append-only status/date history and administrator attribution |
| Four member/video link tables | Relations to existing member and Watch catalogs |

New content must start as a draft, go through review and approval, then be
published by an active administrator. Review requires bilingual titles/summaries
and at least one source; event approval also requires an official source and
known calendar date. Editorial content and source evidence are locked after
approval; return the item to draft to revise it. Era and featured placement
remain administrative classification controls. Event dates are local calendar
dates; a timed event stores a timezone-aware timestamp, whereas all-day or
unannounced clock times do not invent timestamps. Rescheduling history is
captured in the audit log. Anonymous and non-admin users read only published
content and applicable public relations. Source registry, candidates, AI runs
and audit logs are not public. No new service-role writes are enabled.

### Test rollout — pending database execution

1. Verify the selected Supabase project is `monster-archive-test` (not production).
2. Run the complete migration once in its SQL Editor. It creates only new tables,
   policies and functions, within a transaction. It does not insert real editorial
   items, activate schedules or invoke AI.
3. Run `supabase/checks/phase_2_3_1_structure.sql`: 12 rows, expected booleans true.
4. Run `supabase/checks/phase_2_3_1_workflow.sql`: synthetic data tests publication,
   translation requirements, time consistency, duplicates, official evidence,
   locked published evidence, audit, and role isolation. The entire fixture
   transaction rolls back; the final result is PASS.
5. Confirm existing images, Watch and administration work on the Preview.
6. Only after the test checks pass proceed to the News admin interface.

Git branch: `feat/news-and-schedule`. SQL is applied manually to the isolated
Supabase project; a Vercel preview build does not run database migrations.

## Remaining delivery

1. Apply and validate the new editorial schema and RLS in the isolated test database.
2. News administration and review workflow.
3. Events administration, official sources, time zones and status.
4. Public bilingual news feed, article detail, and event schedule.
5. Editorial center and approved-source discovery, deduplication and curation.
6. Opt-in server-only AI assistance; structured suggestions, translations/summaries, reuse, shared cost cap, no automatic publication.
7. Home latest-news and upcoming-events sections, preserving current layout and localization.
8. Preview regression tests and owner approval; only then apply production migration and merge to main.

Keep About/Support the Creator, Community, and future phases out of scope.
