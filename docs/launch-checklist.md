# Launch checklist — 28 October 2026

Status: **functional local candidate; public launch pending**. No public deployment or purchase has been performed.

## Completed locally

- Independent repository, pinned dependencies, reproducible static build and Worker packaging.
- Actual multiplayer: Duo, Couples, Party and Reaction Chain; server-authoritative privacy, deadlines, votes and guest identity.
- Server-UTC daily challenge, 120 prepared prompts, session rematches, explicit sharing and responsive interface.
- Engine/content tests; actual multi-client Worker tests; persisted-runtime restart recovery; bounded five-room load smoke; real browser matrix.
- Crawlable public HTML, distinct mode pages, metadata/schema, configured-origin sitemap/robots, private noindex/no-store and raster social card.
- All 13 SEO sources installed locally, source/license reviewed and portable workflow documented.
- Default build protected from indexing; Cloudflare development/staging/production configuration prepared; no paid core API.

## Owner/external prerequisites

- Finish provisional name/trademark/common-law review. Domain lookups are dated evidence, not availability or legal clearance. Choose and approve a domain; no purchase is authorized by this checklist.
- Finalize operator identity, reachable support/privacy contact, audience/age policy, applicable jurisdictions and legal review. The site's policies currently identify these as prelaunch dependencies.
- Authorize and provide the intended Cloudflare account access securely. Confirm current plan and namespace/migration permissions; inspect quota dashboards. No credentials should be committed.
- Authorize an actual staging deployment, set the real HTTPS `PUBLIC_SITE_URL` in build and Worker configuration, and verify the returned URL/bindings.
- Complete staging checks: two real devices/networks, actual Cloudflare hibernation and alarm recovery, a room expiry/cleanup soak, quota-failure behavior and production headers/Origin enforcement.
- Check physical iOS/Android keyboards, safe areas/backgrounding, installed Safari/Edge, image clipboard/native share, keyboard navigation and screen-reader use.
- Run friends/couples/group playtests; review prompt quality, onboarding, pacing, unfair-feeling edge cases and replay interest. Development tests cannot prove entertainment value.
- Run production Lighthouse/PageSpeed and external schema/share-preview validation. Establish field monitoring when traffic exists.
- Configure only desired, reviewed analytics/search accounts. Verify no private URLs or messages in collected data.
- Review the final test report and unresolved issues. Record commit, build/version, namespace IDs and rollback target, then obtain public production launch authorization.

## Release commands

`npm run deploy:check` packages locally without publishing. After the owner authorizes a target deployment, use `deploy:staging` or the guarded `deploy:production` script. Production requires an exported clean HTTPS `PUBLIC_SITE_URL`; a domain value is not itself proof of ownership. Deployment/rollback details are in `deployment.md`.

After publication, audit the actual deployed origin. A successful local fixture, dry run or browser test must never be presented as deployed verification. Do not enable paid services or billing to bypass quota limits without authorization.
