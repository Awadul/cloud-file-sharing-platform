import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { unzipSync, strFromU8 } from "fflate";
import { FORMATTING_EXTENSIONS } from "@/lib/editor-formatting";
import { wordExport } from "@/lib/word-export";
const schema = getSchema([StarterKit, ...FORMATTING_EXTENSIONS]);
describe("document formatting persistence", () => {
 for (const textAlign of ["left", "center", "right", "justify"]) {
  it(`preserves ${textAlign} paragraphs and headings`, () => {
   for (const type of ["paragraph", "heading"]) {
    const node = schema.nodeFromJSON({type,attrs:{level:2,textAlign,lineHeight:"1.5"},content:[{type:"text",text:"Formatted"}]});
    const saved=schema.nodeFromJSON(node.toJSON());
    expect(saved.attrs.textAlign).toBe(textAlign);
    expect(saved.attrs.lineHeight).toBe("1.5");
   }
  });
 }
 it("preserves font, size, color and highlight in saved content", () => {
  const node=schema.nodeFromJSON({type:"paragraph",content:[{type:"text",text:"Test",marks:[{type:"textStyle",attrs:{fontFamily:"Georgia, serif",fontSize:"24px",color:"#204bdf"}},{type:"highlight",attrs:{color:"#fff0a3"}}]}]});
  expect(schema.nodeFromJSON(node.toJSON()).firstChild?.marks[0].attrs).toMatchObject({fontFamily:"Georgia, serif",fontSize:"24px",color:"#204bdf"});
 });
 it("exports alignment and typography to Word",async()=>{
  const content={type:"doc",content:[{type:"paragraph",attrs:{textAlign:"center",lineHeight:"1.5"},content:[{type:"text",text:"Test",marks:[{type:"textStyle",attrs:{fontSize:"24px",color:"#204bdf",fontFamily:"Georgia, serif"}},{type:"highlight",attrs:{color:"#fff0a3"}}]}]}]};
  const zip=unzipSync(await wordExport("Example",content));
  const xml=strFromU8(zip["word/document.xml"]);
  expect(xml).toContain('w:val="center"');expect(xml).toContain('w:line="360"');expect(xml).toContain('w:val="36"');expect(xml).toContain('w:val="204bdf"');expect(xml).toContain('w:fill="fff0a3"');expect(xml).toContain("Georgia");
 });
});
