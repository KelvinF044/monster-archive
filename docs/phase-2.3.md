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

### Test rollout — completed in homologation (2026-11-25)

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
6. Owner returned successful migration, 12/12 structure rows with expected permissions, and workflow PASS. News admin development can proceed.

Git branch: `feat/news-and-schedule`. SQL is applied manually to the isolated
Supabase project; a Vercel preview build does not run database migrations.

## Phase 2.3.2 — News administration

Implemented in the existing `/admin/news` page; the public feed remains a preview
placeholder until phase 2.3.4.

- Paginated news listing, search, status and category filters.
- Manual bilingual draft/editor with independent titles, summaries and optional
  plain-text bodies; editable slug, category, Era, featured flag and optional
  cover URL, bilingual alt text, credit and source URL.
- Manual creation/selection of sources in the shared editorial registry and
  attribution links with canonical URL deduplication. A source shared by
  multiple stories requires explicit confirmation.
- Search/link existing Watch videos and link existing members; no new catalog
  records are created.
- Explicit transitions for review, approval, rejection, publishing, archive and
  return to draft. Approved/published content remains locked by the database.
- All list/detail/mutation operations use the existing active-admin session,
  scoped database RLS, validated inputs and optimistic update timestamps.
- No external fetch, AI request, production migration or automatic publishing.

### Homologation acceptance checklist

1. Open News as a signed-in test administrator in the newest Vercel Preview.
2. Create a clearly labeled test draft in one language and verify it appears in
   the list; edit both languages and save.
3. Register a manual test source, attach its public URL, and verify a duplicated
   URL (including tracking parameters) is rejected within the same article.
4. Link an existing member and Watch video; verify the relationship persists.
5. Submit for review. Approval must require both titles, both summaries, and at
   least one source. Approve, explicitly publish, and verify the read-only state.
6. Archive the test article or return it to draft. Verify search/filter and
   English/Portuguese switching on desktop and mobile.
7. Confirm existing Watch, Members, Home imagery, and administrator permissions
   remain unchanged.

Owner confirmed creation, manual source registration/link, bilingual review and
publication (Published badge and approval/publication dates). The browser-native
confirmation was flagged by Vercel's interaction timing tool; a non-blocking,
keyboard-accessible confirmation dialog replaces it while preserving explicit
administrative confirmation. Published/approved/archived workflow messages now
reflect their actual status. The owner accepted progression to the next subphase. A new interactive INP measurement was not recorded. No database changes are required.

## Phase 2.3.3 — Event and agenda administration

Implemented the existing `/admin/schedule` workspace and its active-admin API.
It reuses the central member, Era and editorial source catalogs, the Watch
lookup, existing editorial status rules, and the non-blocking confirmation
dialog. The public calendar is still a placeholder until Phase 2.3.4.

- Paginated list, title/slug search and category, editorial status, activity
  status and local calendar-month filters.
- Bilingual titles/summaries, event category, featured placement, existing Era,
  venue, location and optional official URL.
- A separate activity status (confirmed, postponed, rescheduled, cancelled,
  completed) from the editorial workflow.
- Local start/end dates, timed/all-day/time-TBA precision, IANA time zone,
  precise UTC conversion and explicit selection for ambiguous repeated DST
  times; nonexistent local times are rejected. No invented timestamps for
  untimed items.
- Explicit official-evidence checkbox for official group/organizer/broadcaster
  sources. A press/manual source can be a reference but cannot independently
  qualify an event for approval.
- Links to existing members/videos and visible recent audit history of date,
  time, timezone and status changes.
- Authenticated, validated requests with no service-role key, AI call or
  external source fetching. Existing database workflow is authoritative.

### Event interactive test

Create a clearly marked synthetic event in the test database, select a local
date and an exact time in Asia/Seoul, verify the UTC conversion, link an
official-category test source with explicit evidence, and move through review,
approval and publication. An ordinary manual/press source must not satisfy the
official-evidence requirement. Return the item to draft to reschedule, then
review/publish again and check history. Verify all-day or time-TBA events do
not invent a clock time. Test fixture URLs/names are for homologation only.

Status: implementation and automated tests complete, authenticated owner
validation pending. No SQL migration beyond Phase 2.3.1 is required.

## Remaining delivery

1. Editorial database schema and RLS — completed in homologation.
2. News administration and review workflow — validated publication; owner approved progression.
3. Events administration, official sources, time zones and status — implemented, interactive owner validation pending.
4. Public bilingual news feed, article detail, and event schedule.
5. Editorial center and approved-source discovery, deduplication and curation.
6. Opt-in server-only AI assistance; structured suggestions, translations/summaries, reuse, shared cost cap, no automatic publication.
7. Home latest-news and upcoming-events sections, preserving current layout and localization.
8. Preview regression tests and owner approval; only then apply production migration and merge to main.

Keep About/Support the Creator, Community, and future phases out of scope.
