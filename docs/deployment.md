# Cloudflare deployment

This repository prepares a Cloudflare Worker with static assets and SQLite-backed Durable Objects. No account has been connected and no public deployment/domain purchase is implied by the configuration.

## Local development

Use Node 22.12 or newer and install with `npm ci` after the lockfile is present. Build public assets with `npm run build`. Run `npm run dev:rooms` (Wrangler, port 8787). The built game and `/api/health` are then available on `http://127.0.0.1:8787`.

For frontend iteration run `npm run dev` on port 4321 alongside the room server. The Astro development proxy forwards `/api` and WebSocket requests to Wrangler. Build before using the production-shaped port 8787 preview. Local Durable Object state lives in ignored `.wrangler/`; stop Wrangler before clearing that directory for a completely clean local state.

Both staging and production `wrangler deploy --dry-run --env ...` packaging checks passed locally on 28 October 2026; this did not contact a deployed application or establish account access.

Checks: `npm run check`, `npm test`, `node tests/integration/realtime.mjs`, `node tests/integration/recovery.mjs`, `node tests/integration/load.mjs`, `npm run test:e2e`, `npm run test:seo`, and `npm run deploy:check`. Real integration checks require the server running and use temporary rooms/credentials. `TEST_BASE_URL` can target an authorized staging URL. Never target an unrelated production service.

## Account and staging

1. Owner signs in with `npx wrangler login`, or supplies a narrowly scoped Cloudflare API token through a secure local environment. Never commit account credentials or put them in application browser variables.
2. Verify the account can create SQLite Durable Objects on the selected plan and inspect official quotas in `docs/cloudflare-costs.md`.
3. Choose an approved staging workers.dev URL. Set `PUBLIC_SITE_URL` to the **actual approved URL** for the build, so generated canonicals/sitemap point there. A provisional domain is not proof of ownership. Build again after changing this value.
4. Add `PUBLIC_SITE_URL` to the selected Wrangler environment's `vars` with that same origin. This is public configuration, not a secret. The Worker also accepts its own request origin.
5. After owner authorizes staging deployment, run `npm run build` and `npx wrangler deploy --env staging`. Verify the returned URL, migration application and the correct `ROOMS`/`GATES` bindings. Both classes use the `v1` SQLite migration.
6. Run real multiplayer, daily, sharing, private indexing/header and mobile checks on that exact staging URL. Verify room expiry, host migration and a storage-restored reconnect. A successful dry run is not a deployed-service test.

The staging environment uses a different Worker name and namespaces from production. Retain binding declarations when editing environments; they are explicitly configured because bindings do not inherit like ordinary settings.

## Production and domain

Finish brand/trademark/domain review before final branding or purchases. Domain registration, paid products and public production deployment require the owner's authorization. Configure an owned/approved custom domain through Cloudflare only after that decision. Do not assume `deletective.com` is available.

Set `PUBLIC_SITE_URL=https://approved-host.example` at build time and in production vars. `npm run build` then `npx wrangler deploy` deploys the default `deletective` Worker; `npx wrangler deploy --env production` deploys the explicit production environment. The production npm script explicitly selects `--env production` and refuses an absent/test/non-HTTPS build origin. Use that convention for releases; direct `npx wrangler deploy` targets the top-level development vars. Test `npx wrangler deploy --dry-run` before an authorized live deployment.

Do not enable paid plans or additional storage services to work around quota failures without owner approval. The core game uses neither a paid API nor a payment provider.

## Launch verification

Confirm production HTTPS/WSS, origin validation, shared invitation links across two real devices, no-answer disclosure before reveal, vote integrity, noindex/no-store on rooms, actual canonical URL, sitemap, static security headers and mobile keyboard behavior. Check the absence of secrets/content in logs and analytics. Configure Search Console/Bing verification through owner accounts and submit the actual production sitemap. Configure privacy-conscious analytics only after checking its collected fields and jurisdictional requirements.

Record deployed version ID/date, namespace IDs, build commit, observed quota use and actual browser/device coverage in the test report. Keep staging URLs out of the production sitemap. No synthetic rating/review schema or fake player counts should be added.

## Rollback and operations

Record `npx wrangler deployments list` and the current version before a release. Use `npx wrangler rollback <VERSION_ID>` to return code/assets to the recorded version after owner-authorized deployment. A code rollback does not undo Durable Object schema/state changes. Current state uses a versionless room record and a single `v1` creation migration, so future incompatible state changes need explicit migration handling. Existing rooms expire within two hours; consider a maintenance window or preserving backward-compatible deserialization.

Inspect Cloudflare quota dashboards without logging private room content. At free-tier exhaustion, creation/join may fail and players should receive the site's retry message; do not promise unlimited service. Pending sockets, stale hosts, deadlines and inactive rooms are cleaned via durable alarms. If provider quotas disable alarm processing, cleanup may be delayed until capacity returns; no client-side promise overrides a provider outage.
