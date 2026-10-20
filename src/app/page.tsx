'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocList, DocListItem } from '@/components/DocList';
import { Button } from '@/components/Button';
import { UploadButton } from '@/components/UploadButton';
import { Toast, useToast } from '@/components/Toast';

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]         = useState<CurrentUser | null>(null);
  const [owned, setOwned]       = useState<DocListItem[]>([]);
  const [shared, setShared]     = useState<DocListItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const { toasts, toast, dismiss } = useToast();

  const fetchDocs = useCallback(async () => {
    try {
      const [docsRes, meRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/me'),
      ]);

      if (docsRes.status === 401 || meRes.status === 401) {
        router.push('/login');
        return;
      }

      if (!docsRes.ok) {
        setFetchError('Failed to load documents. Retry?');
        return;
      }

      const docsData = await docsRes.json();
      const meData = meRes.ok ? await meRes.json() : null;

      if (meData) setUser(meData);

      setOwned(
        docsData.owned.map((d: { id: string; title: string; updated_at: string }) => ({
          ...d,
          role: 'owner' as const,
        }))
      );
      setShared(
        docsData.shared.map((d: { id: string; title: string; updated_at: string; owner_name: string; role: string }) => ({
          ...d,
          role: d.role as 'editor' | 'viewer',
        }))
      );
    } catch {
      setFetchError('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  async function handleCreateDoc() {
    setCreating(true);
    try {
      const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) { toast('Failed to create document', 'error'); return; }
      const { id } = await res.json();
      router.push(`/docs/${id}`);
    } catch {
      toast('Network error', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-indigo-600 tracking-tight">
            Docs
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user.name}</span>
              <Button variant="ghost" onClick={handleLogout} id="logout-btn">
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {fetchError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between text-sm text-red-700">
            <span>{fetchError}</span>
            <button
              onClick={() => {
                setLoading(true);
                setFetchError('');
                void fetchDocs();
              }}
              className="font-medium underline hover:no-underline ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* My documents */}
        <section aria-labelledby="my-docs-heading" className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h1 id="my-docs-heading" className="text-lg font-semibold text-slate-900">
              My documents
            </h1>
            <div className="flex items-end gap-3">
              <UploadButton onSuccess={(id) => router.push(`/docs/${id}`)} />
              <Button
                id="new-doc-btn"
                loading={creating}
                onClick={handleCreateDoc}
              >
                + New doc
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg px-4">
            <DocList
              items={owned}
              loading={loading}
              emptyText="No documents yet. Create one or upload a file."
              showOwner={false}
            />
          </div>
        </section>

        {/* Shared with me */}
        <section aria-labelledby="shared-docs-heading">
          <h2 id="shared-docs-heading" className="text-lg font-semibold text-slate-900 mb-4">
            Shared with me
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg px-4">
            <DocList
              items={shared}
              loading={loading}
              emptyText="Nothing has been shared with you yet."
              showOwner
            />
          </div>
        </section>
      </main>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
