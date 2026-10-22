import { NextRequest, NextResponse } from "next/server";
import { documentAccess } from "@/lib/platform";
import { documentMarkdown } from "@/lib/document-export";
import { wordExport } from "@/lib/word-export";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const a = await documentAccess(id);
  if (a.response) return a.response;
  const format = request.nextUrl.searchParams.get("format");
  const filename =
    a.doc.title.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 80) || "document";
  if (format === "docx") {
    const buffer = await wordExport(a.doc.title, a.doc.content);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new NextResponse(documentMarkdown(a.doc.content), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
