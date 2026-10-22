export interface ContentNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: ContentNode[];
  _html?: string;
}
export function documentText(node: ContentNode): string {
  if (node._html)
    return node._html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  if (node.text) return node.text;
  const value = (node.content ?? [])
    .map(documentText)
    .join(
      [
        "doc",
        "bulletList",
        "orderedList",
        "taskList",
        "table",
        "tableRow",
      ].includes(node.type ?? "")
        ? "\n"
        : "",
    );
  return (
    value +
    (["paragraph", "heading", "codeBlock", "tableCell", "tableHeader"].includes(
      node.type ?? "",
    )
      ? "\n"
      : "")
  );
}
export function documentMarkdown(node: ContentNode): string {
  if (node._html) return documentText(node);
  if (node.type === "text") {
    let text = (node.text ?? "").replace(/([\\`*_{}[\]<>])/g, "\\$1");
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = `**${text}**`;
      if (mark.type === "italic") text = `*${text}*`;
      if (mark.type === "code") text = `\`${node.text ?? ""}\``;
      if (
        mark.type === "link" &&
        /^https?:\/\//i.test(String(mark.attrs?.href))
      )
        text = `[${text}](${String(mark.attrs?.href).replace(/[()\s]/g, encodeURIComponent)})`;
    }
    return text;
  }
  const children = (node.content ?? []).map(documentMarkdown);
  if (node.type === "heading")
    return (
      "#".repeat(Math.min(6, Math.max(1, Number(node.attrs?.level) || 1))) +
      " " +
      children.join("") +
      "\n\n"
    );
  if (node.type === "hardBreak") return "  \n";
  if (node.type === "image")
    return /^(https?:\/\/|\/api\/documents\/)/i.test(String(node.attrs?.src))
      ? `![${String(node.attrs?.alt ?? "").replace(/[\[\]]/g, "")}](${String(node.attrs?.src).replace(/[()\s]/g, encodeURIComponent)})\n\n`
      : "";
  if (node.type === "codeBlock")
    return (
      "```" +
      String(node.attrs?.language ?? "") +
      "\n" +
      documentText(node).trimEnd() +
      "\n```\n\n"
    );
  if (
    node.type === "bulletList" ||
    node.type === "taskList" ||
    node.type === "orderedList"
  )
    return (
      (node.content ?? [])
        .map(
          (n, i) =>
            `${node.type === "orderedList" ? `${i + 1}.` : node.type === "taskList" ? `- [${n.attrs?.checked ? "x" : " "}]` : "-"} ${documentMarkdown(n).trim()}\n`,
        )
        .join("") + "\n"
    );
  if (node.type === "table")
    return (
      children
        .map(
          (row, i) =>
            row +
            (i === 0
              ? "| " +
                (node.content?.[0].content ?? []).map(() => "---").join(" | ") +
                " |\n"
              : ""),
        )
        .join("") + "\n"
    );
  if (node.type === "tableRow")
    return (
      "| " +
      children
        .map((c) => c.trim().replace(/\|/g, "\\|").replace(/\n/g, " "))
        .join(" | ") +
      " |\n"
    );
  if (node.type === "blockquote")
    return (
      children
        .join("")
        .split("\n")
        .map((l) => "> " + l)
        .join("\n") + "\n\n"
    );
  return (
    children.join("") + (["paragraph"].includes(node.type ?? "") ? "\n\n" : "")
  );
}
