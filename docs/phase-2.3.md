# Phase 2.3 — News & Events

Roadmap 3.0: phase 2.2 (Eras and Smart Import) was released on 2026-11-25. Phase 2.3 is developed in isolation from production. All existing Watch, members, admin, and localization behavior must remain compatible.

## Initial navigation delivery

- Home: compact News and Events submenu; keep Home itself clickable.
- Members: direct links to all seven existing member pages.
- Watch: keep current category links; center submenu text and size to content.
- Mobile: expandable navigation groups.
- Admin: Dashboard, expandable Watch group (Videos, Add New Video, Content Import Center, Era Management), Visual Studio, News, Events, Editorial. Automatically reveal an active Watch subpage. The additional modules can use the same group pattern later.
- Temporary News, Events and Editorial landing pages are explicitly preview-only workspaces under development. They contain no fabricated data, must not be indexed, and must be replaced by real implementations before release.

## Remaining delivery

1. Verify isolated Supabase environment and design/add additive editorial schema and RLS.
2. News administration and review workflow.
3. Events administration, official sources, time zones and status.
4. Public bilingual news feed, article detail, and event schedule.
5. Editorial center and approved-source discovery, deduplication and curation.
6. Opt-in server-only AI assistance; structured suggestions, translations/summaries, reuse, shared cost cap, no automatic publication.
7. Home latest-news and upcoming-events sections, preserving current layout and localization.
8. Preview regression tests and owner approval; only then apply production migration and merge to main.

Keep About/Support the Creator, Community, and future phases out of scope.
