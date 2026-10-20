import { describe, expect, it } from "vitest";
import { activeOutlinePosition } from "../src/lib/editor-outline";
const outline = [{ text: "Agenda", pos: 20 }, { text: "Decisions", pos: 80 }, { text: "Next steps", pos: 150 }];
describe("editor outline active section", () => {
  it("selects the clicked heading rather than always the first", () => {
    expect(activeOutlinePosition(outline, 81)).toBe(80);
    expect(activeOutlinePosition(outline, 151)).toBe(150);
  });
  it("keeps the section active in its following body text", () => {
    expect(activeOutlinePosition(outline, 120)).toBe(80);
    expect(activeOutlinePosition(outline, 200)).toBe(150);
  });
  it("updates when the cursor moves back to an earlier section", () => {
    expect(activeOutlinePosition(outline, 25)).toBe(20);
  });
  it("distinguishes repeated heading titles by position", () => {
    expect(activeOutlinePosition([{ text: "Notes", pos: 10 }, { text: "Notes", pos: 40 }], 41)).toBe(40);
  });
  it("uses the updated positions after inserting or removing headings", () => {
    expect(activeOutlinePosition([{ text: "Agenda", pos: 20 }, { text: "Next steps", pos: 90 }], 91)).toBe(90);
  });
  it("handles a document without outline headings", () => {
    expect(activeOutlinePosition([], 0)).toBeNull();
  });
});
