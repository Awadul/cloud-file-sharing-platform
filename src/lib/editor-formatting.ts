import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit, LineHeight } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";

const ParagraphLineHeight = LineHeight.extend({
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ chain }) => {
        const value = Number(lineHeight);
        if (!Number.isFinite(value) || value < 0.8 || value > 3) return false;
        return chain().updateAttributes("paragraph", { lineHeight }).updateAttributes("heading", { lineHeight }).run();
      },
      unsetLineHeight: () => ({ chain }) => chain().resetAttributes("paragraph", "lineHeight").resetAttributes("heading", "lineHeight").run(),
    };
  },
}).configure({ types: ["heading", "paragraph"] });

export const FORMATTING_EXTENSIONS = [
  TextAlign.configure({ types: ["heading", "paragraph"], defaultAlignment: "left" }),
  TextStyleKit.configure({ lineHeight: false }),
  ParagraphLineHeight,
  Highlight.configure({ multicolor: true }),
];
