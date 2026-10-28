# SEO audit and verification evidence

Audited 28 October 2026 against the actual generated `dist/` and the local Cloudflare/workerd preview at `http://127.0.0.1:8787`. The audit uses the [reviewed 13-source workflow](../tools/seo-skills/DELETECTIVE-WORKFLOW.md). It does not claim rankings, search volume, legal clearance, external indexing or guaranteed rich results.

## Verified result

The final provisional-build run passed **537 checks, with zero failed checks and zero warnings**. These are individual structural assertions, not an SEO score. Evidence is retained in [seo-audit-results.json](seo-audit-results.json), including timestamp, per-page measurements, HTTP results, browser version and emitted asset sizes.

Command actually run:

```sh
node scripts/audit-seo.mjs --base http://127.0.0.1:8787 --browser --output docs/seo-audit-results.json
```

The project-owned audit script reads built files, requests the local server and optionally launches installed Playwright Chromium. It does not run any upstream SEO script, contact a paid API or log private room content. Plain `npm run test:seo` runs the built-file checks without requiring a running server or browser. Run `npm run build` first.

## Public HTML and content

| Check | Measured outcome |
| --- | --- |
| Public page candidates | 10: `/`, `/2-player`, `/couples`, `/party`, `/daily`, `/how-to-play`, `/about`, `/faq`, `/privacy`, `/terms` |
| Meaningful initial HTML | Every public candidate has visible main-content text before JavaScript; measured main-text length ranges from 356 characters on Daily to 2,842 on Privacy |
| Metadata | All ten have distinct titles and descriptions, English language and responsive viewport metadata |
| Heading structure | One descriptive primary heading on each public page |
| Internal links | All inspected internal anchor destinations exist; same-page fragment targets resolve; query strings do not create extra static routes |
| Mode-page value | Manual review confirmed distinct Duo rules/shared scoring, tailored Couples packs/fictional scenarios, Party voting/Chain rules and direct mode launch links |
| Structured data | One JSON-LD block/page parsed in built HTML and the rendered DOM; describes `WebApplication` with `applicationCategory: GameApplication`, free access and price 0 |
| Claims | No review counts, aggregate rating or fabricated popularity data in schema; no claim of recovered real messages or objective humor scoring |
| Private/utility HTML | `/play`, `/room` and the built 404 page have noindex and omit canonical/schema publication |

Public text is prebuilt. Interactive multiplayer and the Daily prompt need JavaScript, but the purpose, requirements and rules are available without running the game. Character counts above describe current text presence, not a Google word-count target. The public copy avoids synonym-only programmatic pages and gives each mode an actual different use case. The game is openly described as a provisional brand in development.

Title lengths of 21–56 characters and public description lengths of 126–173 characters were observed. These are descriptive lint signals; search snippets and title rewriting are engine/device-dependent. No fixed length guarantees a particular result display.

## Actual HTTP and browser checks

Eighteen sampled routes were requested against the local preview. The ten public pages, `/play`, `/room`, an invented deep room path, `/api/health`, `robots.txt` and `sitemap.xml` returned the expected status. Unknown page/API routes returned actual HTTP 404, rather than a successful application shell. Final sampled entry paths required no redirects after URL-policy correction.

Room and API responses returned `X-Robots-Tag: noindex`; room HTML also returned `Cache-Control: no-store`. CSP headers were present on the public and room responses inspected. These indexing controls are separate from the game's session authentication and are not an access-control mechanism.

**Real Chromium 156.0.8078.4** rendered all ten public pages. Each retained main content, a primary heading and parseable JSON-LD. No horizontal overflow was detected at desktop 1280×900 or simulated mobile width 390×844. This browser evidence is not a physical iOS/Android keyboard test or a Safari/Firefox/Edge certification. Multiplayer/browser coverage is reported separately in `test-report.md`.

## Provisional indexing policy and configured-origin readiness

The current default build intentionally has no production origin:

- Every public page has `noindex, nofollow`.
- Canonical production URLs and OG URL/image targets are omitted until configured.
- `robots.txt` disallows `/`.
- `sitemap.xml` is a correctly structured, empty URL set with the standard sitemap namespace.
- No private room, API, generated answer, share-result or parameter URL appears in the sitemap.

This is correct **development protection**, not a failed launch attempt. A real deployment must set a verified HTTPS `PUBLIC_SITE_URL` and rebuild before intentionally allowing indexing. Source review confirms metadata, sitemap and robots are derived from that variable. The generators do not hardcode the provisional candidate domain.

The site now explicitly uses a slashless public URL policy: Astro `trailingSlash: never`, Cloudflare assets `html_handling: drop-trailing-slash`, and the room rewrite matching that policy. The initial HTTP pass discovered 307 redirects from slashless entries to slashful pages while the sitemap generated slashless entries. That inconsistency was fixed before the final successful run. The audit now compares configured sitemap entries with actual built canonical URLs, rather than assuming one slash style.

Production-origin fixture testing can be run without changing the normal `dist/`:

```sh
PUBLIC_SITE_URL=https://deletective.example npm run build -- --outDir /private/tmp/deletective-seo-fixture
node scripts/audit-seo.mjs --dist /private/tmp/deletective-seo-fixture --site https://deletective.example
```

`.example` is a reserved test origin, not a purchased, verified or deployed game domain. The configured-origin fixture was actually executed on 28 October 2026 and passed **345 checks, zero failures/warnings**; its evidence is `seo-production-fixture-results.json`. The fixture checks canonical/sitemap/OG consistency and expected indexability. A real production HTTP/CDN audit, domain ownership verification, Search Console property and sitemap submission remain pending. Do not treat a local configured-origin fixture as any of those external confirmations.

## Social preview and structural performance measurements

The original SVG card was supplemented with a real **1200×630 PNG**, inspected from its PNG dimensions: 67,728 bytes. Configured-origin metadata points to that PNG and supplies image dimensions/alt text. Actual unfurl behavior on external social platforms has not been tested.

All emitted assets in the audited build:

| Asset class | Raw bytes | Calculated gzip bytes |
| --- | ---: | ---: |
| JavaScript, all routes combined | 263,089 | 84,316 |
| CSS, all routes combined | 29,908 | 6,979 |
| WOFF2 fonts | 103,100 | 103,127 |

These are build-file measurements, **not initial homepage transfer totals, edge latency or browser performance scores**. WOFF2 is already compressed, explaining the negligible/increased gzip size. Fonts and essential styling are served locally; project tooling, research documents, tests and skill sources are absent from static assets.

No Lighthouse/Agentic Browsing audit, PageSpeed Insights run, real-user LCP/CLS/INP measurement, field Core Web Vitals pass or production load result is claimed. Browser navigation timings in evidence are local observations only, with no device/network throttling. Production performance and retention remain to be measured.

## Remaining launch checks and external dependencies

1. Complete owner/operator identity, contact and jurisdiction-specific policy review; finish trademark/common-law clearance and approve a domain.
2. Set the actual HTTPS origin, run the configured-origin audit, then verify production HTTP status, canonical redirects, robots, sitemap, headers and share previews after authorized deployment.
3. Run a production Lighthouse/PageSpeed lab audit; monitor field Core Web Vitals once enough real traffic exists.
4. Validate rendered structured data with Schema.org/Google tools against the deployed site. Parsed syntax alone neither proves full schema conformance nor rich-result eligibility.
5. Connect owner-authorized Search Console/Bing properties, submit the real sitemap and inspect indexing evidence. No account is claimed connected and no search engine has confirmed indexing.
6. Obtain reliable keyword/country/trend data before making numeric prioritization or traffic forecasts. The current strategy labels all unavailable metrics Unknown.
7. Measure actual organic-to-play, invite/join, session completion, rematch and sharing rates without transmitting player names, codes, credentials or answer text. Optional analytics configuration remains inactive by default.

No unresolved failure was found in the scoped local SEO audit. External launch dependencies and unperformed measurements above remain explicit; they are not silently converted into passed checks.
