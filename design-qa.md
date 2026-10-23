# Plainpage editor — screenshot comparison QA

Date: 2026-10-22

## Latest focused font-size comparison

Source: C:/Users/awais/AppData/Local/Temp/codex-clipboard-183551ff-69c5-4749-991d-91db280ba37c.png, 532 × 631 pixels, Google Docs font-size suggestions open. Implementation: C:/Users/awais/AppData/Local/Temp/codex-clipboard-ab013d1e-0f5e-418d-a2e7-447996b43638.png, 751 × 493 pixels, Plainpage Typography open, size 19 pt. Both were opened together in full and focused comparison inputs before judging:
- C:/Users/awais/Documents/Codex/2026-10-20/product-design-plugin-product-design-openai-7/outputs/editor-qa/font-size-full.jpg
- C:/Users/awais/Documents/Codex/2026-10-20/product-design-plugin-product-design-openai-7/outputs/editor-qa/font-size-focused.jpg

CSS viewport and density unknown. Crops were not rescaled. These compare task placement and input proportions, not exact pixel equality; source suggestions are open while implementation suggestions are closed.

[P2] Font-size task is buried in a large property popover. Reference exposes font family and size directly in the toolbar, while Plainpage requires an extra open-panel action and a wide form field. Fix implemented: move the 112px font family and 104px size group inline; use a 44px central field with adjacent increment/decrement controls on desktop; touch variants retain 40px targets. The remaining popover is named Format and contains spacing plus secondary text actions. Preset size range extends through 96 pt; Word export accepts the corresponding 128px representation.

Five-surface check for this pair: typography uses legible input weights but exact scale/fallback cannot be inferred; layout has a confirmed task-placement difference addressed in code; color/focus tokens remain Plainpage's intentional neutral/blue system; no image/logo fidelity target exists in these cropped controls; labels remain concise and point units explicit to assistive technology. Reference screenshot contains an incomplete draft in its field, which is not a requirement to accept invalid final values. No keyboard or screen-reader behavior is claimed from the screenshots.

Post-fix visual capture is missing. Lint/build checks are not a visual QA iteration. Latest result remains blocked until revised inline controls are captured and compared. Earlier comparison history follows.

## Artifacts and normalization

Source visual truth paths:
- C:/Users/awais/AppData/Local/Temp/codex-clipboard-aa63cfcb-09bf-4c88-868d-c66148674dce.png (1918 × 897), Google Docs closed toolbar.
- C:/Users/awais/AppData/Local/Temp/codex-clipboard-d09f30f8-2928-4289-b530-94e56440d44c.png (1918 × 895), Google Docs color palette open.
Implementation screenshot paths:
- C:/Users/awais/AppData/Local/Temp/codex-clipboard-2448bfc6-97da-4168-9c98-5fd21500c95b.png (1914 × 895), Plainpage closed toolbar.
- C:/Users/awais/AppData/Local/Temp/codex-clipboard-a5117634-c25b-4fd4-9f9c-6f4e4093c7bf.png (1918 × 897), Plainpage Typography open.

All are user-supplied browser-rendered captures in light theme. CSS viewport, browser zoom and deviceScaleFactor are unknown; similar pixel widths do not establish equal CSS scale. No scaling was applied to saved comparison inputs. Google document zoom reads 100%; this does not establish browser zoom. Content differs (resume versus meeting notes); compare interface chrome, not document body typography or layout. Open panels perform different tasks, so palette contents and total panel heights are not exact one-to-one fidelity targets.

Combined comparison input directory:
C:/Users/awais/Documents/Codex/2026-10-20/product-design-plugin-product-design-openai-7/outputs/editor-qa/
- full-comparison.jpg — source and implementation together, original pixel scale, inspected.
- toolbar-comparison.jpg — focused toolbar strips together, inspected.
- panel-comparison.jpg — focused open-panel regions together, inspected with state mismatch noted.

## Findings

- [P2] Desktop control density remains visibly larger in supplied captures.
  Location: editor header, toolbar, outline, workflow rail.
  Evidence: combined full-view and toolbar comparisons show a taller control band and wider per-action spacing in Plainpage. Raw captured toolbar bands are approximately 74px versus 48px; unknown browser scale prevents interpreting these as CSS dimensions.
  Impact: fewer controls/content fit above the fold.
  Fix applied: compact desktop rules now use viewport width rather than `(pointer:fine)`. That gating was confirmed in source; the capture's actual pointer media state is unknown, so this is a plausible contributing cause rather than a measured runtime attribution. Larger coarse-pointer hit targets remain separately scoped.
  Status: post-fix rendered evidence required.

- [P2] Typography action rows remain oversized relative to the compact reference pattern.
  Location: open Typography popover.
  Evidence: panel comparison shows generous height for Remove highlight, Strikethrough and Clear formatting. The typography property labels now stay on single lines, resolving the previously reported wrapping in this supplied state.
  Impact: settings obscure more of the document than necessary.
  Fix applied: viewport-based desktop action-row heights/padding now activate independently of pointer detection. Typography fields remain 28px CSS height with short labels. No color-palette cloning is implied.
  Status: post-fix rendered evidence required.

## Required fidelity surfaces

- Fonts/typography: Plainpage interface labels appear larger in captures; family is a deliberate product choice (Geist rather than Google's interface family). No serif resume-font mismatch is filed. Single-line property labels are improved. Exact CSS type scale, fallback, optical weight and browser zoom remain unresolved.
- Spacing/layout rhythm: taller Plainpage controls confirmed visually; outline and review rail intentionally differ from Docs. Document-table height and content differ and are not accepted as toolbar-density evidence. Border radii and shadows are restrained; no independent P0/P1 issue established.
- Colors/tokens: both use pale neutral chrome, dark text and blue active states. Plainpage's blue/teal Share gradient is a prior user-requested brand decision; Google's blue is not mandatory. Pixel contrast/opacity and interaction state coverage remain unverified.
- Image quality/assets: functional icons are crisp and consistent within Plainpage. Its own branding is intentional; Google logo, avatars and services should not be copied. No photo or illustration fidelity target exists in this editor chrome. No replacement artwork was generated.
- Copy/content: Font, Size, Spacing, Color and Highlight are concise and fit the supplied open panel. Plainpage-specific Review/History/Export and Clarity remain appropriate. The numbered Meeting notes line is document content, not proof of an editor heading regression.

## Comparison history

1. Prior pass lacked current implementation evidence and was blocked.
2. User supplied current closed-toolbar and Typography-open captures. Source and implementation were combined in full-view and focused inputs before judging. Two P2 density findings remain.
3. Applied viewport-based density fix. Production build and TypeScript passed. No post-fix screenshot has been received/captured; build success is not a visual QA iteration or pass.

## Browser and interaction coverage

Current implementation evidence is user supplied. Direct localhost capture remains blocked by the earlier browser URL security restriction; no alternate channel was used. Primary interactions tested in this QA pass: none directly. Earlier DOM/unit checks cover editor commands, persistence and export; they do not verify pointer/keyboard UI or geometry. Console errors: not checked in this pass. Mobile evidence: missing.

## Implementation checklist

- Refresh Plainpage and capture closed toolbar and Typography open after this fix.
- Record viewport, browser zoom and density when available; compare combined images again.
- Verify desktop/coarse-pointer/mobile layouts, no clipping or displacement, Escape/outside dismissal, focus return and selection-preserving formatting.
- Check console errors.
- Resolve or explicitly accept remaining P0/P1/P2 findings before passing.

## Implementation follow-through

The requested code fixes are implemented: viewport-based desktop density; compact typography labels and fields; dedicated text-color and highlight palettes (30 swatches, custom color and reset); native top-layer popovers measured after opening and repositioned at viewport edges. Typography no longer mixes its three property fields with color pickers. Compact desktop menu rows remain separate from touch targets.

148 tests, lint and production build passed. Four placement tests cover below-trigger placement, right-edge correction, flipping above and tall-menu clamping. Existing editor DOM tests cover formatting commands and reload persistence. These are implementation checks, not a substitute for post-fix screenshot comparison.

## Follow-up polish

- Color-palette enhancement implemented as part of the requested follow-through. No remaining optional code change is asserted by this report. Visual acceptance remains pending post-fix captures.

final result: blocked

## Verification follow-up 23 October 2026
Current source audit found the mobile sidebar focus setup depended on a newly created close callback and therefore reran on ordinary parent renders. Fixed by separating the latest close callback from drawer lifecycle. Added five rendered React interaction checks: closed mobile drawer inertness; opening focus and restoration on close; preserving a focused review link through rerenders; Escape dismissal; clearing page locks on a desktop breakpoint change. All five checks pass. Full suite now has 157 tests across 17 files. These DOM checks do not verify pixel geometry, CSS transition appearance or visual fidelity to the PDF. Goal remains incomplete until current reference-screen comparisons and live visual verification can be completed.
