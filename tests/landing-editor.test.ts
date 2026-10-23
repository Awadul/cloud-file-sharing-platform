// @vitest-environment jsdom
import {afterEach,describe,it,expect} from "vitest";
import {Editor} from "@tiptap/core";
import {LANDING_EDITOR_EXTENSIONS} from "@/lib/landing-editor";
let editor:Editor;
afterEach(()=>editor?.destroy());
function open(){editor=new Editor({element:document.createElement("div"),extensions:LANDING_EDITOR_EXTENSIONS,content:"<p>Preview text</p>"});editor.commands.setTextSelection({from:1,to:8});return editor;}
describe("landing preview toolbar compatibility",()=>{
 it("supports font size changes and reset without a missing command",()=>{
  const e=open();expect(e.chain().setFontSize("20px").run()).toBe(true);expect(e.getAttributes("textStyle").fontSize).toBe("20px");
  expect(e.chain().unsetFontSize().run()).toBe(true);expect(e.getAttributes("textStyle").fontSize).toBeFalsy();
 });
 it("supports the other shared text formatting controls",()=>{
  const e=open();e.chain().setFontFamily("Georgia, serif").setColor("#2563eb").setHighlight({color:"#fef08a"}).setTextAlign("center").setLineHeight("1.5").toggleUnderline().run();
  expect(e.getAttributes("textStyle").fontFamily).toBe("Georgia, serif");expect(e.getAttributes("textStyle").color).toBe("#2563eb");expect(e.isActive("highlight")).toBe(true);expect(e.state.doc.firstChild?.attrs.textAlign).toBe("center");expect(e.state.doc.firstChild?.attrs.lineHeight).toBe("1.5");expect(e.isActive("underline")).toBe(true);
 });
 it("retains formatting when a saved preview draft is restored",()=>{
  const e=open();e.chain().setFontSize("24px").setColor("#2563eb").run();const draft=e.getJSON();e.commands.setContent(draft);expect(e.getJSON()).toEqual(draft);
 });
});
