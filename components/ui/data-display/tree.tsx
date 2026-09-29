"use client";
import * as React from "react";
import { useDirection } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { resolveDirection } from "../utils/roving";
import { useControllableState } from "../utils/use-controllable-state";

interface Ctx {
  expanded: string[];
  toggleExpanded: (v: string, open?: boolean) => void;
  selected: string[];
  select: (v: string) => void;
  multiple: boolean;
}
const TreeCtx = React.createContext<Ctx | null>(null);
const LevelCtx = React.createContext(0);

export interface TreeProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "defaultValue" | "onChange"> {
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (v: string[]) => void;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (v: string[]) => void;
  multiple?: boolean;
}

/**
 * <Tree><TreeItem value="src" label="src"><TreeItem value="a" label="a.ts"/></TreeItem></Tree>
 * Keys: ↑ ↓ move, → expand / enter, ← collapse / parent, Home / End, Enter / Space select.
 */
export const Tree = React.forwardRef<HTMLUListElement, TreeProps>(function Tree(
  { expanded: e, defaultExpanded = [], onExpandedChange, selected: s, defaultSelected = [], onSelectedChange, multiple = false, onFocus, onBlur, ...props },
  ref
) {
  const [expanded, setExpanded] = useControllableState({ value: e, defaultValue: defaultExpanded, onChange: onExpandedChange });
  const [selected, setSelected] = useControllableState({ value: s, defaultValue: defaultSelected, onChange: onSelectedChange });
  const [within, setWithin] = React.useState(false);

  const ctx = React.useMemo<Ctx>(
    () => ({
      expanded,
      selected,
      multiple,
      toggleExpanded: (v, open) => setExpanded((p) => ((open ?? !p.includes(v)) ? (p.includes(v) ? p : [...p, v]) : p.filter((x) => x !== v))),
      select: (v) => setSelected((p) => (multiple ? (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]) : [v])),
    }),
    [expanded, selected, multiple, setExpanded, setSelected]
  );

  return (
    <TreeCtx.Provider value={ctx}>
      <ul
        ref={ref}
        role="tree"
        aria-multiselectable={multiple || undefined}
        // Single tab stop: the tree itself hands focus to the selected / first item.
        tabIndex={within ? -1 : 0}
        data-tree=""
        {...props}
        onFocus={composeHandlers(onFocus, (ev) => {
          setWithin(true);
          if (ev.target === ev.currentTarget) {
            const target = ev.currentTarget.querySelector<HTMLElement>('[role="treeitem"][aria-selected="true"]') ?? ev.currentTarget.querySelector<HTMLElement>('[role="treeitem"]');
            target?.focus();
          }
        })}
        onBlur={composeHandlers(onBlur, (ev) => {
          if (!ev.currentTarget.contains(ev.relatedTarget as Node | null)) setWithin(false);
        })}
      />
    </TreeCtx.Provider>
  );
});

export interface TreeItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "onSelect"> {
  value: string;
  /** The row's content. Nested <TreeItem>s go in `children`. */
  label: React.ReactNode;
  disabled?: boolean;
}

export const TreeItem = React.forwardRef<HTMLLIElement, TreeItemProps>(function TreeItem(
  { value, label, disabled, children, onKeyDown, onClick, ...props },
  ref
) {
  const t = React.useContext(TreeCtx);
  if (!t) throw new Error("TreeItem must be used inside <Tree>");
  const level = React.useContext(LevelCtx) + 1;
  const dir = useDirection();
  const hasChildren = React.Children.count(children) > 0;
  const open = hasChildren && t.expanded.includes(value);
  const isSelected = t.selected.includes(value);

  const handleKey = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget) return;
    const tree = e.currentTarget.closest<HTMLElement>('[role="tree"]')!;
    const items = Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')).filter((el) => el.getAttribute("aria-disabled") !== "true");
    const i = items.indexOf(e.currentTarget);
    const rtl = resolveDirection(tree, dir) === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const go = (el?: HTMLElement) => (e.preventDefault(), e.stopPropagation(), el?.focus());

    if (e.key === "ArrowDown") return go(items[i + 1]);
    if (e.key === "ArrowUp") return go(items[i - 1]);
    if (e.key === "Home") return go(items[0]);
    if (e.key === "End") return go(items[items.length - 1]);
    if (e.key === forward) {
      if (hasChildren && !open) return (go(), t.toggleExpanded(value, true));
      if (open) return go(items[i + 1]);
    }
    if (e.key === back) {
      if (open) return (go(), t.toggleExpanded(value, false));
      return go(e.currentTarget.parentElement?.closest<HTMLElement>('[role="treeitem"]') ?? undefined);
    }
    if (e.key === "Enter" || e.key === " ") {
      go();
      if (!disabled) t.select(value);
      if (hasChildren && e.key === "Enter") t.toggleExpanded(value);
    }
  };

  return (
    <li
      ref={ref}
      role="treeitem"
      tabIndex={-1}
      aria-level={level}
      aria-expanded={hasChildren ? open : undefined}
      aria-selected={isSelected}
      aria-disabled={disabled || undefined}
      data-tree-item=""
      data-state={hasChildren ? (open ? "open" : "closed") : undefined}
      data-selected={dataAttr(isSelected)}
      data-disabled={dataAttr(disabled)}
      {...props}
      onKeyDown={composeHandlers(onKeyDown, handleKey)}
    >
      <div
        data-tree-item-row=""
        onClick={(e) => {
          onClick?.(e as unknown as React.MouseEvent<HTMLLIElement>);
          if (disabled || e.defaultPrevented) return;
          (e.currentTarget.parentElement as HTMLElement).focus();
          t.select(value);
          if (hasChildren) t.toggleExpanded(value);
        }}
      >
        {label}
      </div>
      {open && (
        <LevelCtx.Provider value={level}>
          <ul role="group" data-tree-group="">
            {children}
          </ul>
        </LevelCtx.Provider>
      )}
    </li>
  );
});
