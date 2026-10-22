import { NextRequest, NextResponse } from "next/server";
import { zipSync, strToU8 } from "fflate";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { platformEnabled } from "@/lib/platform";
import { documentMarkdown, type ContentNode } from "@/lib/document-export";
export async function GET(request: NextRequest) {
  const u = await requireSession();
  if (!u) return apiError("UNAUTHENTICATED", "Please sign in");
  const data: { id: string; content: ContentNode; [key: string]: unknown }[] =
    [];
  for (let offset = 0; ; offset += 500) {
    const page = await db
      .from("documents")
      .select("*")
      .eq("owner_id", u.userId)
      .order("id")
      .range(offset, offset + 499);
    if (page.error) return apiError("INTERNAL", "Export could not be created.");
    data.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < 500) break;
  }
  const versions: unknown[] = [];
  if (platformEnabled())
    for (let start = 0; start < data.length; start += 100) {
      const ids = data.slice(start, start + 100).map((d) => d.id);
      for (let offset = 0; ; offset += 500) {
        const result = await db
          .from("document_versions")
          .select("*")
          .in("document_id", ids)
          .order("document_id")
          .order("revision")
          .range(offset, offset + 499);
        if (result.error) return apiError("INTERNAL", "History export failed.");
        versions.push(...(result.data ?? []));
        if ((result.data?.length ?? 0) < 500) break;
      }
    }
  const bundle = {
    format: "plainpage-export-v1",
    exportedAt: new Date().toISOString(),
    account: u,
    documents: data,
    versions,
  };
  if (request.nextUrl.searchParams.get("format") === "json")
    return NextResponse.json(bundle, {
      headers: {
        "Content-Disposition":
          'attachment; filename="plainpage-documents.json"',
        "Cache-Control": "no-store",
      },
    });
  const files: Record<string, Uint8Array> = {
    "documents.json": strToU8(JSON.stringify(bundle, null, 2)),
  };
  for (const doc of data ?? [])
    files[`documents/${doc.id}.md`] = strToU8(
      documentMarkdown(doc.content).replace(
        /\]\(\/api\/documents\/[^/]+\/images\?key=([^)]*)\)/g,
        (_, key: string) => `](../images/${decodeURIComponent(key)})`,
      ),
    );
  if (platformEnabled() && data?.length) {
    let total = 0;
    for (let start = 0; start < data.length; start += 100) {
      const ids = data.slice(start, start + 100).map((d) => d.id);
      for (let offset = 0; ; offset += 500) {
        const images = await db
          .from("document_images")
          .select("key")
          .in("document_id", ids)
          .order("key")
          .range(offset, offset + 499);
        if (images.error)
          return apiError("INTERNAL", "Image inventory could not be exported.");
        for (const image of images.data ?? []) {
          const downloaded = await db.storage
            .from("document-images")
            .download(image.key);
          if (downloaded.error || !downloaded.data)
            return apiError(
              "INTERNAL",
              "An image could not be exported. Please retry, or choose the JSON-only export.",
            );
          total += downloaded.data.size;
          if (total > 100 * 1024 * 1024)
            return apiError(
              "TOO_LARGE",
              "Image export exceeds 100 MB. Download JSON separately and contact support for a full archive.",
            );
          files[`images/${image.key}`] = new Uint8Array(
            await downloaded.data.arrayBuffer(),
          );
        }
        if ((images.data?.length ?? 0) < 500) break;
      }
    }
  }
  files["README.txt"] = strToU8(
    "documents.json contains the complete owned document records and available versions. documents/ contains Markdown copies. images/ contains original uploaded image files; Markdown image URLs may still point to the access-controlled original service. Shared documents owned by others are excluded.",
  );
  return new NextResponse(new Uint8Array(zipSync(files, { level: 1 })), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="plainpage-documents.zip"',
      "Cache-Control": "no-store",
    },
  });
}
