"use client";
import React from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
export function Toolbar({
  editor,
  docId,
  onClarity,
}: {
  editor: Editor | null;
  docId?: string;
  onClarity?: () => void;
}) {
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
      {docId && (
        <>
          <button
            type="button"
            aria-label="Insert or edit link"
            onClick={() => {
              const href = window.prompt(
                "Link URL (https:// or http://). Leave empty to remove.",
                String(editor.getAttributes("link").href ?? ""),
              );
              if (href === null) return;
              if (!href) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              if (!/^https?:\/\//i.test(href)) {
                window.alert("Use an https:// or http:// link.");
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href })
                .run();
            }}
          >
            Link
          </button>
          <button
            type="button"
            aria-pressed={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </button>
          <button
            type="button"
            aria-pressed={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            Tasks
          </button>
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            Table
          </button>
          {editor.isActive("table") && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                Add row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                Add column
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                Remove table
              </button>
            </>
          )}
          <label className="btn btn-ghost pp-image-upload">
            Image
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append("file", file);
                try {
                  const r = await fetch(`/api/documents/${docId}/images`, {
                    method: "POST",
                    body: form,
                  });
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error?.message);
                  editor
                    .chain()
                    .focus()
                    .setImage({ src: d.src, alt: file.name })
                    .run();
                } catch (error) {
                  window.alert(
                    error instanceof Error ? error.message : "Upload failed.",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" onClick={onClarity}>
            Clarity
          </button>
        </>
      )}
    </div>
  );
}
