# Analytics and measurement readiness

This build has **no active external analytics or advertising**. No Cloudflare, Google Search Console, Bing Webmaster, paid keyword account, or custom event collector has been connected by the build process.

## Implemented

`apps/web/src/lib/client.ts` dispatches a `deletective:analytics` CustomEvent with one allowlisted event name only. Existing calls cover room creation/join, invite copied, completed round/session, rematch, sharing, daily start/completion and disconnect. No room code, credential, name, answer, vote target, invite URL or user identifier is included. The event bus is an instrumentation interface, not collected usage data or a metrics dashboard. A refresh can produce another lifecycle event; session-level deduplication must be designed in a future collector.

An optional `PUBLIC_CF_ANALYTICS_TOKEN` (32 hex characters) includes Cloudflare's page-view/performance beacon on public pages only. It is never injected into `/play` or `/room` and SPA tracking is disabled. The build CSP permits the beacon only when the token setting is present; response headers permit the official endpoints. Default builds contain no beacon. Adding a token is a build-time change and requires a rebuild, policy review and verification in the intended hosting environment.

Cloudflare's [collection documentation](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/) describes the official script and endpoints; [SPA guidance](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/) explains the explicit `spa:false` setting. Its page-view beacon does not implement this project's custom product-event funnel.

## Owner setup before collection

1. Complete the operator/contact and jurisdictional privacy review. Verify provider data fields, retention and any local consent requirements.
2. Set up Cloudflare Web Analytics in the owner's account if desired; do not enable zone-wide automatic injection into private game routes. Verify the actual network payload and page URLs. A private room URL must never be sent to analytics.
3. Set the optional public token in the build environment, rebuild and confirm public-only script presence. Disable it and rebuild if collection differs from the intended policy.
4. For a future product-event collector, accept only allowlisted enum values, strip request URLs/referrers before persistence, rate limit, use coarse aggregated daily counts and define retention. Do not use raw event payloads or credential-bearing URLs as metric labels. Do not add fingerprinting to count returning players.
5. Establish owner-authorized Search Console and Bing properties after the approved domain is deployed. Verify ownership, submit the exact production sitemap and inspect indexing/search query reports. No account verification receipts exist yet.

## Metrics to establish after staging

Visitor→play, room-create→join→start, lobby abandonment, coarse group-size distribution, completed rounds/session, session duration, rematch and share rates, daily completion, disconnect/error rates and organic landing-page conversion. An event sink, privacy-safe aggregation and denominators are needed before those rates can be reported. Duo→Party changes and returning-user metrics are not currently measurable from the name-only event bus. Do not invent values from test sessions.

Use the provider dashboard for request/quota trends without enabling private-body logging. Lab and field Web Vitals must be labelled separately. This repository's local asset sizes, browser tests and transport smoke measurements are not production usage analytics.
