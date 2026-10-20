// app/api/import/route.ts
// POST /api/import — multipart file upload, returns new doc id

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import { apiError } from '@/lib/errors';
import { importFile, ImportError } from '@/lib/import';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return apiError('UNAUTHENTICATED', 'Please log in');

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError('VALIDATION', 'Expected multipart form data');
  }

  const file = formData.get('file') as File | null;
  if (!file) return apiError('VALIDATION', 'No file provided');

  const buffer = Buffer.from(await file.arrayBuffer());

  let importResult: Awaited<ReturnType<typeof importFile>>;
  try {
    importResult = await importFile(buffer, file.name, file.type, file.size);
  } catch (err) {
    if (err instanceof ImportError) {
      return apiError(err.code, err.message);
    }
    console.error('Import error:', err);
    return apiError('INTERNAL', 'Failed to process file');
  }

  const { json, title } = importResult;

  const { data: doc, error } = await db
    .from('documents')
    .insert({
      owner_id: session.userId,
      title,
      content: json,
    })
    .select('id, title')
    .single();

  if (error || !doc) return apiError('INTERNAL', 'Failed to create document from import');

  return NextResponse.json({ id: doc.id, title: doc.title }, { status: 201 });
}
