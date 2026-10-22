"use client";
import { useCallback, useEffect, useState } from "react";
import { ProductPage } from "@/components/ProductPage";
import { Button } from "@/components/Button";
export default function TrashPage() {
  const [docs, setDocs] = useState<
      { id: string; title: string; deleted_at: string }[]
    >([]),
    [notice, setNotice] = useState("Loading Trash…"),
    [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/trash");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message);
      setDocs(d.documents);
      setNotice(d.documents.length ? "" : "Trash is empty.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Trash unavailable.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <ProductPage
      title="Trash"
      description="Deleted documents are kept here until you restore them or delete your account. Shared access is suspended while a document is in Trash."
    >
      <p role="status">{notice}</p>
      {docs.map((doc) => (
        <article className="pp-product-row" key={doc.id}>
          <div>
            <h2>{doc.title}</h2>
            <p>Deleted {new Date(doc.deleted_at).toLocaleDateString()}</p>
          </div>
          <Button
            loading={busy === doc.id}
            onClick={async () => {
              setBusy(doc.id);
              try {
                const r = await fetch("/api/trash", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: doc.id }),
                });
                const d = await r.json();
                if (!r.ok) throw new Error(d.error?.message);
                await load();
              } catch (e) {
                setNotice(e instanceof Error ? e.message : "Restore failed.");
              } finally {
                setBusy("");
              }
            }}
          >
            Restore
          </Button>
        </article>
      ))}
    </ProductPage>
  );
}
