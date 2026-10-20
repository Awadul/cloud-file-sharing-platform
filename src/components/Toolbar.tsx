'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';

interface ToolbarButtonProps {
  editor: Editor;
  onClick: () => void;
  isActive: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // prevent editor blur
        onClick();
      }}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      className={[
        'flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none',
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-1.5 flex items-center gap-0.5 overflow-x-auto"
    >
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        label="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        label="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        label="Underline (Ctrl+U)"
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" aria-hidden="true" />

      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        label="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        label="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        label="Heading 3"
      >
        H3
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" aria-hidden="true" />

      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        label="Bullet list"
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        label="Numbered list"
      >
        1≡
      </ToolbarButton>
    </div>
  );
}
