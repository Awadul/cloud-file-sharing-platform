import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  ExternalHyperlink,
} from "docx";
import { documentText, type ContentNode } from "./document-export";
function runs(node: ContentNode): (TextRun | ExternalHyperlink)[] {
  if (node.type === "text") {
    const link = node.marks?.find((m) => m.type === "link");
    const text = new TextRun({
      text: node.text ?? "",
      bold: node.marks?.some((m) => m.type === "bold"),
      italics: node.marks?.some((m) => m.type === "italic"),
      underline: node.marks?.some((m) => m.type === "underline")
        ? {}
        : undefined,
      font: node.marks?.some((m) => m.type === "code")
        ? "Courier New"
        : undefined,
    });
    return link && /^https?:\/\//i.test(String(link.attrs?.href))
      ? [
          new ExternalHyperlink({
            link: String(link.attrs?.href),
            children: [text],
          }),
        ]
      : [text];
  }
  if (node.type === "hardBreak") return [new TextRun({ break: 1 })];
  return (node.content ?? []).flatMap(runs);
}
function blocks(node: ContentNode, indent = 0): (Paragraph | Table)[] {
  if (node._html)
    return documentText(node)
      .split("\n")
      .map((text) => new Paragraph({ text }));
  if (node.type === "table")
    return [
      new Table({
        rows: (node.content ?? []).map(
          (row) =>
            new TableRow({
              children: (row.content ?? []).map(
                (cell) =>
                  new TableCell({
                    children: (cell.content ?? []).flatMap((n) => blocks(n)),
                    shading:
                      cell.type === "tableHeader"
                        ? { fill: "EEF2F8" }
                        : undefined,
                  }),
              ),
            }),
        ),
      }),
    ];
  if (node.type === "heading")
    return [
      new Paragraph({
        heading: [
          HeadingLevel.HEADING_1,
          HeadingLevel.HEADING_2,
          HeadingLevel.HEADING_3,
        ][Math.min(2, Math.max(0, Number(node.attrs?.level) - 1))],
        children: runs(node),
      }),
    ];
  if (node.type === "paragraph")
    return [
      new Paragraph({ children: runs(node), indent: { left: indent * 360 } }),
    ];
  if (node.type === "image")
    return [
      new Paragraph({
        text: `[Image: ${String(node.attrs?.alt ?? "Uploaded image")}. Original file is included in account ZIP exports.]`,
      }),
    ];
  if (node.type === "codeBlock")
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: documentText(node).trimEnd(),
            font: "Courier New",
          }),
        ],
      }),
    ];
  if (["bulletList", "orderedList", "taskList"].includes(node.type ?? ""))
    return (node.content ?? []).flatMap((item, i) => [
      new Paragraph({
        children: [
          new TextRun(
            node.type === "taskList"
              ? `[${item.attrs?.checked ? "x" : " "}] `
              : node.type === "orderedList"
                ? `${i + 1}. `
                : "• ",
          ),
          ...runs(item),
        ],
        indent: { left: indent * 360 },
      }),
    ]);
  return (node.content ?? []).flatMap((child) => blocks(child, indent));
}
export async function wordExport(title: string, content: ContentNode) {
  return Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            new Paragraph({ heading: HeadingLevel.TITLE, text: title }),
            ...blocks(content),
          ],
        },
      ],
    }),
  );
}
