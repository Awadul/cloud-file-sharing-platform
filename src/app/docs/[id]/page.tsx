'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ShareDialog } from '@/components/ShareDialog';
import { Toast, useToast } from '@/components/Toast';
import PlainpageLogo from '@/components/PlainpageLogo';

// Dynamically import editor to keep dashboard fast and avoid SSR issues
const Editor = dynamic(() => import('@/components/Editor').then((m) => m.Editor), {
  loading: () => (
    <div className="max-w-3xl mx-auto mt-6 bg-white border border-slate-200 rounded-lg min-h-[70vh] animate-pulse" />
  ),
  ssr: false,
});

interface DocData {
  id: string;
  title: string;
  content: Record<string, unknown>;
  owner_id: string;
  updated_at: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [docId, setDocId] = useState<string | null>(null);
  const [doc, setDoc]     = useState<DocData | null>(null);
  const [user, setUser]   = useState<CurrentUser | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<'404' | '403' | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { toasts, toast, dismiss } = useToast();

  // Resolve async params
  useEffect(() => {
    params.then(({ id }) => setDocId(id));
  }, [params]);

  const fetchDoc = useCallback(async (id: string) => {
    setLoading(true);
    const [docRes, meRes] = await Promise.all([
      fetch(`/api/documents/${id}`),
      fetch('/api/me'),
    ]);

    if (docRes.status === 401) { router.push('/login'); return; }
    if (docRes.status === 403) { setError('403'); setLoading(false); return; }
    if (docRes.status === 404) { setError('404'); setLoading(false); return; }
    if (!docRes.ok) { toast('Failed to load document', 'error', true); setLoading(false); return; }

    const docData = await docRes.json();
    const meData  = meRes.ok ? await meRes.json() : null;

    setDoc(docData);
    setTitle(docData.title);
    if (meData) setUser(meData);
    setLoading(false);
  }, [router, toast]);

  useEffect(() => {
    if (docId) fetchDoc(docId);
  }, [docId, fetchDoc]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  // Error states
  if (error === '404') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Document not found</h1>
        <p className="text-slate-500">This document doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm">← Back to documents</Link>
      </div>
    );
  }
  if (error === '403') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-slate-500">You don&apos;t have permission to view this document.</p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm">← Back to documents</Link>
      </div>
    );
  }

  const isReadOnly = doc?.role === 'viewer';
  const isOwner    = doc?.role === 'owner';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2.5 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            <span className="text-slate-400">←</span>
            <PlainpageLogo size="sm" />
          </Link>

          {loading ? (
            <div className="flex-1 h-5 bg-slate-200 rounded animate-pulse" />
          ) : (
            <input
              id="doc-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={async () => {
                if (!doc || title === doc.title || isReadOnly) return;
                await fetch(`/api/documents/${doc.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title }),
                });
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              disabled={isReadOnly}
              aria-label="Document title"
              className={[
                'flex-1 text-sm font-medium text-slate-900 bg-transparent',
                'border-b border-transparent focus:border-slate-300 hover:border-slate-200',
                'focus:outline-none py-0.5 px-1 rounded-sm transition-colors',
                isReadOnly ? 'cursor-default' : '',
              ].join(' ')}
            />
          )}

          <div className="flex items-center gap-3 shrink-0">
            {doc && <Badge role={doc.role} />}
            {isOwner && (
              <Button
                id="share-btn"
                onClick={() => setShareOpen(true)}
              >
                Share
              </Button>
            )}
            {user && (
              <Button variant="ghost" onClick={handleLogout} id="logout-btn">
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-5xl mx-auto px-6">
        {!loading && doc && (
          <Editor
            docId={doc.id}
            initialContent={doc.content}
            initialTitle={doc.title}
            role={doc.role}
            ownerName={user?.name ?? 'You'}
          />
        )}
        {isReadOnly && (
          <div className="text-center text-xs text-slate-500 mt-2">
            View only — you can select and copy text
          </div>
        )}
      </main>

      {/* Share dialog */}
      {doc && (
        <ShareDialog
          docId={doc.id}
          docTitle={doc.title}
          ownerName={user?.name ?? 'You'}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
