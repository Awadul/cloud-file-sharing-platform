"use client";
import Link from "next/link";
import { useSyncExternalStore, useEffect, useRef } from "react";
import { Home, Files, Users, MessageSquare, Trash2, UserRound, Menu, X, LogOut, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PlainpageLogo from "./PlainpageLogo";
const navigationEvent="plainpage-navigation";
function subscribeNavigation(callback:()=>void) { window.addEventListener(navigationEvent,callback); window.addEventListener("storage",callback); return ()=>{window.removeEventListener(navigationEvent,callback);window.removeEventListener("storage",callback);}; }
function readCollapsed(){try{return localStorage.getItem("plainpage.navigation.collapsed")==="true";}catch{return false;}}
export function useWorkspaceNavigation(){
 const collapsed=useSyncExternalStore(subscribeNavigation,readCollapsed,()=>false);
 function setCollapsed(value:boolean){try{localStorage.setItem("plainpage.navigation.collapsed",String(value));window.dispatchEvent(new Event(navigationEvent));}catch{/* Storage may be unavailable in a private browser session. */}}
 return [collapsed,setCollapsed] as const;
}
export interface WorkspacePerson { name:string; email:string; productTiers?:boolean }
export function WorkspaceSidebar({user,active,drawer,collapsed,onClose,onToggle,onLogout,onAccount}:{user:WorkspacePerson|null;active:string;drawer:boolean;collapsed:boolean;onClose:()=>void;onToggle:()=>void;onLogout:()=>void;onAccount?:()=>void}) {
 const sidebar=useRef<HTMLElement>(null);
 const closeHandler=useRef(onClose);
 useEffect(()=>{closeHandler.current=onClose;},[onClose]);
 useEffect(()=>{
  const media=window.matchMedia("(max-width:900px)");
  const sidebarElement=sidebar.current;
  let dispose=()=>{};
  function sync(){
   dispose();
   const el=sidebar.current; if(!el) return;
   el.inert=media.matches && !drawer;
   if(!media.matches || !drawer) return;
   const previous=document.activeElement as HTMLElement|null;
   const main=el.parentElement?.querySelector<HTMLElement>(".pp-app-main");
   const oldOverflow=document.body.style.overflow;
   document.body.style.overflow="hidden";
   if(main) main.inert=true;
   el.querySelector<HTMLButtonElement>(".pp-mobile-close")?.focus();
   function keydown(event:KeyboardEvent){
    if(event.key==="Escape"){event.preventDefault();closeHandler.current();return;}
    if(event.key!=="Tab" || !el) return;
    const controls=Array.from(el.querySelectorAll<HTMLElement>('a[href],button,summary')).filter(node=>!node.hasAttribute("disabled") && node.getClientRects().length>0);
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
   }
   document.addEventListener("keydown",keydown);
   dispose=()=>{document.removeEventListener("keydown",keydown);document.body.style.overflow=oldOverflow;if(main) main.inert=false;previous?.focus();dispose=()=>{};};
  }
  sync();media.addEventListener("change",sync);
  return ()=>{dispose();media.removeEventListener("change",sync);if(sidebarElement) sidebarElement.inert=false;};
 },[drawer]);
 const links: [LucideIcon,string,string][] = [[Home,"Home","/"],[Files,"Documents","/documents"],[Users,"Shared","/shared"],...(user?.productTiers ? [[MessageSquare,"Reviews","/reviews"],[Trash2,"Trash","/trash"]] as [LucideIcon,string,string][] : []),[UserRound,"Account and data","/account"]];
 return <>
  {drawer && <button className="pp-drawer-backdrop" aria-label="Close navigation" onClick={onClose}/>}
  <aside ref={sidebar} id="workspace-navigation" aria-label="Workspace navigation" className={`pp-sidebar ${drawer ? "pp-sidebar-open" : ""}`}>
   <div><div className="pp-sidebar-brand">
    <button className="btn btn-ghost pp-navigation-toggle" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed} aria-controls="workspace-navigation" onClick={onToggle}><Menu size={18}/></button>
    <Link href="/" aria-label="Plainpage home"><PlainpageLogo theme="light" size="sm"/></Link>
    <button className="btn btn-ghost pp-mobile-close" aria-label="Close navigation" onClick={onClose}><X size={18}/></button>
   </div><nav aria-label="Main navigation">{links.map(([Icon,label,href])=><Link key={href} href={href} title={label} aria-label={label} onClick={onClose} aria-current={active===href ? "page":undefined} className={active===href ? "pp-nav-active":""}><Icon size={18}/><span>{label}</span></Link>)}</nav></div>
   <details className="pp-sidebar-account"><summary title={user?.name || "Your account"}><span className="pp-avatar">{user?.name?.[0]?.toUpperCase() || "…"}</span><span className="pp-account-identity"><strong>{user?.name || "Your account"}</strong><span>Account options</span></span><ChevronUp size={14}/></summary>
    <div className="pp-account-menu">{onAccount ? <button type="button" onClick={onAccount}><UserRound size={16}/>Account settings</button> : <Link href="/account"><UserRound size={16}/>Account settings</Link>}<button type="button" onClick={onLogout}><LogOut size={16}/>Log out</button></div>
   </details>
  </aside>
 </>;
}
