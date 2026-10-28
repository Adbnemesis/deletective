# Deletective competitor research

Research date: 28 October 2026. Desk research of public rules and product pages, plus a small sample of public player discussions. Competitors were not played or load-tested in this research. Their marketing claims are attributed, not independently measured. Player-count settings and prices can change.

## What the evidence supports

The surrounding category is established: players already write captions, improvise jokes, vote anonymously and reveal collaborative stories. Deletective's particular combination is a missing fictional chat message, multiple explanations of the same reactions, a mode designed for exactly two, and a collaborative reaction chain. This is a product differentiation hypothesis, **not a claim of globally original mechanics or legal clearance**.

| Product / relationship | Confirmed mechanism and access | Observable strength / friction | Consequence for Deletective |
| --- | --- | --- | --- |
| [Gartic Phone](https://garticphone.com/) / adjacent | Players alternate writing, drawing and interpreting, then watch the resulting telephone chains. Official onboarding recommends a voice call. | The final transformation is the payoff; drawing asks more effort from a phone user. Round length and all current lobby limits were not independently verified. | Make the completed conversation a reveal worth waiting for; keep input to short text. Voice is optional, supplied by the group's existing call. |
| [Make It Meme](https://makeitmeme.com/) and [official help](https://makeitmeme.com/help/) / close adjacent | Browser players caption templates and vote. Guest play is permitted; accounts enable additional features. Same Meme puts everyone on one template; Relaxed removes points. Help documents host moderation and leader-controlled continuation. | Familiar visual prompt and social voting; caption quality depends on the group's familiarity with templates. | Shared context is enough; no account gate. Let everyone finish early and offer cooperative scoring where voting would be artificial. |
| [skribbl.io](https://skribbl.io/) / adjacent | One player draws while others guess for points. Its public page documents private invitations, mobile support, host kick/ban, mute/report and custom-room settings. | Simple explanation and direct invitations. Turns place different demands on drawers and guessers. | Everyone writes during the same phase. Build leave, kick and local hide into room UX, with clear states. |
| [Quiplash 3](https://www.jackboxgames.com/games/quiplash-3) / close adjacent | Official listing: 3–8 players; approximately 15-minute session; humorous prompts lead to head-to-head audience/player voting. Moderation and family-friendly settings are offered. Part of a purchased Jackbox pack. | Strong joke-writing structure. Requires a host running the purchased game; does not serve exactly two active players. | Keep a simple fair party vote, but design a shared-score Duo separately. Do not claim free writing/voting itself is novel. |
| [FixyText](https://www.jackboxgames.com/games/the-jackbox-party-pack-10/fixy-text?locale=pt-br) / closest messaging-adjacent | Official listing: 3–8 players and about 15 minutes. Groups edit a reply in one shared field, cannot delete/backspace, then other players vote on words. Includes no-timer option and moderation. | Texting comedy is already a commercial game space; simultaneous editing deliberately creates chaos. | Deletective uses independent secret answers to reconstruct an absent message, rather than collaborative editing of one live reply. Explain that distinction with a playable example. |
| [Punchline](https://punchline.party/) / browser caption competitor | Product page offers private link/code rooms, timed meme captions, anonymous reveal and three-level ratings; save/share actions and guest access are advertised. | Low onboarding friction and shareable results. Claims about template count and community size were not verified. | A good-looking explicit share export matters; no automatic publishing or dependency on copyrighted meme templates. |
| [Known Associates](https://knownassociatesgame.com/) / anonymous-answer adjacent | Product describes a rotating Focus: friends answer about that person, Focus matches authors, others vote. | Identity guessing and personal knowledge give comedy context. | Keep Deletective fictional and avoid requiring personal disclosures. Authors remain secret during party voting. |
| [Curio](https://curioroom.net/blog/two-player-browser-games-no-download) / two-person adjacent | Operator's guide describes private prompt answers, guessing each other's choices, a room link/code, and no built-in voice. | The two-player use case has dedicated competition. | Duo needs its own pacing, rematch and shared outcome; do not market two-player support as unique by itself. |
| [Here We Ask](https://hereweask.com/) / couples/conversation adjacent | Operator advertises browser conversation cards, themed decks and a daily question with no mandatory account. | Low-pressure prompts; some decks are paid. | Couples should be fictional comedy with theme choice, not a relationship test. Solo visitors need something to do immediately. |

Known Associates links its marketing site to knownassociates.io for play; the running game was not independently tested. All observations above are desk-research findings, not certified feature inventories.

## Direct-concept search

Queries included `"deleted message" "party game"`, `"missing message" game multiplayer`, `"deleted message game"`, `"guess the deleted message game"`, `site:github.com "party game" "deleted"`, and `site:itch.io "deleted message"`. Results were noisy, often about chat recovery, general games or unrelated software. No exact-match multiplayer reconstruction product was confidently established in this limited pass. That absence is not proof none exists. An exact-phrase search found [a 2011 Google Groups post](https://groups.google.com/g/the-stream-of-consciousness/c/1H7Nhlr4Afs) suggesting “Guess The Deleted Message”; this is evidence the phrase/concept predates this project, though it does not establish a shipped multiplayer product. Searches of stores, GitHub and directories were conducted through the web index, not exhaustive native store databases.

A [Product Hunt directory mirror](https://hunted.space/dashboard/partygames) surfaced a collection called PartyGames aimed at groups on one shared device. It is a weak discovery signal, not a verified direct competitor. No code from competing repositories was imported.

## Player complaints: qualitative, small sample

- A [Make It Meme launch discussion](https://www.reddit.com/r/WebGames/comments/m8dyzn/make_it_meme_i_made_a_free_multiplayer_party_game/) includes a complaint about having to rephrase captions to get them through filtering. Implication: explain input rejection and keep family filtering limited and honest.
- A [Gartic Phone streaming discussion](https://www.reddit.com/r/Twitch/comments/15uwxoc/is_there_a_good_way_to_safely_stream_gartic_phone/) describes inappropriate submissions from strangers and using known-community invitations. Implication: private rooms by default, host kick, local hide, and an explicit warning that player text is unreviewed.
- A [FixyText bug discussion](https://www.reddit.com/r/jackboxgames/comments/184rh31) describes an unusually long game in an eight-player session; a developer asks for a report. Implication: authoritative deadlines, bounded phases and reconnect testing are essential.

These anecdotes do not establish complaint rates or that current versions still have the same issues. They are test-case inspiration.

## Decisions applied to this build

1. One sentence teaches the action: read the reactions, invent the deleted message, reveal together.
2. Duo/Couples use participation and shared enjoyment instead of pretending two self-interested votes are impartial.
3. Classic Party keeps all players writing, hides authors until votes lock, rejects self-votes and allows ties.
4. Reaction Chain rotates the two reaction roles; other players reconstruct from the same pair.
5. Public examples are immediately understandable and use original text/artwork.
6. Completed results can be explicitly downloaded/shared, with no room credential embedded.
7. No claim of being the first, biggest, highest-rated or objectively funniest game.

## Research still needed after playtests

Measure time-to-first-round, lobby abandonment, mobile typing comfort, response quality and rematch rate with consenting real groups. Record median phase duration instead of inventing competitor averages. Test five rounds with a pair, a three-person group and six people, and review every prompt that produces confusion or similar answers. Comparison landing pages should wait for documented hands-on evidence and a scheduled fact review.
