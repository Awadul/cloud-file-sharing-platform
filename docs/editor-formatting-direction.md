# Plainpage editor formatting direction

## Intent and references

The document is the focal point. Use the existing Geist interface, a 4px spacing grid, 12px control labels, 16px icons, neutral paper/canvas surfaces, and blue for active selection. A compact Typography popover keeps less frequent settings away from the primary writing controls.

User reference: attached Google Docs screenshot showing paragraph style, font, size, color, highlight, alignment and list controls. This is a visual reference, not instructions to reproduce unsupported Google services.

Official references inspected on 2026-10-22:
- https://www.notion.com/help/customize-and-style-your-content — typography and restrained page customization.
- https://help.figma.com/hc/en-us/articles/360039956434-Guide-to-text-in-Figma-Design — typography properties grouped in a properties area.
- https://tiptap.dev/docs/editor/extensions/functionality/line-height — official extension for persistent spacing.

Design choices, rather than claims of exact product equivalence: familiar document alignment; Notion-like quote/divider blocks; grouped typography properties inspired by Figma. The current platform remains a document editor, without arbitrary Figma canvas layout or Google service integration.

## Implemented

Left/centre/right/justify alignment on paragraphs and headings; selection font family/size/color; paragraph line spacing; highlight color/removal; strikethrough; clear formatting; quote block; divider. Attributes and marks are serialized into document JSON for autosave, history and shared reloads. Word export carries alignment, spacing, font, size, color and highlight. Markdown cannot represent all rich typography; PDF uses the visible print layout.

## Verification boundary

144 tests pass, including formatting schema round-trip, generated Word XML, and five DOM-based real Tiptap command tests covering multi-block alignment, undo, selected-text styling, visible formatting after JSON reload and clear formatting. Production build passes. These prove command, DOM rendering and persistence/export paths; they do not prove toolbar pointer/keyboard operation or visual geometry. Interaction tests found and fixed the official spacing command writing an inline mark instead of paragraph attributes. Alignment icons and color pickers now reflect the current selection. Local browser verification remains blocked by the earlier URL security restriction; no alternate browser channel was used. REA has no active server registration, and no fresh diagnostics or unrelated engines were run for source work.

Remaining acceptance: inspect desktop/mobile editor; use alignment on paragraphs/headings and a multi-paragraph selection; choose fonts/size/colors without losing selection; close popovers with Escape and outside clicks; ensure no toolbar/content displacement; reload a saved document and verify the same visible formatting.
