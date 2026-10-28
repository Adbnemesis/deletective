import { useState } from "react";
export default function Demo() {
  const [revealed, setRevealed] = useState(false);
  const [custom, setCustom] = useState("");
  const [writing, setWriting] = useState(false);
  return (
    <div className="demo-shell">
      <div className="demo-sticker">
        a very normal family chat <span aria-hidden="true">↴</span>
      </div>
      <div className="chat-preview">
        <div className="chat-top">
          <div className="avatar avatar-pink">♧</div>
          <div>
            <strong>The family group</strong>
            <span>5 members · 1 questionable decision</span>
          </div>
          <span className="chat-dots" aria-hidden="true">
            •••
          </span>
        </div>
        <div className="chat-date">TODAY, 11:42 AM</div>
        <div className="chat-line">
          <span className="mini-avatar lavender">M</span>
          <div>
            <span className="sender">Mom</span>
            <p className="bubble">This is why we can’t have nice things.</p>
          </div>
        </div>
        <div className="chat-line">
          <span className="mini-avatar peach">J</span>
          <div>
            <span className="sender">Jamie</span>
            <p className="bubble">Please tell me Grandma wasn’t involved.</p>
          </div>
        </div>
        <div className="chat-line outgoing">
          <div>
            <span className="sender">The missing message</span>
            <button
              className={"deleted-bubble " + (revealed ? "restored" : "")}
              onClick={() => setRevealed(!revealed)}
              aria-label={
                revealed
                  ? `Example: ${custom.trim() || "I taught Grandma how to bid. She owns a lighthouse now."} Click to hide.`
                  : "Reveal example message"
              }
            >
              {revealed ? (
                custom.trim() ||
                "I taught Grandma how to bid. She owns a lighthouse now."
              ) : (
                <>
                  <span aria-hidden="true">⊘</span> This message was deleted{" "}
                  <span className="tap-label">tap to undelete ↗</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="chat-line">
          <span className="mini-avatar mint">D</span>
          <div>
            <span className="sender">Dad</span>
            <p className="bubble">I’m taking the Wi-Fi away.</p>
          </div>
        </div>
        <div className="preview-reactions" aria-hidden="true">
          <span>😭 2</span>
          <span>💀 3</span>
          <span>👀 1</span>
        </div>
        {writing ? (
          <form
            className="demo-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (custom.trim()) {
                setRevealed(true);
                setWriting(false);
              }
            }}
          >
            <label className="sr-only" htmlFor="demo-answer">
              Your fictional missing message
            </label>
            <input
              id="demo-answer"
              autoFocus
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Your version of events…"
              maxLength={240}
              required
            />
            <button aria-label="Reveal your message" className="demo-send">
              ↑
            </button>
          </form>
        ) : (
          <button className="demo-try" onClick={() => setWriting(true)}>
            Got a better explanation?{" "}
            <strong>
              Try yours <span aria-hidden="true">↗</span>
            </strong>
          </button>
        )}
      </div>
      <div className="demo-caption">
        <span className="tiny-dot"></span> Fictional chat. Very real bad ideas.
      </div>
      <span className="floating-spark spark-one" aria-hidden="true">
        ✳
      </span>
      <span className="floating-spark spark-two" aria-hidden="true">
        ✧
      </span>
    </div>
  );
}
