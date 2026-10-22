export function analyzeClarity(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 25);
  const jargon = [
    "leverage",
    "facilitate",
    "utilize",
    "synergy",
    "endeavor",
    "seamless",
    "stakeholders",
  ];
  const words: string[] = text.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
  return {
    words: words.length,
    longSentences,
    jargon: jargon.filter((word) => words.includes(word)),
  };
}
