export interface OutlineHeading {
  text: string;
  pos: number;
}

/** Find the section containing the cursor, using document positions rather than labels. */
export function activeOutlinePosition(headings: readonly OutlineHeading[], cursor: number): number | null {
  if (!headings.length) return null;
  let active = headings[0].pos;
  for (const heading of headings) {
    if (heading.pos > cursor) break;
    active = heading.pos;
  }
  return active;
}
