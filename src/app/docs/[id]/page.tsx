"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  use,
  Suspense,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, Users } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ShareDialog } from "@/components/ShareDialog";
import { DocumentTools } from "@/components/DocumentTools";
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
  productTiers?: boolean;
  aiConfigured?: boolean;
  revision?: number;
  review_status?: string;
  role: "owner" | "editor" | "viewer";
}
type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";
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
  const [dirty, setDirty] = useState(false);
  const activeDocument = useRef(id);
  useEffect(() => {
    activeDocument.current = id;
    return () => {
      activeDocument.current = "";
    };
  }, [id]);
  const revisionRef = useRef<number | undefined>(undefined);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const savePatch = useCallback(
    (patch: Record<string, unknown>): Promise<void> => {
      const task = queueRef.current
        .catch(() => undefined)
        .then(async () => {
          const response = await fetch(`/api/documents/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({ ...patch, revision: revisionRef.current }),
          });
          if (response.status === 409) throw new Error("CONFLICT");
          if (!response.ok) throw new Error("SAVE_FAILED");
          const saved = await response.json();
          if (activeDocument.current !== id) return;
          revisionRef.current = saved.revision;
          setDoc((current) => (current ? { ...current, ...saved } : current));
        });
      queueRef.current = task;
      return task;
    },
    [id],
  );
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
      revisionRef.current = d.revision;
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
      await savePatch({ title: next });
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
        <Link
          href="/"
          className="pp-editor-back"
          onClick={(event) => {
            if (
              (dirty || titleSaving || (doc && title !== doc.title)) &&
              !window.confirm(
                "You have unsaved changes. Stay here to save or download your draft. Leave anyway?",
              )
            )
              event.preventDefault();
          }}
        >
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
          ) : status === "conflict" ? (
            "Review changes"
          ) : status === "error" ? (
            "Save failed"
          ) : dirty ? (
            "Unsaved changes"
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
      {doc?.productTiers && doc.revision !== undefined && (
        <DocumentTools
          docId={id}
          revision={doc.revision}
          role={doc.role}
          title={doc.title}
          hasLocalEdits={dirty || titleSaving || title !== doc.title}
          onReload={() => {
            if (
              dirty ||
              titleSaving ||
              status === "saving" ||
              status === "error" ||
              status === "conflict"
            ) {
              toast(
                "Save or download your local changes before reloading.",
                "error",
              );
              return;
            }
            void load();
          }}
        />
      )}
      <main className="pp-editor-main">
        {doc && !loading && (
          <Editor
            key={loading ? "loading" : id}
            aiConfigured={doc.aiConfigured}
            productTiers={doc.productTiers}
            onDirtyChange={setDirty}
            onSave={savePatch}
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
