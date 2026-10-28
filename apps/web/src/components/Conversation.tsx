import type { RoomView } from "../../../../packages/shared/types";
export default function Conversation({
  prompt,
  answer,
}: {
  prompt: RoomView["prompt"];
  answer?: string;
}) {
  if (!prompt) return null;
  const messages = [...prompt.messages];
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i <= messages.length; i++) {
    if (i === prompt.deletedIndex)
      nodes.push(
        answer ? (
          <div className="chat-line outgoing" key="deleted">
            <div>
              <span className="sender">The restored message</span>
              <p className="bubble" style={{ background: "var(--lime)" }}>
                {answer}
              </p>
            </div>
          </div>
        ) : (
          <div className="missing-slot" key="deleted">
            <span aria-hidden="true">⊘</span> This message was deleted{" "}
            <span aria-hidden="true">···</span>
          </div>
        ),
      );
    if (i < messages.length) {
      const m = messages[i];
      nodes.push(
        <div className="chat-line" key={i}>
          <span
            className={"mini-avatar " + ["lavender", "peach", "mint"][i % 3]}
            aria-hidden="true"
          >
            {m.sender[0]}
          </span>
          <div>
            <span className="sender">{m.sender}</span>
            <p className="bubble">{m.text}</p>
          </div>
        </div>,
      );
    }
  }
  return (
    <div className="conversation">
      <div className="conversation-title">
        <span aria-hidden="true">♧</span>
        {prompt.title || prompt.category.replaceAll("-", " ")}
      </div>
      {nodes}
    </div>
  );
}
