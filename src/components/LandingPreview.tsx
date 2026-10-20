"use client";
import { useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./Toolbar";
import { readLandingDraft, saveLandingDraft } from "@/lib/landing-draft";

export default function LandingPreview() {
  const [modified, setModified] = useState(false);
  const [status, setStatus] = useState("Try editing · preview only");
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: "<h1>Product launch brief</h1><p>A shared plan. Clear decisions. A next step for everyone.</p><h2>What we’re working toward</h2><p>Help new customers create their first document and share it with a teammate.</p><h2>Decisions and next steps</h2><ol><li><p>Agree on the launch message and owner.</p></li><li><p>Import the existing research notes.</p></li><li><p>Invite reviewers before the final handoff.</p></li></ol>",
    onCreate: ({ editor }) => {
      try {
        const draft = readLandingDraft(window.localStorage);
        if (draft) {
          editor.commands.setContent(draft, { emitUpdate: false });
          setModified(true);
          setStatus("Your preview draft · restored on this device");
        }
      } catch { setStatus("Preview only · device storage unavailable"); }
    },
    onUpdate: ({ editor }) => {
      setModified(true);
      try {
        setStatus(saveLandingDraft(window.localStorage, editor.getJSON()) ? "Preview saved on this device" : "Preview only · changes could not be saved on this device");
      } catch { setStatus("Preview only · device storage unavailable"); }
    },
    editorProps: { attributes: { class: "pp-landing-writing", role: "textbox", "aria-label": "Try editing this example document", "aria-multiline": "true", spellcheck: "true" } },
  });
  return (
    <div className="pp-landing-example">
      <div className="pp-landing-editor">
        <div className="pp-landing-editor-heading"><span>Make this brief your own</span><span role="status">{status}</span></div>
        <div className="pp-landing-tools"><Toolbar editor={editor} /></div>
        <div className="pp-landing-paper"><EditorContent editor={editor} />{!editor && <div className="pp-landing-preview-loading" aria-busy="true"><h2>Product launch brief</h2><p>Opening the example editor…</p></div>}</div>
      </div>
      {modified && <div className="pp-landing-next"><p>Ready for your own work?<span>Create a document in your workspace. This preview stays on this device.</span></p><Link href="/login" className="btn btn-primary pp-landing-button">Create your first document</Link></div>}
    </div>
  );
}
