'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Toolbar } from './Toolbar';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface EditorProps {
  docId: string;
  initialContent: Record<string, unknown>;
  initialTitle?: string;
  role: 'owner' | 'editor' | 'viewer';
  ownerName?: string;
  onTitleChange?: (title: string) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

const EXTENSIONS = [StarterKit, Underline];

function contentFromImport(raw: Record<string, unknown>): Record<string, unknown> {
  // If the content has _html (from server import), convert it to Tiptap JSON
  if (raw._html && typeof raw._html === 'string') {
    try {
      // Use the editor to parse HTML. We'll handle this with a temporary div approach.
      // The editor will handle this via setContent with the HTML string.
      return { _importHtml: raw._html };
    } catch {
      return { type: 'doc', content: [{ type: 'paragraph' }] };
    }
  }
  return raw;
}

export function Editor({
  docId,
  initialContent,
  role,
  onSaveStatusChange,
}: EditorProps) {
  const isReadOnly  = role === 'viewer';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount    = useRef(0);
  const hasUnsaved    = useRef(false);
  const isFirstRender = useRef(true);

  const updateSaveStatus = useCallback((s: SaveStatus) => {
    setSaveStatus(s);
    onSaveStatusChange?.(s);
  }, [onSaveStatusChange]);

  async function saveContent(content: Record<string, unknown>) {
    updateSaveStatus('saving');
    const delays = [1000, 3000, 8000];
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          updateSaveStatus('saved');
          hasUnsaved.current = false;
          retryCount.current = 0;
          return;
        }
      } catch { /* network error, retry */ }
      if (attempt < 2) {
        updateSaveStatus('error');
        await new Promise((r) => setTimeout(r, delays[attempt]));
        updateSaveStatus('saving');
      }
    }
    updateSaveStatus('error');
  }

  const editor = useEditor({
    extensions: EXTENSIONS,
    editable: !isReadOnly,
    content: (() => {
      // Handle imported HTML
      const processed = contentFromImport(initialContent);
      if (processed._importHtml) return processed._importHtml as string;
      return initialContent as Record<string, unknown>;
    })(),
    editorProps: {
      attributes: {
        class: 'tiptap-content px-8 py-8',
        'aria-label': 'Document content',
        'aria-readonly': isReadOnly ? 'true' : 'false',
      },
    },
    onUpdate: ({ editor }) => {
      if (isFirstRender.current) { isFirstRender.current = false; return; }
      if (isReadOnly) return;

      hasUnsaved.current = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveContent(editor.getJSON() as Record<string, unknown>);
      }, 800);
    },
  });

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);


  const saveStatusText: Record<SaveStatus, string> = {
    idle:   '',
    saving: 'Saving…',
    saved:  'Saved',
    error:  'Save failed, retrying',
  };

  const saveStatusColor: Record<SaveStatus, string> = {
    idle:   'text-slate-400',
    saving: 'text-slate-400',
    saved:  'text-emerald-600',
    error:  'text-amber-600',
  };

  return (
    <div>
      {/* Toolbar — hidden for viewers */}
      {!isReadOnly && <Toolbar editor={editor} />}

      {/* Editor area */}
      <div
        className="max-w-3xl mx-auto mt-6 mb-12 bg-white border border-slate-200 rounded-lg min-h-[70vh] cursor-text"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Save status — exposed via prop for header display */}
      {saveStatus !== 'idle' && !isReadOnly && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm ${saveStatusColor[saveStatus]}`}
          aria-live="polite"
        >
          {saveStatusText[saveStatus]}
        </div>
      )}
    </div>
  );
}
