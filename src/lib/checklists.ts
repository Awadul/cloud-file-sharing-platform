import TaskList from "@tiptap/extension-task-list";
import type { Transaction } from "@tiptap/pm/state";

// Stored on each list so collaborators and restored versions see the same style.
export const PlainpageTaskList = TaskList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      completedStyle: {
        default: "strike",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-completed-style") === "plain" ? "plain" : "strike",
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-completed-style": attrs.completedStyle === "plain" ? "plain" : "strike" }),
      },
    };
  },
});

export function setListCompletion(tr: Transaction, checked: boolean): boolean {
  const { $from } = tr.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const list = $from.node(depth);
    if (list.type.name !== "taskList") continue;
    const start = $from.before(depth) + 1;
    list.descendants((node, offset) => {
      if (node.type.name === "taskItem" && node.attrs.checked !== checked) {
        tr.setNodeMarkup(start + offset, undefined, { ...node.attrs, checked });
      }
    });
    return true;
  }
  return false;
}
