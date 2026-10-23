"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { PlainpageTaskList } from "@/lib/checklists";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { analyzeClarity } from "@/lib/clarity";
import Underline from "@tiptap/extension-underline";
import { FORMATTING_EXTENSIONS } from "@/lib/editor-formatting";
import { SlashCommands } from "./SlashCommands";
import { Toolbar } from "./Toolbar";
import {
  activeOutlinePosition,
  type OutlineHeading,
} from "@/lib/editor-outline";

type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

interface EditorProps {
  productTiers?: boolean;
  aiConfigured?: boolean;
  docId: string;
  onDirtyChange?: (dirty: boolean) => void;
  onSave?: (patch: Record<string, unknown>) => Promise<void>;
  initialContent: Record<string, unknown>;
  initialTitle?: string;
  role: "owner" | "editor" | "viewer";
  ownerName?: string;
  onTitleChange?: (title: string) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

const EXTENSIONS = [
  ...FORMATTING_EXTENSIONS,
  StarterKit.configure({ underline: false }),
  Underline,
  TableKit,
  PlainpageTaskList,
  TaskItem.configure({ nested: true }),
  Image.configure({ allowBase64: false }),
];

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
  productTiers,
  aiConfigured,
  onSave,
  onDirtyChange,
  initialContent,
  role,
  onSaveStatusChange,
}: EditorProps) {
  const isReadOnly = role === "viewer";
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const [activeHeading, setActiveHeading] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const conflictRef = useRef(false);
  const editSequence = useRef(0);
  const [clarity, setClarity] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const suggestionText = useRef("");
  const suggestionRange = useRef({ from: 0, to: 0 });
  const [suggestionMode, setSuggestionMode] = useState<"summary" | "rewrite">(
    "summary",
  );
  const hasUnsaved = useRef(false);
  const [draftDirty, setDraftDirty] = useState(false);

  const updateSaveStatus = useCallback(
    (s: SaveStatus) => {
      setSaveStatus(s);
      onSaveStatusChange?.(s);
    },
    [onSaveStatusChange],
  );

  async function saveContent(content: Record<string, unknown>) {
    if (conflictRef.current) return;
    const sequence = editSequence.current;
    updateSaveStatus("saving");
    try {
      if (onSave) await onSave({ content });
      else {
        const response = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (response.status === 409) throw new Error("CONFLICT");
        if (!response.ok) throw new Error("SAVE_FAILED");
      }
      if (!mounted.current) return;
      if (sequence === editSequence.current) {
        hasUnsaved.current = false;
        setDraftDirty(false);
        onDirtyChange?.(false);
        updateSaveStatus("saved");
      }
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof Error && error.message === "CONFLICT") {
        conflictRef.current = true;
        updateSaveStatus("conflict");
      } else updateSaveStatus("error");
    }
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

      onDirtyChange?.(true);
      editSequence.current++;
      hasUnsaved.current = true;
      setDraftDirty(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveContent(editor.getJSON() as Record<string, unknown>);
      }, 800);
    },
  });

  useEffect(() => {
    if (!editor) return;
    let currentHeadings: OutlineHeading[] = [];
    const updateActiveHeading = () => {
      setActiveHeading(
        activeOutlinePosition(currentHeadings, editor.state.selection.from),
      );
    };
    const updateOutline = () => {
      const items: OutlineHeading[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading" && node.attrs.level > 1)
          items.push({ text: node.textContent, pos });
      });
      currentHeadings = items;
      setHeadings(items);
      updateActiveHeading();
    };
    updateOutline();
    editor.on("update", updateOutline);
    editor.on("selectionUpdate", updateActiveHeading);
    return () => {
      editor.off("update", updateOutline);
      editor.off("selectionUpdate", updateActiveHeading);
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
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div>
      {!isReadOnly ? (
        <Toolbar
          editor={editor}
          docId={productTiers ? docId : undefined}
          onClarity={() => setClarity(!clarity)}
          clarityOpen={clarity}
        />
      ) : (
        <div className="pp-view-only">
          View only — you can select and copy text.
        </div>
      )}
      {(saveStatus === "conflict" || saveStatus === "error") && (
        <div className="pp-save-error" role="alert">
          <strong>
            {saveStatus === "conflict"
              ? "Someone changed this document. Your local edits are still here."
              : "Your changes are not saved. Keep this page open."}
          </strong>
          <p>Download your draft before opening the latest saved version.</p>
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify(editor?.getJSON(), null, 2)],
                { type: "application/json" },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "plainpage-unsaved-draft.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Download my draft
          </button>
          {saveStatus === "error" && (
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => {
                if (editor)
                  void saveContent(editor.getJSON() as Record<string, unknown>);
              }}
            >
              Retry save
            </button>
          )}
          <a
            className="btn btn-sm"
            href={`/docs/${docId}`}
            target="_blank"
            rel="noopener"
          >
            Open latest in another tab
          </a>
        </div>
      )}
      {clarity && editor && (
        <aside className="pp-product-panel" aria-label="Clarity">
          <h2>Clarity</h2>
          <p>
            Local checks update as you type. These are suggestions, not a
            quality score.
          </p>
          {(() => {
            const report = analyzeClarity(editor.getText());
            return (
              <p>
                {report.words} words · {report.longSentences.length} long
                sentences · {report.jargon.length} jargon terms
                {report.jargon.length ? `: ${report.jargon.join(", ")}` : ""}
              </p>
            );
          })()}
          <label>
            <input
              className="checkbox checkbox-sm"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />{" "}
            Allow this document text to be sent to OpenAI for this suggestion.
          </label>
          <p>
            {aiConfigured
              ? "AI actions count toward 20 attempts per day, including failed attempts."
              : "AI suggestions are not available yet. Local clarity checks work without them."}
          </p>
          {(["summary", "rewrite"] as const).map((action) => (
            <button
              className="btn btn-sm"
              key={action}
              disabled={!aiConfigured || !consent || aiBusy || isReadOnly}
              onClick={async () => {
                setAiBusy(true);
                setAiMessage("");
                const text =
                  action === "rewrite"
                    ? editor.state.doc.textBetween(
                        editor.state.selection.from,
                        editor.state.selection.to,
                        " ",
                      )
                    : editor.getText();
                suggestionText.current = JSON.stringify(editor.getJSON());
                suggestionRange.current = {
                  from: editor.state.selection.from,
                  to: editor.state.selection.to,
                };
                setSuggestionMode(action);
                if (!text.trim()) {
                  setAiMessage("Select a passage to rewrite first.");
                  setAiBusy(false);
                  return;
                }
                try {
                  const r = await fetch(`/api/documents/${docId}/clarity`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, text, consent: true }),
                  });
                  const d = await r.json();
                  if (!r.ok) throw new Error(d.error?.message);
                  setSuggestion(d.suggestion);
                  setAiMessage(
                    `${d.remaining} attempts left today. ${action === "rewrite" ? "Review the suggestion before accepting the rewrite." : "Review before inserting at the top."}`,
                  );
                } catch (e) {
                  setAiMessage(
                    e instanceof Error ? e.message : "Suggestion failed.",
                  );
                } finally {
                  setAiBusy(false);
                }
              }}
            >
              {action === "summary"
                ? "Suggest a summary"
                : "Rewrite selected text"}
            </button>
          ))}
          {suggestion && (
            <div>
              <h3>Suggested by AI</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{suggestion}</p>
              <button
                className="btn btn-sm"
                onClick={() => {
                  if (
                    JSON.stringify(editor.getJSON()) !== suggestionText.current
                  ) {
                    setAiMessage(
                      "The document changed. Generate a fresh suggestion before inserting.",
                    );
                    return;
                  }
                  if (suggestionMode === "rewrite")
                    editor
                      .chain()
                      .focus()
                      .insertContentAt(suggestionRange.current, {
                        type: "text",
                        text: suggestion,
                      })
                      .run();
                  else
                    editor
                      .chain()
                      .focus()
                      .insertContentAt(0, {
                        type: "paragraph",
                        content: [{ type: "text", text: suggestion }],
                      })
                      .run();
                  setSuggestion("");
                }}
              >
                {suggestionMode === "rewrite"
                  ? "Accept rewrite"
                  : "Insert at top"}
              </button>
              <button
                className="btn btn-sm"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(suggestion)
                    .catch(() =>
                      setAiMessage("Select and copy the suggestion manually."),
                    )
                }
              >
                Copy
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSuggestion("")}
              >
                Dismiss
              </button>
            </div>
          )}
          <p role="status">{aiMessage}</p>
        </aside>
      )}
      {!isReadOnly && productTiers && <SlashCommands editor={editor} />}
      <div className="pp-editor-layout">
        <aside className="pp-editor-outline" aria-label="Document outline">
          <h2>Outline</h2>
          {headings.length ? (
            headings.map((heading, index) => (
              <button
                type="button"
                key={`${heading.pos}-${index}`}
                aria-current={
                  activeHeading === heading.pos ? "location" : undefined
                }
                onClick={() => {
                  setActiveHeading(heading.pos);
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
      <footer className="pp-editor-document-status" aria-label="Document information">
        <span>{editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0} words</span>
        <span>{isReadOnly ? "View only" : "Editing"}</span>
        <span>{saveStatus === "saving" ? "Saving..." : saveStatus === "conflict" ? "Save conflict  -  local draft preserved" : saveStatus === "error" ? "Not saved  -  keep this page open" : draftDirty ? "Unsaved changes" : "All changes saved"}</span>
      </footer>
    </div>
  );
}
