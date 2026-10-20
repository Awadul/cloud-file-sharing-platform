'use client';

import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { useToast, Toast } from './Toast';

interface UploadButtonProps {
  onSuccess: (docId: string) => void;
}

const ACCEPTED = '.txt,.md,.docx';

export function UploadButton({ onSuccess }: UploadButtonProps) {
  const [loading, setLoading]   = useState(false);
  const { toasts, toast, dismiss } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/import', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error?.message ?? 'Upload failed', 'error', true);
        return;
      }
      const { id } = await res.json();
      onSuccess(id);
    } catch {
      toast('Network error. Please try again.', 'error', true);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <input
          ref={inputRef}
          id="file-upload"
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          aria-label="Upload file"
        />
        <Button
          variant="secondary"
          loading={loading}
          onClick={() => inputRef.current?.click()}
          id="upload-file-btn"
        >
          Upload file
        </Button>
        <span className="text-xs text-slate-500">Supports .txt, .md, .docx up to 2 MB</span>
      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
