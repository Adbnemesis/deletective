# Architecture

Deletective is independent of the Control Freak project. The repository contains no code or runtime dependency from that game.

## Components

- `apps/web`: Astro public HTML and React game UI. Public content is in the initial HTML, without connecting to multiplayer.
- `apps/realtime/worker.ts`: Cloudflare Worker router, room Durable Object, and abuse gate Durable Object.
- `packages/game-core/engine.ts`: server-only game state machine, rules, input validation and public projections.
- `packages/shared/types.ts`: browser/server protocol types. Types do not replace runtime validation.
- `content/prompts/index.ts`: authored prompt bank; imported into the server, not sent as a complete future daily schedule.
- `tests/unit`: deterministic rule and state tests.
- `tests/integration/realtime.mjs`: real HTTP/WebSocket clients against local Wrangler or staging.

Static assets and the Worker deploy as a single Cloudflare project. Each room has one SQLite-backed Durable Object, addressed by its random code. Each abuse gate is a separate object addressed by SHA-256 of the Cloudflare IP plus action kind. No D1, KV, R2, AI service, payment service, or external database is required.

## Room flow and transport

1. `POST /api/rooms` with name, avatar and settings returns `{code, playerId, token}`. The token contains 256 random bits and is returned only to that player.
2. An invite contains only the room code: `/room?code=XXXXXXXX`. `POST /api/rooms/XXXXXXXX/join` creates a new player in an available lobby.
3. Open `/api/rooms/XXXXXXXX/ws` and immediately send `{type:'auth',token}`. Tokens never appear in URLs. The server hashes the credential and authorizes membership.
4. The server sends personalized `{type:'state',state:RoomView}` snapshots. Actions are `start`, `submit`, `reaction`, `vote`, `react`, `next`, `rematch`, `settings`, `kick`, `leave`, `report`, and `ping`.
5. Submission and vote commands include the current unpredictable `roundId`. Expired, stale, wrong-phase, duplicate and unauthorized commands fail.

An unauthenticated socket receives no room state and closes after five seconds. A player has one active socket; a new authenticated connection replaces an older tab. The frontend stores credentials in session storage so a refresh can reconnect without creating a duplicate player. A credential holder can resume their session, but display name alone cannot authenticate it.

## Authoritative state

The server phases are `lobby → intro → writing → reveal → voting (competitive rounds only) → results → intro/complete`. Reaction Chain inserts `reactions` before `writing`. Intro takes three seconds. Writing/reaction phases use the host's 30/45/60/90-second setting. Reveal lasts at least four seconds (2.2 seconds per answer); voting lasts twenty seconds and results eight seconds. Everyone completing an action ends its phase early. All connected participants pressing Continue can skip a reveal/results wait.

A room records player membership, scores, prompts already used, round roles, secret submissions, votes and bounded result history. After every accepted mutation it writes the room state through the Durable Object storage API. SQLite-backed storage also provides this key/value interface. Hibernation socket attachments contain only player ID and bounded rate-limit metadata. Reconstructing the object loads room state before processing events and reconciles persisted presence against the sockets actually preserved by the runtime. An abrupt runtime restart cannot leave vanished sockets marked connected.

Only a deliberately constructed public projection leaves the server. In writing/reaction phases, other players' text and all token hashes are omitted. In Party/competitive Chain reveal and voting, answers have opaque answer IDs and no author identity; authors appear only in results. A player's own-answer flag enables the interface to disable self votes without exposing other authors.

A durable alarm tracks the next phase deadline, host migration grace, unauthenticated socket timeout, maximum age or inactivity expiry. There is no heartbeat timer keeping objects awake. Pings receive a time response but do not write storage or reschedule alarms. Alarm transitions are based on persisted phase/deadline, so hibernation does not reset round timing. An overdue phase advances when the next event runs; the server does not simulate several missed comedy phases instantly.

## Lifetimes and failure handling

Rooms expire after two hours absolute age or thirty minutes without a valid game action/join/reconnect. Content storage and alarms are deleted, sockets close, and later requests receive an expired/not-found error. Scores/history are temporary and are not a public feed. A host disconnect receives a thirty-second grace period; after that the first connected member becomes host. Explicit leave/kick migrates immediately. A departed player no longer blocks completion. If there are too few players, the room returns to the lobby and allows a replacement.

Current limits: 2 players in Duo/Couples, 3–10 in Party/Chain, 1–10 rounds, 240-character answers, 160-character reactions, 20-character names, 100 lifetime joins per room and 24 pending/authenticated socket slots. These caps bound stored state and fanout.

## Daily

`GET /api/daily` uses the server's current UTC date and returns one deterministic prompt, excluding its example. `POST /api/daily` validates that same date plus the player's plain-text answer, then discloses the curated example. It does not grade subjective comedy or persist/publish the answer. Streaks are browser-local convenience data and are not tamper-proof awards.

## Important tradeoffs

- The full room is persisted per accepted mutation. This is simple and recoverable but writes more data than a normalized SQL event model. Measure write quotas at scale.
- IP-based limits can group shared Wi-Fi players. Room creation is capped at 10/minute/IP, joins 30/minute/IP, WebSocket upgrades 120/minute/IP, daily posts 30/minute/IP. Production IP identity comes from Cloudflare, not browser-supplied game data.
- Everyone can read a room after joining with its unguessable invite code; private means unlisted, temporary and non-indexed, not end-to-end encrypted.
- Free-tier quota exhaustion can still reject requests. Hibernation reduces idle duration, not all request or storage costs.

Official references: [WebSocket hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [Object lifecycle](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/).
