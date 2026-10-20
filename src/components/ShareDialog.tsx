'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './Button';
import { useToast, Toast } from './Toast';

interface ShareUser {
  user_id: string;
  role: 'editor' | 'viewer';
  users: { id: string; name: string; email: string } | null;
}

interface ShareDialogProps {
  docId: string;
  docTitle: string;
  ownerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ docId, docTitle, ownerName, isOpen, onClose }: ShareDialogProps) {
  const [shares, setShares]       = useState<ShareUser[]>([]);
  const [email, setEmail]         = useState('');
  const [role, setRole]           = useState<'editor' | 'viewer'>('viewer');
  const [emailError, setEmailError] = useState('');
  const [sharing, setSharing]     = useState(false);
  const [removing, setRemoving]   = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const { toasts, toast, dismiss } = useToast();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const dialogRef     = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setEmail('');
    setEmailError('');
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
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setSharing(true);

    const res = await fetch(`/api/documents/${docId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    setSharing(false);

    if (!res.ok) {
      const data = await res.json();
      setEmailError(data.error?.message ?? 'Failed to share');
      return;
    }

    const data = await res.json();
    setShares(data.shares);
    setEmail('');
    toast(`Shared with ${email}`, 'success');
  }

  async function handleRoleChange(userId: string, newRole: 'editor' | 'viewer') {
    const res = await fetch(`/api/documents/${docId}/shares/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
      toast('Role updated', 'success');
    }
  }

  async function handleRemove(userId: string) {
    if (confirmRemove !== userId) {
      setConfirmRemove(userId);
      return;
    }
    setRemoving(userId);
    const res = await fetch(`/api/documents/${docId}/shares/${userId}`, { method: 'DELETE' });
    setRemoving(null);
    setConfirmRemove(null);
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares);
      toast('Access removed', 'info');
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="share-dialog-title" className="text-base font-semibold text-slate-900">
            Share &ldquo;{docTitle}&rdquo;
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close share dialog"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Add share */}
        <form onSubmit={handleShare} className="flex gap-2 mb-4">
          <div className="flex-1">
            <input
              ref={emailInputRef}
              id="share-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
            />
            {emailError && (
              <p role="alert" className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>
          <select
            id="share-role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            className="border border-slate-200 rounded-md px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit" loading={sharing} id="share-submit-btn">
            Share
          </Button>
        </form>

        {/* People with access */}
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            People with access
          </h3>
          <div className="divide-y divide-slate-100">
            {/* Owner row */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-900">{ownerName} (you)</span>
              <span className="text-sm text-slate-500">Owner</span>
            </div>

            {shares.length === 0 && (
              <p className="text-sm text-slate-500 py-2">Only you have access.</p>
            )}

            {shares.map((s) => {
              const name = s.users?.name ?? s.users?.email ?? 'Unknown';
              const uid  = s.user_id;
              return (
                <div key={uid} className="flex items-center justify-between py-2 gap-2">
                  <span className="text-sm text-slate-900 flex-1">{name}</span>
                  <select
                    value={s.role}
                    onChange={(e) => handleRoleChange(uid, e.target.value as 'editor' | 'viewer')}
                    aria-label={`Change ${name}'s role`}
                    className="border border-slate-200 rounded-md px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRemove(uid)}
                    disabled={removing === uid}
                    aria-label={confirmRemove === uid ? `Confirm remove ${name}` : `Remove ${name}`}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    {confirmRemove === uid ? `Remove ${name}?` : '✕'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
