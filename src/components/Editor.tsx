"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Toolbar } from "./Toolbar";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorProps {
  docId: string;
  initialContent: Record<string, unknown>;
  initialTitle?: string;
  role: "owner" | "editor" | "viewer";
  ownerName?: string;
  onTitleChange?: (title: string) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

const EXTENSIONS = [StarterKit.configure({ underline: false }), Underline];

function contentFromImport(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  // If the content has _html (from server import), convert it to Tiptap JSON
  if (raw._html && typeof raw._html === "string") {
    try {
      // Use the editor to parse HTML. We'll handle this with a temporary div approach.
      // The editor will handle this via setContent with the HTML string.
      return { _importHtml: raw._html };
    } catch {
      return { type: "doc", content: [{ type: "paragraph" }] };
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
  const isReadOnly = role === "viewer";
  const [headings, setHeadings] = useState<{ text: string; pos: number }[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const hasUnsaved = useRef(false);

  const updateSaveStatus = useCallback(
    (s: SaveStatus) => {
      setSaveStatus(s);
      onSaveStatusChange?.(s);
    },
    [onSaveStatusChange],
  );

  async function saveContent(content: Record<string, unknown>) {
    updateSaveStatus("saving");
    const delays = [1000, 3000, 8000];
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const res = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          updateSaveStatus("saved");
          hasUnsaved.current = false;
          retryCount.current = 0;
          return;
        }
      } catch {
        /* network error, retry */
      }
      if (attempt < 2) {
        updateSaveStatus("error");
        await new Promise((r) => setTimeout(r, delays[attempt]));
        updateSaveStatus("saving");
      }
    }
    updateSaveStatus("error");
  }

  const editor = useEditor({
    extensions: EXTENSIONS,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !isReadOnly,
    content: (() => {
      // Handle imported HTML
      const processed = contentFromImport(initialContent);
      if (processed._importHtml) return processed._importHtml as string;
      return initialContent as Record<string, unknown>;
    })(),
    editorProps: {
      attributes: {
        class: "tiptap-content",
        "aria-label": "Document content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-readonly": isReadOnly ? "true" : "false",
      },
    },
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;

      hasUnsaved.current = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveContent(editor.getJSON() as Record<string, unknown>);
      }, 800);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const updateOutline = () => {
      const items: { text: string; pos: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.attrs.level > 1)
          items.push({ text: node.textContent, pos });
      });
      setHeadings(items);
    };
    updateOutline();
    editor.on("update", updateOutline);
    return () => {
      editor.off("update", updateOutline);
    };
  }, [editor]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div>
      {!isReadOnly ? (
        <Toolbar editor={editor} />
      ) : (
        <div className="pp-view-only">
          View only — you can select and copy text.
        </div>
      )}
      <div className="pp-editor-layout">
        <aside className="pp-editor-outline" aria-label="Document outline">
          <h2>Outline</h2>
          {headings.length ? (
            headings.map((heading, index) => (
              <button
                type="button"
                key={`${heading.pos}-${index}`}
                onClick={() => {
                  editor
                    ?.chain()
                    .setTextSelection(heading.pos + 1)
                    .focus()
                    .scrollIntoView()
                    .run();
                }}
              >
                {heading.text || "Untitled heading"}
              </button>
            ))
          ) : (
            <p>Your document headings will appear here.</p>
          )}
        </aside>
        <div
          className="pp-editor-paper"
          onClick={() => editor?.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
      {saveStatus === "error" && (
        <div className="pp-save-error" role="alert">
          Save failed. Retrying automatically. Keep this page open until your
          changes are saved.
        </div>
      )}
    </div>
  );
}
