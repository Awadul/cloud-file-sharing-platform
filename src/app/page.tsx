'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DocList, DocListItem } from '@/components/DocList';
import { Button } from '@/components/Button';
import { UploadButton } from '@/components/UploadButton';
import { ShareDialog } from '@/components/ShareDialog';
import { Toast, useToast } from '@/components/Toast';

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
}

export type TabType = 'home' | 'documents' | 'shared';

export function DashboardContent({ initialTab = 'home' }: { initialTab?: TabType }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [owned, setOwned] = useState<DocListItem[]>([]);
  const [shared, setShared] = useState<DocListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sharingDoc, setSharingDoc] = useState<{ id: string; title: string } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
        docsData.owned.map((d: { id: string; title: string; excerpt?: string; updated_at: string }) => ({
          ...d,
          description: d.excerpt,
          role: 'owner' as const,
        }))
      );
      setShared(
        docsData.shared.map((d: { id: string; title: string; excerpt?: string; updated_at: string; owner_name: string; role: string }) => ({
          ...d,
          description: d.excerpt,
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
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) {
        toast('Failed to create document', 'error');
        return;
      }
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

  async function handleSwitchUser(email: string) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'demo123' }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        setLoading(true);
        void fetchDocs();
      }
    } catch {
      toast('Failed to switch user', 'error');
    }
  }

  function handleDocumentDeleted(deletedId: string) {
    setOwned((prev) => prev.filter((d) => d.id !== deletedId));
    setShared((prev) => prev.filter((d) => d.id !== deletedId));
    toast('Document deleted', 'info');
  }

  // Filtered lists for search
  const filteredOwned = useMemo(() => {
    if (!searchQuery.trim()) return owned;
    const q = searchQuery.toLowerCase();
    return owned.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [owned, searchQuery]);

  const filteredShared = useMemo(() => {
    if (!searchQuery.trim()) return shared;
    const q = searchQuery.toLowerCase();
    return shared.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.owner_name && d.owner_name.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [shared, searchQuery]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex text-slate-800 antialiased font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── LEFT SIDEBAR (AJAIA MIDNIGHT NAVY #0C1322) ──────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0C1322] text-slate-300 flex flex-col justify-between shrink-0 h-screen select-none border-r border-[#152037] transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:w-56 md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0 shadow-2xl' : 'max-md:-translate-x-full'
        }`}
      >
        {/* Top: Logo & Navigation */}
        <div className="p-3.5">
          {/* Ajaia Docs Wordmark + Mobile Close Button */}
          <div className="flex items-center justify-between px-3 py-3 mb-5 text-white">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-5 h-5 text-blue-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.9}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <span className="font-bold text-[15px] tracking-tight text-white font-sans">
                Ajaia Docs
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white rounded-md transition-colors"
              aria-label="Close navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileNavOpen(false);
                router.push('/');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-[#182642] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('documents');
                setMobileNavOpen(false);
                router.push('/documents');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-[#182642] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span>Documents</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('shared');
                setMobileNavOpen(false);
                router.push('/shared');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'shared'
                  ? 'bg-[#182642] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Shared</span>
            </button>
          </nav>
        </div>

        {/* Bottom: User Card & Settings */}
        <div className="p-3 border-t border-[#152037] space-y-1">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-800/80 border border-blue-400/30 text-blue-100 font-semibold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white leading-tight truncate">
                {user?.name ?? 'Alice'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                Demo workspace
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowSettingsModal(true);
              setMobileNavOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#121c32] transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              Ajaia Docs
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-normal">
              {activeTab === 'home' && 'Product overview'}
              {activeTab === 'documents' && 'Your workspace'}
              {activeTab === 'shared' && 'Shared with me'}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              Interactive demo
            </span>
            {activeTab === 'home' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('documents')}
              >
                Open demo
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('home')}
              >
                Back to overview
              </Button>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {fetchError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-red-700 shadow-xs">
              <span>{fetchError}</span>
              <button
                onClick={() => {
                  setLoading(true);
                  setFetchError('');
                  void fetchDocs();
                }}
                className="font-semibold underline hover:no-underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* ════ VIEW 1: HOME (SIDE-BY-SIDE 2-COLUMN MATCHING SCREENSHOT) ════ */}
          {activeTab === 'home' && (
            <div className="space-y-12">
              {/* 2-Column Row: Left Hero + Right Workspace Card */}
              <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 xl:gap-10">
                {/* ── LEFT COLUMN: HERO HEADLINE & ACTIONS ── */}
                <div className="w-full lg:w-[310px] xl:w-[360px] shrink-0 pt-1 lg:pt-2">
                  <h1 className="text-3xl lg:text-[32px] xl:text-[38px] font-extrabold text-slate-900 tracking-tight leading-[1.14]">
                    Your team’s next great document starts here.
                  </h1>

                  <p className="text-sm text-slate-500 leading-relaxed mt-3.5 max-w-sm">
                    Ajaia Docs is a lightweight collaborative document editor for teams.
                    Write rich text documents, keep them organised, import your existing
                    files, and share them with the right people.
                  </p>

                  <div className="flex items-center gap-3 mt-5 sm:mt-6">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setActiveTab('documents')}
                    >
                      Open demo
                    </Button>

                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold h-9 px-3.5 text-xs rounded-lg shadow-xs transition-colors shrink-0 whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-700 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>View source</span>
                    </a>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: YOUR WORKSPACE CARD ── */}
                <div className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
                  {/* Card Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                        Your workspace
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Create, manage and share documents with your team.
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          id="new-doc-btn"
                          variant="primary"
                          size="md"
                          loading={creating}
                          onClick={handleCreateDoc}
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          <span>New document</span>
                        </Button>

                        <UploadButton
                          onSuccess={(id) => router.push(`/docs/${id}`)}
                          hideHint
                          size="md"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 select-none">
                        Supports .txt, .md, .docx · up to 2 MB
                      </span>
                    </div>
                  </div>

                  {/* My Documents Section */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                      My documents
                    </h3>
                    <DocList
                      items={owned}
                      loading={loading}
                      emptyText="No documents yet."
                      showOwner={false}
                      onShare={(docId, docTitle) => setSharingDoc({ id: docId, title: docTitle })}
                      onDeleted={handleDocumentDeleted}
                    />
                  </div>

                  {/* Shared With Me Section */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                      Shared with me
                    </h3>
                    <DocList
                      items={shared}
                      loading={loading}
                      emptyText="Nothing has been shared with you yet."
                      showOwner
                      onShare={(docId, docTitle) => setSharingDoc({ id: docId, title: docTitle })}
                      onDeleted={handleDocumentDeleted}
                    />
                  </div>
                </div>
              </div>

              {/* ── 3-STEP FEATURE STRIP AT BOTTOM ── */}
              <div className="pt-8 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Create a document
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Start writing with a clean, focused editor built for everyday work.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Bring your files
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Import .txt, .md or .docx files and keep everything in one place.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Share with control
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Invite teammates with clear editor or viewer access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ VIEW 2: DOCUMENTS TAB ════ */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Your workspace
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Create, manage and share documents with your team.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      id="new-doc-btn"
                      variant="primary"
                      size="md"
                      loading={creating}
                      onClick={handleCreateDoc}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>New document</span>
                    </Button>
                    <UploadButton
                      onSuccess={(id) => router.push(`/docs/${id}`)}
                      hideHint
                      size="md"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 select-none">
                    Supports .txt, .md, .docx · up to 2 MB
                  </span>
                </div>
              </div>

              {/* Search Bar + Local Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-72">
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full bg-white border border-slate-200/90 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  Sample documents · saved locally
                </span>
              </div>

              {/* Documents List */}
              <div className="pt-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  My documents
                </h2>
                <DocList
                  items={filteredOwned}
                  loading={loading}
                  emptyText={
                    searchQuery
                      ? 'No documents matched your search.'
                      : 'No documents yet.'
                  }
                  showOwner={false}
                  onShare={(docId, docTitle) => setSharingDoc({ id: docId, title: docTitle })}
                  onDeleted={handleDocumentDeleted}
                />
              </div>
            </div>
          )}

          {/* ════ VIEW 3: SHARED TAB ════ */}
          {activeTab === 'shared' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Shared with me
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    A little more alignment, one shared document at a time.
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      id="new-doc-btn"
                      variant="primary"
                      size="md"
                      loading={creating}
                      onClick={handleCreateDoc}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>New document</span>
                    </Button>
                    <UploadButton
                      onSuccess={(id) => router.push(`/docs/${id}`)}
                      hideHint
                      size="md"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 select-none">
                    Supports .txt, .md, .docx · up to 2 MB
                  </span>
                </div>
              </div>

              {/* Search Bar + Local Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-72">
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full bg-white border border-slate-200/90 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  Sample documents · saved locally
                </span>
              </div>

              {/* Shared Documents List */}
              <div className="pt-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Shared with me
                </h2>
                <DocList
                  items={filteredShared}
                  loading={loading}
                  emptyText={
                    searchQuery
                      ? 'No shared documents matched your search.'
                      : 'Nothing has been shared with you yet.'
                  }
                  showOwner
                  onShare={(docId, docTitle) => setSharingDoc({ id: docId, title: docTitle })}
                  onDeleted={handleDocumentDeleted}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── SHARE DIALOG (CONNECTED VIA KEBAB MENU) ─────────────────── */}
      {sharingDoc && (
        <ShareDialog
          docId={sharingDoc.id}
          docTitle={sharingDoc.title}
          ownerName={user?.name ?? 'You'}
          isOpen={!!sharingDoc}
          onClose={() => setSharingDoc(null)}
        />
      )}

      {/* ─── SETTINGS & USER SWITCH MODAL ─────────────────────────────── */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Workspace Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Switch Demo User
              </label>
              <div className="space-y-1.5">
                {[
                  { name: 'Alice', email: 'alice@demo.test' },
                  { name: 'Bob', email: 'bob@demo.test' },
                  { name: 'Carol', email: 'carol@demo.test' },
                ].map((u) => (
                  <button
                    key={u.email}
                    onClick={() => handleSwitchUser(u.email)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      user?.email === u.email
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <span>
                      {u.name} ({u.email})
                    </span>
                    {user?.email === u.email && (
                      <span className="text-blue-600 font-semibold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-medium"
              >
                Sign out
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSettingsModal(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent initialTab="home" />;
}

