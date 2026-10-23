// @vitest-environment jsdom
import React, {act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {WorkspaceSidebar} from "@/components/WorkspaceSidebar";
vi.mock("next/link",()=>({default:({children,...props}:React.AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}>{children}</a>}));
let root:Root,container:HTMLDivElement,opener:HTMLButtonElement;
let mobile:boolean,change:()=>void;
const close=vi.fn();
async function render(drawer:boolean){await act(async()=>{root.render(<><WorkspaceSidebar user={{name:"Test",email:"test@example.com",productTiers:true}} active="/reviews" drawer={drawer} collapsed={false} onClose={()=>close()} onToggle={()=>{}} onLogout={()=>{}}/><div className="pp-app-main"><button>Document action</button></div></>);});}
beforeEach(()=>{
 (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
 mobile=true;change=()=>{};close.mockClear();
 vi.stubGlobal("matchMedia",()=>({get matches(){return mobile;},addEventListener:(_event:string,callback:()=>void)=>{change=callback;},removeEventListener:()=>{}}));
 opener=document.createElement("button");document.body.append(opener);opener.focus();
 container=document.createElement("div");document.body.append(container);root=createRoot(container);
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();opener.remove();document.body.style.overflow="";vi.unstubAllGlobals();});
describe("workspace sidebar drawer",()=>{
 it("keeps a closed mobile drawer out of keyboard navigation",async()=>{await render(false);expect((container.querySelector("aside") as HTMLElement).inert).toBe(true);expect(document.body.style.overflow).toBe("");});
 it("moves focus into the drawer and restores it on close",async()=>{await render(true);expect(document.activeElement?.getAttribute("aria-label")).toBe("Close navigation");expect((container.querySelector(".pp-app-main") as HTMLElement).inert).toBe(true);expect(document.body.style.overflow).toBe("hidden");await render(false);expect(document.activeElement).toBe(opener);expect((container.querySelector(".pp-app-main") as HTMLElement).inert).toBe(false);});
 it("preserves the user's focused link during unrelated rerenders",async()=>{await render(true);const link=container.querySelector<HTMLAnchorElement>('a[href="/reviews"]')!;link.focus();await render(true);expect(document.activeElement).toBe(link);expect(link.getAttribute("aria-current")).toBe("page");});
 it("dismisses with Escape",async()=>{await render(true);await act(async()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true})));expect(close).toHaveBeenCalledOnce();});
 it("releases page locks when resizing to desktop",async()=>{await render(true);mobile=false;await act(async()=>change());expect(document.body.style.overflow).toBe("");expect((container.querySelector("aside") as HTMLElement).inert).toBe(false);expect((container.querySelector(".pp-app-main") as HTMLElement).inert).toBe(false);});
});
