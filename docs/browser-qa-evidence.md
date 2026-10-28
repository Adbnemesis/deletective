# Browser QA evidence

Date: **28 October 2026**. Target: the built application and real local Cloudflare Worker/Durable Objects runtime at `http://127.0.0.1:8787`. These tests exercised separate browser contexts and actual WebSocket clients. They did not use simulated players or an in-browser fake server.

## Final matrix

Command: `npm run test:e2e` (`npx playwright test`). The final matrix against the **22:06:28 IST rebuilt frontend** started at **22:07:37 IST / 16:37:37 UTC** and completed in **116.58 seconds**: **20 passed, 0 failed, 0 skipped, 0 flaky**. The machine-readable result is `test-results/playwright-results.json`; the generated HTML report is `test-results/playwright-report/index.html`. These generated reports are local verification artifacts and are not required application assets.

| Browser actually launched | Reported version | Coverage |
| --- | --- | --- |
| Playwright Chromium | 156.0.8078.4 | All 11 tests: multiplayer modes, recovery, security, mobile viewport, daily, public HTML, stale-room credentials |
| Installed Google Chrome | 156.0.8078.49 | Duo session with two separate contexts; daily completion/image/local storage; public HTML and noindex |
| Playwright Firefox | 157.0 | Same three compatibility tests |
| Playwright WebKit | 27.2 | Same three compatibility tests |

No browser downloads were required: the installed Playwright revisions matched the bundled Chromium, Firefox, and WebKit binaries. Google Chrome used the installed application via Playwright's `chrome` channel. Microsoft Edge was not installed. **WebKit is engine coverage, not a claim that the installed Safari application or iOS Safari was tested.**

## Behaviours proved through browsers

- **Duo:** created through the form, joined through the invite URL, synchronized two independent browser identities, rejected a guest's host action, and rejected an invalid credential on an existing room's WebSocket with code `4001` and no state disclosure.
- **Answer privacy:** submitted one person's text, verified that another client's received WebSocket frames and DOM did not contain that text before reveal, and verified synchronized real answers after the second submission.
- **Validation:** a markup/XSS payload was rejected without locking an answer or creating an injected image. Tokens were not present in WebSocket URLs. The tests collected uncaught page exceptions and CSP refusal messages; none occurred in passing tests.
- **Refresh and reconnect:** refreshed a player after locking an answer and restored the same identity and locked text. In Party, navigated the original host away, waited for actual host migration after the grace period, and rejoined the original host using the same tab credential.
- **Reveal and sharing:** added an emoji reaction and observed it on the other client; downloaded an actual PNG chat card, checked its PNG signature and nontrivial size, finished a Duo session, and completed a full rematch with new answers.
- **Couples:** selected the wholesome pack, completed a tailored two-player round with a 200-point shared score, hid an answer on one device without hiding it on the other, and opened the session gallery.
- **Three-player Party:** proved anonymous answers through reveal/voting, explicitly attempted a self-vote and duplicate vote over the application's authenticated socket, observed server rejection, then checked three recorded votes, author reveal, and exactly 300 total score points.
- **Six-player room:** joined six browser contexts and started a Party round. One player left during writing; the remaining five stayed synchronized, revealed their five submissions, cast five votes, and completed the session. Complete six-submission/six-vote gameplay is also covered by the separate real Worker integration suite; this browser test focuses on the departure transition.
- **Reaction Chain:** played three rounds with three independent clients; checked that reaction writers could not see the other clue early, reconstructed after both clues arrived, used participation rather than voting for the sole reconstruction, and checked each player was the reconstruction writer once. Shared points reached 900.
- **Daily:** set the browser clock to January 2099 and still received the server's current challenge date; checked examples were absent from the initial API result; submitted, downloaded a chat card, reloaded and restored local completion/streak, then cleared those local records.
- **Mobile viewport:** played with two 390-pixel-wide touch contexts, checked no horizontal overflow, reduced the viewport height to 420 pixels during composition, scrolled the submit control into view, submitted and completed synchronized play.
- **Invalid entry:** showed a useful malformed-code page, a useful unknown/expired-room error, and no room state to an unauthenticated connection.
- **Expired saved credentials:** seeded a browser tab with a valid-format room code and a synthetic old guest credential, then opened a room whose Durable Object no longer exists. The resulting WebSocket handshake failure led to an actionable expiration message and a create-room link, with no endless reconnect loader. This reproduces the terminal 404 case without waiting two hours; actual lifetime/expiry rules are tested separately.
- **Long-word sharing:** the Chromium daily test used an unbroken 240-character answer, verified that the complete answer remained in the daily UI, and downloaded its generated PNG. Visual inspection confirmed that the word wraps within the card. The existing six-line card limit uses a visible ellipsis for excess text; this does not claim the PNG preserves every character of an unusually long answer.
- **Search HTML:** disabled JavaScript and checked meaningful public headings/content on the homepage, two-player, couples, party, rules, daily, and FAQ routes. Checked room `noindex` in both HTML and response headers, private routes absent from the sitemap, and a robots policy protecting rooms. With an unverified site URL, this build deliberately disallows all crawling.

## Reproducible run

1. Install the locked dependencies with `npm ci`.
2. Build using `npm run build`.
3. Start the local built Worker using `npm run preview` and leave it running on port 8787.
4. Ensure compatible Playwright browser binaries are installed. If absent on another development machine, install them using the standard Playwright browser installer; that is a development dependency only, not a player requirement.
5. Run `npm run test:e2e`. The single worker avoids unnecessary bursts against the real room-creation limiter. The suite never lowers the production limits.

`PLAYWRIGHT_BASE_URL` can select another authorized test environment. Tests create temporary private rooms and write synthetic test submissions. They do not connect analytics accounts, publish player content, or deploy the application.

The UI selectors use accessible names. Direct socket messages are limited to deliberate invalid-action tests that cannot be triggered through the normal interface. The server runs the same rules as ordinary players. Initial test-authoring runs exposed an overly literal select-label selector and an assumption about the provisional robots policy; both test issues were corrected before the final passing matrix.

## Visual artifacts

- `docs/screenshots/duo-reveal.png`: the actual two-player reveal, using synthetic QA messages.
- `docs/screenshots/mobile-compose.png`: the actual composer at a 390 × 420 CSS-pixel viewport.
- `docs/screenshots/daily-longword-card.png`: the actual 1080 × 1350 generated share card for an unbroken maximum-length QA answer, showing bounded wrapping and the visible six-line truncation indicator.

Screenshots are evidence of local UI rendering, not an assertion that a public deployment is live. They may include expired local room codes but contain no session credential.

## Limits and remaining manual checks

- A reduced desktop viewport **does not open a physical phone's software keyboard**. Test iOS Safari and Android Chrome with real keyboards, safe-area insets, orientation changes, and background/resume before public launch.
- Installed Safari and Microsoft Edge were not exercised by this suite. Add actual-browser/device coverage where available.
- Clipboard image permissions and the native device share sheet vary by platform. Downloading is verified; copying images, pasting into third-party applications, and completing a native share action require manual platform checks. The invite-copy action was exercised in Chromium.
- The suite uses a local `workerd` development runtime. Public Cloudflare account permissions, deployed hibernation behaviour, real network disconnections, multi-region latency, and production quotas require staging verification.
- Room-expiry timing, storage recovery, malformed protocol inputs, and more engine edge cases are covered by separate unit/integration tests, not inferred from this browser run.
- Screen-reader usability, contrast measurement, real friend-group playtesting, ten-person browser play, long-running load, and comedic quality are not proved by these tests. No assertion is made that the product is bug-free or launch-cleared.
