import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {FORMATTING_EXTENSIONS} from "./editor-formatting";

// The preview uses the shared formatting toolbar and must support its commands.
export const LANDING_EDITOR_EXTENSIONS = [
 StarterKit.configure({underline:false}),
 Underline,
 ...FORMATTING_EXTENSIONS,
];
