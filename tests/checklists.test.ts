import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { PlainpageTaskList, setListCompletion } from "@/lib/checklists";
const schema = getSchema([StarterKit, PlainpageTaskList, TaskItem.configure({nested:true})]);
const task = (text:string, checked=false) => schema.nodes.taskItem.create({checked},schema.nodes.paragraph.create(null,schema.text(text)));
function fixture() {
 const first=schema.nodes.taskList.create({completedStyle:"plain"},[task("First"),task("Second",true)]);
 const other=schema.nodes.taskList.create(null,[task("Other")]);
 const doc=schema.nodes.doc.create(null,[first,other]);
 return EditorState.create({doc,selection:TextSelection.create(doc,3)});
}
describe("persistent checklists",()=>{
 it("defaults existing lists to strikethrough",()=>expect(schema.nodes.taskList.create().attrs.completedStyle).toBe("strike"));
 it("preserves plain completion style in saved JSON",()=>{
  const state=fixture();
  expect(schema.nodeFromJSON(state.doc.toJSON()).firstChild?.attrs.completedStyle).toBe("plain");
 });
 it("completes only the current list and preserves text and style",()=>{
  const state=fixture(),tr=state.tr;
  expect(setListCompletion(tr,true)).toBe(true);
  expect(tr.doc.firstChild?.child(0).attrs.checked).toBe(true);
  expect(tr.doc.firstChild?.child(1).attrs.checked).toBe(true);
  expect(tr.doc.child(1).firstChild?.attrs.checked).toBe(false);
  expect(tr.doc.textContent).toBe(state.doc.textContent);
  expect(tr.doc.firstChild?.attrs.completedStyle).toBe("plain");
 });
 it("reopens completed tasks",()=>{
  const tr=fixture().tr;setListCompletion(tr,false);
  expect(tr.doc.firstChild?.child(1).attrs.checked).toBe(false);
 });
 it("ignores selections outside a checklist",()=>{
  const doc=schema.nodes.doc.create(null,schema.nodes.paragraph.create(null,schema.text("Note")));
  const tr=EditorState.create({doc}).tr;
  expect(setListCompletion(tr,true)).toBe(false);
  expect(tr.docChanged).toBe(false);
 });
});
