"use client";
import * as React from "react";
import { Portal } from "../foundation/portal";
import { Slot, type AsChildProps } from "../foundation/slot";
import { useDirection } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { composeHandlers, composeRefs } from "../utils/compose";
import { resolveDirection } from "../utils/roving";
import { useControllableState } from "../utils/use-controllable-state";
import { useDismissable } from "./dismissable";
import { useFloating, type FloatingOptions, type VirtualAnchor } from "./floating";
import { usePresence } from "./presence";

/* ------------------------------------------------------------------ */
/* Root contexts                                                       */
/* ------------------------------------------------------------------ */

interface RootCtx {
  open: boolean;
  setOpen: (o: boolean) => void;
  contentId: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Where the menu attaches: the trigger, or a pointer point for ContextMenu. */
  getAnchor: () => Element | VirtualAnchor | null;
  /** How the menu was opened; decides whether the first item gets focus. */
  openedBy: React.MutableRefObject<"pointer" | "keyboard">;
}
const RootContext = React.createContext<RootCtx | null>(null);
const useRoot = () => {
  const c = React.useContext(RootContext);
  if (!c) throw new Error("Menu parts must be used inside <DropdownMenu> or <ContextMenu>");
  return c;
};

/** The menu (root or submenu) an item currently lives in. */
interface PanelCtx {
  closeSelf: () => void;
  isSub: boolean;
}
const PanelContext = React.createContext<PanelCtx | null>(null);

export interface MenuRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function DropdownMenu({ open: openProp, defaultOpen = false, onOpenChange, children }: MenuRootProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const openedBy = React.useRef<"pointer" | "keyboard">("pointer");
  const contentId = React.useId();
  const value = React.useMemo<RootCtx>(
    () => ({ open, setOpen, contentId, triggerRef, openedBy, getAnchor: () => triggerRef.current }),
    [open, setOpen, contentId]
  );
  return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
}

export function ContextMenu({ open: openProp, defaultOpen = false, onOpenChange, children }: MenuRootProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const openedBy = React.useRef<"pointer" | "keyboard">("pointer");
  const point = React.useRef({ x: 0, y: 0 });
  const contentId = React.useId();
  const value = React.useMemo<RootCtx & { point: typeof point }>(
    () => ({
      open,
      setOpen,
      contentId,
      triggerRef,
      openedBy,
      point,
      getAnchor: () => ({
        getBoundingClientRect: () => ({ top: point.current.y, bottom: point.current.y, left: point.current.x, right: point.current.x, width: 0, height: 0 }),
      }),
    }),
    [open, setOpen, contentId]
  );
  return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Triggers                                                            */
/* ------------------------------------------------------------------ */

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, AsChildProps {}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(function DropdownMenuTrigger(
  { asChild, onClick, onKeyDown, ...props },
  ref
) {
  const ctx = useRoot();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={composeRefs(ref, ctx.triggerRef as React.Ref<HTMLButtonElement>)}
      type={asChild ? undefined : "button"}
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.open ? "open" : "closed"}
      {...props}
      onClick={composeHandlers(onClick, (e: React.MouseEvent) => {
        ctx.openedBy.current = e.detail === 0 ? "keyboard" : "pointer";
        ctx.setOpen(!ctx.open);
      })}
      onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          ctx.openedBy.current = "keyboard";
          ctx.setOpen(true);
        }
      })}
    />
  );
});

export interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLDivElement>, AsChildProps {
  disabled?: boolean;
}

/** Right-click (or long-press on touch, or Shift+F10 / ContextMenu key) opens the menu at the pointer. */
export const ContextMenuTrigger = React.forwardRef<HTMLDivElement, ContextMenuTriggerProps>(function ContextMenuTrigger(
  { asChild, disabled, onContextMenu, onKeyDown, ...props },
  ref
) {
  const ctx = useRoot() as RootCtx & { point: React.MutableRefObject<{ x: number; y: number }> };
  const Comp: React.ElementType = asChild ? Slot : "div";
  return (
    <Comp
      ref={composeRefs(ref, ctx.triggerRef as React.Ref<HTMLDivElement>)}
      data-state={ctx.open ? "open" : "closed"}
      data-disabled={dataAttr(disabled)}
      {...props}
      onContextMenu={composeHandlers(onContextMenu, (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        ctx.point.current = { x: e.clientX, y: e.clientY };
        ctx.openedBy.current = e.detail === 0 ? "keyboard" : "pointer";
        ctx.setOpen(true);
      })}
      onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent<HTMLElement>) => {
        if (disabled || !(e.key === "ContextMenu" || (e.shiftKey && e.key === "F10"))) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        ctx.point.current = { x: r.left + 8, y: r.top + 8 };
        ctx.openedBy.current = "keyboard";
        ctx.setOpen(true);
      })}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Panel (shared by root content and sub content)                      */
/* ------------------------------------------------------------------ */

const ITEM_SELECTOR = '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]';

function enabledItems(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (el) => !el.hasAttribute("data-disabled") && el.closest('[role="menu"]') === container
  );
}

interface PanelProps extends React.HTMLAttributes<HTMLDivElement>, FloatingOptions {
  open: boolean;
  onClose: () => void;
  getAnchor: () => Element | VirtualAnchor | null;
  isSub: boolean;
  openedBy: "pointer" | "keyboard";
  excludeRefs?: React.RefObject<HTMLElement | null>[];
  container?: Element | null;
  loop?: boolean;
  onCloseAutoFocus?: () => void;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(function Panel(
  {
    open, onClose, getAnchor, isSub, openedBy, excludeRefs, container, loop = true, id,
    side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions, onKeyDown, ...props
  },
  ref
) {
  const rootDir = useDirection();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const typeahead = React.useRef({ text: "", timer: undefined as ReturnType<typeof setTimeout> | undefined });
  const { isPresent, ref: presenceRef } = usePresence<HTMLDivElement>(open);
  const setFloating = useFloating(open, getAnchor, {
    side: side ?? (isSub ? "inline-end" : "bottom"),
    align: align ?? (isSub ? "start" : "start"),
    sideOffset: sideOffset ?? (isSub ? 0 : 4),
    alignOffset, collisionPadding, avoidCollisions,
  });

  useDismissable(open, contentRef, onClose, { exclude: excludeRefs });

  React.useEffect(() => {
    const el = contentRef.current;
    if (!open || !el) return;
    const items = enabledItems(el);
    (openedBy === "keyboard" && items[0] ? items[0] : el).focus({ preventScroll: true });
  }, [open, openedBy, isPresent]);

  const ctx = React.useMemo(() => ({ closeSelf: onClose, isSub }), [onClose, isSub]);
  if (!isPresent) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const container = e.currentTarget;
    if (e.target !== container && (e.target as HTMLElement).closest('[role="menu"]') !== container) return;
    const items = enabledItems(container);
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const rtl = resolveDirection(container, rootDir) === "rtl";
    const move = (i: number) => {
      e.preventDefault();
      items[i]?.focus();
    };
    switch (e.key) {
      case "ArrowDown": return move(idx === -1 ? 0 : idx + 1 >= items.length ? (loop ? 0 : idx) : idx + 1);
      case "ArrowUp": return move(idx === -1 ? items.length - 1 : idx - 1 < 0 ? (loop ? items.length - 1 : 0) : idx - 1);
      case "Home": return move(0);
      case "End": return move(items.length - 1);
      case "Tab":
        e.preventDefault();
        return onClose();
      case rtl ? "ArrowRight" : "ArrowLeft":
        if (isSub) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
    }
    // Typeahead: focus the next item whose text starts with what's been typed.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = typeahead.current;
      clearTimeout(t.timer);
      t.text += e.key.toLowerCase();
      t.timer = setTimeout(() => (t.text = ""), 600);
      const ordered = [...items.slice(idx + 1), ...items.slice(0, idx + 1)];
      const search = t.text.length > 1 && new Set(t.text).size === 1 ? t.text[0]! : t.text;
      const match = ordered.find((it) => (it.textContent ?? "").trim().toLowerCase().startsWith(search));
      match?.focus();
    }
  };

  return (
    <Portal container={container}>
      <PanelContext.Provider value={ctx}>
        <div
          ref={composeRefs(ref, contentRef, presenceRef, setFloating)}
          id={id}
          role="menu"
          tabIndex={-1}
          aria-orientation="vertical"
          data-menu-content=""
          data-state={open ? "open" : "closed"}
          {...props}
          onKeyDown={handleKeyDown}
        />
      </PanelContext.Provider>
    </Portal>
  );
});

export interface MenuContentProps extends React.HTMLAttributes<HTMLDivElement>, FloatingOptions {
  container?: Element | null;
  /** Wrap around at the ends when using arrow keys. Default: true. */
  loop?: boolean;
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(function DropdownMenuContent(props, ref) {
  const ctx = useRoot();
  return (
    <Panel
      ref={ref}
      id={ctx.contentId}
      open={ctx.open}
      onClose={() => {
        ctx.setOpen(false);
        ctx.triggerRef.current?.focus?.({ preventScroll: true });
      }}
      getAnchor={ctx.getAnchor}
      isSub={false}
      openedBy={ctx.openedBy.current}
      excludeRefs={[ctx.triggerRef]}
      {...props}
    />
  );
});

/** Same panel as DropdownMenuContent; anchored to the pointer position. */
export const ContextMenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(function ContextMenuContent(
  { side = "inline-end", align = "start", sideOffset = 0, ...props },
  ref
) {
  const ctx = useRoot();
  return (
    <Panel
      ref={ref}
      id={ctx.contentId}
      open={ctx.open}
      onClose={() => {
        ctx.setOpen(false);
        ctx.triggerRef.current?.focus?.({ preventScroll: true });
      }}
      getAnchor={ctx.getAnchor}
      isSub={false}
      openedBy={ctx.openedBy.current}
      side={side}
      align={align}
      sideOffset={sideOffset}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

function useMenuItem(disabled: boolean | undefined, onSelect: ((e: Event) => void) | undefined) {
  const root = useRoot();
  const select = (e: React.SyntheticEvent) => {
    if (disabled) return;
    const evt = new Event("menu.select", { cancelable: true });
    onSelect?.(evt);
    if (!evt.defaultPrevented) root.setOpen(false);
    if (!evt.defaultPrevented) root.triggerRef.current?.focus?.({ preventScroll: true });
    e.stopPropagation();
  };
  const common = {
    tabIndex: -1,
    "aria-disabled": disabled || undefined,
    "data-disabled": dataAttr(disabled),
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      if (document.activeElement === e.currentTarget) (e.currentTarget.closest('[role="menu"]') as HTMLElement | null)?.focus({ preventScroll: true });
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.currentTarget.click();
      }
    },
  };
  return { select, common };
}

export interface MenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect">, AsChildProps {
  disabled?: boolean;
  /** Call event.preventDefault() to keep the menu open. */
  onSelect?: (event: Event) => void;
}

/** Style hooks: [data-highlighted] (keyboard/hover focus) [data-disabled] */
export const MenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { asChild, disabled, onSelect, onClick, onKeyDown, onPointerMove, onPointerLeave, ...props },
  ref
) {
  const { select, common } = useMenuItem(disabled, onSelect);
  const Comp: React.ElementType = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      role="menuitem"
      data-menu-item=""
      {...common}
      {...props}
      onClick={composeHandlers(onClick, select)}
      onKeyDown={composeHandlers(onKeyDown, common.onKeyDown)}
      onPointerMove={composeHandlers(onPointerMove, common.onPointerMove)}
      onPointerLeave={composeHandlers(onPointerLeave, common.onPointerLeave)}
    />
  );
});

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, "onSelect"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Keep the menu open after toggling. Default: false. */
  keepOpen?: boolean;
}

export const MenuCheckboxItem = React.forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function MenuCheckboxItem(
  { checked = false, onCheckedChange, keepOpen, ...props },
  ref
) {
  return (
    <MenuItem
      ref={ref}
      role="menuitemcheckbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onSelect={(e) => {
        onCheckedChange?.(!checked);
        if (keepOpen) e.preventDefault();
      }}
      {...props}
    />
  );
});

const RadioCtx = React.createContext<{ value: string; setValue: (v: string) => void } | null>(null);

export interface MenuRadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const MenuRadioGroup = React.forwardRef<HTMLDivElement, MenuRadioGroupProps>(function MenuRadioGroup(
  { value = "", onValueChange, ...props },
  ref
) {
  const ctx = React.useMemo(() => ({ value, setValue: (v: string) => onValueChange?.(v) }), [value, onValueChange]);
  return (
    <RadioCtx.Provider value={ctx}>
      <div ref={ref} role="group" {...props} />
    </RadioCtx.Provider>
  );
});

export interface MenuRadioItemProps extends Omit<MenuItemProps, "onSelect"> {
  value: string;
  keepOpen?: boolean;
}

export const MenuRadioItem = React.forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  { value, keepOpen, ...props },
  ref
) {
  const group = React.useContext(RadioCtx);
  if (!group) throw new Error("MenuRadioItem must be used inside <MenuRadioGroup>");
  const checked = group.value === value;
  return (
    <MenuItem
      ref={ref}
      role="menuitemradio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onSelect={(e) => {
        group.setValue(value);
        if (keepOpen) e.preventDefault();
      }}
      {...props}
    />
  );
});

export const MenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function MenuLabel(props, ref) {
  return <div ref={ref} data-menu-label="" {...props} />;
});

export const MenuGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function MenuGroup(props, ref) {
  return <div ref={ref} role="group" {...props} />;
});

export const MenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function MenuSeparator(props, ref) {
  return <div ref={ref} role="separator" aria-orientation="horizontal" data-menu-separator="" {...props} />;
});

/* ------------------------------------------------------------------ */
/* Submenus                                                            */
/* ------------------------------------------------------------------ */

interface SubCtx {
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentId: string;
}
const SubContext = React.createContext<SubCtx | null>(null);
const useSub = () => {
  const c = React.useContext(SubContext);
  if (!c) throw new Error("MenuSub parts must be used inside <MenuSub>");
  return c;
};

export function MenuSub({ children, open: openProp, defaultOpen = false, onOpenChange }: MenuRootProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentId = React.useId();
  const value = React.useMemo(() => ({ open, setOpen, triggerRef, contentId }), [open, setOpen, contentId]);
  return <SubContext.Provider value={value}>{children}</SubContext.Provider>;
}

export const MenuSubTrigger = React.forwardRef<HTMLDivElement, Omit<MenuItemProps, "onSelect">>(function MenuSubTrigger(
  { asChild, disabled, onClick, onKeyDown, onPointerEnter, ...props },
  ref
) {
  const sub = useSub();
  const dir = useDirection();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const Comp: React.ElementType = asChild ? Slot : "div";
  return (
    <Comp
      ref={composeRefs(ref, sub.triggerRef as React.Ref<HTMLDivElement>)}
      role="menuitem"
      tabIndex={-1}
      aria-haspopup="menu"
      aria-expanded={sub.open}
      aria-controls={sub.open ? sub.contentId : undefined}
      aria-disabled={disabled || undefined}
      data-menu-item=""
      data-sub-trigger=""
      data-state={sub.open ? "open" : "closed"}
      data-disabled={dataAttr(disabled)}
      {...props}
      onPointerEnter={composeHandlers(onPointerEnter, () => {
        if (disabled) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => sub.setOpen(true), 100);
      })}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
      }}
      onClick={composeHandlers(onClick, (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) sub.setOpen(true);
      })}
      onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent<HTMLElement>) => {
        const rtl = resolveDirection(e.currentTarget, dir) === "rtl";
        if (disabled) return;
        if (e.key === "Enter" || e.key === " " || e.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
          e.preventDefault();
          e.stopPropagation();
          sub.setOpen(true);
        }
      })}
    />
  );
});

export const MenuSubContent = React.forwardRef<HTMLDivElement, MenuContentProps>(function MenuSubContent(props, ref) {
  const sub = useSub();
  const root = useRoot();
  return (
    <Panel
      ref={ref}
      id={sub.contentId}
      open={sub.open}
      onClose={() => {
        sub.setOpen(false);
        sub.triggerRef.current?.focus?.({ preventScroll: true });
      }}
      getAnchor={() => sub.triggerRef.current}
      isSub
      openedBy={root.openedBy.current === "keyboard" || sub.open ? "keyboard" : "pointer"}
      excludeRefs={[sub.triggerRef]}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ */
/* Aliases                                                             */
/* ------------------------------------------------------------------ */

export const DropdownMenuItem = MenuItem;
export const DropdownMenuCheckboxItem = MenuCheckboxItem;
export const DropdownMenuRadioGroup = MenuRadioGroup;
export const DropdownMenuRadioItem = MenuRadioItem;
export const DropdownMenuLabel = MenuLabel;
export const DropdownMenuGroup = MenuGroup;
export const DropdownMenuSeparator = MenuSeparator;
export const DropdownMenuSub = MenuSub;
export const DropdownMenuSubTrigger = MenuSubTrigger;
export const DropdownMenuSubContent = MenuSubContent;

export const ContextMenuItem = MenuItem;
export const ContextMenuCheckboxItem = MenuCheckboxItem;
export const ContextMenuRadioGroup = MenuRadioGroup;
export const ContextMenuRadioItem = MenuRadioItem;
export const ContextMenuLabel = MenuLabel;
export const ContextMenuGroup = MenuGroup;
export const ContextMenuSeparator = MenuSeparator;
export const ContextMenuSub = MenuSub;
export const ContextMenuSubTrigger = MenuSubTrigger;
export const ContextMenuSubContent = MenuSubContent;
