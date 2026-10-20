import { describe, expect, it } from "vitest";
import { readLandingDraft, saveLandingDraft } from "../src/lib/landing-draft";

const draft = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Keep this thought for tomorrow." }] }] };
function device() {
  let value: string | null = null;
  return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
}
describe("landing preview continuity", () => {
  it("restores content after returning to the same device", () => {
    const storage = device();
    expect(saveLandingDraft(storage, draft)).toBe(true);
    expect(readLandingDraft(storage)).toEqual(draft);
  });
  it("ignores malformed and incompatible stored data", () => {
    const storage = device();
    for (const raw of ["broken", "null", '{"version":2,"content":{"type":"doc","content":[]}}', '{"version":1,"content":{"type":"paragraph"}}']) {
      storage.setItem("", raw);
      expect(readLandingDraft(storage)).toBeNull();
    }
  });
  it("handles blocked storage without interrupting editing", () => {
    const storage = { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Blocked"); } };
    expect(readLandingDraft(storage)).toBeNull();
    expect(saveLandingDraft(storage, draft)).toBe(false);
  });
  it("keeps the last stored draft when a new draft exceeds the limit", () => {
    const storage = device();
    saveLandingDraft(storage, draft);
    expect(saveLandingDraft(storage, { type: "doc", content: [{ type: "text", text: "x".repeat(100_001) }] })).toBe(false);
    expect(readLandingDraft(storage)).toEqual(draft);
  });
  it("rejects oversized stored data", () => {
    const storage = device();storage.setItem("", "x".repeat(100_001));
    expect(readLandingDraft(storage)).toBeNull();
  });
});
