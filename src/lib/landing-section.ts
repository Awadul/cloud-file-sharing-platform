interface SectionPosition { id: string; top: number }

/** The section whose start most recently crossed the navigation's reading line. */
export function activeLandingSection(sections: SectionPosition[], readingLine: number): string | undefined {
  let active = sections[0]?.id;
  for (const section of sections) {
    if (section.top > readingLine) break;
    active = section.id;
  }
  return active;
}
