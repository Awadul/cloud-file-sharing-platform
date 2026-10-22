"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductPage } from "@/components/ProductPage";
import { Button } from "@/components/Button";
export default function AccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <ProductPage
      title="Your account and data"
      description="Take your work with you, manage access, or close your account."
    >
      <section className="pp-settings-section">
        <h2>Export your documents</h2>
        <p>
          Download all documents you own, including Trash and available revision
          history, as a ZIP containing JSON, Markdown and uploaded images.
          Documents owned by other people are excluded.
        </p>
        <a className="btn" href="/api/account/export">
          Download all documents
        </a>{" "}
        <a className="btn btn-ghost" href="/api/account/export?format=json">
          JSON only
        </a>
      </section>
      <section className="pp-settings-section">
        <h2>Password</h2>
        <p>Use a password-reset email to choose a new password.</p>
        <a className="btn" href="/forgot-password">
          Reset password
        </a>
      </section>
      <section className="pp-settings-section">
        <h2>Delete account</h2>
        <p>
          Deletion permanently removes your profile, owned documents, history,
          invitations, reviews, and uploaded images. Documents owned by other
          people remain. Existing backups may retain deleted data until their
          configured retention expires. Download an export first.
        </p>
        <form
          className="pp-product-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              !window.confirm(
                "Permanently delete your account and owned documents? This cannot be undone.",
              )
            )
              return;
            setBusy(true);
            try {
              const r = await fetch("/api/account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, confirmation }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error?.message);
              router.replace("/welcome");
              router.refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Deletion failed.");
              setBusy(false);
            }
          }}
        >
          <label>
            Current password
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Type DELETE to confirm
            <input
              className="input"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <Button
            variant="danger"
            loading={busy}
            disabled={confirmation !== "DELETE"}
            type="submit"
          >
            Permanently delete my account
          </Button>
          <p role="alert">{message}</p>
        </form>
      </section>
    </ProductPage>
  );
}
