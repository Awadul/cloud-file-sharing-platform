"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Menu,
  X,
  ArrowRight,
  FileText,
  LogOut,
} from "lucide-react";
import { WorkspaceSidebar, useWorkspaceNavigation } from "@/components/WorkspaceSidebar";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { UploadButton } from "@/components/UploadButton";
import { ShareDialog } from "@/components/ShareDialog";
import { KebabMenu } from "@/components/KebabMenu";
import { Toast, useToast } from "@/components/Toast";
export type TabType = "home" | "documents" | "shared";
interface Person {
  productTiers?: boolean;
  userId: string;
  name: string;
  email: string;
}
interface Item {
  id: string;
  title: string;
  excerpt?: string;
  updated_at: string;
  owner_id?: string;
  owner_name?: string;
  role: "owner" | "editor" | "viewer";
}
const starters = [
  {
    name: "Meeting notes",
    headings: ["Agenda", "Decisions", "Next steps"],
    copy: "Agenda, decisions and next steps.",
  },
  {
    name: "Project brief",
    headings: ["Overview", "Goals", "Scope and owners"],
    copy: "Goals, scope and owners.",
  },
  {
    name: "Weekly update",
    headings: ["This week", "Up next", "Blockers"],
    copy: "A short note the whole team reads.",
  },
];
export function DashboardContent({
  initialTab = "home",
}: {
  initialTab?: TabType;
}) {
  const router = useRouter();
  const [collapsed,setCollapsed] = useWorkspaceNavigation();
  const [user, setUser] = useState<Person | null>(null),
    [owned, setOwned] = useState<Item[]>([]),
    [shared, setShared] = useState<Item[]>([]),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [creating, setCreating] = useState(false),
    [error, setError] = useState(""),
    [view, setView] = useState<"grid" | "list">("grid"),
    [drawer, setDrawer] = useState(false),
    [settings, setSettings] = useState(false),
    [sharing, setSharing] = useState<Item | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [accessFilter, setAccessFilter] = useState("all"),
    [personFilter, setPersonFilter] = useState("all"),
    [sort, setSort] = useState("recent");
  const { toasts, toast, dismiss } = useToast();
  const fetchDocs = useCallback(async () => {
    try {
      setError("");
      const [dr, mr] = await Promise.all([
        (async () => {
          await fetch("/api/invitations/accept", { method: "POST" });
          return fetch("/api/documents");
        })(),
        fetch("/api/me"),
      ]);
      if (dr.status === 401 || mr.status === 401) {
        router.replace("/login");
        return;
      }
      if (!dr.ok || !mr.ok)
        throw new Error("Documents could not be loaded. Please try again.");
      const [d, m] = await Promise.all([dr.json(), mr.json()]);
      setUser(m);
      setOwned(d.owned.map((i: Item) => ({ ...i, role: "owner" })));
      setShared(d.shared);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);
  useEffect(() => {
    const listener = () => {
      if (document.visibilityState === "visible") void fetchDocs();
    };
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  }, [fetchDocs]);
  useEffect(() => {
    if (!settings) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = document.querySelector<HTMLElement>(".pp-account-panel");
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href],input,select",
        ) || [],
      );
    focusable()[0]?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettings(false);
      if (e.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [settings]);
  async function createDocument(starter?: (typeof starters)[number]) {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(starter ? { title: starter.name } : {}),
      });
      if (!res.ok) throw new Error("Could not create the document. Try again.");
      const doc = await res.json();
      if (starter) {
        const content = {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: starter.name }],
            },
            ...starter.headings.flatMap((text) => [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text }],
              },
              { type: "paragraph" },
            ]),
          ],
        };
        const save = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, revision: doc.revision }),
        });
        if (!save.ok)
          toast(
            "Your document was created, but the starter could not be applied.",
            "error",
          );
      }
      router.push(`/docs/${doc.id}`);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Could not create document",
        "error",
      );
    } finally {
      setCreating(false);
    }
  }
  async function logout() {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      router.push("/login");
    } catch {
      toast("Could not sign out. Please try again.", "error");
    }
  }
  const filter = useCallback(
    (items: Item[]) =>
      items.filter((i) =>
        (i.title + " " + (i.excerpt || ""))
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const ownedItems = useMemo(() => filter(owned), [filter, owned]);
  const sharedItems = useMemo(
    () =>
      filter(shared)
        .filter(
          (i) =>
            (accessFilter === "all" || i.role === accessFilter) &&
            (personFilter === "all" || i.owner_name === personFilter),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.title.localeCompare(b.title)
            : b.updated_at.localeCompare(a.updated_at),
        ),
    [filter, shared, accessFilter, personFilter, sort],
  );
  const detail = sharedItems.find((i) => i.id === selected) || sharedItems[0];
  function deleted(id: string) {
    setOwned((d) => d.filter((i) => i.id !== id));
    setShared((d) => d.filter((i) => i.id !== id));
  }
  function renderDocuments(items: Item[], sharedSection = false) {
    if (loading)
      return (
        <div
          className="pp-doc-grid"
          aria-busy="true"
          aria-label="Loading documents"
        >
          {[0, 1, 2].map((i) => (
            <div className="pp-loading-card skeleton" key={i} />
          ))}
        </div>
      );
    if (!items.length)
      return (
        <div className="pp-empty">
          <FileText size={28} />
          <h3>
            {query
              ? "No matching documents"
              : sharedSection
                ? "Nothing shared with you yet"
                : "Your next document starts here"}
          </h3>
          <p>
            {query
              ? "Try a different document title."
              : sharedSection
                ? "Documents shared with your account will appear here."
                : "Create a blank document or bring in a file."}
          </p>
          {!sharedSection && !query && (
            <Button onClick={() => createDocument()}>Create a document</Button>
          )}
        </div>
      );
    return (
      <div className={view === "grid" ? "pp-doc-grid" : "pp-doc-list"}>
        {items.map((d) => (
          <article
            className={`card pp-document-card ${!d.excerpt?.trim() ? "pp-document-empty" : ""} ${view === "list" ? "pp-list-card" : ""}`}
            key={d.id}
          >
            <div className="pp-doc-card-body">
              <div className="pp-doc-card-title">
                <Link href={`/docs/${d.id}`} className="pp-doc-open">
                  <span className="pp-doc-name">
                    {d.title || "Untitled document"}
                  </span>
                  <span
                    className={`pp-doc-excerpt ${d.excerpt?.trim() ? "" : "pp-doc-excerpt-empty"}`}
                  >
                    {d.excerpt?.trim() || "No text yet."}
                  </span>
                </Link>
                <KebabMenu
                  softDelete={!!user?.productTiers}
                  docId={d.id}
                  docTitle={d.title}
                  role={d.role}
                  onShare={() => setSharing(d)}
                  onDeleted={deleted}
                />
              </div>
              <div className="pp-doc-meta">
                <span>
                  Updated{" "}
                  {new Date(d.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {sharedSection && d.owner_name ? ` · by ${d.owner_name}` : ""}
                </span>
                <Badge role={d.role} />
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }
  return (
    <div className={`pp-app pp-library-workspace ${collapsed ? "pp-navigation-collapsed" : ""}`}>
      <WorkspaceSidebar user={user} active={initialTab === "home" ? "/" : `/${initialTab}`} drawer={drawer} collapsed={collapsed} onClose={() => setDrawer(false)} onToggle={() => setCollapsed(!collapsed)} onLogout={logout} onAccount={() => setSettings(true)} />
      <div className="pp-app-main">
        <header className="pp-workspace-header">
          <button
            className="pp-mobile-menu btn btn-ghost btn-square"
            aria-label="Open navigation" aria-expanded={drawer} aria-controls="workspace-navigation"
            onClick={() => setDrawer(true)}
          >
            <Menu size={20} />
          </button>
          <label className="input pp-search">
            <Search size={20} />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Search documents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="pp-header-actions">
            <UploadButton
              hideHint
              onSuccess={(id) => router.push(`/docs/${id}`)}
            />
            <Button
              loading={creating}
              onClick={() => createDocument()}
              id="new-doc-btn"
            >
              <Plus size={17} />
              <span>New document</span>
            </Button>
          </div>
        </header>
        <main>
          {error && (
            <div className="pp-error" role="alert">
              <p>{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  void fetchDocs();
                }}
              >
                Retry
              </button>
            </div>
          )}
          {initialTab === "home" && (
            <section className="pp-starters">
              <h1>Start a new document</h1>
              <div className="pp-starter-grid">
                <button
                  className="pp-starter"
                  disabled={creating}
                  onClick={() => createDocument()}
                >
                  <span className="pp-starter-page">
                    <Plus size={43} strokeWidth={1.6} />
                  </span>
                  <strong>Blank document</strong>
                  <span>Start from scratch</span>
                </button>
                {starters.map((s) => (
                  <button
                    className="pp-starter"
                    key={s.name}
                    disabled={creating}
                    onClick={() => createDocument(s)}
                  >
                    <span className="pp-starter-page">
                      <span className="pp-starter-content" aria-hidden="true">
                        <span className="pp-starter-preview-title">{s.name}</span>
                        {s.headings.map(heading => <span className="pp-starter-preview-heading" key={heading}>{heading}</span>)}
                      </span>
                    </span>
                    <strong>{s.name}</strong>
                    <span>{s.copy}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {initialTab !== "shared" ? (
            <div className="pp-library">
              <section>
                <div className="pp-section-heading">
                  <h1>
                    {initialTab === "home" ? "My documents" : "Documents"}
                  </h1>
                  <div className="pp-view-switch">
                    <button
                      className={`btn btn-ghost btn-square ${view === "grid" ? "pp-active-view" : ""}`}
                      aria-label="Grid view"
                      aria-pressed={view === "grid"}
                      onClick={() => setView("grid")}
                    >
                      <LayoutGrid size={21} />
                    </button>
                    <button
                      className={`btn btn-ghost btn-square ${view === "list" ? "pp-active-view" : ""}`}
                      aria-label="List view"
                      aria-pressed={view === "list"}
                      onClick={() => setView("list")}
                    >
                      <List size={21} />
                    </button>
                  </div>
                </div>
                {renderDocuments(ownedItems)}
              </section>
              {initialTab === "home" && (
                <section className="pp-shared-section">
                  <h2>Shared with me</h2>
                  {renderDocuments(filter(shared), true)}
                </section>
              )}
            </div>
          ) : (
            <div className="pp-shared-page">
              <h1>Shared with me</h1>
              <p>Documents other people have shared with you.</p>
              <div className="pp-filters">
                <select
                  className="select select-sm"
                  aria-label="Filter by access"
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                >
                  <option value="all">Access</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <select
                  className="select select-sm"
                  aria-label="Filter by person"
                  value={personFilter}
                  onChange={(e) => setPersonFilter(e.target.value)}
                >
                  <option value="all">People</option>
                  {[
                    ...new Set(shared.map((i) => i.owner_name).filter(Boolean)),
                  ].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <select
                  className="select select-sm"
                  aria-label="Sort shared documents"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recent">Modified</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
              {loading ? (
                <p className="pp-muted">Loading shared documents…</p>
              ) : !sharedItems.length ? (
                renderDocuments([], true)
              ) : (
                <div className="pp-shared-layout">
                  <div className="pp-shared-table-wrap">
                    <table className="table pp-shared-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Shared by</th>
                          <th>Modified</th>
                          <th>Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sharedItems.map((d) => (
                          <tr
                            key={d.id}
                            className={
                              detail?.id === d.id ? "pp-selected-row" : ""
                            }
                          >
                            <td>
                              <button
                                onClick={() => setSelected(d.id)}
                                aria-label={`Show details for ${d.title}`}
                              >
                                <FileText size={17} />
                                <span>{d.title}</span>
                              </button>
                            </td>
                            <td>
                              <span className="pp-inline-user">
                                <span className="pp-avatar">
                                  {d.owner_name?.[0] || "?"}
                                </span>
                                {d.owner_name}
                              </span>
                            </td>
                            <td>
                              {new Date(d.updated_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td>
                              <Badge role={d.role} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {detail && (
                    <aside className="pp-document-details">
                      <div className="pp-details-title">
                        <FileText size={23} />
                        <h2>{detail.title}</h2>
                      </div>
                      <Link
                        className="btn btn-primary btn-sm"
                        href={`/docs/${detail.id}`}
                      >
                        Open
                        <ArrowRight size={14} />
                      </Link>
                      <h3>Who has access</h3>
                      <div className="pp-detail-user">
                        <span className="pp-avatar">
                          {detail.owner_name?.[0] || "?"}
                        </span>
                        <span>{detail.owner_name}</span>
                        <Badge role="owner" />
                      </div>
                      <div className="pp-detail-user">
                        <span className="pp-avatar">{user?.name[0]}</span>
                        <span>You</span>
                        <Badge role={detail.role} />
                      </div>
                      <h3>Details</h3>
                      <dl>
                        <dt>Owner</dt>
                        <dd>{detail.owner_name}</dd>
                        <dt>Modified</dt>
                        <dd>
                          {new Date(detail.updated_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </dd>
                        <dt>Your access</dt>
                        <dd>
                          {detail.role === "editor" ? "Editor" : "Viewer"}
                        </dd>
                      </dl>
                    </aside>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {sharing && (
        <ShareDialog
          docId={sharing.id}
          docTitle={sharing.title}
          ownerName={user?.name || "You"}
          isOpen
          onClose={() => setSharing(null)}
        />
      )}
      {settings && (
        <div
          className="pp-account-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pp-account-heading"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettings(false);
          }}
        >
          <div className="pp-account-panel">
            <div>
              <h2 id="pp-account-heading">Your account</h2>
              <button
                className="btn btn-ghost btn-square btn-sm"
                aria-label="Close account settings"
                onClick={() => setSettings(false)}
              >
                <X size={18} />
              </button>
            </div>
            <span className="pp-avatar">{user?.name[0]}</span>
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
            <Link className="btn btn-ghost" href="/account">
              Account, export and deletion
            </Link>
            <div className="pp-account-actions">
              <Button variant="secondary" onClick={logout}>
                <LogOut size={16} />
                Sign out
              </Button>
              <Button onClick={() => setSettings(false)}>Done</Button>
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
