"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import PlainpageLogo from "./PlainpageLogo";
import { WorkspaceSidebar, useWorkspaceNavigation, type WorkspacePerson } from "./WorkspaceSidebar";
export function ProductPage({title,description,children}:{title:string;description?:string;children:React.ReactNode}) {
 const pathname=usePathname(); const router=useRouter();
 const [user,setUser]=useState<WorkspacePerson|null>(null);
 const [drawer,setDrawer]=useState(false),[error,setError]=useState("");
 const [collapsed,setCollapsed]=useWorkspaceNavigation();
 const publicPage=pathname==="/privacy" || pathname==="/terms";
 useEffect(()=>{ if(publicPage) return; const controller=new AbortController(); void fetch("/api/me",{signal:controller.signal}).then(async r=>{if(r.ok) setUser(await r.json());}).catch(()=>{}); return ()=>controller.abort(); },[publicPage]);
 async function logout(){try {const r=await fetch("/api/logout",{method:"POST"});if(!r.ok) throw new Error();router.replace("/login");router.refresh();}catch{setError("Could not sign out. Please try again.");}}
 const footer=<footer><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:awaisabdullahm79@gmail.com">Contact support</a></footer>;
 const content=<section className="pp-product-content"><h1>{title}</h1>{description && <p className="pp-product-description">{description}</p>}{error && <p role="alert">{error}</p>}{children}</section>;
 if(publicPage) return <main className="pp-product-page"><header><Link href="/" aria-label="Plainpage home"><PlainpageLogo size="md"/></Link><nav aria-label="Workspace"><Link href="/documents">Documents</Link><Link href="/account">Account</Link></nav></header>{content}{footer}</main>;
 return <div className={`pp-app pp-library-workspace ${collapsed ? "pp-navigation-collapsed":""}`}><WorkspaceSidebar user={user} active={pathname} drawer={drawer} collapsed={collapsed} onClose={()=>setDrawer(false)} onToggle={()=>setCollapsed(!collapsed)} onLogout={logout}/><div className="pp-app-main"><header className="pp-workspace-header pp-route-header"><button className="pp-mobile-menu btn btn-ghost btn-square" aria-label="Open navigation" aria-expanded={drawer} aria-controls="workspace-navigation" onClick={()=>setDrawer(true)}><Menu size={20}/></button><span>{title}</span></header><main className="pp-product-page pp-workspace-page">{content}{footer}</main></div></div>;
}
