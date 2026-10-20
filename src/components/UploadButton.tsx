"use client";

import React, { useState, useRef, useId } from "react";
import { Button } from "./Button";
import { useToast, Toast } from "./Toast";

interface UploadButtonProps {
  onSuccess: (docId: string) => void;
  hideHint?: boolean;
  size?: "sm" | "md" | "lg";
}

const ACCEPTED = ".txt,.md,.docx";

export function UploadButton({
  onSuccess,
  hideHint = false,
  size = "md",
}: UploadButtonProps) {
  const uploadId = useId();
  const [loading, setLoading] = useState(false);
  const { toasts, toast, dismiss } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/import", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error?.message ?? "Upload failed", "error", true);
        return;
      }
      const { id } = await res.json();
      onSuccess(id);
    } catch {
      toast("Network error. Please try again.", "error", true);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploadInput = (
    <input
      ref={inputRef}
      id={uploadId}
      type="file"
      accept={ACCEPTED}
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
      }}
      aria-label="Upload file"
    />
  );

  const buttonElement = (
    <Button
      variant="secondary"
      size={size}
      loading={loading}
      onClick={() => inputRef.current?.click()}
      id={`${uploadId}-button`}
    >
      <svg
        className="w-3.5 h-3.5 text-slate-500 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <span>Upload file</span>
    </Button>
  );

  if (hideHint) {
    return (
      <>
        {uploadInput}
        {buttonElement}
        <Toast toasts={toasts} onDismiss={dismiss} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        {uploadInput}
        {buttonElement}
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          Supports .txt, .md, .docx · up to 2 MB
        </span>
      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
