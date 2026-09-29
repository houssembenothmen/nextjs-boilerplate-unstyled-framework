"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { composeRefs } from "../utils/compose";

/**
 * Native HTML5 drag-and-drop reordering (no pointer-event engine, so it's tiny,
 * but it doesn't support touch — add a manual "move up/down" fallback for mobile).
 */

interface Ctx {
  dragId: string | null;
  overId: string | null;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragEnter: (id: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  disabled: boolean;
}
const Ctx = React.createContext<Ctx | null>(null);

export interface SortableListProps<T> extends Omit<React.HTMLAttributes<HTMLElement>, "onChange" | "children"> {
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (items: T[]) => void;
  disabled?: boolean;
  /** Root tag. Default: "ul". */
  as?: "ul" | "ol" | "div";
  children: (item: T, index: number) => React.ReactNode;
}

/** Style hooks on the root: [data-sortable-list]. On each item (via SortableItem): [data-dragging] [data-drop-target]. */
export function SortableList<T>({ items, getItemId, onReorder, disabled = false, as = "ul", children, ...props }: SortableListProps<T>) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const ctx = React.useMemo<Ctx>(
    () => ({
      dragId,
      overId,
      disabled,
      onDragStart: (id, e) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", id);
        } catch { /* some browsers restrict this; drag still works */ }
      },
      onDragEnter: (id) => dragId && id !== dragId && setOverId(id),
      onDrop: () => {
        if (dragId && overId && dragId !== overId) {
          const from = items.findIndex((i) => getItemId(i) === dragId);
          const to = items.findIndex((i) => getItemId(i) === overId);
          if (from >= 0 && to >= 0) {
            const next = items.slice();
            next.splice(to, 0, next.splice(from, 1)[0]!);
            onReorder(next);
          }
        }
        setDragId(null);
        setOverId(null);
      },
      onDragEnd: () => {
        setDragId(null);
        setOverId(null);
      },
    }),
    [dragId, overId, disabled, items, getItemId, onReorder]
  );

  const Comp = as;
  return (
    <Ctx.Provider value={ctx}>
      <Comp data-sortable-list="" {...props}>
        {items.map((item, i) => (
          <React.Fragment key={getItemId(item)}>{children(item, i)}</React.Fragment>
        ))}
      </Comp>
    </Ctx.Provider>
  );
}

export interface SortableItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  id: string;
  as?: "li" | "div";
  /** Restrict dragging to a handle: render <SortableHandle> inside and set this. Default: false (whole row drags). */
  handle?: boolean;
}

export const SortableItem = React.forwardRef<HTMLLIElement, SortableItemProps>(function SortableItem(
  { id, as = "li", handle = false, children, ...props },
  ref
) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("SortableItem must be used inside <SortableList>");
  const Comp = as as React.ElementType;
  return (
    <HandleCtx.Provider value={id}>
      <Comp
        ref={ref}
        draggable={!ctx.disabled && !handle}
        aria-grabbed={ctx.dragId === id || undefined}
        data-sortable-item=""
        data-dragging={dataAttr(ctx.dragId === id)}
        data-drop-target={dataAttr(ctx.overId === id && ctx.dragId !== id)}
        {...props}
        onDragStart={!handle ? (e: React.DragEvent) => ctx.onDragStart(id, e) : props.onDragStart}
        onDragEnter={(e: React.DragEvent) => {
          e.preventDefault();
          ctx.onDragEnter(id);
        }}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          ctx.onDrop();
        }}
        onDragEnd={ctx.onDragEnd}
      >
        {children}
      </Comp>
    </HandleCtx.Provider>
  );
});

const HandleCtx = React.createContext<string | null>(null);

/** Drag grip: makes only this element the drag source (set `handle` on the parent SortableItem). */
export const SortableHandle = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function SortableHandle(
  props,
  ref
) {
  const ctx = React.useContext(Ctx);
  const id = React.useContext(HandleCtx);
  if (!ctx || id === null) throw new Error("SortableHandle must be used inside <SortableItem>");
  return (
    <button
      ref={composeRefs(ref)}
      type="button"
      draggable={!ctx.disabled}
      aria-label={props["aria-label"] ?? "Reorder"}
      data-sortable-handle=""
      {...props}
      onDragStart={(e) => {
        const row = (e.currentTarget.closest("[data-sortable-item]") as HTMLElement) ?? e.currentTarget;
        e.dataTransfer.setDragImage(row, 0, 0);
        ctx.onDragStart(id, e);
      }}
    />
  );
});
