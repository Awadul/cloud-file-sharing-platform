// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { FORMATTING_EXTENSIONS } from "@/lib/editor-formatting";
let editor: Editor;
afterEach(() => editor?.destroy());
function open() {
 editor=new Editor({element:document.createElement("div"),extensions:[StarterKit,...FORMATTING_EXTENSIONS],content:"<p>First text</p><h2>Second heading</h2><p>Third</p>"});
 return editor;
}
describe("real editor formatting commands",()=>{
 it("aligns selected paragraphs and headings without changing another paragraph",()=>{
  const e=open();e.commands.setTextSelection({from:1,to:24});
  expect(e.commands.setTextAlign("center")).toBe(true);
  expect(e.state.doc.child(0).attrs.textAlign).toBe("center");
  expect(e.state.doc.child(1).attrs.textAlign).toBe("center");
  expect(e.state.doc.child(2).attrs.textAlign).toBe("left");
 });
 it("supports left, right and justified alignment with undo",()=>{
  const e=open();e.commands.setTextSelection(1);
  for(const value of ["right","justify","left"]) {expect(e.commands.setTextAlign(value)).toBe(true);expect(e.state.doc.child(0).attrs.textAlign).toBe(value);}
  e.commands.undo();expect(e.state.doc.child(0).attrs.textAlign).toBe("left");
 });
 it("changes only the selected text typography and renders the formatting",()=>{
  const e=open();e.commands.setTextSelection({from:1,to:6});
  e.chain().setFontFamily("Georgia, serif").setFontSize("24px").setColor("#204bdf").setHighlight({color:"#fff0a3"}).run();
  expect(e.state.doc.firstChild?.firstChild?.marks.find(mark=>mark.type.name==="textStyle")?.attrs.fontSize).toBe("24px");
  expect(e.state.doc.firstChild?.lastChild?.marks).toHaveLength(0);
  const span=e.view.dom.querySelector("span");expect(span?.style.fontSize).toBe("24px");
  expect(e.view.dom.querySelector("mark")).not.toBeNull();
 });
 it("restores visible formatting from saved JSON",()=>{
  const e=open();e.commands.setTextSelection({from:1,to:6});
  e.chain().setTextAlign("right").setLineHeight("2").setFontSize("20px").run();
  const json=e.getJSON();e.commands.setContent(json);
  const paragraph=e.view.dom.querySelector("p");expect(paragraph?.style.textAlign).toBe("right");expect(paragraph?.style.lineHeight).toBe("2");expect(paragraph?.querySelector("span")?.style.fontSize).toBe("20px");
 });
 it("clears formatting without deleting text",()=>{
  const e=open();e.commands.setTextSelection({from:1,to:6});
  e.chain().setTextAlign("right").setLineHeight("2").setFontSize("24px").setHighlight({color:"#fff0a3"}).run();
  const text=e.getText();e.chain().unsetAllMarks().resetAttributes("paragraph",["textAlign","lineHeight"]).run();
  expect(e.getText()).toBe(text);expect(e.state.doc.firstChild?.attrs.textAlign).toBe("left");expect(e.state.doc.firstChild?.firstChild?.marks).toHaveLength(0);
 });
});
