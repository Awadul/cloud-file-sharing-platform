"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
const commands = [
 {id:"paragraph",label:"Text",hint:"Plain paragraph",terms:"paragraph normal"},
 {id:"heading1",label:"Heading 1",hint:"Large heading",terms:"h1 title"},
 {id:"heading2",label:"Heading 2",hint:"Section heading",terms:"h2 subtitle"},
 {id:"heading3",label:"Heading 3",hint:"Small heading",terms:"h3"},
 {id:"bullet",label:"Bullet list",hint:"Unordered list",terms:"list ul"},
 {id:"number",label:"Numbered list",hint:"Ordered list",terms:"list ol"},
 {id:"task",label:"Checklist",hint:"Tasks with checkboxes",terms:"todo task"},
 {id:"quote",label:"Quote",hint:"Quoted text",terms:"blockquote"},
 {id:"code",label:"Code block",hint:"Monospace block",terms:"snippet"},
 {id:"divider",label:"Divider",hint:"Horizontal rule",terms:"line hr"},
 {id:"table",label:"Table",hint:"Three columns and rows",terms:"grid"},
];
type Match={from:number;to:number;query:string;left:number;top:number};
export function SlashCommands({editor}:{editor:Editor|null}) {
 const id=useId(),menuRef=useRef<HTMLDivElement>(null);
 const [match,setMatch]=useState<Match|null>(null),[active,setActive]=useState(0);
 const matchRef=useRef<Match|null>(null),activeRef=useRef(0),dismissed=useRef("");
 const items=commands.filter(c=>`${c.label} ${c.terms}`.toLowerCase().includes(match?.query.toLowerCase() ?? ""));
 useEffect(()=>{
  if(!editor) return;
  const dom=editor.view.dom;
  function close(){matchRef.current=null;setMatch(null);}
  function refresh(){
   if(!editor!.isEditable || !editor!.isFocused) {close();return;}
   const {empty,$from,from}=editor!.state.selection;
   if(!empty || $from.parent.type.name!=="paragraph") {close();return;}
   const before=$from.parent.textBetween(0,$from.parentOffset," "," ");
   const found=before.match(/^\/([a-z0-9 ]{0,32})$/i);
   if(!found || dismissed.current===`${from}:${before}`) {close();return;}
   const caret=editor!.view.coordsAtPos(from);
   const next={from:from-before.length,to:from,query:found[1],left:Math.max(8,Math.min(caret.left,window.innerWidth-264)),top:Math.min(caret.bottom+4,Math.max(8,window.innerHeight-316))};
   matchRef.current=next;activeRef.current=0;setMatch(next);setActive(0);
  }
  function execute(index:number){
   const current=matchRef.current;if(!current)return;
   const options=commands.filter(c=>`${c.label} ${c.terms}`.toLowerCase().includes(current.query.toLowerCase()));
   const command=options[index];if(!command)return;
   close();const chain=editor!.chain().focus().deleteRange({from:current.from,to:current.to});
   switch(command.id){
    case "heading1":chain.setHeading({level:1}).run();break;
    case "heading2":chain.setHeading({level:2}).run();break;
    case "heading3":chain.setHeading({level:3}).run();break;
    case "bullet":chain.toggleBulletList().run();break;
    case "number":chain.toggleOrderedList().run();break;
    case "task":chain.toggleTaskList().run();break;
    case "quote":chain.toggleBlockquote().run();break;
    case "code":chain.toggleCodeBlock().run();break;
    case "divider":chain.setHorizontalRule().run();break;
    case "table":chain.insertTable({rows:3,cols:3,withHeaderRow:true}).run();break;
    default:chain.setParagraph().run();
   }
  }
  function key(event:KeyboardEvent){
   const current=matchRef.current;if(!current||event.isComposing)return;
   const count=commands.filter(c=>`${c.label} ${c.terms}`.toLowerCase().includes(current.query.toLowerCase())).length;
   if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();dismissed.current=`${current.to}:/${current.query}`;close();}
   else if((event.key==="ArrowDown"||event.key==="ArrowUp")&&count){event.preventDefault();event.stopImmediatePropagation();activeRef.current=(activeRef.current+(event.key==="ArrowDown"?1:-1)+count)%count;setActive(activeRef.current);}
   else if(event.key==="Enter"&&count){event.preventDefault();event.stopImmediatePropagation();execute(activeRef.current);}
  }
  function click(event:MouseEvent){const target=event.target as HTMLElement;const button=target.closest<HTMLButtonElement>("button[data-command-index]");if(button)execute(Number(button.dataset.commandIndex));}
  function blur(){window.requestAnimationFrame(()=>{if(!editor!.isFocused)close();});}
  const menu=menuRef.current;
  dom.addEventListener("keydown",key,true);menu?.addEventListener("click",click);
  editor.on("update",refresh);editor.on("selectionUpdate",refresh);editor.on("blur",blur);
  return ()=>{dom.removeEventListener("keydown",key,true);menu?.removeEventListener("click",click);editor.off("update",refresh);editor.off("selectionUpdate",refresh);editor.off("blur",blur);};
 },[editor]);
 useEffect(()=>{
  if(!editor)return;const dom=editor.view.dom;
  if(match){dom.setAttribute("aria-controls",id);if(items.length)dom.setAttribute("aria-activedescendant",`${id}-${active}`);else dom.removeAttribute("aria-activedescendant");}
  else{dom.removeAttribute("aria-controls");dom.removeAttribute("aria-activedescendant");}
  menuRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest"});
  return ()=>{dom.removeAttribute("aria-controls");dom.removeAttribute("aria-activedescendant");};
 },[editor,match,active,id,items.length]);
 return <div ref={menuRef} id={id} role="listbox" aria-label="Insert block" hidden={!match} className="pp-slash-menu" style={{left:match?.left,top:match?.top}} onMouseDown={event=>event.preventDefault()}>
  <p>Insert block <span>↑ ↓ choose · Enter insert · Esc dismiss</span></p>
  {items.map((command,index)=><button type="button" role="option" tabIndex={-1} aria-selected={index===active} id={`${id}-${index}`} data-command-index={index} key={command.id}><strong>{command.label}</strong><span>{command.hint}</span></button>)}
  {!items.length&&<p role="status">No matching blocks. Keep typing or press Escape.</p>}
 </div>;
}
