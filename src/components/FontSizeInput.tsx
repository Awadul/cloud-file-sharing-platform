"use client";
import {useEffect,useId,useRef,useState} from "react";
import type {Editor} from "@tiptap/react";
import {Minus,Plus} from "lucide-react";
import {popoverPlacement} from "@/lib/popover-placement";
const sizes=[8,9,10,11,12,14,16,18,24,36,48,60,72,96];
export function FontSizeInput({editor}:{editor:Editor}) {
 const id=useId(),errorId=useId();
 const input=useRef<HTMLInputElement>(null),panel=useRef<HTMLDivElement>(null);
 const skipBlur=useRef(false);
 const current=editor.getAttributes("textStyle").fontSize;
 const points=current ? String(Math.round(parseFloat(current)*75)/100) : "";
 const [draft,setDraft]=useState<string|null>(null),[error,setError]=useState("");
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
 function close(){panel.current?.hidePopover();setOpen(false);setActive(-1);}
 function show(){
  if(!panel.current || !input.current) return;
  panel.current.showPopover();
  const position=popoverPlacement(input.current.getBoundingClientRect(),panel.current.getBoundingClientRect(),{width:window.innerWidth,height:window.innerHeight});
  panel.current.style.left=`${position.left}px`;panel.current.style.top=`${position.top}px`;
  setOpen(true);
 }
 function apply(value:string,focus=true){
  const pt=Number(value);
  if(value.trim() && (!Number.isFinite(pt)||pt<6||pt>96)){setError("Enter a size from 6 to 96 pt.");return;}
  skipBlur.current=focus;
  close();setDraft(null);setError("");
  const chain=editor.chain();
  if(focus) chain.focus();
  if(value.trim()) chain.setFontSize(`${Math.round(pt*4/3*100)/100}px`).run();
  else chain.unsetFontSize().run();
 }
 useEffect(()=>{
  const menu=panel.current;
  const dismiss=(event:Event)=>{if(event.target instanceof Node && menu?.contains(event.target))return;menu?.hidePopover();};
  window.addEventListener("resize",dismiss);window.addEventListener("scroll",dismiss,true);
  return ()=>{window.removeEventListener("resize",dismiss);window.removeEventListener("scroll",dismiss,true);};
 },[]);
 useEffect(()=>{if(active>=0)panel.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({block:"nearest"});},[active]);
 return <div className="pp-font-size-field" style={{position:"relative",flex:"0 0 80px",width:80,minWidth:80,maxWidth:80}}>
  <div className="pp-font-size-controls" style={{display:"grid",gridTemplateColumns:"22px 32px 22px",gap:2,alignItems:"center"}}>
   <button type="button" style={{width:22,minWidth:22,maxWidth:22,height:28,minHeight:28,padding:0}} aria-label="Decrease font size" onMouseDown={e=>e.preventDefault()} onClick={()=>apply(String(Math.max(6,(Number(draft??points)||12)-1)))}><Minus size={14} aria-hidden="true"/></button>
   <input ref={input} className="input input-xs" style={{boxSizing:"border-box",width:32,minWidth:0,maxWidth:32,height:24,minHeight:24,padding:"1px 2px",fontSize:12,lineHeight:"20px",textAlign:"center"}} role="combobox" aria-label="Font size in points" aria-autocomplete="none" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-activedescendant={open && active>=0 ? `${id}-${active}`:undefined} aria-invalid={!!error} aria-describedby={error?errorId:undefined} inputMode="decimal" autoComplete="off" placeholder="Size" title="Font size (pt)" value={draft??points}
    onFocus={e=>{skipBlur.current=false;e.currentTarget.select();show();}} onClick={show}
    onChange={e=>{setDraft(e.target.value);setActive(-1);setError("");}}
    onBlur={()=>{close();if(skipBlur.current){skipBlur.current=false;return;}if(draft!==null)apply(draft,false);}}
    onKeyDown={e=>{
     if(e.nativeEvent.isComposing)return;
     if(e.key==="ArrowDown"||e.key==="ArrowUp"){
      e.preventDefault();if(!open)show();
      const start=active<0 ? sizes.indexOf(Number(draft??points)):active;
      setActive(e.key==="ArrowDown" ? Math.min(sizes.length-1,start+1):Math.max(0,start<0?sizes.length-1:start-1));
     }
     if(e.key==="Enter"){e.preventDefault();apply(open&&active>=0?String(sizes[active]):draft??points);}
     if(e.key==="Escape"){e.preventDefault();e.stopPropagation();skipBlur.current=true;close();setDraft(null);setError("");editor.commands.focus();}
    }}/>
   <button type="button" style={{width:22,minWidth:22,maxWidth:22,height:28,minHeight:28,padding:0}} aria-label="Increase font size" onMouseDown={e=>e.preventDefault()} onClick={()=>apply(String(Math.min(96,(Number(draft??points)||12)+1)))}><Plus size={14} aria-hidden="true"/></button>
  </div>
  <div ref={panel} id={id} className="pp-font-size-menu" style={{boxSizing:"border-box",position:"fixed",inset:"auto",margin:0,width:56,minWidth:56,maxWidth:56,height:"auto",maxHeight:"min(200px, calc(100dvh - 16px))",overflowY:"auto",scrollbarWidth:"none",overscrollBehavior:"contain",padding:4,border:"1px solid var(--pp-line, #d5ddea)",borderRadius:4,background:"var(--color-base-100, #fff)",color:"var(--pp-ink, #182236)",boxShadow:"0 3px 10px #1822361f"}} popover="auto" role="listbox" aria-label="Font sizes in points" onToggle={e=>{setOpen(e.newState==="open");if(e.newState!=="open")setActive(-1);}}>
   {sizes.map((size,index)=><button type="button" style={{boxSizing:"border-box",display:"block",width:"100%",height:24,minHeight:24,maxHeight:24,padding:"2px 4px",fontSize:12,lineHeight:"20px",textAlign:"center",flexShrink:0}} role="option" tabIndex={-1} id={`${id}-${index}`} data-index={index} data-active={active===index} aria-selected={Number(points)===size} key={size} onMouseDown={e=>e.preventDefault()} onClick={()=>apply(String(size))}>{size}</button>)}
  </div>
  {error && <span id={errorId} role="alert">{error}</span>}
 </div>;
}
