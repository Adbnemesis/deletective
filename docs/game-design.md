# Deletective game design

Implementation reference: `packages/game-core/engine.ts`, `packages/shared/types.ts`, and `content/prompts/index.ts`. Provisional brand; this document describes the implemented game, not a claim of legal originality or clearance.

## The joke everyone gets to write

Read a fictional conversation, then invent the message that caused the reactions. There is no correct answer and no automated humour judge. The fun comes from seeing the very different stories friends invent from the same clues.

All launch conversations contain a missing-message slot followed by two short reactions. The missing slot appears at index zero; the underlying contract also supports other insertion positions. Sender names are fictional. The game never asks players to reveal personal messages or romantic information.

## Round and session flow

The host selects a mode, 1–10 rounds, and a 30, 45, 60, or 90 second writing timer. The website defaults to Duo, five rounds, 45 seconds, all categories, with the basic family language filter enabled. The backend's fallback timer for API callers who omit settings is 60 seconds. A room requires two people for Duo/Couples or 3–10 for Party/Reaction Chain. No login, email address, or download is required.

The authoritative server phases are:

1. **Lobby:** invite friends and choose settings. Only the host can start or change settings.
2. **Introduction:** three seconds to read the conversation and prepare.
3. **Reactions, in Reaction Chain only:** two assigned players independently write the clues. Neither receives the other's text during this phase.
4. **Writing:** eligible players write at most 240 characters. One submission locks the answer; the server rejects changes and submissions from another phase or round.
5. **Reveal:** answers enter the chat presentation. The server keeps the reveal open for at least four seconds and increases that time with the number of submissions. Players can all mark ready to continue early.
6. **Voting, where eligible:** twenty seconds, ending early when every eligible voter has voted.
7. **Results:** eight seconds, or until all connected participants mark ready. Display authors, votes or participation points, and the running score.
8. **Next round or complete:** advance automatically at the deadline. At session completion the host can rematch; returning to the lobby allows settings changes for the same group.

The server controls phase deadlines. Finishing writing early immediately starts the reveal. No missing answer is replaced with a bot or an invented player submission. A writing timeout can therefore produce fewer answers, or no answers. Voting is skipped when fewer than two real answers are available.

## Duo

Exactly two real people receive the same fictional chat. Each answer remains hidden until both have submitted or time expires. The reveal shows both interpretations. Players can add a laughing, surprised, crying, confused, skull, or idea reaction.

Each submitted answer earns 100 participation points. The shared score increases by the total participation points. It records making something together, without pretending that either partner's reaction is an impartial judgement. A timer expiry does not award points for an absent answer.

## Couples

Couples uses the same two-player rules, privacy, shared scoring, and rematch flow as Duo. Its differences come from tailored fictional scenarios and two selectable packs:

- **Wholesome:** affectionate misunderstandings, shared pets, thoughtful surprises, meeting family, and ordinary plans becoming silly.
- **Date night:** awkward restaurant moments, introductions, wedding plans, holiday mix-ups, and elaborate attempts to impress someone.

The full couples pool draws only from explicitly tagged tailored prompts. Neither pack asks relationship questions, rates compatibility, or requires personal disclosures. The comedy remains suitable for friends playing this mode as well.

## Classic Party

Three to ten people write at the same time. Answers are presented in a shuffled anonymous order during reveal and voting. The client's own answer is labelled so that it cannot accidentally be selected; authors of other answers stay hidden until results.

Every eligible participant gets one vote for a different player's real answer. Self-votes, duplicate votes, invalid answer identifiers, and votes from a previous round are rejected on the server. Each received vote earns 100 points. Ties remain ties. There is no arbitrary tiebreak winner and no score supplied by the browser.

If fewer than two answers arrive, the round uses participation scoring and skips competitive voting. Players should see the actual amount of participation rather than fabricated competition.

## Reaction Chain

Reaction Chain requires at least three people. Each round, two people write an independent fictional reaction of at most 160 characters. The remaining players reconstruct a deleted message explaining both clues. The server rotates the pair using the round number and participant ordering, so that a stable group shares the reaction-writing role across a full rotation.

When both reactions lock, the reconstruction writers receive them as a fictional conversation. The clue writers can enjoy the reveal and vote when there are at least two reconstructions. In a three-player game there is only one reconstruction; all three participants earn 100 participation points for their completed contribution, and the room receives a shared score. With several reconstructions the normal 100-points-per-vote competition applies to those answers. Reaction writers therefore have voting influence in larger groups, rather than a fabricated score for their clues.

If two real reactions do not arrive before time expires, the server shows a clear notice and moves to results without manufacturing a reaction. Roles rotate in later rounds. A changing roster changes the rotation; the implementation does not promise perfectly equal role counts after mid-session departures.

## Daily solo challenge

The daily route uses the server's UTC date. All visitors on the same UTC date receive the same conversation, regardless of their device's timezone or clock. The server returns only the current challenge and withholds the curated alternative until the player submits.

After writing an answer, the player can compare it with a prepared example. The example is one possible interpretation, never an objectively correct answer or a humour score. Completion and local streaks are stored in the browser, with no automatically published answer. Local records can be cleared or edited by the owner and are not a competitive leaderboard. Sharing is an explicit player action.

The bank uses a coprime day-step rotation: every one of the 120 prompts appears before the cycle repeats. This is predictable server content, not an AI API call. Extending or changing the bank changes future date mappings and should therefore be treated as an intentional content release.

## Content system and review

The first bank contains **120 distinct authored conversations across 15 categories**, including more than 30 specifically tailored couples prompts. Categories are family, workplace, school, dating, weddings, restaurants, vacations, gaming, pets, neighbours, superheroes, fantasy, science fiction, internet, and ridiculous emergencies. All prompts carry a family content rating.

Each entry has a stable unique ID, title, category, compatible modes, difficulty, fictional sender names and messages, deleted-message insertion index, optional constraint, rating, language, tags, revision, and a curated example. Content lives outside interface components. It is imported by server code so the browser does not need the full future daily bank or its examples.

The writing review used these criteria: read the two reactions quickly; leave several plausible explanations; give senders short natural lines; avoid required knowledge of memes or franchises; vary the setting and joke mechanism; avoid graphic, hateful, sexual, or dangerous prompts; and make the example compatible with an explicit constraint. This is an initial editorial review by the development agent, not a claim of audience testing. Playtests with actual friend groups are still needed to find weak prompts and tune reveal timing.

Occasional constraints, such as exactly five words or an unnecessarily dramatic confession, add variation. The instruction is shown to the player; constraint adherence is creative guidance, not a basis for an automatic humour judgement or bonus points. The example for the five-word constraint contains exactly five words.

Selection excludes all previously used prompts in the matching mode and selected category/pack until that pool is exhausted. Rematches retain the used-prompt record. If a requested category has no content in the chosen mode, selection falls back to the full compatible mode pool. An exhausted pool can repeat; there is no promise of infinite unique content.

## Control, safety, and presentation

The game uses plain-text input, character limits, basic family language filtering, and server validation. No HTML or links are rendered as executable content. Family filtering is limited and can miss obfuscation or context; it is not professional moderation. Hosts can remove players, and players can leave or hide content locally using the game controls. Reports are a session control rather than a staffed review service.

Rooms are temporary. A refresh or temporary network loss can reconnect using the stored guest credential. Host migration has a short grace period so a momentary refresh does not immediately transfer control. If a departure leaves too few participants, the game returns to the lobby with a notice. Session results remain private to the room; explicit share actions produce a fictional-chat card without guest credentials.

Short chat animations, visible progress, readable timers, keyboard operation, and reduced-motion support should keep the reveal understandable without sound. Gameplay must remain understandable even when a player's browser cannot copy an image or use native sharing; downloading the card and copying share text are fallbacks.

## Follow-up design work

- Playtest prompt funniness, writing duration, and reveal pacing with two-, three-, six-, and ten-person groups.
- Increase content depth before promoting narrow category filters heavily; an eight-prompt category repeats sooner than the full bank.
- Consider per-device prompt history for returning players without turning anonymous play into account tracking.
- Consider stronger role balancing for a frequently changing Reaction Chain roster.
- Do not add objective joke scores, fake AI judges, public answer indexes, or required romantic disclosures.
