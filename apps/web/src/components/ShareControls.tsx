import { useState } from "react";
import type { RoomView } from "../../../../packages/shared/types";
import { copyText, track } from "../lib/client";
async function makeCard(prompt: RoomView["prompt"], answer: string) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const c = canvas.getContext("2d");
  if (!c)
    throw new Error(
      "Your browser cannot create an image here. Try copying the text.",
    );
  const wrap = (text: string, max: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      if (c.measureText(word).width > max) {
        if (line) {
          lines.push(line);
          line = "";
        }
        for (const character of word) {
          if (line && c.measureText(line + character).width > max) {
            lines.push(line);
            line = character;
          } else line += character;
        }
        continue;
      }
      const test = line ? `${line} ${word}` : word;
      if (c.measureText(test).width > max && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  c.fillStyle = "#f8f7f2";
  c.fillRect(0, 0, 1080, 1350);
  c.fillStyle = "#282923";
  c.font = 'bold 52px "Space Grotesk Variable", sans-serif';
  c.fillText("deletective.", 75, 105);
  c.font = '24px "DM Sans Variable", sans-serif';
  c.fillStyle = "#73766b";
  c.fillText("A fictional chat. A very questionable explanation.", 75, 153);
  let y = 215;
  const messages = (prompt?.messages || []).map((x) => ({
    ...x,
    answer: false,
  }));
  messages.splice(prompt?.deletedIndex || 0, 0, {
    sender: "The restored message",
    text: answer,
    answer: true,
  });
  for (const m of messages) {
    c.font = '29px "DM Sans Variable", sans-serif';
    let lines = wrap(m.text, 750);
    if (lines.length > 6)
      lines = [...lines.slice(0, 5), lines[5].slice(0, 45) + "…"];
    const h = lines.length * 39 + 58;
    c.fillStyle = m.answer ? "#daf279" : "#eeeee7";
    c.beginPath();
    c.roundRect(m.answer ? 160 : 75, y, 845, h, 22);
    c.fill();
    c.fillStyle = "#73766b";
    c.font = '20px "DM Sans Variable", sans-serif';
    c.fillText(m.sender, m.answer ? 185 : 100, y + 31);
    c.fillStyle = "#282923";
    c.font = '29px "DM Sans Variable", sans-serif';
    lines.forEach((l, i) =>
      c.fillText(l, m.answer ? 185 : 100, y + 72 + i * 39),
    );
    y += h + 30;
  }
  c.fillStyle = "#282923";
  c.font = 'bold 26px "DM Sans Variable", sans-serif';
  c.fillText("What would YOU have deleted?", 75, 1258);
  c.fillStyle = "#73766b";
  c.font = '20px "DM Sans Variable", sans-serif';
  c.fillText(
    "Free browser party game · No actual messages were recovered.",
    75,
    1300,
  );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error("Could not create image. Try copying the text.")),
      "image/png",
    ),
  );
}
export default function ShareControls({
  prompt,
  answer,
}: {
  prompt: RoomView["prompt"];
  answer: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function share(kind: "download" | "copy" | "native" | "text") {
    setBusy(true);
    setMessage("");
    try {
      if (kind === "text") {
        const lines = (prompt?.messages || []).map(
          (m) => `${m.sender}: ${m.text}`,
        );
        lines.splice(
          prompt?.deletedIndex || 0,
          0,
          `The missing message: ${answer}`,
        );
        await copyText(
          `A fictional Deletective chat\n\n${lines.join("\n")}\n\nPlay Deletective at ${location.origin}`,
        );
        setMessage("Chat text copied.");
        track("share_copy");
        return;
      }
      const blob = await makeCard(prompt, answer);
      if (kind === "copy") {
        if (!navigator.clipboard?.write || !window.ClipboardItem)
          throw new Error(
            "Image copying is unavailable here. Use Download image.",
          );
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setMessage("Image copied.");
        track("share_copy");
      } else if (kind === "native") {
        const file = new File([blob], "deletective-chat.png", {
          type: "image/png",
        });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "What did they delete?!",
          });
          track("share_native");
        } else {
          await copyText(
            `What did they delete?! Play Deletective: ${location.origin}`,
          );
          setMessage("Game link copied. Use Download image to save your chat.");
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "deletective-chat.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setMessage("Image downloaded.");
        track("share_download");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="share-controls" aria-label="Share this fictional chat">
        <button disabled={busy} onClick={() => void share("download")}>
          ↓ Download image
        </button>
        <button disabled={busy} onClick={() => void share("copy")}>
          Copy image
        </button>
        <button disabled={busy} onClick={() => void share("text")}>
          Copy text
        </button>
        <button disabled={busy} onClick={() => void share("native")}>
          Share ↗
        </button>
      </div>
      {message && (
        <p className="micro" role="status">
          {message}
        </p>
      )}
    </>
  );
}
