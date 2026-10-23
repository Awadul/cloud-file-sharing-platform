"use client";
import React, { useRef, useId, useEffect, useState, useCallback } from "react";
import { FontSizeInput } from "./FontSizeInput";
import { popoverPlacement } from "@/lib/popover-placement";
import { setListCompletion } from "@/lib/checklists";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2, ChevronDown, Link2, Code2, ListTodo, Table2, ImagePlus, ScanText, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Strikethrough, Quote, Minus, RemoveFormatting, Highlighter, Baseline, Keyboard, Plus } from "lucide-react";
function ToolbarPopover({ label, children, name, chevron = true, variant = "actions" }: { label: React.ReactNode; children: React.ReactNode; name?: string; chevron?: boolean; variant?: "actions" | "palette" | "alignment" }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) return;
      panel.current?.hidePopover();
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
  }, []);
  return <>
    <button ref={trigger} className="btn btn-ghost" type="button" aria-label={name} title={name} aria-expanded={open} aria-controls={id} popoverTarget={id} onClick={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (panel.current) {
        panel.current.style.left = `${rect.left}px`;
        panel.current.style.top = `${rect.bottom + 4}px`;
      }
    }}>{label}{chevron && <ChevronDown size={12} aria-hidden="true" />}</button>
    <div ref={panel} id={id} popover="auto" onToggle={(event) => {
      setOpen(event.newState === "open");
      if (event.newState !== "open" || !trigger.current || !panel.current) return;
      const placement = popoverPlacement(trigger.current.getBoundingClientRect(), panel.current.getBoundingClientRect(), {width:window.innerWidth,height:window.innerHeight});
      panel.current.style.left = `${placement.left}px`;
      panel.current.style.top = `${placement.top}px`;
    }} className={`pp-format-menu pp-toolbar-popover pp-toolbar-popover--${variant}`} aria-label={name ?? "Document tools"} onClick={(event) => {
      if ((event.target as HTMLElement).closest("button") && !(event.target as HTMLElement).closest("[data-keep-open]")) panel.current?.hidePopover();
    }}>{children}</div>
  </>;
}


export function Toolbar({
  editor,
  docId,
  onClarity,
  clarityOpen,
}: {
  editor: Editor | null;
  docId?: string;
  onClarity?: () => void;
  clarityOpen?: boolean;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkDialog = useRef<HTMLDialogElement>(null);
  const linkSelection = useRef({from:0,to:0});
  const [linkUrl,setLinkUrl]=useState("");
  const [linkError,setLinkError]=useState("");
  const openLink = useCallback(() => {
    if(!editor) return;
    linkSelection.current={from:editor.state.selection.from,to:editor.state.selection.to};
    setLinkUrl(String(editor.getAttributes("link").href ?? ""));setLinkError("");linkDialog.current?.showModal();
  },[editor]);
  useEffect(()=>{
    if(!editor) return;
    const key=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();event.stopPropagation();openLink();}};
    const dom=editor.view.dom;dom.addEventListener("keydown",key,true);return ()=>dom.removeEventListener("keydown",key,true);
  },[editor,openLink]);
  if (!editor) return null;
  const heading = [1, 2, 3].find((level) => editor!.isActive("heading", { level }));
  const alignment = ["left", "center", "right", "justify"].find((value) => editor.isActive({ textAlign: value }));
  const AlignmentIcon = alignment === "center" ? AlignCenter : alignment === "right" ? AlignRight : alignment === "justify" ? AlignJustify : AlignLeft;
  const colorValue = (value: unknown, fallback: string) => {
    const text = String(value ?? "");
    if (/^#[0-9a-f]{6}$/i.test(text)) return text;
    const rgb = text.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
    return rgb ? "#" + rgb.slice(1).map((channel) => Math.min(255, Number(channel)).toString(16).padStart(2, "0")).join("") : fallback;
  };
  const controls = [
    {
      label: "Bold (Ctrl+B)",
      active: editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
      icon: <Bold size={16} />,
    },
    {
      label: "Italic (Ctrl+I)",
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
      icon: <Italic size={16} />,
    },
    {
      label: "Underline (Ctrl+U)",
      active: editor.isActive("underline"),
      run: () => editor.chain().focus().toggleUnderline().run(),
      icon: <Underline size={16} />,
    },
  ];
  return (
    <div
      ref={toolbarRef}
      className="pp-editor-toolbar pp-editor-workbench"
      role="toolbar"
      aria-label="Text formatting"
    >
      <button className="btn btn-ghost" type="button" aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></button>
      <button className="btn btn-ghost" type="button" aria-label="Redo (Ctrl+Shift+Z)" title="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></button>
      <span className="pp-toolbar-divider" aria-hidden="true" />
      <select className="select pp-paragraph-select" aria-label="Paragraph style" value={heading ?? 0} onChange={(event) => {
        const level = Number(event.target.value);
        if (level === 0) editor.chain().focus().setParagraph().run();
        else editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run();
      }}>
        <option value={0}>Normal text</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
      </select>
      <span className="pp-toolbar-divider" aria-hidden="true" />
          <select aria-label="Font family" title="Font family" className="select select-xs pp-font-family-select" style={{ flex: "0 0 88px", width: 88, minWidth: 0, maxWidth: 88, height: 28, minHeight: 28, fontSize: 12, padding: "2px 20px 2px 6px" }} value={editor.getAttributes("textStyle").fontFamily ?? ""} onChange={(e) => { if(e.target.value) editor.chain().focus().setFontFamily(e.target.value).run(); else editor.chain().focus().unsetFontFamily().run(); }}>
            <option value="">Geist</option><option value="Arial, sans-serif">Arial</option><option value="Georgia, serif">Georgia</option><option value="'Courier New', monospace">Courier New</option>
          </select>
      <FontSizeInput editor={editor} />
      <span className="pp-toolbar-divider" aria-hidden="true" />
      {controls.map((c) => (
        <button
          type="button"
          className="btn btn-ghost"
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
      <button
        type="button"
        aria-label="Bullet list"
        aria-pressed={editor.isActive("bulletList")}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        aria-label="Numbered list"
        aria-pressed={editor.isActive("orderedList")}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </button>
      <ToolbarPopover variant="alignment" name={`Text alignment: ${alignment ?? "mixed"}`} label={<AlignmentIcon size={16} aria-hidden="true" />}>
        <p className="pp-menu-caption">Paragraph alignment</p>
        {([ ["left", "Left", AlignLeft], ["center", "Centre", AlignCenter], ["right", "Right", AlignRight], ["justify", "Justify", AlignJustify] ] as const).map(([value,label,Icon]) => <button key={value} type="button" aria-pressed={editor.isActive({textAlign:value})} onClick={() => editor.chain().focus().setTextAlign(value).run()}><Icon size={16} />{label}</button>)}
      </ToolbarPopover>
      <ToolbarPopover name="More text formatting" label={<Type size={16} aria-hidden="true" />}>
        <div className="pp-type-properties">
          <label>Spacing<select className="select" value={editor.getAttributes(editor.isActive("heading") ? "heading" : "paragraph").lineHeight ?? ""} onChange={(e) => { if(e.target.value) editor.chain().focus().setLineHeight(e.target.value).run(); else editor.chain().focus().unsetLineHeight().run(); }}>
            <option value="">Default</option>{[1,1.15,1.5,1.75,2].map(height => <option key={height} value={height}>{height}</option>)}
          </select></label>
        </div>
        <button type="button" aria-pressed={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} />Strikethrough</button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().resetAttributes("paragraph", ["textAlign","lineHeight"]).resetAttributes("heading", ["textAlign","lineHeight"]).run()}><RemoveFormatting size={16} />Clear text formatting</button>
      </ToolbarPopover>
      {([ ["Text color", Baseline, false], ["Highlight", Highlighter, true] ] as const).map(([name, Icon, highlight]) => <ToolbarPopover key={name} variant="palette" name={name} label={<Icon size={16} aria-hidden="true" />}>
        <button type="button" onClick={() => highlight ? editor.chain().focus().unsetHighlight().run() : editor.chain().focus().unsetColor().run()}>{highlight ? "No highlight" : "Default text color"}</button>
        <div className="pp-color-palette" role="group" aria-label={`${name} palette`}>
          {["#182236","#536176","#ffffff","#9ca3af","#d1d5db","#f3f4f6","#dc2626","#ea580c","#ca8a04","#16a34a","#0891b2","#2563eb","#7c3aed","#db2777","#fecaca","#fed7aa","#fef08a","#bbf7d0","#a5f3fc","#bfdbfe","#ddd6fe","#fbcfe8","#7f1d1d","#7c2d12","#713f12","#14532d","#164e63","#1e3a8a","#4c1d95","#831843"].map(color => <button type="button" key={color} className="pp-color-swatch" style={{backgroundColor:color}} aria-label={`${name} ${color}`} title={color} aria-pressed={colorValue(editor.getAttributes(highlight ? "highlight" : "textStyle").color, "") === color} onClick={() => highlight ? editor.chain().focus().setHighlight({color}).run() : editor.chain().focus().setColor(color).run()} />)}
        </div>
        <label className="pp-custom-color">Custom color<input type="color" aria-label={`Custom ${name.toLowerCase()}`} value={colorValue(editor.getAttributes(highlight ? "highlight" : "textStyle").color, highlight ? "#fff0a3" : "#182236")} onChange={(e) => highlight ? editor.chain().focus().setHighlight({color:e.target.value}).run() : editor.chain().focus().setColor(e.target.value).run()} /></label>
      </ToolbarPopover>)}
      {docId && <>
        <button className="btn btn-ghost" type="button" aria-label="Toggle checklist" title="Checklist" aria-pressed={editor.isActive("taskList")} onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo size={16} /></button>
        <ToolbarPopover name="Checklist options" label={null}>
          <p className="pp-menu-caption">Completed task style</p>
          {([ ["strike", "With strikethrough"], ["plain", "Without strikethrough"] ] as const).map(([style, label]) => <button type="button" key={style} aria-pressed={editor.isActive("taskList") && editor.getAttributes("taskList").completedStyle === style} onClick={() => {
            const chain = editor.chain().focus();
            if (!editor.isActive("taskList")) chain.toggleTaskList();
            chain.updateAttributes("taskList", { completedStyle: style }).run();
          }}><ListTodo size={16} />{label}</button>)}
          {editor.isActive("taskList") && <>
            <hr />
            <button type="button" disabled={!editor.can().sinkListItem("taskItem")} onClick={() => editor.chain().focus().sinkListItem("taskItem").run()}>Indent task <span className="pp-menu-shortcut">Tab</span></button>
            <button type="button" disabled={!editor.can().liftListItem("taskItem")} onClick={() => editor.chain().focus().liftListItem("taskItem").run()}>Outdent task <span className="pp-menu-shortcut">Shift+Tab</span></button>
            <button type="button" onClick={() => editor.chain().focus().updateAttributes("taskItem", { checked: !editor.getAttributes("taskItem").checked }).run()}>{editor.getAttributes("taskItem").checked ? "Mark task incomplete" : "Mark task complete"}</button>
            <hr />
            <button type="button" onClick={() => editor.chain().focus().command(({ tr }) => setListCompletion(tr, true)).run()}>Complete all in this list</button>
            <button type="button" onClick={() => editor.chain().focus().command(({ tr }) => setListCompletion(tr, false)).run()}>Reopen all in this list</button>
            <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()}>Remove checklist formatting</button>
          </>}
          <p className="pp-menu-caption">Enter adds a task. Enter on an empty task exits.</p>
        </ToolbarPopover>
      </>}
      {docId && (
        <>
          <span className="pp-toolbar-divider" aria-hidden="true" />
          <ToolbarPopover name="Insert block" label={<Plus size={16} aria-hidden="true" />}>
          <button type="button" aria-pressed={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} />Quote block</button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} />Divider</button>
          <button
            type="button"
            aria-label="Insert or edit link"
            onClick={openLink}
          >
            <Link2 size={16} /> Link
          </button>
          <button
            type="button"
            aria-pressed={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 size={16} /> Code block
          </button>
          <button
            type="button"
            aria-pressed={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListTodo size={16} /> Task list
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
            <Table2 size={16} /> Table
          </button>
          <label className="btn btn-ghost pp-image-upload">
            <ImagePlus size={16} /> Image
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
          </ToolbarPopover>
          {editor.isActive("table") && <ToolbarPopover name="Table options" label={<Table2 size={16} aria-hidden="true" />}>
            <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()}>Insert row above</button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>Insert row below</button>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>Insert column</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>Toggle header row</button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()}>Remove table</button>
          </ToolbarPopover>}
          {onClarity && <button className="btn btn-ghost pp-clarity-trigger" type="button" aria-label="Clarity" title="Clarity" aria-pressed={clarityOpen} onClick={onClarity}><ScanText size={16} aria-hidden="true" /></button>}
        </>
      )}
      <ToolbarPopover name="Keyboard and typing help" chevron={false} label={<Keyboard size={16} aria-hidden="true" />}>
        <p className="pp-menu-caption">Typing shortcuts</p>
        <div className="pp-typing-help">
          <p><kbd>/</kbd> at the start of a paragraph opens block commands.</p>
          <p><kbd>Ctrl/Cmd + K</kbd> edits a link.</p>
          <p><kbd>Ctrl/Cmd + B / I / U</kbd> formats selected text.</p>
          <p>Type <kbd>#</kbd>, <kbd>##</kbd> or <kbd>###</kbd> then Space for headings. Type <kbd>-</kbd> then Space for a list.</p>
          <p>Use Tab / Shift+Tab inside a checklist to indent or outdent.</p>
        </div>
      </ToolbarPopover>
      <dialog ref={linkDialog} className="pp-link-dialog" aria-labelledby="pp-link-title" onClose={()=>editor.commands.focus()}>
        <form onSubmit={event=>{
          event.preventDefault();const href=linkUrl.trim();
          if(href && !/^https?:\/\//i.test(href) && !/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) {setLinkError("Use an https://, http:// or mailto: link.");return;}
          const chain=editor.chain().setTextSelection(linkSelection.current).extendMarkRange("link");
          if(href) chain.setLink({href}).run();else chain.unsetLink().run();
          linkDialog.current?.close();
        }}>
          <h2 id="pp-link-title">Edit link</h2>
          <label htmlFor="pp-link-url">Link address</label>
          <input id="pp-link-url" className="input" autoFocus value={linkUrl} onChange={event=>setLinkUrl(event.target.value)} placeholder="https://example.com" aria-invalid={!!linkError} aria-describedby={linkError ? "pp-link-error" : undefined} />
          {linkError && <p id="pp-link-error" role="alert">{linkError}</p>}
          <div><button className="btn btn-ghost" type="button" onClick={()=>linkDialog.current?.close()}>Cancel</button><button className="btn btn-primary" type="submit">{linkUrl.trim() ? "Apply link" : "Remove link"}</button></div>
        </form>
      </dialog>
    </div>
  );
}
