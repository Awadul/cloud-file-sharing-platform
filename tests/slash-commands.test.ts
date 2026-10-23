// @vitest-environment jsdom
import React, {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {Editor} from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {afterEach,beforeEach,describe,it,expect,vi} from "vitest";
import {SlashCommands} from "@/components/SlashCommands";
let editor:Editor,root:Root,container:HTMLDivElement;
beforeEach(async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 HTMLElement.prototype.scrollIntoView=vi.fn();
 window.scrollBy=vi.fn();
 const mount=document.createElement("div");document.body.append(mount);
 editor=new Editor({element:mount,extensions:[StarterKit],content:"<p></p>"});
 vi.spyOn(editor.view,"coordsAtPos").mockReturnValue({left:100,right:100,top:100,bottom:124});
 container=document.createElement("div");document.body.append(container);root=createRoot(container);
 await act(async()=>{root.render(React.createElement(SlashCommands,{editor}));editor.view.dom.focus();});
});
afterEach(async()=>{await act(async()=>root.unmount());editor.destroy();document.body.innerHTML="";vi.restoreAllMocks();});
async function type(text:string){await act(async()=>{editor.commands.insertContent(text);});}
async function key(key:string,isComposing=false){await act(async()=>{editor.view.dom.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true,isComposing}));});}
describe("slash keyboard interaction",()=>{
 it("filters typed commands and turns the paragraph into a heading",async()=>{
  await type("/heading 2");expect(container.querySelector('[role="listbox"]')?.hasAttribute("hidden")).toBe(false);
  expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
  await key("Enter");expect(editor.state.doc.firstChild?.type.name).toBe("heading");expect(editor.state.doc.firstChild?.attrs.level).toBe(2);expect(editor.state.doc.firstChild?.textContent).toBe("");
 });
 it("Escape leaves literal text intact",async()=>{
  await type("/heading");await key("Escape");expect(editor.getText()).toBe("/heading");expect(container.querySelector('[role="listbox"]')?.hasAttribute("hidden")).toBe(true);
 });
 it("arrow navigation updates the active option without moving focus",async()=>{
  await type("/");await key("ArrowDown");expect(container.querySelector('[aria-selected="true"] strong')?.textContent).toBe("Heading 1");expect(document.activeElement).toBe(editor.view.dom);
 });
 it("does not execute commands while an IME composition is active",async()=>{
  await type("/heading 2");await key("Enter",true);expect(editor.state.doc.firstChild?.type.name).toBe("paragraph");expect(editor.state.doc.firstChild?.textContent).toBe("/heading 2");
 });
});
