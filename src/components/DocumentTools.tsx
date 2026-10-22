"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "./Button";
import { MessageSquare, History, Download, X } from "lucide-react";
import { documentText } from "@/lib/document-export";
interface Person {
  user_id: string;
  users: { name: string; email: string } | null;
}
interface Response {
  reviewer_id: string;
  decision: string;
  feedback: string;
  users: { name: string; email: string } | null;
}
interface Round {
  id: string;
  revision: number;
  due_at: string;
  message: string;
  closed_at: string | null;
  review_responses: Response[];
}
interface Version {
  revision: number;
  title: string;
  content: Record<string, unknown>;
  created_at: string;
}
export function DocumentTools({
  docId,
  revision,
  role,
  title,
  hasLocalEdits,
  onReload,
}: {
  docId: string;
  revision: number;
  role: string;
  title: string;
  hasLocalEdits: boolean;
  onReload: () => void;
}) {
  const toolsRef = useRef<HTMLElement>(null);
  const reviewDetails = useRef<HTMLDetailsElement>(null);
  const [round, setRound] = useState<Round | null>(null),
    [people, setPeople] = useState<Person[]>([]),
    [me, setMe] = useState(""),
    [status, setStatus] = useState("draft"),
    [selected, setSelected] = useState<string[]>([]),
    [due, setDue] = useState(""),
    [message, setMessage] = useState(""),
    [feedback, setFeedback] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [versions, setVersions] = useState<Version[]>([]),
    [preview, setPreview] = useState<Version | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/documents/${docId}/review`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message);
      setRound(d.round);
      setPeople(d.people);
      setMe(d.userId);
      setStatus(d.status);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Review unavailable.");
    }
  }, [docId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(action: string) {
    if (hasLocalEdits) {
      setNotice(
        "Save or download your local changes before changing the review.",
      );
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch(`/api/documents/${docId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          revision,
          reviewers: selected,
          due: due ? new Date(due).toISOString() : undefined,
          message: action === "changes_requested" ? feedback : message,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message);
      await load();
      setNotice(
        action === "request"
          ? "Review requested. Notifications are queued."
          : "Review updated.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }
  const mine = round?.review_responses.find((r) => r.reviewer_id === me);
  const current = round?.revision === revision && !round.closed_at;
  return (
    <section ref={toolsRef} className="pp-document-tools" aria-label="Document workflow" onKeyDown={(event) => {
      if (event.key !== "Escape") return;
      const open = toolsRef.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (open) { open.open = false; open.querySelector("summary")?.focus(); event.stopPropagation(); }
    }}>
      <details ref={reviewDetails} name="document-workflow">
        <summary className="btn btn-ghost" title="Document review"><MessageSquare size={16} aria-hidden="true" /><span>Review</span>{mine && current && mine.decision === "pending" && <span className="pp-review-dot" aria-label="Feedback requested" />}</summary>
        <div className="pp-product-panel">
          <div className="pp-tool-heading"><h2>Document review</h2><button className="btn btn-ghost btn-square" aria-label="Close review" onClick={(e) => { const d = e.currentTarget.closest("details")!; d.open = false; d.querySelector("summary")?.focus(); }}><X size={16} aria-hidden="true" /></button></div>
          <div className="pp-tool-meta">      <span className="badge badge-ghost">
        {round && round.revision !== revision
          ? "Draft"
          : status.replace("_", " ")}
      </span>
      <span className="pp-muted">Revision {revision}</span>
</div>
          {mine && current && mine.decision === "pending" && <p className="pp-review-prompt">Your feedback is requested for this revision.</p>}
          {!round && role !== "owner" && <p>No review has been requested yet.</p>}
          {round && (
            <>
              <p>
                {current
                  ? "In review"
                  : round.revision !== revision
                    ? "Content changed since this review. Request a fresh review."
                    : "Previous review"}{" "}
                · Due {new Date(round.due_at).toLocaleDateString()}
              </p>
              <p>{round.message}</p>
              <ul className="pp-review-people">
                {round.review_responses.map((r) => (
                  <li key={r.reviewer_id}>
                    <strong>{r.users?.name ?? "Reviewer"}</strong>
                    <span>{r.decision.replace("_", " ")}</span>
                    {r.feedback && <p>{r.feedback}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {mine && current && (
            <div>
              <label htmlFor="review-feedback">What should change?</label>
              <textarea
                id="review-feedback"
                className="textarea"
                value={feedback}
                maxLength={2000}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="pp-product-actions">
                <Button
                  loading={busy}
                  variant="secondary"
                  disabled={!feedback.trim()}
                  onClick={() => void act("changes_requested")}
                >
                  Request changes
                </Button>
                <Button loading={busy} onClick={() => void act("approved")}>
                  Approve this revision
                </Button>
              </div>
            </div>
          )}
          {role === "owner" && (
            <>
              {current && (
                <div className="pp-product-actions">
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={() => void act("remind")}
                  >
                    Send reminder
                  </Button>
                  <Button
                    loading={busy}
                    disabled={
                      !round.review_responses.length ||
                      round.review_responses.some(
                        (r) => r.decision !== "approved",
                      )
                    }
                    onClick={() => void act("final")}
                  >
                    Mark as Final
                  </Button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("request");
                }}
              >
                <h3>{round ? "Request a new review" : "Request review"}</h3>
                <p>
                  Reviewers need document access first. Share the document to
                  invite them.
                </p>
                <fieldset disabled={busy}>
                  <legend>Reviewers</legend>
                  {!people.length && <p>Share this document with a teammate to request their review.</p>}
                  {people.map((p) => (
                    <label key={p.user_id} className="pp-review-choice">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selected.includes(p.user_id)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, p.user_id]
                              : prev.filter((id) => id !== p.user_id),
                          )
                        }
                      />
                      {p.users?.name ?? p.users?.email ?? "Teammate"}
                    </label>
                  ))}
                  <label>
                    Due date
                    <input
                      className="input"
                      type="datetime-local"
                      required
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                  <label>
                    Message <span className="pp-muted">(optional)</span>
                    <textarea
                      className="textarea"
                      maxLength={2000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </label>
                  <Button
                    type="submit"
                    loading={busy}
                    disabled={!selected.length}
                  >
                    Send request
                  </Button>
                </fieldset>
              </form>
            </>
          )}
        </div>
      </details>
      <details name="document-workflow"
        onToggle={async (e) => {
          if (!e.currentTarget.open) return;
          try {
            const r = await fetch(`/api/documents/${docId}/versions`);
            const d = await r.json();
            if (!r.ok) throw new Error(d.error?.message);
            setVersions(d.versions);
          } catch (e) {
            setNotice(e instanceof Error ? e.message : "History unavailable.");
          }
        }}
      >
        <summary className="btn btn-ghost" title="Version history"><History size={16} aria-hidden="true" /><span>History</span></summary>
        <div className="pp-product-panel">
          <div className="pp-tool-heading"><h2>Version history</h2><button className="btn btn-ghost btn-square" aria-label="Close history" onClick={(e) => { const d = e.currentTarget.closest("details")!; d.open = false; d.querySelector("summary")?.focus(); }}><X size={16} aria-hidden="true" /></button></div>
          <p>
            Restoring creates a new revision and closes the previous review.
          </p>
          {!versions.length && <p>No earlier saved revisions yet.</p>}
          <div className="pp-version-list">
            {versions.map((v) => (
              <button
                className="btn btn-ghost"
                key={v.revision}
                onClick={() => setPreview(v)}
              >
                Revision {v.revision} ·{" "}
                {new Date(v.created_at).toLocaleString()}
              </button>
            ))}
          </div>
          {preview && (
            <>
              <h3>{preview.title}</h3>
              <pre className="pp-version-preview">
                {documentText(preview.content)}
              </pre>
              {role === "owner" && (
                <Button
                  loading={busy}
                  disabled={preview.revision === revision}
                  onClick={async () => {
                    if (hasLocalEdits) {
                      setNotice(
                        "Save or download your local changes before restoring.",
                      );
                      return;
                    }
                    if (
                      !window.confirm(
                        "Restore this saved revision? Download any unsaved local draft first.",
                      )
                    )
                      return;
                    setBusy(true);
                    try {
                      const r = await fetch(
                        `/api/documents/${docId}/versions`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            revision,
                            restore: preview.revision,
                          }),
                        },
                      );
                      const d = await r.json();
                      if (!r.ok) throw new Error(d.error?.message);
                      onReload();
                    } catch (e) {
                      setNotice(
                        e instanceof Error ? e.message : "Restore failed.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Restore this revision
                </Button>
              )}
            </>
          )}
        </div>
      </details>
      <details name="document-workflow">
        <summary className="btn btn-ghost" title="Export document"><Download size={16} aria-hidden="true" /><span>Export</span></summary>
        <div className="pp-product-panel">
          <div className="pp-tool-heading"><h2>Export document</h2><button className="btn btn-ghost btn-square" aria-label="Close export" onClick={(e) => { const d = e.currentTarget.closest("details")!; d.open = false; d.querySelector("summary")?.focus(); }}><X size={16} aria-hidden="true" /></button></div><p className="pp-export-title">{title}</p>
          <p>
            Markdown and Word export saved content. Print/PDF uses the current
            visible document. Embedded image portability is limited; account ZIP
            export includes original image files.
          </p>
          <div className="pp-product-actions">
            <a
              className="btn"
              href={`/api/documents/${docId}/export?format=md`}
            >
              Markdown
            </a>
            <a
              className="btn"
              href={`/api/documents/${docId}/export?format=docx`}
            >
              Word
            </a>
            <button className="btn" onClick={() => window.print()}>
              Print or save PDF
            </button>
          </div>
        </div>
      </details>
      <p className="pp-tool-notice" role="status">
        {notice}
      </p>
    </section>
  );
}
