import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { documentAccess } from "@/lib/platform";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const a = await documentAccess(id);
  if (a.response) return a.response;
  if (a.role === "viewer")
    return apiError("FORBIDDEN", "Editing access is required.");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
    return apiError(
      "VALIDATION",
      "Choose a PNG, JPEG or WebP image up to 5 MB.",
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const ext = png ? "png" : jpg ? "jpg" : webp ? "webp" : null;
  if (!ext) return apiError("VALIDATION", "This image format is unsupported.");
  const key = `${a.session.userId}/${randomUUID()}.${ext}`;
  const { error } = await db.storage
    .from("document-images")
    .upload(key, bytes, {
      contentType: png ? "image/png" : jpg ? "image/jpeg" : "image/webp",
    });
  if (error)
    return apiError("INTERNAL", "Upload failed. Image storage may need setup.");
  const record = await db
    .from("document_images")
    .insert({ key, document_id: id, uploaded_by: a.session.userId });
  if (record.error) {
    await db.storage.from("document-images").remove([key]);
    return apiError("INTERNAL", "Image could not be attached.");
  }
  // Images are served through the document's access-checked route, never a public bucket.
  return NextResponse.json({
    src: `/api/documents/${id}/images?key=${encodeURIComponent(key)}`,
  });
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const a = await documentAccess(id);
  if (a.response) return a.response;
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !/^[-a-f0-9]{36}\/[-a-f0-9]{36}\.(png|jpg|webp)$/.test(key))
    return apiError("NOT_FOUND", "Image not found.");
  const record = await db
    .from("document_images")
    .select("key")
    .eq("key", key)
    .eq("document_id", id)
    .maybeSingle();
  if (!record.data) return apiError("NOT_FOUND", "Image not found.");
  const { data, error } = await db.storage
    .from("document-images")
    .download(key);
  if (error || !data) return apiError("NOT_FOUND", "Image not found.");
  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
