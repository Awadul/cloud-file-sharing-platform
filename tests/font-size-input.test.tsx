// @vitest-environment jsdom
import React,{act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {Editor} from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {FORMATTING_EXTENSIONS} from "@/lib/editor-formatting";
import {FontSizeInput} from "@/components/FontSizeInput";
let editor:Editor,root:Root,host:HTMLDivElement;
let input:HTMLInputElement;
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 HTMLElement.prototype.showPopover=vi.fn();HTMLElement.prototype.hidePopover=vi.fn();HTMLElement.prototype.scrollIntoView=vi.fn();
 editor=new Editor({element:document.createElement("div"),extensions:[StarterKit,...FORMATTING_EXTENSIONS],content:"<p>Selected words</p>"});editor.commands.setTextSelection({from:1,to:9});
 host=document.createElement("div");document.body.append(host);root=createRoot(host);
 await act(async()=>root.render(<FontSizeInput editor={editor}/>));input=host.querySelector("input")!;
});
afterEach(async()=>{await act(async()=>root.unmount());editor.destroy();host.remove();});
async function key(key:string){await act(async()=>input.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true})));}
async function type(value:string){await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,value);input.dispatchEvent(new Event("input",{bubbles:true}));});}
describe("font size input",()=>{
 it("uses editor options rather than the browser datalist",()=>{expect(input.hasAttribute("list")).toBe(false);expect(input.getAttribute("role")).toBe("combobox");expect(host.querySelectorAll('[role="option"]')).toHaveLength(14);});
 it("selects a preset with arrows and Enter",async()=>{await act(async()=>input.focus());await key("ArrowDown");expect(input.getAttribute("aria-activedescendant")).toBeTruthy();await key("Enter");expect(editor.getAttributes("textStyle").fontSize).toBe("10.67px");expect(editor.state.selection.from).toBe(1);expect(editor.state.selection.to).toBe(9);});
 it("applies a custom typed point size",async()=>{await act(async()=>input.focus());await type("15");await key("Enter");expect(editor.getAttributes("textStyle").fontSize).toBe("20px");});
 it("rejects invalid sizes and Escape cancels without formatting",async()=>{await act(async()=>input.focus());await type("100");await key("Enter");expect(host.querySelector('[role="alert"]')?.textContent).toContain("6 to 96");expect(editor.getAttributes("textStyle").fontSize).toBeFalsy();await key("Escape");expect(host.querySelector('[role="alert"]')).toBeNull();expect(input.value).toBe("");});
});
