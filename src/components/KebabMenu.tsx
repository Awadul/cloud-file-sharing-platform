"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface KebabMenuProps {
  softDelete?: boolean;
  docId: string;
  docTitle: string;
  role: "owner" | "editor" | "viewer";
  onShare?: (docId: string, docTitle: string) => void;
  onDeleted?: (docId: string) => void;
}

export function KebabMenu({
  softDelete = false,
  docId,
  docTitle,
  role,
  onShare,
  onDeleted,
}: KebabMenuProps) {
  const router = useRouter();
  const [failure, setFailure] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setConfirmDelete(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setFailure("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setIsOpen(false);
        onDeleted?.(docId);
      } else {
        setFailure("The document could not be removed. Please try again.");
      }
    } catch {
      setFailure("Unable to connect. Please try again.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const isOwner = role === "owner";

  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
          setConfirmDelete(false);
        }}
        aria-label="Document options"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {failure && (
        <p role="alert" className="text-error text-xs">
          {failure}
        </p>
      )}
      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-30 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsOpen(false);
              router.push(`/docs/${docId}`);
            }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            role="menuitem"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Open document
          </button>

          {isOwner && onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(false);
                onShare(docId, docTitle);
              }}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              role="menuitem"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share settings
            </button>
          )}

          {isOwner && onDeleted && (
            <div className="border-t border-slate-100 my-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <svg
                  className="w-3.5 h-3.5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {confirmDelete
                  ? deleting
                    ? "Removing..."
                    : "Confirm removal?"
                  : softDelete
                    ? "Move to Trash"
                    : "Delete document"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
