"use client";
import * as React from "react";
import { useKeyboardShortcut } from "../hooks/use-keyboard-shortcut";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { Dialog, DialogContent, type DialogContentProps } from "./dialog";

/** Default matcher: every whitespace-separated query word must appear in the text. */
export function defaultCommandFilter(text: string, query: string) {
  const t = text.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => t.includes(w));
}

interface Ctx {
  query: string;
  setQuery: (q: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  report: (id: string, visible: boolean) => void;
  visibleCount: number;
  filter: (text: string, query: string) => boolean;
  listId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
  close: () => void;
}
const CommandCtx = React.createContext<Ctx | null>(null);
const useCommand = () => {
  const c = React.useContext(CommandCtx);
  if (!c) throw new Error("CommandPalette parts must be used inside <CommandPalette>");
  return c;
};

export interface CommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global shortcut that toggles the palette, e.g. "mod+k". Off by default. */
  shortcut?: string;
  /** Custom matcher. Return false to hide an item. */
  filter?: (text: string, query: string) => boolean;
  children?: React.ReactNode;
}

export function CommandPalette({ open: openProp, defaultOpen = false, onOpenChange, shortcut, filter = defaultCommandFilter, children }: CommandPaletteProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  useKeyboardShortcut(shortcut ?? "mod+k", () => setOpen(!open), { enabled: Boolean(shortcut), allowInInputs: true });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <CommandRoot filter={filter} close={() => setOpen(false)} open={open}>
        {children}
      </CommandRoot>
    </Dialog>
  );
}

function CommandRoot({ filter, close, open, children }: { filter: Ctx["filter"]; close: () => void; open: boolean; children?: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [visible, setVisible] = React.useState<Set<string>>(() => new Set());
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const report = React.useCallback((id: string, isVisible: boolean) => {
    setVisible((prev) => {
      if (prev.has(id) === isVisible) return prev;
      const next = new Set(prev);
      isVisible ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ query, setQuery, activeId, setActiveId, report, visibleCount: visible.size, filter, listId, listRef, close }),
    [query, activeId, report, visible.size, filter, listId, close]
  );
  return <CommandCtx.Provider value={value}>{children}</CommandCtx.Provider>;
}

export const CommandPaletteContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function CommandPaletteContent(props, ref) {
  return <DialogContent ref={ref} data-command-palette="" aria-label="Command palette" {...props} />;
});

export const CommandPaletteInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function CommandPaletteInput({ onChange, onKeyDown, ...props }, ref) {
    const c = useCommand();
    const items = () => Array.from(c.listRef.current?.querySelectorAll<HTMLElement>("[data-command-item]:not([data-disabled])") ?? []);

    // Keep the active item valid: default to the first visible one.
    React.useEffect(() => {
      const list = items();
      if (!list.some((el) => el.id === c.activeId)) c.setActiveId(list[0]?.id ?? null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [c.query, c.visibleCount]);

    return (
      <input
        ref={ref}
        role="combobox"
        aria-expanded
        aria-controls={c.listId}
        aria-activedescendant={c.activeId ?? undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-command-input=""
        data-autofocus=""
        {...props}
        value={c.query}
        onChange={composeHandlers(onChange, (e) => c.setQuery(e.target.value))}
        onKeyDown={composeHandlers(onKeyDown, (e) => {
          const list = items();
          const idx = list.findIndex((el) => el.id === c.activeId);
          const go = (i: number) => {
            e.preventDefault();
            const el = list[(i + list.length) % list.length];
            if (el) {
              c.setActiveId(el.id);
              el.scrollIntoView({ block: "nearest" });
            }
          };
          if (list.length === 0) return;
          if (e.key === "ArrowDown") go(idx + 1);
          else if (e.key === "ArrowUp") go(idx - 1);
          else if (e.key === "Home") go(0);
          else if (e.key === "End") go(list.length - 1);
          else if (e.key === "Enter" && idx >= 0) {
            e.preventDefault();
            list[idx]!.click();
          }
        })}
      />
    );
  }
);

export const CommandPaletteList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CommandPaletteList(props, ref) {
  const c = useCommand();
  return (
    <div
      ref={(el) => {
        (c.listRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      id={c.listId}
      role="listbox"
      data-command-list=""
      {...props}
    />
  );
});

export interface CommandPaletteItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Text used for matching. Defaults to children when they're a string. */
  value?: string;
  /** Extra searchable words. */
  keywords?: string[];
  disabled?: boolean;
  onSelect?: () => void;
  /** Close the palette after selecting. Default: true. */
  closeOnSelect?: boolean;
}

export const CommandPaletteItem = React.forwardRef<HTMLDivElement, CommandPaletteItemProps>(function CommandPaletteItem(
  { value, keywords = [], disabled, onSelect, closeOnSelect = true, onClick, onPointerMove, children, ...props },
  ref
) {
  const c = useCommand();
  const id = React.useId();
  const text = [value ?? (typeof children === "string" ? children : ""), ...keywords].join(" ");
  const visible = !c.query || c.filter(text, c.query);

  React.useLayoutEffect(() => {
    c.report(id, visible);
    return () => c.report(id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, id]);

  if (!visible) return null;
  const active = c.activeId === id;
  return (
    <div
      ref={ref}
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-command-item=""
      data-selected={dataAttr(active)}
      data-disabled={dataAttr(disabled)}
      {...props}
      onPointerMove={composeHandlers(onPointerMove, () => !disabled && !active && c.setActiveId(id))}
      onClick={composeHandlers(onClick, () => {
        if (disabled) return;
        onSelect?.();
        if (closeOnSelect) c.close();
      })}
    >
      {children}
    </div>
  );
});

export interface CommandPaletteGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode;
}

export const CommandPaletteGroup = React.forwardRef<HTMLDivElement, CommandPaletteGroupProps>(function CommandPaletteGroup(
  { heading, children, ...props },
  ref
) {
  const headingId = React.useId();
  return (
    <div ref={ref} role="group" aria-labelledby={heading ? headingId : undefined} data-command-group="" {...props}>
      {heading && <div id={headingId} data-command-group-heading="">{heading}</div>}
      {children}
    </div>
  );
});

/** Shown only when nothing matches the query. */
export const CommandPaletteEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CommandPaletteEmpty(props, ref) {
  const c = useCommand();
  if (c.visibleCount > 0) return null;
  return <div ref={ref} role="status" data-command-empty="" {...props} />;
});
