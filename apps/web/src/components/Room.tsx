import { useEffect, useRef, useState } from "react";
import type {
  AnswerView,
  ClientAction,
  Credentials,
  RoomView,
  ServerMessage,
} from "../../../../packages/shared/types";
import {
  AVATARS,
  copyText,
  getCredentials,
  inviteUrl,
  MODE_NAMES,
  playTone,
  readPreference,
  track,
  writePreference,
} from "../lib/client";
import Conversation from "./Conversation";
import PlayForm from "./PlayForm";
import ShareControls from "./ShareControls";
const EMOJIS = ["😂", "😮", "😭", "🤔", "💀", "💡"];
function playerStatus(p: RoomView["players"][number], s: RoomView) {
  if (!p.connected) return "Reconnecting…";
  if (s.phase === "lobby")
    return p.id === s.hostId ? "Host · ready to go" : "In the chat";
  if (s.phase === "reactions")
    return p.role === "reaction"
      ? p.submitted
        ? "Reaction locked"
        : "Writing a reaction"
      : "Reconstruction writer";
  if (s.phase === "writing")
    return p.role === "reaction"
      ? "Reactions delivered"
      : p.submitted
        ? "Answer locked"
        : "Writing…";
  if (s.phase === "voting")
    return p.voted ? "Vote locked" : "Choosing a favorite";
  if (["results", "reveal"].includes(s.phase))
    return p.ready ? "Ready to continue" : "Enjoying the chaos";
  return `${p.score} points`;
}
export default function Room() {
  const [code, setCode] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [state, setState] = useState<RoomView | null>(null);
  const [connection, setConnection] = useState("connecting");
  const [fatal, setFatal] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const [muted, setMuted] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selectedReaction, setSelectedReaction] = useState<
    Record<string, string>
  >({});
  const ws = useRef<WebSocket | null>(null);
  const clockOffset = useRef(0);
  const lastPhase = useRef("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const c = (
      p.get("code") ||
      location.pathname.split("/")[2] ||
      ""
    ).toUpperCase();
    setCode(c);
    setCredentials(getCredentials(c));
    setSound(readPreference("sound", false));
    setInitialized(true);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + clockOffset.current), 250);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!credentials) return;
    let stopped = false;
    let retries = 0;
    let retry: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let current: WebSocket;
    const connect = () => {
      if (stopped) return;
      setConnection(retries ? "reconnecting" : "connecting");
      const u = new URL(`/api/rooms/${credentials.code}/ws`, location.origin);
      u.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      current = new WebSocket(u);
      ws.current = current;
      current.onopen = () => {
        current.send(
          JSON.stringify({ type: "auth", token: credentials.token }),
        );
        heartbeat = setInterval(() => {
          if (current.readyState === WebSocket.OPEN)
            current.send(JSON.stringify({ type: "ping" }));
        }, 25000);
      };
      current.onmessage = (e) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        if (msg.type === "state") {
          retries = 0;
          setConnection("connected");
          clockOffset.current = msg.state.serverNow - Date.now();
          setNow(msg.state.serverNow);
          setState(msg.state);
          if (lastPhase.current !== msg.state.phase) {
            if (msg.state.phase === "reveal") playTone();
            if (msg.state.phase === "results") track("round_completed");
            if (msg.state.phase === "complete") track("session_completed");
            lastPhase.current = msg.state.phase;
            setError("");
          }
        } else if (msg.type === "error") setError(msg.message);
        else if (msg.type === "notice") flash(msg.message);
        else if (msg.type === "pong")
          clockOffset.current = msg.serverNow - Date.now();
      };
      current.onclose = async (e) => {
        clearInterval(heartbeat);
        if (stopped) return;
        track("disconnected");
        if ([4001, 4002, 4003, 4004, 4008].includes(e.code)) {
          setConnection("closed");
          setFatal(
            e.code === 4002
              ? "This player is connected in another tab. Return to that tab or refresh here to reconnect."
              : e.code === 4003
                ? "The host removed you from this room."
                : e.code === 4004
                  ? "This room has expired. Create a new room to keep playing."
                  : e.code === 4008
                    ? "Too many actions. Wait a moment, then refresh to reconnect."
                    : "Your room session is unavailable. Rejoin using your friend’s invite.",
          );
          return;
        }
        // A deleted room cannot complete a WebSocket handshake to send a close
        // code. Distinguish that HTTP failure from a temporary network outage.
        try {
          const response = await fetch(`/api/rooms/${credentials.code}/ws`);
          if (stopped) return;
          if (response.status === 404 || response.status === 410) {
            setConnection("closed");
            setFatal(
              "This room was not found or has expired. Create a new room to keep playing.",
            );
            return;
          }
        } catch {
          // Offline clients keep the normal retry loop and recover automatically.
        }
        if (stopped) return;
        retries++;
        setConnection("reconnecting");
        retry = setTimeout(
          connect,
          Math.min(15000, 1000 * 2 ** Math.min(retries - 1, 4)),
        );
      };
      current.onerror = () => setConnection("reconnecting");
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(heartbeat);
      current?.close();
      if (ws.current === current) ws.current = null;
    };
  }, [credentials]);
  useEffect(() => {
    setText("");
    setSelectedReaction({});
    setHidden([]);
  }, [state?.roundId]);
  function flash(message: string) {
    setNotice(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setNotice(""), 5500);
  }
  function send(action: ClientAction) {
    setError("");
    if (
      ws.current?.readyState !== WebSocket.OPEN ||
      connection !== "connected"
    ) {
      setError(
        "Reconnecting to the chat. Your next action will be available in a moment.",
      );
      return;
    }
    ws.current.send(
      JSON.stringify({ ...action, requestId: crypto.randomUUID() }),
    );
  }
  async function copyInvite() {
    try {
      await copyText(inviteUrl(code));
      flash("Invite link copied. Send it to your people.");
      track("invite_copied");
    } catch (e) {
      flash((e as Error).message);
    }
  }
  function leave() {
    send({ type: "leave" });
    sessionStorage.removeItem(`deletective:${code}`);
    setTimeout(() => (location.href = "/play"), 100);
  }
  if (!initialized)
    return <div className="loading-state">Opening the chat…</div>;
  if (!/^[A-Z2-9]{8}$/.test(code))
    return (
      <div className="panel play-panel">
        <h2>That room code looks a little off.</h2>
        <p>
          Ask your friend for their eight-character code, or start a fresh chat.
        </p>
        <a className="button dark" href="/play">
          Find your friends ↗
        </a>
      </div>
    );
  if (!credentials)
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">YOU’VE GOT GOOD COMPANY</span>
          <h1>The chat is waiting.</h1>
        </div>
        <PlayForm joinCode={code} onJoined={setCredentials} />
      </>
    );
  if (fatal)
    return (
      <div className="panel play-panel">
        <h2>The chat hit a detour.</h2>
        <p role="alert">{fatal}</p>
        <div className="share-controls">
          <button onClick={() => location.reload()}>Try reconnecting</button>
          <button
            onClick={() => {
              sessionStorage.removeItem(`deletective:${code}`);
              setCredentials(null);
              setFatal("");
              setState(null);
            }}
          >
            Rejoin the room
          </button>
        </div>
        <a className="button dark" href="/play">
          Create a fresh room ↗
        </a>
      </div>
    );
  if (!state)
    return (
      <div className="loading-state">
        <span className="loading-dots" aria-hidden="true">
          ···
        </span>
        Connecting to your room…
        <p className="micro">
          If this keeps spinning, check your connection or{" "}
          <a href="/play" style={{ textDecoration: "underline" }}>
            start a fresh room
          </a>
          .
        </p>
      </div>
    );
  const s = state;
  const me = s.players.find((p) => p.id === s.you);
  const host = s.hostId === s.you;
  const seconds = s.deadline
    ? Math.max(0, Math.ceil((s.deadline - now) / 1000))
    : null;
  const connected = s.players.filter((p) => p.connected).length;
  const minimum = ["party", "chain"].includes(s.settings.mode) ? 3 : 2;
  function next() {
    send({ type: "next" });
  }
  function write(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    send({
      type: s.phase === "reactions" ? "reaction" : "submit",
      text,
      roundId: s.roundId,
    });
  }
  function renderAnswer(a: AnswerView, index: number) {
    const isHidden =
      hidden.includes(a.id) || (a.authorId && muted.includes(a.authorId));
    return (
      <article
        className="answer-card"
        key={a.id}
        style={{
          animationDelay:
            s.phase === "reveal" ? `${Math.min(index * 0.8, 5)}s` : "0s",
        }}
      >
        <div className="answer-content">
          <div className="answer-label">
            <span>
              {a.author
                ? `${a.author}${a.own ? " (you)" : ""}`
                : `Explanation ${index + 1}${a.own ? " · yours" : ""}`}
            </span>
            {a.votes !== undefined &&
              ["party", "chain"].includes(s.settings.mode) && (
                <span>
                  {a.votes} {a.votes === 1 ? "vote" : "votes"} · {a.votes * 100}{" "}
                  pts
                </span>
              )}
          </div>
          <p className="answer-text">
            {isHidden ? "You’ve hidden this answer on your device." : a.text}
          </p>
        </div>
        <div className="answer-footer">
          {!isHidden &&
            EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="emoji-reaction"
                aria-label={`React ${emoji}`}
                aria-pressed={selectedReaction[a.id] === emoji}
                onClick={() => {
                  send({
                    type: "react",
                    answerId: a.id,
                    emoji,
                    roundId: s.roundId,
                  });
                  setSelectedReaction((r) => ({ ...r, [a.id]: emoji }));
                }}
              >
                {emoji}
                {a.reactions[emoji] ? ` ${a.reactions[emoji]}` : ""}
              </button>
            ))}
          {s.phase === "voting" ? (
            a.own ? (
              <span className="vote-note">Your explanation</span>
            ) : me?.voted ? (
              <span className="vote-note">Vote locked</span>
            ) : (
              <button
                className="vote-button"
                onClick={() =>
                  send({ type: "vote", answerId: a.id, roundId: s.roundId })
                }
                disabled={connection !== "connected"}
              >
                Vote for this ↗
              </button>
            )
          ) : (
            <button
              className="text-button"
              onClick={() =>
                setHidden((v) =>
                  v.includes(a.id) ? v.filter((x) => x !== a.id) : [...v, a.id],
                )
              }
            >
              {isHidden ? "Show" : "Hide"}
            </button>
          )}
          {!a.own && (
            <button
              className="text-button"
              onClick={() => {
                send({ type: "report", answerId: a.id, roundId: s.roundId });
                setHidden((v) => [...v, a.id]);
              }}
            >
              Report
            </button>
          )}
        </div>
        {["results", "complete"].includes(s.phase) && !isHidden && (
          <div style={{ padding: "0 15px 15px" }}>
            <ShareControls prompt={s.prompt} answer={a.text} />
          </div>
        )}
      </article>
    );
  }
  return (
    <>
      <div className="room-head">
        <div className="room-heading">
          <span className="eyebrow">
            <span
              className={
                "connection-dot " +
                (connection === "connected" ? "" : "offline")
              }
            ></span>
            {connection === "connected"
              ? "PRIVATE ROOM"
              : connection.toUpperCase()}{" "}
            · {s.code}
          </span>
          <h1>
            {MODE_NAMES[s.settings.mode]}{" "}
            {s.phase === "lobby"
              ? "lobby"
              : s.phase === "complete"
                ? "well played."
                : `· round ${s.round} / ${s.settings.rounds}`}
          </h1>
        </div>
        <div className="room-actions">
          <button
            className="icon-button"
            aria-label={sound ? "Mute sounds" : "Enable sounds"}
            aria-pressed={sound}
            onClick={() => {
              const enabled = !sound;
              setSound(enabled);
              writePreference("sound", enabled);
              if (enabled) playTone();
            }}
          >
            {sound ? "♪" : "♩"}
          </button>
          <button className="text-button" onClick={leave}>
            Leave room
          </button>
        </div>
      </div>
      {connection !== "connected" && (
        <div className="notice" role="status">
          Reconnecting… Your locked answer stays safe on the server. You’ll
          catch up automatically.
        </div>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {s.notice && (
        <div className="notice" role="status">
          {s.notice}
        </div>
      )}
      <div className="room-grid">
        <aside className="room-sidebar" aria-label="Players">
          <div className="panel">
            <h2>
              THE USUAL SUSPECTS{" "}
              <span>
                {s.players.length}/
                {["duo", "couples"].includes(s.settings.mode) ? 2 : 10}
              </span>
            </h2>
            <div className="players-list">
              {s.players.map((p) => (
                <div className="player-item" key={p.id}>
                  <div
                    className={
                      "avatar " + ["lavender", "peach", "mint"][p.avatar % 3]
                    }
                    aria-hidden="true"
                  >
                    {AVATARS[p.avatar]}
                  </div>
                  <div className="player-info">
                    <div className="player-name">
                      {p.name}
                      {p.id === s.you ? " (you)" : ""}
                      {p.id === s.hostId ? " ♔" : ""}
                    </div>
                    <div className="player-sub">{playerStatus(p, s)}</div>
                  </div>
                  <span
                    className="player-state"
                    aria-label={p.connected ? "Connected" : "Disconnected"}
                  >
                    {p.connected
                      ? p.submitted || p.voted || p.ready
                        ? "✓"
                        : "·"
                      : "○"}
                  </span>
                </div>
              ))}
            </div>
            {s.players.length > 1 && (
              <details className="room-controls">
                <summary
                  className="micro"
                  style={{ cursor: "pointer", marginBottom: 7 }}
                >
                  Player controls
                </summary>
                {s.players
                  .filter((p) => p.id !== s.you)
                  .map((p) => (
                    <div key={p.id}>
                      <button
                        onClick={() =>
                          setMuted((v) =>
                            v.includes(p.id)
                              ? v.filter((x) => x !== p.id)
                              : [...v, p.id],
                          )
                        }
                      >
                        {muted.includes(p.id) ? "Unhide" : "Hide"} {p.name}’s
                        revealed answers
                      </button>
                      {host && (
                        <button
                          onClick={() => send({ type: "kick", playerId: p.id })}
                        >
                          Remove {p.name}
                        </button>
                      )}
                    </div>
                  ))}
              </details>
            )}
          </div>
          <p className="sidebar-info">
            {s.settings.mode === "party"
              ? "Answers stay anonymous until votes lock. One vote each. Ties are welcome."
              : s.settings.mode === "chain"
                ? "Two reactions. One missing message. A different role every round."
                : "No judges. No self-votes. You’re collecting laughs together."}
          </p>
          <p className="sidebar-info">
            Your room is private. Content disappears when the room expires.
            Sharing is always your choice.
          </p>
        </aside>
        <section className="room-main" aria-label="Game">
          {s.phase === "lobby" ? (
            <div className="panel">
              <div className="lobby-illustration" aria-hidden="true">
                ☺ ☺ <span style={{ color: "#9b86bb" }}>✳</span>
              </div>
              <h2 className="lobby-title">A link away from chaos.</h2>
              <p className="lobby-desc">
                {s.settings.mode === "chain"
                  ? "Two players write secret reactions. Everyone else writes the deleted message. Your roles rotate each round."
                  : s.settings.mode === "party"
                    ? "Everyone gets the same chat. Invent a deleted message in secret, then vote for your favorite explanation."
                    : "You’ll both see the same fictional chat. Write your answers in secret. Reveal them together. Laugh accordingly."}
              </p>
              <div className="invite-box">
                <small>YOUR PRIVATE ROOM CODE</small>
                <strong className="room-code">{s.code}</strong>
                <button
                  className="button lime"
                  onClick={() => void copyInvite()}
                >
                  Copy invite link <span aria-hidden="true">↗</span>
                </button>
              </div>
              <div className="lobby-settings">
                <span className="chip">{s.settings.rounds} rounds</span>
                <span className="chip">
                  {s.settings.writingSeconds}s to write
                </span>
                <span className="chip">
                  {s.settings.category === "all"
                    ? "Mixed prompts"
                    : s.settings.category}
                </span>
                <span className="chip">
                  {s.settings.familyFriendly
                    ? "Basic word filter on"
                    : "Word filter off"}
                </span>
              </div>
              {host ? (
                <>
                  <button
                    className="button dark full-width"
                    onClick={() => send({ type: "start" })}
                    disabled={connected < minimum || connection !== "connected"}
                  >
                    {connected < minimum
                      ? `Waiting for ${minimum - connected} more ${minimum - connected === 1 ? "player" : "players"}…`
                      : "Everyone’s here. Let’s play ↗"}
                  </button>
                  <details className="settings-extra">
                    <summary>Adjust this session</summary>
                    <div className="field-row">
                      <label className="field">
                        Rounds
                        <select
                          value={s.settings.rounds}
                          onChange={(e) =>
                            send({
                              type: "settings",
                              settings: { rounds: Number(e.target.value) },
                            })
                          }
                        >
                          {[1, 3, 5, 8, 10].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        Timer
                        <select
                          value={s.settings.writingSeconds}
                          onChange={(e) =>
                            send({
                              type: "settings",
                              settings: {
                                writingSeconds: Number(e.target.value),
                              },
                            })
                          }
                        >
                          {[30, 45, 60, 90].map((n) => (
                            <option key={n} value={n}>
                              {n}s
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </details>
                </>
              ) : (
                <div className="submitted-panel">
                  <strong>You’re in!</strong>
                  <p>Your host will start when everyone’s here.</p>
                </div>
              )}
              <p className="form-note">
                Send the invite to your friends. They can join from any browser.
              </p>
            </div>
          ) : s.phase === "complete" ? (
            <div className="panel">
              <div className="eyebrow">THAT ESCALATED BEAUTIFULLY</div>
              <h2 className="results-title" style={{ marginTop: 15 }}>
                Same time, same weirdos?
              </h2>
              <p className="results-meta">
                {s.round} rounds of things that absolutely did not happen.
              </p>
              {["duo", "couples"].includes(s.settings.mode) ||
              (s.settings.mode === "chain" && s.players.length === 3) ? (
                <div className="session-score">
                  <strong>{s.sharedScore}</strong>
                  <span>
                    shared completion points · a very good use of your time
                  </span>
                </div>
              ) : (
                <div className="scoreboard">
                  {[...s.players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, _i, all) => (
                      <div className="score-row" key={p.id}>
                        <span className="score-rank">
                          {all.findIndex((x) => x.score === p.score) + 1}
                        </span>
                        <span className="avatar lavender" aria-hidden="true">
                          {AVATARS[p.avatar]}
                        </span>
                        <strong>{p.name}</strong>
                        <span>{p.score}</span>
                      </div>
                    ))}
                </div>
              )}
              {host ? (
                <button
                  className="button dark full-width"
                  onClick={() => {
                    send({ type: "rematch" });
                    track("rematch");
                  }}
                >
                  Same friends. New chaos. Rematch ↗
                </button>
              ) : (
                <div className="submitted-panel">
                  <strong>Ready for another?</strong>
                  <p>Your host can open a rematch.</p>
                </div>
              )}
              <div className="share-controls">
                <a href="/play" className="text-link">
                  New room or change mode ↗
                </a>
              </div>
              <details className="gallery">
                <summary>Your session’s restored messages</summary>
                {s.history.map((h) => (
                  <div className="gallery-round" key={h.round}>
                    <h3>
                      Round {h.round} · {h.prompt?.title || h.prompt?.category}
                    </h3>
                    {h.answers.map((a) => (
                      <div key={a.id}>
                        <p>
                          <strong>{a.author}:</strong>{" "}
                          {a.authorId && muted.includes(a.authorId)
                            ? "Hidden on this device."
                            : a.text}
                        </p>
                        {!(a.authorId && muted.includes(a.authorId)) && (
                          <ShareControls prompt={h.prompt} answer={a.text} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </details>
            </div>
          ) : (
            <>
              <div className="phase-bar" aria-live="polite">
                <h2>
                  {s.phase === "intro"
                    ? "Read the room…"
                    : s.phase === "reactions"
                      ? "First, make a little chaos."
                      : s.phase === "writing"
                        ? "What did the missing message say?"
                        : s.phase === "reveal"
                          ? "The message has been undeleted."
                          : s.phase === "voting"
                            ? "Whose explanation got you?"
                            : "The group chat has spoken."}
                </h2>
                {seconds !== null && (
                  <span
                    className={"timer " + (seconds <= 10 ? "urgent" : "")}
                    role="timer"
                    aria-label={`${seconds} seconds remaining`}
                  >
                    {seconds}s
                  </span>
                )}
              </div>
              {s.prompt &&
                !(
                  s.settings.mode === "chain" &&
                  ["intro", "reactions"].includes(s.phase)
                ) && <Conversation prompt={s.prompt} />}
              {s.phase === "intro" && (
                <div className="submitted-panel">
                  <strong>
                    {s.settings.mode === "chain"
                      ? me?.role === "reaction"
                        ? "You’re writing a reaction."
                        : "You’re restoring the message."
                      : "One chat. So many possible explanations."}
                  </strong>
                  <p>
                    {s.settings.mode === "chain"
                      ? "Reaction writers work in secret first. Then the missing-message writers get their clues."
                      : "Read the reactions. Your writing timer starts in a moment."}
                  </p>
                </div>
              )}
              {(s.phase === "writing" || s.phase === "reactions") && (
                <>
                  {s.prompt?.constraint && (
                    <p className="constraint">
                      <strong>A little twist:</strong> {s.prompt.constraint}
                    </p>
                  )}
                  {(s.phase === "reactions" && me?.role !== "reaction") ||
                  (s.phase === "writing" && me?.role === "reaction") ? (
                    <div className="submitted-panel">
                      <strong>
                        {s.phase === "reactions"
                          ? "Your clues are on their way."
                          : "Your reactions have set the scene."}
                      </strong>
                      <p>
                        {s.phase === "reactions"
                          ? "Two friends are writing their reactions in secret. You’ll invent the message that explains both."
                          : "The reconstruction writers are connecting your wonderfully strange dots. You’ll react when the chat is revealed."}
                      </p>
                      <span className="animate-typing" aria-hidden="true">
                        <i></i>
                        <i></i>
                        <i></i>
                      </span>
                    </div>
                  ) : (
                      s.phase === "reactions" ? s.ownReaction : s.ownSubmission
                    ) ? (
                    <div className="submitted-panel">
                      <strong>Locked. Your secret’s safe. ✓</strong>
                      <div className="locked-answer">
                        “
                        {s.phase === "reactions"
                          ? s.ownReaction
                          : s.ownSubmission}
                        ”
                      </div>
                      <p>
                        Waiting for the others. We’ll reveal as soon as
                        everyone’s done.
                      </p>
                    </div>
                  ) : (
                    <form className="writing-panel" onSubmit={write}>
                      <label className="field" htmlFor="answer">
                        {s.phase === "reactions"
                          ? "Write a reaction to something absolutely ridiculous."
                          : "Your version of events"}
                        <textarea
                          id="answer"
                          name="answer"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          maxLength={s.phase === "reactions" ? 160 : 240}
                          required
                          placeholder={
                            s.phase === "reactions"
                              ? "e.g. Why is the mayor asking for our address?"
                              : "What on earth did they delete?"
                          }
                          onKeyDown={(e) => {
                            if (
                              (e.ctrlKey || e.metaKey) &&
                              e.key === "Enter" &&
                              text.trim()
                            ) {
                              e.preventDefault();
                              send({
                                type:
                                  s.phase === "reactions"
                                    ? "reaction"
                                    : "submit",
                                text,
                                roundId: s.roundId,
                              });
                            }
                          }}
                        />
                      </label>
                      <div className="writing-footer">
                        <small>
                          {text.length}/{s.phase === "reactions" ? 160 : 240} ·
                          plain text only
                        </small>
                        <button
                          className="button dark"
                          disabled={!text.trim() || connection !== "connected"}
                          type="submit"
                        >
                          Lock {s.phase === "reactions" ? "reaction" : "answer"}{" "}
                          <span aria-hidden="true">↗</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
              {["reveal", "voting", "results"].includes(s.phase) && (
                <>
                  {s.phase === "results" && (
                    <p className="results-meta">
                      {["duo", "couples"].includes(s.settings.mode)
                        ? `${s.sharedScore} shared completion points. Two interpretations. No wrong answers.`
                        : s.answers.length < 2
                          ? "Completion points this round. No competitive voting with fewer than two answers."
                          : "100 points per vote. Ties stand. All the fun is in the explanations."}
                    </p>
                  )}
                  {s.phase === "reveal" && (
                    <p className="micro" style={{ marginBottom: 15 }}>
                      A moment for the joke to land. React below.
                    </p>
                  )}
                  {s.phase === "voting" && (
                    <p className="micro" style={{ marginBottom: 15 }}>
                      {me?.voted
                        ? "Your vote is locked. Waiting for the rest of the chat."
                        : "Choose one explanation. You can’t vote for yourself."}
                    </p>
                  )}
                  <div className="answers">
                    {s.answers.length ? (
                      s.answers.map(renderAnswer)
                    ) : (
                      <div className="submitted-panel">
                        <strong>No messages came through.</strong>
                        <p>
                          Fresh round, fresh chance to make something
                          ridiculous.
                        </p>
                      </div>
                    )}
                  </div>
                  {["reveal", "results"].includes(s.phase) && (
                    <div className="continue-bar">
                      <small>
                        {s.players.filter((p) => p.ready).length} ready ·
                        auto-continue in {seconds}s
                      </small>
                      <button
                        className="button dark"
                        onClick={next}
                        disabled={me?.ready || connection !== "connected"}
                      >
                        {me?.ready
                          ? "Ready ✓"
                          : s.phase === "reveal"
                            ? (s.settings.mode === "party" ||
                                s.settings.mode === "chain") &&
                              s.answers.length >= 2
                              ? "Ready to vote →"
                              : "See results →"
                            : s.round >= s.settings.rounds
                              ? "Finish session →"
                              : "Next round →"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
