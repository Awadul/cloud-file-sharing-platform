import type { JSONContent } from "@tiptap/react";
const KEY = "plainpage:landing-draft:v1";
const LIMIT = 100_000;
type DraftStorage = Pick<Storage, "getItem" | "setItem">;

export function readLandingDraft(storage: DraftStorage): JSONContent | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw || raw.length > LIMIT) return null;
    const value = JSON.parse(raw);
    if (value.version !== 1 || value.content?.type !== "doc" || !Array.isArray(value.content.content)) return null;
    return value.content;
  } catch { return null; }
}

export function saveLandingDraft(storage: DraftStorage, content: JSONContent): boolean {
  try {
    const raw = JSON.stringify({ version: 1, content });
    if (raw.length > LIMIT) return false;
    storage.setItem(KEY, raw);
    return true;
  } catch { return false; }
}
