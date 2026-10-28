# Deletective

**What did they delete?!** A free browser party game about inventing the missing message in fictional group chats. An independent project; it does not use or modify Control Freak.

This repository contains a working local game, actual Cloudflare Durable Object/WebSocket multiplayer, responsive public pages and deployment configuration. **It has not been deployed publicly or cleared for launch.** Brand/domain/legal decisions, a Cloudflare account, production staging checks and real-device testing remain. See [launch checklist](docs/launch-checklist.md) and [roadmap](docs/roadmap.md).

## Play locally

Requirements: Node **22.12+**, npm, and an internet connection for the initial dependency installation. Developed on Apple Silicon with Node 24.18.0. Exact dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run build
npm run preview
```

Open **http://127.0.0.1:8787**. Create a room in one browser tab/profile, copy its invitation, and join from a separate browser/profile with a different name. Each player is a real authenticated WebSocket client. The local URL works on this computer; friends elsewhere need an authorized hosted deployment. No simulated players are included.

To edit the frontend with automatic refresh, keep the room server running and start `npm run dev` in a second terminal. Open http://127.0.0.1:4321; Astro proxies `/api` and WebSockets to the same room backend. Wrangler's ignored `.wrangler/` folder holds local room storage. Stop the server before clearing local state.

## The game

Read the fictional reactions, write the deleted message in secret, lock your answer, then reveal together. The server controls time, eligibility, answer visibility and points.

| Mode | Players | What happens |
| --- | --- | --- |
| Duo | Exactly 2 | Both write, reveal and react; shared completion score |
| Couples | Exactly 2 | Same comfortable flow; 31 tailored prompts with wholesome/date-night packs |
| Party | 3–10 | Anonymous answers, one non-self vote each, 100 points per vote; ties stand |
| Reaction Chain | 3–10 | Two secret reaction writers, then reconstructions; roles rotate. A sole reconstruction uses participation scoring |
| Daily | 1 | Server-UTC challenge, curated alternative after completion, local streak; no joke quality score |

The library contains **120 authored prompts across 15 categories**. No paid API or AI judge is required. Core features include private invite links/codes, guest avatars, reconnect/refresh, host migration, authoritative deadlines, early completion, rematches, session gallery, emoji reactions, host removal, local hiding/report notices, sound opt-in, reduced motion and explicit PNG/text sharing.

## Verify

```sh
npm run check
npm test
# Start npm run preview first for the following network/browser checks:
npm run test:integration
npm run test:e2e
npm run test:seo -- --base http://127.0.0.1:8787 --browser
npm run test:load
# Self-contained restart test uses temporary storage and port 8791:
npm run test:recovery
# Build and package only; does not deploy:
npm run deploy:check
```

`npm test` scopes Vitest to engine/content tests and excludes Playwright. The integration tests create disposable synthetic rooms. Browser tests use independent contexts with actual server connections; compatible Playwright browser binaries and installed Chrome are required for the full configured matrix. On a new machine, install the standard Playwright browsers if absent. A player never needs those tools. Tests run one worker to respect the real room-creation limit. Do not run these suites against an unrelated live service.

Read [test report](docs/test-report.md), [browser evidence](docs/browser-qa-evidence.md), [performance evidence](docs/performance.md) and [SEO audit](docs/seo-audit.md) for actual runs and limitations. No bug-free, ranking or production-capacity guarantee is implied.

## Architecture and layout

- `apps/web/`: Astro static public pages, React game islands, original SVG brand assets, self-hosted fonts and CSS.
- `apps/realtime/`: Worker routing, one SQLite Durable Object per room, hibernation-compatible sockets, persistent state and alarms; separate short-lived abuse counters.
- `packages/game-core/`: shared server-authoritative rules, scoring, privacy projections and validation.
- `packages/shared/`: typed client/server protocol.
- `content/prompts/`: server-only prompt bank, examples and deterministic daily rotation.
- `tests/`: Vitest, actual HTTP/WebSocket integration, restart/load scripts and Playwright.
- `docs/`: design, research, operations, security, measured QA and launch dependencies.
- `tools/seo-skills/`: 13 source-separated, pinned SEO instruction packages and licenses. They are development references, never shipped to players.

See [architecture](docs/architecture.md), [rules](docs/game-design.md) and [security](docs/security.md). There is no mandatory account provider, external database, ad system or payment integration.

## SEO and configuration

Until a valid site origin is configured, public pages deliberately use `noindex`, robots blocks all crawling and the sitemap is empty. Set **`PUBLIC_SITE_URL` at build time** to the actual approved HTTPS origin and rebuild to generate self-canonicals, OG URLs, robots and the public sitemap. Room/play/API routes stay excluded. Never use an unowned candidate domain. A configured `.example` fixture tests output only; it is not a deployment.

```sh
PUBLIC_SITE_URL=https://your-approved-host npm run build
```

Also set the same public origin in the chosen Wrangler environment's `vars`. The guarded production deployment script requires an exported clean HTTPS origin. No secrets belong in `PUBLIC_*` values or this repository. `.env.example` documents optional local settings.

The optional `PUBLIC_CF_ANALYTICS_TOKEN` enables a Cloudflare page-view beacon **only on public pages**, never private rooms/play pages. It is unset and inactive in this build. Product events currently use an allowlisted, content-free browser event interface; no event collection account is connected. Read [analytics setup](docs/analytics.md) before enabling collection. Review and update the privacy policy before changing analytics behavior.

All 13 requested SEO sources were installed as **project-local reference packages**, reviewed and adapted through [the explicit SEO workflow](tools/seo-skills/DELETECTIVE-WORKFLOW.md). They are not globally registered Codex/Antigravity skills. See [compatibility matrix](docs/seo-skills.md), [keyword strategy](docs/seo-strategy.md), [competitor research](docs/competitor-research.md) and [brand/domain research](docs/brand-domain-research.md).

## Deploy when authorized

[Deployment instructions](docs/deployment.md) cover staging/production bindings, SQLite migrations, environment variables and rollback. `npm run deploy:check` is a local dry run. `deploy:staging` and `deploy:production` actually publish and require owner authorization and Cloudflare access. No account login, purchase, paid-plan change, domain registration or public deployment was performed during this build.

Review [current costs and free quotas](docs/cloudflare-costs.md); free hosting is finite. No guarantee of unlimited service is made. Dynamic state writes and alarms can exhaust the SQLite write allowance before request quotas.

Original brand vectors/UI and prepared fictional content belong to this project subject to the owner's licensing decision. Bundled font licenses are retained in public `licenses/`; upstream SEO packages retain their own licenses. No license or legal clearance is implied for the provisional Deletective name.
