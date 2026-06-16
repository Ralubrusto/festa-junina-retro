import type { RetroSession } from "../../types/domain";

const DEFAULT_SESSION_ID = "demo-sprint";

export function getInitialSession(): RetroSession {
  const url = new URL(window.location.href);
  const sessionId = normalizeSessionId(
    url.searchParams.get("session") ?? DEFAULT_SESSION_ID,
  );

  if (!url.searchParams.has("session")) {
    url.searchParams.set("session", sessionId);
    window.history.replaceState({}, "", url);
  }

  return {
    id: sessionId,
    title: getSessionTitle(sessionId),
    status: "open",
  };
}

function normalizeSessionId(value: string) {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || DEFAULT_SESSION_ID;
}

function getSessionTitle(sessionId: string) {
  return sessionId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
