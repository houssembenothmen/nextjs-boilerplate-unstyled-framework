"use client";
import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";
import { useDismissable } from "../overlays/dismissable";
import { dataAttr } from "../utils/attrs";
import { composeHandlers, composeRefs } from "../utils/compose";

interface RootCtx {
  value: string;
  setValue: (v: string) => void;
  delay: number;
  timer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  rootRef: React.RefObject<HTMLElement | null>;
}
const RootContext = React.createContext<RootCtx | null>(null);
const useRoot = () => {
  const c = React.useContext(RootContext);
  if (!c) throw new Error("NavigationMenu parts must be used inside <NavigationMenu>");
  return c;
};

export interface NavigationMenuProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Open item value (controlled). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Hover-open delay in ms. Default: 100. */
  delayDuration?: number;
}

/**
 * Site navigation with optional fly-out panels (hover, click and keyboard).
 * <NavigationMenu><NavigationMenuList>
 *   <NavigationMenuItem value="products"><NavigationMenuTrigger/><NavigationMenuContent/></NavigationMenuItem>
 *   <NavigationMenuItem><NavigationMenuLink href="/pricing"/></NavigationMenuItem>
 * </NavigationMenuList></NavigationMenu>
 */
export const NavigationMenu = React.forwardRef<HTMLElement, NavigationMenuProps>(function NavigationMenu(
  { value: valueProp, onValueChange, delayDuration = 100, "aria-label": label = "Main", ...props },
  ref
) {
  const [internal, setInternal] = React.useState("");
  const value = valueProp ?? internal;
  const rootRef = React.useRef<HTMLElement | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setValue = React.useCallback(
    (v: string) => {
      setInternal(v);
      onValueChange?.(v);
    },
    [onValueChange]
  );
  React.useEffect(() => () => clearTimeout(timer.current), []);
  useDismissable(value !== "", rootRef, () => setValue(""));

  const ctx = React.useMemo(() => ({ value, setValue, delay: delayDuration, timer, rootRef }), [value, setValue, delayDuration]);
  return (
    <RootContext.Provider value={ctx}>
      <nav ref={composeRefs(ref, rootRef)} aria-label={label} data-navigation-menu="" {...props} />
    </RootContext.Provider>
  );
});

export const NavigationMenuList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(function NavigationMenuList(props, ref) {
  return <ul ref={ref} data-navigation-menu-list="" {...props} />;
});

const ItemCtx = React.createContext<{ value: string; open: boolean; triggerId: string; contentId: string } | null>(null);

export interface NavigationMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Required when the item has a Trigger + Content. */
  value?: string;
}

export const NavigationMenuItem = React.forwardRef<HTMLLIElement, NavigationMenuItemProps>(function NavigationMenuItem(
  { value: valueProp, onPointerLeave, onKeyDown, ...props },
  ref
) {
  const root = useRoot();
  const auto = React.useId();
  const value = valueProp ?? auto;
  const open = root.value === value;
  const ctx = React.useMemo(() => ({ value, open, triggerId: `${auto}-trigger`, contentId: `${auto}-content` }), [value, open, auto]);
  return (
    <ItemCtx.Provider value={ctx}>
      <li
        ref={ref}
        data-navigation-menu-item=""
        {...props}
        onPointerLeave={composeHandlers(onPointerLeave, (e: React.PointerEvent) => {
          if (e.pointerType === "touch") return;
          clearTimeout(root.timer.current);
          if (open) root.timer.current = setTimeout(() => root.setValue(""), root.delay + 100);
        })}
        onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent) => {
          if (e.key === "Escape" && open) {
            root.setValue("");
            document.getElementById(ctx.triggerId)?.focus();
          }
        })}
      />
    </ItemCtx.Provider>
  );
});

export const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function NavigationMenuTrigger(
  { onClick, onPointerEnter, ...props },
  ref
) {
  const root = useRoot();
  const item = React.useContext(ItemCtx);
  if (!item) throw new Error("NavigationMenuTrigger must be used inside <NavigationMenuItem>");
  return (
    <button
      ref={ref}
      type="button"
      id={item.triggerId}
      aria-expanded={item.open}
      aria-controls={item.open ? item.contentId : undefined}
      data-state={item.open ? "open" : "closed"}
      {...props}
      onPointerEnter={composeHandlers(onPointerEnter, (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return;
        clearTimeout(root.timer.current);
        root.timer.current = setTimeout(() => root.setValue(item.value), root.delay);
      })}
      onClick={composeHandlers(onClick, () => root.setValue(item.open ? "" : item.value))}
    />
  );
});

export interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean;
}

export const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(function NavigationMenuContent(
  { forceMount, onPointerEnter, ...props },
  ref
) {
  const root = useRoot();
  const item = React.useContext(ItemCtx);
  if (!item) throw new Error("NavigationMenuContent must be used inside <NavigationMenuItem>");
  if (!item.open && !forceMount) return null;
  return (
    <div
      ref={ref}
      id={item.contentId}
      hidden={!item.open}
      data-navigation-menu-content=""
      data-state={item.open ? "open" : "closed"}
      {...props}
      onPointerEnter={composeHandlers(onPointerEnter, () => clearTimeout(root.timer.current))}
    />
  );
});

export interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, AsChildProps {
  /** Marks the link as the current page (aria-current + [data-active]). */
  active?: boolean;
}

export const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(function NavigationMenuLink(
  { asChild, active, onClick, ...props },
  ref
) {
  const root = useRoot();
  const Comp: React.ElementType = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      aria-current={active ? "page" : undefined}
      data-active={dataAttr(active)}
      data-navigation-menu-link=""
      {...props}
      onClick={composeHandlers(onClick, () => root.setValue(""))}
    />
  );
});
