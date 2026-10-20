"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { X, Lock } from "lucide-react";
import { useToast, Toast } from "./Toast";

interface ShareUser {
  user_id: string;
  role: "editor" | "viewer";
  users: { id: string; name: string; email: string } | null;
}

interface ShareDialogProps {
  docId: string;
  docTitle: string;
  ownerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({
  docId,
  docTitle,
  ownerName,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [shares, setShares] = useState<ShareUser[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [emailError, setEmailError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const { toasts, toast, dismiss } = useToast();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setEmail("");
    setEmailError("");
    onClose();
  }, [onClose]);

  const fetchShares = useCallback(async () => {
    const res = await fetch(`/api/documents/${docId}/shares`);
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
    }
  }, [docId]);

  // Load shares when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => emailInputRef.current?.focus(), 50);
    void fetchShares();
    return () => clearTimeout(timer);
  }, [isOpen, fetchShares]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "Tab" && dialogRef.current) {
        const items = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]",
          ),
        ).filter((el) => el.offsetParent !== null);
        const first = items[0],
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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setSharing(true);

    const res = await fetch(`/api/documents/${docId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    setSharing(false);

    if (!res.ok) {
      const data = await res.json();
      setEmailError(data.error?.message ?? "Failed to share");
      return;
    }

    const data = await res.json();
    setShares(data.shares);
    setEmail("");
    toast(`Shared with ${email}`, "success");
  }

  async function handleRoleChange(
    userId: string,
    newRole: "editor" | "viewer",
  ) {
    const res = await fetch(`/api/documents/${docId}/shares/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
      toast("Role updated", "success");
    }
  }

  async function handleRemove(userId: string) {
    if (confirmRemove !== userId) {
      setConfirmRemove(userId);
      return;
    }
    setRemoving(userId);
    const res = await fetch(`/api/documents/${docId}/shares/${userId}`, {
      method: "DELETE",
    });
    setRemoving(null);
    setConfirmRemove(null);
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
      toast("Access removed", "info");
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="pp-share-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div ref={dialogRef} className="pp-share-panel">
        <div className="pp-share-titlebar">
          <h2 id="share-dialog-title">Share “{docTitle}”</h2>
          <button onClick={handleClose} aria-label="Close share dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleShare} className="pp-share-invite">
          <div>
            <input
              ref={emailInputRef}
              id="share-email"
              type="email"
              aria-label="Email address to share with"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />
            {emailError && (
              <p role="alert" className="text-xs text-red-600 mt-2">
                {emailError}
              </p>
            )}
          </div>
          <select
            id="share-role"
            aria-label="Access level"
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit" loading={sharing} id="share-submit-btn">
            Share
          </Button>
        </form>
        <p className="pp-share-helper">
          Add a person by email. Choose editor or viewer access.
        </p>
        <section className="pp-share-people">
          <h3>People with access</h3>
          <div className="pp-access-row">
            <span className="pp-avatar">{ownerName[0]?.toUpperCase()}</span>
            <div>
              <strong>{ownerName} (you)</strong>
            </div>
            <Badge role="owner" />
          </div>
          {shares.map((s) => {
            const name = s.users?.name || s.users?.email || "Teammate";
            return (
              <div key={s.user_id} className="pp-access-row">
                <span className="pp-avatar">{name[0]?.toUpperCase()}</span>
                <div>
                  <strong>{name}</strong>
                  {s.users?.email && <small>{s.users.email}</small>}
                </div>
                <select
                  value={s.role}
                  aria-label={`Change ${name}'s role`}
                  onChange={(e) =>
                    handleRoleChange(
                      s.user_id,
                      e.target.value as "editor" | "viewer",
                    )
                  }
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={() => handleRemove(s.user_id)}
                  disabled={removing === s.user_id}
                  aria-label={
                    confirmRemove === s.user_id
                      ? `Confirm remove ${name}`
                      : `Remove ${name}`
                  }
                >
                  {confirmRemove === s.user_id ? (
                    `Remove ${name}?`
                  ) : (
                    <X size={15} />
                  )}
                </button>
              </div>
            );
          })}
        </section>
        <section className="pp-general-access">
          <h3>General access</h3>
          <div>
            <Lock size={19} />
            <span>
              <strong>Restricted</strong>
              <p>Only people you add can open this document.</p>
            </span>
          </div>
        </section>
        <div className="pp-share-footer">
          <Button onClick={handleClose}>Done</Button>
        </div>
      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
