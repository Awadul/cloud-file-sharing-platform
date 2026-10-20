"use client";
import React, { useEffect, useState, useCallback, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, Users } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ShareDialog } from "@/components/ShareDialog";
import { Toast, useToast } from "@/components/Toast";
const Editor = dynamic(
  () => import("@/components/Editor").then((m) => m.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="pp-editor-layout">
        <div />
        <div className="pp-editor-paper skeleton" aria-label="Loading editor" />
      </div>
    ),
  },
);
interface Doc {
  id: string;
  title: string;
  content: Record<string, unknown>;
  owner_id: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
}
type SaveStatus = "idle" | "saving" | "saved" | "error";
function EditorPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null),
    [title, setTitle] = useState(""),
    [name, setName] = useState("You"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [sharing, setSharing] = useState(false),
    [status, setStatus] = useState<SaveStatus>("idle"),
    [titleSaving, setTitleSaving] = useState(false);
  const { toasts, toast, dismiss } = useToast();
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dr, mr] = await Promise.all([
        fetch(`/api/documents/${id}`),
        fetch("/api/me"),
      ]);
      if (dr.status === 401) {
        router.replace("/login");
        return;
      }
      if (dr.status === 404 || dr.status === 403) {
        setError("This document is unavailable or you do not have access.");
        return;
      }
      if (!dr.ok)
        throw new Error("Could not load this document. Please try again.");
      const d = await dr.json();
      setDoc(d);
      setTitle(d.title);
      if (mr.ok) {
        const m = await mr.json();
        setName(m.name);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, router]);
  useEffect(() => {
    void load();
  }, [load]);
  async function saveTitle() {
    if (!doc || doc.role === "viewer" || title === doc.title) return;
    const next = title.trim() || "Untitled document";
    setTitle(next);
    setTitleSaving(true);
    try {
      const r = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!r.ok) throw new Error();
      setDoc((d) => (d ? { ...d, title: next } : d));
    } catch {
      toast("The document title could not be saved. Try again.", "error", true);
      setStatus("error");
    } finally {
      setTitleSaving(false);
    }
  }
  if (error)
    return (
      <main
        className="pp-empty"
        style={{ minHeight: "100vh", justifyContent: "center" }}
      >
        <h1>Document unavailable</h1>
        <p>{error}</p>
        <div className="flex gap-3">
          <Link className="btn btn-primary" href="/">
            Back to documents
          </Link>
          <Button variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </main>
    );
  return (
    <div className="pp-editor">
      <header className="pp-editor-header">
        <Link href="/" className="pp-editor-back">
          <ArrowLeft size={18} />
          Docs
        </Link>
        {loading ? (
          <div className="pp-editor-title skeleton h-6" />
        ) : (
          <input
            className="pp-editor-title"
            id="doc-title-input"
            aria-label="Document title"
            value={title}
            maxLength={255}
            disabled={doc?.role === "viewer"}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void saveTitle()}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        )}
        <span
          className="pp-editor-status"
          data-state={status}
          role="status"
          aria-live="polite"
        >
          {status === "saving" || titleSaving ? (
            "Saving…"
          ) : status === "error" ? (
            "Save failed"
          ) : !loading ? (
            <>
              <Check size={15} />
              Saved
            </>
          ) : (
            ""
          )}
        </span>
        <div className="pp-editor-actions">
          {doc && <Badge role={doc.role} />}{" "}
          {doc?.role === "owner" && (
            <Button id="share-btn" onClick={() => setSharing(true)}>
              <Users size={17} />
              Share
            </Button>
          )}
        </div>
      </header>
      <main className="pp-editor-main">
        {doc && !loading && (
          <Editor
            docId={doc.id}
            initialContent={doc.content}
            initialTitle={doc.title}
            role={doc.role}
            ownerName={name}
            onSaveStatusChange={setStatus}
          />
        )}
      </main>
      {doc && (
        <ShareDialog
          docId={id}
          docTitle={title}
          ownerName={name}
          isOpen={sharing}
          onClose={() => setSharing(false)}
        />
      )}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default function EditorPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main
          className="pp-empty"
          style={{ minHeight: "100vh", justifyContent: "center" }}
          aria-busy="true"
        >
          <p>Opening document…</p>
        </main>
      }
    >
      <EditorPageContent {...props} />
    </Suspense>
  );
}
