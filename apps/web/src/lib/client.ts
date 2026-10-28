import type { Credentials } from "../../../../packages/shared/types";
export const AVATARS = ["☘", "✳", "☺", "✿", "✧", "☀", "♧", "♡"];
export const MODE_NAMES = {
  duo: "Duo",
  couples: "Couples",
  party: "Party",
  chain: "Reaction Chain",
};
export const defaultSettings = {
  mode: "duo" as const,
  rounds: 5,
  writingSeconds: 45,
  category: "all",
  familyFriendly: true,
};
export function saveCredentials(c: Credentials) {
  sessionStorage.setItem(`deletective:${c.code}`, JSON.stringify(c));
}
export function getCredentials(code: string): Credentials | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(`deletective:${code}`) || "null",
    );
    return value?.token && value?.code === code ? value : null;
  } catch {
    return null;
  }
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      "Couldn’t reach the game server. Check your connection and try again.",
    );
  }
  let data: { error?: string; message?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The game server is temporarily unavailable. Please try again.",
    );
  }
  if (!response.ok)
    throw new Error(
      data.error || data.message || "Something went wrong. Please try again.",
    );
  return data as T;
}
export function track(event: string) {
  // Allowlisted events only. No room codes, tokens, names, messages, or identifiers.
  const allowed = [
    "room_created",
    "room_joined",
    "invite_copied",
    "round_completed",
    "session_completed",
    "rematch",
    "share_download",
    "share_copy",
    "share_native",
    "daily_started",
    "daily_completed",
    "disconnected",
  ];
  if (allowed.includes(event))
    window.dispatchEvent(
      new CustomEvent("deletective:analytics", { detail: { event } }),
    );
}
export function inviteUrl(code: string) {
  return `${location.origin}/room?code=${encodeURIComponent(code)}`;
}
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    if (!ok)
      throw new Error(
        "Copy is unavailable. Select and copy the link from your address bar.",
      );
  }
}
export function readPreference<T>(key: string, fallback: T): T {
  try {
    return (
      JSON.parse(localStorage.getItem(`deletective-${key}`) || "null") ??
      fallback
    );
  } catch {
    return fallback;
  }
}
export function writePreference(key: string, value: unknown) {
  try {
    localStorage.setItem(`deletective-${key}`, JSON.stringify(value));
  } catch {}
}
export function playTone() {
  if (!readPreference("sound", false)) return;
  try {
    const Audio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Audio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.13);
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
    osc.onended = () => void ctx.close();
  } catch {}
}
