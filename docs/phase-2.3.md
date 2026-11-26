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

Status: owner confirmed Schedule administration works in homologation; the
provided screenshot shows a saved draft and its original Asia/Seoul time.
Public publication is checked separately in Phase 2.3.4. No new SQL required.

## Phase 2.3.4 — Public News and Events
     
- Public `/news` feed with a featured story, chronological articles, bilingual
  search, category/Era/member filters, and pagination. Detail pages at
  `/news/[slug]` show the bilingual summary/body, optional cover, credits,
  attribution sources, and existing public members/Watch videos.
- Public `/schedule` provides Upcoming, Calendar and History views, bilingual
  search and category/Era/member/activity-status filters. Monthly calendar
  preserves the original local calendar dates and includes overlapping multi-day
  events. The monthly view displays up to 200 matching events with a visible
  filter/refinement notice; lists are paginated.
- `/schedule/[slug]` shows date/time precision, original IANA zone and
  visitor-zone conversion for timed events, activity status, venue, official
  link and public relations. Untimed events retain their local calendar dates
  and never receive fabricated times. Date-only list grouping uses the current
  UTC calendar day; exact timed list grouping uses UTC instants.
- All public queries use the anonymous publishable-key role (even for signed-in
  admins), explicit published status and publication date, uncached request-time
  reads, and existing RLS. Unpublished or missing slugs are not found; private
  discovery, AI and audit records are not read. Remote covers use HTTPS
  direct browser loading with a branded fallback, not a server-side proxy.
- No production deployment, SQL change, automatic fetching, AI, Home integration,
  or change to existing Watch/Members in this step. Preview pages stay noindex
  until release.

### Owner acceptance of public pages

1. Open the new Preview News page. The existing published test article must
   appear in the featured area; open its detail and verify both languages,
   cover and linked test attribution. Check search/filter.
2. Open Events in the same Preview. Draft events must not appear, even when
   an administrator is logged in. Publish the clearly labeled test event using
   the admin workflow and verify its listing, details and December calendar.
3. A 2026-12-01 18:00 Asia/Seoul timed test event displays 06:00 in the
   America/Sao_Paulo timezone. Check all-day/time-TBA display and event status.
4. Return a test item to draft and verify it disappears from the public list
   and cannot be opened by its slug. Publish again if more testing is needed.
5. Check English/Portuguese, desktop/mobile, existing public pages and admin.
   Keep the synthetic content and test source in the test database only.

The owner approved the News and Events views on 2026-11-26. The Events
filter form now fits all five controls on one desktop row and wraps on
narrower screens.

## Phase 2.3.5 — Editorial Center

- The bilingual `/admin/editorial` workspace uses the existing editorial schema.
  Administrators can register or edit shared sources, toggle source availability,
  add candidates manually, and scan active RSS or Atom feeds on demand.
- Feed scans use the configured direct HTTPS URL, limit the response to 1 MiB,
  and process up to 25 matching entries per scan. The keyword defaults to
  BABYMONSTER, including Korean and Japanese spellings. Editors can change or
  clear the keyword. Only feed metadata and a short excerpt enter the queue.
- Canonical URL and per-source external ID prevent repeat candidates. URLs
  already linked to an article or event of the same type are skipped. The
  review queue supports search, filtering, pagination, editorial notes and
  review statuses. Selected candidates can be used as a reference for manual
  draft creation in News or Events.
- All reads and changes use the active administrator session and existing RLS.
  Source and candidate updates reuse the existing audit triggers. The RSS
  reader verifies public IP addresses, pins the HTTPS connection and refuses
  redirects. Source discovery and public publishing are separately controlled
  by the editor. Phase 2.3.6 supplies AI drafting assistance.

### Preview acceptance

1. Open Editorial Center as an active administrator. Register a manual source
   and add a labeled test candidate with its original URL.
2. Add the same URL with a different tracking parameter. Confirm the duplicate
   message and a single candidate in the queue.
3. Review the candidate, add an editorial note, and select or reject it. Refresh
   and verify the decision persists.
4. Register an active source with a direct public feed URL, choose a content
   type and scan. Confirm matching entries enter the queue as pending.
   Repeat the scan and check the duplicate count.
5. Open public Events at desktop and phone widths to check filter alignment.
   The existing Supabase migration from Phase 2.3.1 covers this delivery.

## Phase 2.3.6 — AI draft assistance

The owner approved the Editorial Center on 2026-11-26. Accepted candidates
with active sources can now open AI draft assistance in their review panel.

- Generation is started by the editor. The model receives the original title,
  excerpt, language and any verified facts the editor adds. It returns PT-BR
  and EN titles and summaries, plus a category from the selected taxonomy.
- Editors can change the texts and category before saving. The draft and its
  original attribution are created in a single transaction. A repeated save
  opens the existing item. Events start with an unconfirmed date and an
  unverified source link. The existing review and publication rules apply.
- Identical inputs reuse a stored suggestion. The database records token usage
  and estimated cost when the gateway supplies usage information. A shared
  editorial allowance reserves US$0.005 per new attempt against US$1 per UTC
  month. Failed attempts retain their reservation, and reuse adds no charge
  to this allowance. These are application estimates for editorial assistance.
- Vercel Preview enables the feature by default. `EDITORIAL_AI_ENABLED` can
  override the default. The Gateway uses the existing server-only OIDC/API
  credential path and the Gemini 2.5 Flash-Lite model.

### Preview activation and verification

1. In the Supabase SQL Editor for `monster-archive-test`, apply
   `supabase/migrations/202611260001_editorial_ai_assistance.sql`.
2. Optionally run `supabase/checks/phase_2_3_6_workflow.sql` in the same SQL Editor.
   Expect PASS. The fixture transaction rolls back and makes zero AI calls.
3. In the Vercel Preview, select a candidate with an active source, open
   **AI draft assistance**, and generate a suggestion. Reopen with the same
   inputs to verify reuse. Edit one title, create the draft, and open the editor
   to verify the revision and original attribution.
4. For an event, verify the date is empty and the official evidence checkbox
   is clear. Confirm the draft is absent from the public agenda.

## Remaining delivery

1. Editorial database schema and RLS — completed in homologation.
2. News administration and review workflow — validated publication; owner approved progression.
3. Events administration, official sources, time zones and status — owner confirmed in homologation.
4. Public bilingual news feed, article detail, and event schedule — owner approved the views in homologation.
5. Editorial Center and approved-source discovery, deduplication and curation — owner approved in homologation.
6. AI draft assistance — implemented for Preview activation and acceptance.
7. Home latest-news and upcoming-events sections, preserving current layout and localization.
8. Preview regression tests and owner approval; only then apply production migration and merge to main.

Keep About/Support the Creator, Community, and future phases out of scope.
