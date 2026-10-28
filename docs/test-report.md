# Test report — 28 October 2026

Target: the actual local built application in this independent repository. No public deployment, paid service or fake multiplayer was used. Tests used synthetic names and text. Local results are not production certification or proof of entertainment value.

## Results actually observed

| Check | Actual result | Evidence / reproduction |
| --- | --- | --- |
| Static build | Passed; 13 HTML pages plus robots/sitemap emitted | `npm run build` |
| Application/Worker type checks | Passed, zero errors/warnings; one advisory hint for the legacy copy fallback | `npm run check` |
| Engine and content unit tests | **36 passed** (31 engine + 5 content) | `npm test`; `vitest.config.ts` excludes Playwright |
| Real HTTP/WebSocket integration | **16 checks passed** on final backend snapshot | `npm run test:integration`; local Wrangler/SQLite runtime |
| Persisted-runtime restart | **2 recovery checks passed** | `npm run test:recovery`; stops/restarts a temporary runtime preserving storage |
| Browser end-to-end matrix | **20 passed, 0 failed/skipped/flaky**, 116.58 seconds | Full final run began 22:07:37 IST; `test-results/playwright-results.json`; [detailed browser evidence](browser-qa-evidence.md) |
| Default SEO audit | **537 assertions passed, 0 failed/warnings** | `seo-audit-results.json`; actual generated HTML, 18 HTTP routes and Chromium rendering |
| Configured-origin SEO fixture | **345 assertions passed, 0 failed/warnings** | `seo-production-fixture-results.json`; reserved `https://deletective.example`, separate temporary output |
| Production and staging deployment packaging | Both dry runs passed with GameRoom/AbuseGate/ASSETS bindings | `wrangler deploy --dry-run --env production` and `--env staging`; no upload/deployment |
| Bounded parallel-room smoke | Five rooms, ten actual clients, 100 ping samples passed | `performance-results.json`, [measurement limits](performance.md) |

The final browser build was produced at 22:06:28 IST. Later checks/audits are read-only or documentation/configuration checks and do not alter gameplay. The installed browser matrix was Chromium 156.0.8078.4, Google Chrome 156.0.8078.49, Firefox 157.0 and WebKit 27.2. The full mode suite ran in Chromium; genuine Duo/daily/public-page compatibility cases ran in each other browser. This does not claim branded Safari or Edge coverage.

## Core behaviours exercised

- Room create/join, capacity/identity/host rules, invalid entry, real socket authentication and no state before authentication.
- Independent Duo submissions, privacy in received frames and DOM, synchronized reveal, reactions, score, session completion and full rematch.
- Couples-specific wholesome prompt selection, shared completion score, session gallery and local hiding isolated to one device.
- Three-player and six-player Party rules, author anonymity until voting ends, no self/duplicate votes, 100 points per received vote and ties.
- Reaction Chain's independent hidden clues, reconstruction phase, participation scoring for the single answer and rotating roles over three rounds.
- Explicit departure during a six-player browser round, successful five-player continuation; disconnected host grace/migration and original-identity return.
- Browser refresh with locked answer; original session/answer after actual local runtime restart, with vanished connections reconciled correctly.
- Controlled-clock phase deadlines/room expiry, valid phase transitions, stale round rejection, constraints metadata, prompt non-repetition and deterministic valid UTC dates.
- Daily challenge with a spoofed client clock still using server UTC, example absent before submission, locally restored completion/streak, clear control and PNG download.
- Input length/markup/link/control-character handling; host/vote authorizations, report-notice anonymity, cross-origin rejection and invalid credentials.
- Real PNG generation, including a 240-character unbroken-word answer (wrapped/truncated with visible ellipsis in the bounded image; copy-text retains full content).
- A previously saved credential pointing at a deleted/nonexistent room now shows a useful expiration message instead of retrying indefinitely. The added regression passed against the final build.
- JavaScript-disabled public HTML, private noindex/no-store, actual 404s, canonical/sitemap consistency, raster social image, JSON-LD parsing, responsive width and a reduced-height composer.

## Issues found and repaired

The first Astro setup used a root path that did not resolve pages under the installed framework version; explicit source/public paths corrected it before browser QA. The first SEO HTTP audit found slashless entries redirecting to slashful canonicals while sitemap entries used slashless URLs; one consistent slash policy fixed that. Server review corrected a report notice that could identify an anonymous author, and restart recovery now reconciles persisted presence against preserved sockets. Narrow-screen heading sizing, maximum-length card wrapping and saved-expired-room feedback were improved and verified.

Initial browser authoring failures were test-selector and provisional-robots expectation issues. They were corrected; the final matrix has no retries/flakiness. No failing authoring run is presented as a successful product test. Build CSP scope advisories describe the deliberate stricter script-attribute/style-attribute policy; the browser suite observed no CSP refusals or uncaught page errors.

## Not tested or not yet established

- A deployed Cloudflare account, real hibernation/billing/quotas, internet/multi-region latency and production rollback.
- Two-hour wall-clock expiry, prolonged memory/cleanup soak, sustained higher concurrency, distributed abuse resistance or an independent security audit.
- Physical iOS/Android keyboards, real radio loss/backgrounding, actual installed Safari/Edge, ten-person browser play, screen-reader usability or instrumented contrast/accessibility audit.
- Image-clipboard permissions, native share-sheet completion or external social unfurls across physical platforms. Download is verified and fallbacks exist.
- Lighthouse/PageSpeed/field Core Web Vitals, external schema validators, live search indexing, keyword volumes/difficulty, actual traffic/conversion/retention or audience playtesting.
- Trademark/domain legal clearance, operator-policy review, account verification or paid plan changes.

These remain explicit launch gates in [launch-checklist.md](launch-checklist.md). No assertion is made that the product is bug-free, objectively funny, guaranteed to rank, unlimited on a free tier or cleared for public launch.
