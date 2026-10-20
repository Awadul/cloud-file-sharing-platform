'use client';

import React, { useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  persistent?: boolean;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_CLASSES = {
  success: 'bg-emerald-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-slate-800 text-white',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (toast.persistent) return;
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.persistent, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs',
        TOAST_CLASSES[toast.type],
      ].join(' ')}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-75 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/** Hook for managing toasts in a component */
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info', persistent = false) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, persistent }]);
      return id;
    },
    []
  );

  return { toasts, toast, dismiss };
}
