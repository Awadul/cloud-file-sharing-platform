"use client";
import React from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
export function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const controls = [
    {
      label: "Bold (Ctrl+B)",
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
      icon: <Bold size={18} />,
    },
    {
      label: "Italic (Ctrl+I)",
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
      icon: <Italic size={18} />,
    },
    {
      label: "Underline (Ctrl+U)",
      active: editor.isActive("underline"),
      run: () => editor.chain().focus().toggleUnderline().run(),
      icon: <Underline size={18} />,
    },
  ];
  return (
    <div
      className="pp-editor-toolbar"
      role="toolbar"
      aria-label="Text formatting"
    >
      {controls.map((c) => (
        <button
          type="button"
          key={c.label}
          aria-label={c.label}
          aria-pressed={c.active}
          title={c.label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={c.run}
        >
          {c.icon}
        </button>
      ))}
      <span className="pp-toolbar-divider" aria-hidden="true" />
      {([1, 2, 3] as const).map((level) => (
        <button
          type="button"
          key={level}
          aria-label={`Heading ${level}`}
          aria-pressed={editor.isActive("heading", { level })}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </button>
      ))}
      <span className="pp-toolbar-divider" aria-hidden="true" />
      <button
        type="button"
        aria-label="Bullet list"
        aria-pressed={editor.isActive("bulletList")}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={20} />
      </button>
      <button
        type="button"
        aria-label="Numbered list"
        aria-pressed={editor.isActive("orderedList")}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={20} />
      </button>
    </div>
  );
}
