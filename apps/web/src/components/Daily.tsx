import { useEffect, useState } from "react";
import type { DailyView } from "../../../../packages/shared/types";
import { api, readPreference, writePreference, track } from "../lib/client";
import Conversation from "./Conversation";
import ShareControls from "./ShareControls";
type Completion = { date: string; answer: string; example: string };
type Streak = { date: string; count: number };
export default function Daily() {
  const [daily, setDaily] = useState<DailyView | null>(null);
  const [text, setText] = useState("");
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void load();
  }, []);
  async function load() {
    setError("");
    try {
      const d = await api<DailyView>("/api/daily");
      setDaily(d);
      const stored = readPreference<Completion | null>(
        "daily-completion",
        null,
      );
      if (stored?.date === d.date) setCompletion(stored);
      const previous = readPreference<Streak | null>("daily-streak", null);
      if (previous) {
        const diff =
          (Date.parse(d.date) - Date.parse(previous.date)) / 86400000;
        setStreak(diff <= 1 ? previous.count : 0);
      }
      track("daily_started");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!daily) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<DailyView & { answer: string; completed: true }>(
        "/api/daily",
        { date: daily.date, text },
      );
      const c = {
        date: result.date,
        answer: result.answer,
        example: result.example || "",
      };
      setCompletion(c);
      writePreference("daily-completion", c);
      const previous = readPreference<Streak | null>("daily-streak", null);
      let count = 1;
      if (previous?.date === result.date) count = previous.count;
      else if (
        previous &&
        Date.parse(result.date) - Date.parse(previous.date) === 86400000
      )
        count = previous.count + 1;
      setStreak(count);
      writePreference("daily-streak", { date: result.date, count });
      track("daily_completed");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!daily)
    return (
      <div className="panel">
        {error ? (
          <>
            <p className="form-error" role="alert">
              {error}
            </p>
            <button className="button dark" onClick={() => void load()}>
              Try again ↻
            </button>
          </>
        ) : (
          <div className="loading-state">
            <span className="loading-dots" aria-hidden="true">
              ···
            </span>
            Getting today’s conversation…
          </div>
        )}
      </div>
    );
  return (
    <>
      <div className="daily-meta">
        <span className="chip">
          {new Intl.DateTimeFormat("en", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${daily.date}T12:00:00Z`))}{" "}
          · UTC
        </span>
        <span className="chip">
          {streak} day{streak === 1 ? "" : "s"} in a row
        </span>
      </div>
      <Conversation prompt={daily.prompt} />
      {daily.prompt.constraint && (
        <p className="constraint">
          <strong>Today’s twist:</strong> {daily.prompt.constraint}
        </p>
      )}
      {completion ? (
        <>
          <div className="completion-badge">
            <strong>Case creatively closed. ✓</strong>
            <p>No right answer. Just your excellent imagination.</p>
          </div>
          <div className="daily-answer">
            <span>YOUR RESTORED MESSAGE</span>
            <p>{completion.answer}</p>
            <ShareControls prompt={daily.prompt} answer={completion.answer} />
          </div>
          <details className="daily-answer">
            <summary
              style={{ fontSize: 13, cursor: "pointer", fontWeight: 650 }}
            >
              One other way it could have happened…
            </summary>
            <p>{completion.example}</p>
            <span>
              A curated example, not a correct answer or a judgment of yours.
            </span>
          </details>
          <p className="form-note">
            Your answer and streak stay in this browser. A new chat arrives at
            00:00 UTC.
          </p>
          <div
            className="bottom-cta"
            style={{ margin: "25px 0 0", padding: 23 }}
          >
            <div>
              <h2 style={{ fontSize: 21 }}>Imagine your friend’s version.</h2>
              <p>Same chat, twice the terrible explanations.</p>
            </div>
            <a className="button dark" href="/play?mode=duo">
              Play Duo ↗
            </a>
          </div>
          <button
            className="text-button"
            style={{ marginTop: 14 }}
            onClick={() => {
              try {
                localStorage.removeItem("deletective-daily-completion");
                localStorage.removeItem("deletective-daily-streak");
              } catch {}
              setCompletion(null);
              setStreak(0);
              setText("");
            }}
          >
            Clear my local answer and streak
          </button>
        </>
      ) : (
        <form className="writing-panel" onSubmit={(e) => void submit(e)}>
          <label className="field" htmlFor="daily-answer">
            What did they delete?
            <textarea
              id="daily-answer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Invent your explanation…"
              maxLength={240}
              required
            />
          </label>
          <div className="writing-footer">
            <small>{text.length}/240 · no timer, take your time</small>
            <button disabled={busy || !text.trim()} className="button dark">
              {busy ? "Restoring…" : "Restore message ↗"}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
