export function popoverPlacement(anchor: { left:number; top:number; bottom:number }, panel: { width:number; height:number }, viewport: { width:number; height:number }) {
  const gutter=8, gap=4;
  const left=Math.max(gutter, Math.min(anchor.left, viewport.width-panel.width-gutter));
  const below=anchor.bottom+gap;
  const above=anchor.top-panel.height-gap;
  const top=below+panel.height<=viewport.height-gutter ? below : above>=gutter ? above : Math.max(gutter,viewport.height-panel.height-gutter);
  return {left,top};
}
