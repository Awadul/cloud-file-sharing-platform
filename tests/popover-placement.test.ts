import { describe,it,expect } from "vitest";
import { popoverPlacement } from "@/lib/popover-placement";
describe("popover viewport placement",()=>{
 it("opens below when it fits",()=>expect(popoverPlacement({left:100,top:40,bottom:72},{width:240,height:200},{width:1200,height:800})).toEqual({left:100,top:76}));
 it("shifts left at the right edge",()=>expect(popoverPlacement({left:1100,top:40,bottom:72},{width:240,height:200},{width:1200,height:800}).left).toBe(952));
 it("flips above near the bottom",()=>expect(popoverPlacement({left:100,top:700,bottom:732},{width:240,height:200},{width:1200,height:800}).top).toBe(496));
 it("keeps tall menus in the viewport",()=>expect(popoverPlacement({left:1,top:20,bottom:52},{width:240,height:580},{width:320,height:600})).toEqual({left:8,top:12}));
});
