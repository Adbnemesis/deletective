# Cloudflare cost and capacity notes

Verified against official documentation on 28 October 2026. Core gameplay needs no paid API. This is a free-plan-compatible architecture, **not a promise of unlimited free hosting**. No Cloudflare account, paid plan or deployment was activated during development.

## Current official limits

[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) lists 100,000 dynamic requests/day on Free, with 10 ms CPU/invocation. Static-asset requests are free and unlimited when served as assets. The initial WebSocket upgrade is a request; later WebSocket messages passing through the front Worker are not additional Worker requests. Paid Workers starts at $5/month, with included allocations; an upgrade requires owner approval.

[Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) allows SQLite-backed DOs on Free: 100,000 requests/day, 13,000 GB-s/day, 5 million rows read/day, 100,000 rows written/day, 5 GB stored. Incoming WebSocket messages use 20:1 request billing; outgoing messages are free. Alarms count as requests; `setAlarm` and deletes count as row writes. KV-style storage methods on SQLite also incur row usage. Limits reset at 00:00 UTC; operations exceeding a Free limit fail. Eligible hibernation time is not billed; active duration is accounted at 128 MB per object. These are separate limits, so low request traffic does not guarantee capacity.

[Workers limits](https://developers.cloudflare.com/workers/platform/limits/) specifies 128 MB per isolate, 20,000 static files/version on Free and 25 MiB per asset. The 10 ms CPU budget is execution time, distinct from waiting on I/O. Keep API validation small and public pages prebuilt. No heavy server rendering or AI inference is needed.

[DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/) specifies 100 classes/account on Free and 10 GB/object subject to the smaller Free account cap. Platform WebSocket receive limits are far larger than this game's permitted payloads; the application must enforce its own small bounds. Account eligibility and actual dashboard settings need verification when an owner connects Cloudflare.

## Architecture and meaningful cost risks

`wrangler.jsonc` declares `GameRoom` and `AbuseGate` as SQLite classes. Each room persists one bounded state object, uses the Hibernation WebSocket API and schedules authoritative deadlines with durable alarms. The abuse gate persists a per-IP action window. Static pages/assets bypass the Worker except the declared API/room routes.

A persistent WebSocket does not require an in-memory interval. Authentication, game actions, reconnects and alarms do create work. Saving a room and rescheduling its alarm costs at least two writes; gate checks and gate cleanup add writes. For this implementation, **row writes may be the first Free quota reached**. Hibernation eligibility and real row accounting must be measured in staging, rather than inferred from local success. Long open connections, repeated reconnects, spamming reactions, and invalid actions all change the budget. Abusive traffic can exhaust an account quota despite application rate limits.

## Transparent scenario model

Calculated scenario, not measured production usage. Assumptions: one session/person/day; four players/room on average; five rounds; ten minutes wall time; about 20 incoming game/auth messages plus 24 client heartbeats/person; a small allowance for HTTP, DO gate calls, room alarms and cleanup. Budget **4 Worker requests, 10 billed DO requests and 80 SQLite row writes per player**. For duration, illustrate 30 active billable seconds/room with hibernation between events: `30 × 0.125 / 4 = 0.9375 GB-s/player`. Assume 200 KB temporary state/room; peak storage below is an intentionally conservative all-daily-rooms-at-once calculation, excluding SQLite overhead and abuse gates.

| Daily active players | Rooms/day | Worker req/day | DO billed req/day | Rows written/day | Illustrative GB-s/day | Temporary room state | Free assessment |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 10 | 2.5 expected | 40 | 100 | 800 | 9.4 | 0.5 MB | Plausible $0, validate account/staging |
| 100 | 25 | 400 | 1,000 | 8,000 | 93.8 | 5 MB | Plausible $0, measure room activity |
| 1,000 | 250 | 4,000 | 10,000 | 80,000 | 937.5 | 50 MB | Writes already use 80% of Free allowance |
| 10,000 | 2,500 | 40,000 | 100,000 | 800,000 | 9,375 | 500 MB | Writes exceed Free 8×; DO requests reach the cap; Free is unsuitable at these assumptions |

These assumptions do not include crawlers invoking dynamic routes, a viral spike, multiple sessions/day, users sharing an IP, application retries, row-read amplification, platform metadata or a failed client reconnect loop. Round settings and pair-heavy usage also change the room-to-player ratio. Do not size capacity from DAU alone.

Without hibernation, a ten-minute room costs `600 × 0.125 = 75 GB-s`, or 18.75 GB-s/player at four players. 1,000 daily players would consume 18,750 GB-s: above the Free duration limit. That is why hibernation is a functional requirement, not a cosmetic optimization. It does not remove state-storage costs.

A paid illustration at 10,000 players/day for 30 days, under the same assumptions: 1.2M Worker requests; 3M DO billed requests; 281,250 GB-s; 24M writes. At the current DO paid rate, 2M excess requests would be about $0.30 beyond included requests, on top of the $5 base. This **$5.30 illustration is not a quote or upper bound**: it assumes duration/SQL/Worker CPU stay within paid included allocations and ignores other account usage. Failure of hibernation or higher mutation rates can materially change it. No paid plan is needed for the local game or a small Free staging test.

## Launch operating procedure

1. Confirm owner account supports Workers Free and SQLite DO namespaces. Use separate staging and production namespaces; do not add D1/KV/R2 without need.
2. Deploy staging only after authorization; inspect DO requests/duration/rows and Worker CPU/errors during actual multi-client games.
3. Capture five-round Duo, three-player Classic, six-player Classic and Chain sessions. Record writes/room, billable duration, messages and reconnects.
4. Set operational review thresholds below quotas (suggested: 50%, 70%, 90%). Dashboard alerts depend on account capabilities and are not claimed configured.
5. Verify expired room/gate data is removed, repeat the measurement, then replace this scenario table with real per-session measurements.
6. At quota pressure, keep static pages and explanations available; return clear retry/server-unavailable UI and stop aggressive reconnect loops. Do not silently enable billing.

Dedicated production load testing, real edge latency, regional behavior, long-running resource use and dashboard quota verification remain required before a large launch. Local workerd measurements do not establish production cost or latency.
