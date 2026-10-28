# Performance evidence — 28 October 2026

## Measured local multiplayer smoke

Executed `TEST_BASE_URL=http://127.0.0.1:8790 PERF_OUTPUT=docs/performance-results.json node tests/integration/load.mjs` against an isolated local Wrangler 4.154.0/workerd snapshot of the implemented backend, on the development Mac. This was a bounded smoke test, **not a production capacity or internet-latency benchmark**.

Five rooms were created concurrently; ten independent WebSocket clients authenticated (two per room). Each client sent ten sequential pings (100 total). All five rooms then ran an intro and writing phase concurrently. Every player submitted a unique answer; both clients in every room received only that room's two locked answers. No failures or cross-room content appeared.

| Measurement | Samples | Median | p95 / maximum |
| --- | ---: | ---: | ---: |
| Room creation HTTP response | 5 | 35.90 ms | 38.00 ms |
| WebSocket ping round trip | 100 | 1.86 ms | 2.50 / 2.84 ms |
| Last submission to reveal-state receipt | 10 | 3.26 ms | 3.31 ms |
| Difference between the two reveal arrival times in a room | 5 | 0.03 ms | 0.07 ms |

Measured active duration was 3.15 seconds, including the three-second intro. Small sample counts, a local loopback network, warm runtime state, shared hardware and the test harness materially limit these figures. Reveal receipt measures network state delivery, not browser animation paint. The five-sample p95 is simply the largest observed value, not a reliable population estimate.

The **Node test-client process only** grew from 46.14 MiB to 100.42 MiB RSS, and 4.59 MiB to 11.78 MiB used heap while initializing fetch/WebSockets and retaining test objects. This does not measure the Worker, distinguish warm-up from retained memory, or establish the absence of a leak. Worker/isolate memory was not measured. Raw, credential-free results are in `docs/performance-results.json`.

## Reliability evidence

- 31 game-engine unit tests passed, including timers, bounded inputs, expiry, role rotation, score calculation, stale round rejection and duplicate/self-vote rejection.
- 16 real HTTP/WebSocket integration checks passed on the final backend snapshot: Duo, rematch, Couples, three/six-player Party, Chain, author/answer privacy, reconnect, explicit departure, thirty-second host migration, invalid credentials, daily date validation and cross-origin rejection.
- Two runtime restart recovery checks passed using a separate, automatically cleaned local environment: the original round/answer/credentials survived the stopped/restarted SQLite-backed runtime; vanished sockets stopped appearing connected; both returning identities completed their original round without leaking unpublished answers.

The restart test exercises persisted storage recovery. It is not proof of actual Cloudflare production hibernation behavior.

## Reproduce

Build assets first. Start `npm run dev:rooms`, then run `TEST_BASE_URL=http://127.0.0.1:8787 node tests/integration/load.mjs`. Close unused test sockets/rooms and respect rate limits. `PERF_OUTPUT` optionally writes raw metrics. The load script uses five room creations in a short interval and 100 low-rate ping messages; it is not intended to stress an unrelated live service.

Run `node tests/integration/recovery.mjs` for restart recovery. This creates a temporary source snapshot and local runtime on port 8791, preserves storage across its own restart, then removes its temporary data. That port must be free. Use the same Node version and dependencies as the main project.

## Remaining performance verification

Production internet latency, real mobile radio/keyboard behavior, a sustained multi-hour memory/cleanup soak, quota exhaustion handling, more than five simultaneous rooms, exact Durable Object storage row billing and production account/isolate limits require staging access and longer measurement. Full two-hour expiry was verified as a rule with controlled time, not by waiting two hours in an actual deployed room. Browser page performance and field Core Web Vitals are separate from these transport measurements; do not infer them from this table.
