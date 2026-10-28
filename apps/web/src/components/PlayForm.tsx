import { useEffect, useState } from "react";
import type {
  Credentials,
  Mode,
  Settings,
} from "../../../../packages/shared/types";
import {
  api,
  AVATARS,
  defaultSettings,
  MODE_NAMES,
  saveCredentials,
  track,
  readPreference,
  writePreference,
} from "../lib/client";
export default function PlayForm({
  joinCode = "",
  onJoined,
}: {
  joinCode?: string;
  onJoined?: (credentials: Credentials) => void;
}) {
  const [tab, setTab] = useState(joinCode ? "join" : "create");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [code, setCode] = useState(joinCode);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (["duo", "party", "couples", "chain"].includes(mode || ""))
      setSettings((s) => ({
        ...s,
        mode: mode as Mode,
        category: mode === "couples" ? "all" : s.category,
      }));
    setName(readPreference("name", ""));
    setAvatar(readPreference("avatar", 0));
  }, []);
  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const c = await api<Credentials>(
        tab === "create"
          ? "/api/rooms"
          : `/api/rooms/${code.trim().toUpperCase()}/join`,
        { name, avatar, ...(tab === "create" ? { settings } : {}) },
      );
      saveCredentials(c);
      writePreference("name", name);
      writePreference("avatar", avatar);
      track(tab === "create" ? "room_created" : "room_joined");
      if (onJoined) onJoined(c);
      else location.href = `/room?code=${c.code}`;
    } catch (e) {
      setError(
        (e as Error).message ||
          "Could not reach the game server. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="panel play-panel">
      {!joinCode && (
        <div className="tabs" role="tablist" aria-label="Create or join a room">
          <button
            role="tab"
            aria-selected={tab === "create"}
            onClick={() => {
              setTab("create");
              setError("");
            }}
          >
            Create a room
          </button>
          <button
            role="tab"
            aria-selected={tab === "join"}
            onClick={() => {
              setTab("join");
              setError("");
            }}
          >
            Join a room
          </button>
        </div>
      )}
      <h2>
        {tab === "create"
          ? "Assemble your usual suspects."
          : `You’re invited${joinCode ? "!" : "."}`}
      </h2>
      <p>
        {tab === "create"
          ? "A name, a link, and you’re in. Your first terrible explanation awaits."
          : "Pick a name your friends will recognize. No account needed."}
      </p>
      <form onSubmit={(e) => void submit(e)}>
        <label className="field">
          What should we call you?
          <input
            name="name"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            minLength={1}
            placeholder="Your display name"
            required
            aria-describedby={error ? "play-error" : undefined}
          />
        </label>
        <div className="field">
          <span id="avatar-label">Pick your little face</span>
          <div
            className="avatar-choices"
            role="group"
            aria-labelledby="avatar-label"
          >
            {AVATARS.map((a, i) => (
              <button
                key={i}
                type="button"
                className="avatar-choice"
                aria-label={`Avatar ${i + 1}`}
                aria-pressed={avatar === i}
                onClick={() => setAvatar(i)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        {tab === "join" ? (
          <label className="field">
            Room code
            <input
              name="code"
              inputMode="text"
              autoCapitalize="characters"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="Your friend’s room code"
              maxLength={8}
              minLength={8}
              required
              readOnly={Boolean(joinCode)}
              style={{ textTransform: "uppercase", letterSpacing: 3 }}
            />
          </label>
        ) : (
          <>
            <label className="field">
              Who’s playing?
              <select
                value={settings.mode}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mode: e.target.value as Mode,
                    category: "all",
                  }))
                }
              >
                <option value="duo">Duo · 2 friends, shared laughs</option>
                <option value="party">
                  Party · 3–10 players, votes & chaos
                </option>
                <option value="couples">Couples · 2 players, date night</option>
                <option value="chain">
                  Reaction Chain · 3–10, write the whole chat
                </option>
              </select>
            </label>
            <details className="settings-extra">
              <summary>Make it your kind of chaos · round settings</summary>
              <div className="field-row">
                <label className="field">
                  Rounds
                  <select
                    value={settings.rounds}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        rounds: Number(e.target.value),
                      }))
                    }
                  >
                    <option value="3">3 · a quick one</option>
                    <option value="5">5 · the classic</option>
                    <option value="8">8 · we’re staying</option>
                  </select>
                </label>
                <label className="field">
                  Writing time
                  <select
                    value={settings.writingSeconds}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        writingSeconds: Number(e.target.value),
                      }))
                    }
                  >
                    {[30, 45, 60, 90].map((n) => (
                      <option value={n} key={n}>
                        {n} seconds
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                Prompt pack
                <select
                  value={settings.category}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, category: e.target.value }))
                  }
                >
                  <option value="all">A bit of everything</option>
                  {(settings.mode === "couples"
                    ? [
                        "wholesome",
                        "date-night",
                        "dating",
                        "family",
                        "vacations",
                        "weddings",
                        "pets",
                      ]
                    : [
                        "family",
                        "workplace",
                        "school",
                        "restaurants",
                        "vacations",
                        "gaming",
                        "pets",
                        "neighbors",
                        "superheroes",
                        "fantasy",
                        "science-fiction",
                        "internet",
                        "emergencies",
                      ]
                  ).map((c) => (
                    <option key={c} value={c}>
                      {c.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
                <small>
                  All prepared prompts are family friendly. Player answers can
                  vary.
                </small>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={settings.familyFriendly}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      familyFriendly: e.target.checked,
                    }))
                  }
                />
                Basic family friendly word filter
              </label>
            </details>
          </>
        )}
        {error && (
          <div className="form-error" id="play-error" role="alert">
            {error}
          </div>
        )}
        <button
          className="button dark full-width"
          disabled={busy}
          type="submit"
        >
          {busy
            ? "Opening the chat…"
            : tab === "create"
              ? `Create ${MODE_NAMES[settings.mode]} room`
              : "Join the chat"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="form-note">
          Private room. Fictional chats. Real friends.
          <br />
          By playing, you agree to our{" "}
          <a href="/terms" style={{ textDecoration: "underline" }}>
            terms
          </a>{" "}
          and{" "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            privacy policy
          </a>
          .
        </p>
      </form>
    </div>
  );
}
