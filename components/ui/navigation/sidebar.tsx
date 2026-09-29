"use client";
import * as React from "react";
import { useKeyboardShortcut } from "../hooks/use-keyboard-shortcut";
import { Slot, type AsChildProps } from "../foundation/slot";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";

interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  toggle: () => void;
  sidebarId: string;
}
const SidebarCtx = React.createContext<Ctx | null>(null);

export function useSidebar() {
  const c = React.useContext(SidebarCtx);
  if (!c) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return c;
}

export interface SidebarProviderProps {
  /** true = expanded. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Toggle shortcut, e.g. "mod+b". Off by default. */
  shortcut?: string;
  children?: React.ReactNode;
}

/** State + structure only. Layout, widths, mobile behavior and animation are yours. */
export function SidebarProvider({ open: openProp, defaultOpen = true, onOpenChange, shortcut, children }: SidebarProviderProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const sidebarId = React.useId();
  const toggle = React.useCallback(() => setOpen((o) => !o), [setOpen]);
  useKeyboardShortcut(shortcut ?? "mod+b", toggle, { enabled: Boolean(shortcut), allowInInputs: true });
  const value = React.useMemo(() => ({ open, setOpen, toggle, sidebarId }), [open, setOpen, toggle, sidebarId]);
  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

/** Style hooks: [data-state="expanded|collapsed"] */
export const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & AsChildProps>(function Sidebar({ asChild, ...props }, ref) {
  const c = useSidebar();
  const Comp: React.ElementType = asChild ? Slot : "aside";
  return <Comp ref={ref} id={c.sidebarId} data-sidebar="" data-state={c.open ? "expanded" : "collapsed"} {...props} />;
});

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & AsChildProps>(function SidebarTrigger(
  { asChild, onClick, ...props },
  ref
) {
  const c = useSidebar();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : "button"}
      aria-controls={c.sidebarId}
      aria-expanded={c.open}
      data-state={c.open ? "expanded" : "collapsed"}
      {...props}
      onClick={composeHandlers(onClick, c.toggle)}
    />
  );
});

type Div = React.HTMLAttributes<HTMLDivElement> & AsChildProps;
const block = (name: string, tag: "div" | "ul" | "li" = "div") =>
  React.forwardRef<HTMLDivElement, Div>(function Block({ asChild, ...props }, ref) {
    const Comp: React.ElementType = asChild ? Slot : tag;
    return <Comp ref={ref} {...{ [`data-sidebar-${name}`]: "" }} {...props} />;
  });

export const SidebarHeader = block("header");
export const SidebarContent = block("content");
export const SidebarFooter = block("footer");
export const SidebarGroup = block("group");
export const SidebarGroupLabel = block("group-label");
export const SidebarMenu = block("menu", "ul");
export const SidebarMenuItem = block("menu-item", "li");

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, AsChildProps {
  /** Current page: aria-current + [data-active]. */
  active?: boolean;
}

/** Use asChild with a link: <SidebarMenuButton asChild active><Link href="/x"/></SidebarMenuButton> */
export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(function SidebarMenuButton(
  { asChild, active, ...props },
  ref
) {
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : "button"}
      aria-current={active ? "page" : undefined}
      data-active={dataAttr(active)}
      data-sidebar-menu-button=""
      {...props}
    />
  );
});
