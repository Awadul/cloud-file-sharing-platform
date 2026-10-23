"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductPage } from "@/components/ProductPage";
interface Review {
  id: string;
  due_at: string;
  closed_at: string | null;
  documents: { id: string; title: string; deleted_at: string | null } | null;
}
export default function ReviewsPage() {
  const [tab, setTab] = useState("waiting"),
    [requested, setRequested] = useState<Review[]>([]),
    [assigned, setAssigned] = useState<
      { decision: string; review_rounds: Review | null }[]
    >([]),
    [notice, setNotice] = useState("Loading reviews…");
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/reviews");
        const d = await r.json();
        if (!r.ok) throw new Error(d.error?.message);
        setRequested(d.requested ?? []);
        setAssigned(d.assigned ?? []);
        setNotice("");
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Reviews unavailable.");
      }
    })();
  }, []);
  const rows =
    tab === "requested"
      ? requested
      : assigned
          .filter((a) =>
            tab === "waiting"
              ? a.decision === "pending" && !a.review_rounds?.closed_at
              : a.decision !== "pending" || !!a.review_rounds?.closed_at,
          )
          .flatMap((a) => (a.review_rounds ? [a.review_rounds] : []));
  return (
    <ProductPage
      title="Reviews"
      description="Documents waiting on your feedback, and reviews you asked for."
    >
      <div
        className="pp-product-actions pp-review-filters"
        role="group"
        aria-label="Review inbox"
      >
        {[
          ["waiting", "Waiting on me"],
          ["requested", "I requested"],
          ["completed", "Completed"],
        ].map(([id, label]) => (
          <button
            className="btn btn-ghost"
            key={id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p role="status">{notice}</p>
      {!notice && !rows.filter(r=>r.documents && !r.documents.deleted_at).length && <div className="pp-review-empty"><h2>{tab === "waiting" ? "No documents need your review" : tab === "requested" ? "You haven’t requested a review yet" : "No completed reviews yet"}</h2><p>{tab === "waiting" ? "When someone assigns you a review, it will appear here." : tab === "requested" ? "Open a document and choose Request review to invite feedback." : "Reviews you finish will appear here."}</p>{tab === "requested" && <Link className="btn btn-ghost" href="/documents">Open documents</Link>}</div>}
      {rows
        .filter((r) => r.documents && !r.documents.deleted_at)
        .map((r) => (
          <article className="pp-product-row" key={r.id}>
            <div>
              <h2>{r.documents!.title}</h2>
              <p>
                Due {new Date(r.due_at).toLocaleDateString()} ·{" "}
                {r.closed_at ? "Closed" : "In review"}
              </p>
            </div>
            <Link className="btn" href={`/docs/${r.documents!.id}`}>
              Open review
            </Link>
          </article>
        ))}
    </ProductPage>
  );
}
