# Current state and remaining work

## Implemented candidate

The initial end-to-end product is playable locally, with actual networked players and no mandatory login. Duo and Couples support exactly two players with shared participation points; Couples has 31 tailored prompts and wholesome/date-night selection. Classic Party supports 3–10 with anonymous non-self voting. Reaction Chain rotates reaction/reconstruction roles and adapts scoring to the number of answers. Daily uses server UTC and local streaks.

Rooms provide secure guest credentials, real WebSockets, persistent state/alarms, reconnect, refresh recovery, host migration, bounded lifetime, input validation, basic filtering, report-to-host, local hiding and host removal. Timers advance authoritatively and early completion avoids unnecessary waiting. The UI includes responsive writing, progressive reveals/reactions, sound opt-in, reduced motion, session gallery/rematches and explicit PNG/text sharing.

There are 120 authored prompts, ten distinct static public pages, private indexing protection, original brand vectors, self-hosted fonts, metadata/JSON-LD/sitemap/robots, an OG PNG and Cloudflare deployment configuration. All 13 SEO instruction sources were reviewed, pinned and copied into project-local namespaces with a coordinated adaptation; global skill registration and native Claude-only runtimes are not active.

Tests cover rules/content, actual Worker/network sessions, restart persistence, a small parallel-room smoke and a cross-engine browser matrix. See `test-report.md` for actual counts, results and limits. No unresolved failure is being concealed as a passed test.

## Before public launch

The explicit gates in `launch-checklist.md` remain: brand/domain/legal/operator decisions, authorized account/deployment, staging hibernation/quotas/expiry-soak, real mobile/installed-browser/accessibility checks, friend-group playtesting and external schema/social/performance checks. The candidate is not certified production-ready or bug-free. No Google/Bing indexing, keyword-volume dataset, analytics account or paid service connection exists.

Additional measured verification is needed for ten-player browser sessions, long network disruptions, prolonged resource use, persistent-state evolution across future schema changes and actual free-tier row billing. Local restart recovery does not prove deployed hibernation. The basic language filter is not comprehensive moderation; reports notify a room host, not a moderation team.

## Near-term improvements after playtests

- Tune prompt/reveal pacing and improve repeated-session variety using optional local history without uploading private text.
- Expand tailored scenarios only where playtest feedback shows a content gap; retain editorial review and avoid low-quality bulk generation.
- Improve reveal presentation and game-based local achievements when they add enjoyment, without false humor judgments.
- Add privacy-safe coarse event aggregation after the operator approves a collector and retention policy. Keep private-room pages out of third-party beacons.
- Measure organic query intent and actual conversion before adding editorial/comparison pages. No synonym doorway-page generation.
- Refine accessibility from screen-reader/keyboard feedback and verify real mobile share/clipboard behavior.

## Deliberately deferred

Public answer feeds, matchmaking with strangers, accounts, D1/KV/R2 databases, AI generation/judging, payments, intrusive ads, premium packs and competitive two-person voting. None is required by the working core, and payments/publication are not authorized automatically by this roadmap.
