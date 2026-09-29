"use client";
import * as React from "react";
import { Portal } from "../foundation/portal";
import { Slot, type AsChildProps } from "../foundation/slot";
import { composeHandlers, composeRefs } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useDismissable } from "./dismissable";
import { useFloating, type FloatingOptions } from "./floating";
import { usePresence } from "./presence";

/* ------------------------------------------------------------------ */
/* Shared hover-intent logic for Tooltip and HoverCard                 */
/* ------------------------------------------------------------------ */

function useHoverIntent(setOpen: (o: boolean) => void, openDelay: number, closeDelay: number) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const schedule = (open: boolean, delay: number) => {
    clearTimeout(timer.current);
    if (delay <= 0) setOpen(open);
    else timer.current = setTimeout(() => setOpen(open), delay);
  };
  return {
    show: (delay = openDelay) => schedule(true, delay),
    hide: (delay = closeDelay) => schedule(false, delay),
    cancel: () => clearTimeout(timer.current),
  };
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

interface TooltipProviderCtx {
  delayDuration: number;
  skipDelayDuration: number;
  lastClosed: React.MutableRefObject<number>;
}
const ProviderCtx = React.createContext<TooltipProviderCtx | null>(null);

export interface TooltipProviderProps {
  /** Hover delay before showing. Default: 500ms. */
  delayDuration?: number;
  /** After one tooltip closes, others open instantly for this long. Default: 300ms. */
  skipDelayDuration?: number;
  children?: React.ReactNode;
}

export function TooltipProvider({ delayDuration = 500, skipDelayDuration = 300, children }: TooltipProviderProps) {
  const lastClosed = React.useRef(0);
  const value = React.useMemo(() => ({ delayDuration, skipDelayDuration, lastClosed }), [delayDuration, skipDelayDuration]);
  return <ProviderCtx.Provider value={value}>{children}</ProviderCtx.Provider>;
}

interface TooltipCtx {
  open: boolean;
  contentId: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  intent: ReturnType<typeof useHoverIntent>;
  setOpen: (o: boolean) => void;
  delay: number;
}
const TooltipContext = React.createContext<TooltipCtx | null>(null);
const useTooltip = () => {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip parts must be used inside <Tooltip>");
  return ctx;
};

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  children?: React.ReactNode;
}

export function Tooltip({ open: openProp, defaultOpen = false, onOpenChange, delayDuration, children }: TooltipProps) {
  const provider = React.useContext(ProviderCtx);
  const delay = delayDuration ?? provider?.delayDuration ?? 500;
  const [open, setOpenState] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const setOpen = React.useCallback(
    (o: boolean) => {
      if (!o && provider) provider.lastClosed.current = Date.now();
      setOpenState(o);
    },
    [provider, setOpenState]
  );
  const intent = useHoverIntent(setOpen, delay, 100);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentId = React.useId();
  const value = React.useMemo(() => ({ open, setOpen, contentId, triggerRef, intent, delay }), [open, setOpen, contentId, intent, delay]);
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

export interface TooltipTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, AsChildProps {}

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(function TooltipTrigger(
  { asChild, onPointerEnter, onPointerLeave, onFocus, onBlur, onKeyDown, onClick, ...props },
  ref
) {
  const ctx = useTooltip();
  const provider = React.useContext(ProviderCtx);
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={composeRefs(ref, ctx.triggerRef as React.Ref<HTMLButtonElement>)}
      type={asChild ? undefined : "button"}
      aria-describedby={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.open ? "open" : "closed"}
      {...props}
      onPointerEnter={composeHandlers(onPointerEnter, (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return;
        const skip = provider && Date.now() - provider.lastClosed.current < provider.skipDelayDuration;
        ctx.intent.show(skip ? 0 : ctx.delay);
      })}
      onPointerLeave={composeHandlers(onPointerLeave, () => ctx.intent.hide())}
      onFocus={composeHandlers(onFocus, (e: React.FocusEvent<HTMLElement>) => {
        if (e.currentTarget.matches(":focus-visible")) ctx.intent.show(0);
      })}
      onBlur={composeHandlers(onBlur, () => ctx.intent.hide(0))}
      onKeyDown={composeHandlers(onKeyDown, (e: React.KeyboardEvent) => e.key === "Escape" && ctx.intent.hide(0))}
      onClick={composeHandlers(onClick, () => ctx.intent.hide(0))}
    />
  );
});

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement>, FloatingOptions {
  container?: Element | null;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(function TooltipContent(
  { side = "top", align, sideOffset = 6, alignOffset, collisionPadding, avoidCollisions, container, ...props },
  ref
) {
  const ctx = useTooltip();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const { isPresent, ref: presenceRef } = usePresence<HTMLDivElement>(ctx.open);
  const setFloating = useFloating(ctx.open, () => ctx.triggerRef.current, { side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions });
  useDismissable(ctx.open, contentRef, () => ctx.setOpen(false), { closeOnOutside: false });

  if (!isPresent) return null;
  return (
    <Portal container={container}>
      <div
        ref={composeRefs(ref, contentRef, presenceRef, setFloating)}
        id={ctx.contentId}
        role="tooltip"
        data-tooltip-content=""
        data-state={ctx.open ? "open" : "closed"}
        {...props}
        // Hoverable: moving onto the tooltip keeps it open (WCAG 1.4.13).
        onPointerEnter={composeHandlers(props.onPointerEnter, () => ctx.intent.cancel())}
        onPointerLeave={composeHandlers(props.onPointerLeave, () => ctx.intent.hide())}
      />
    </Portal>
  );
});

/* ------------------------------------------------------------------ */
/* HoverCard                                                           */
/* ------------------------------------------------------------------ */

const HoverCardContext = React.createContext<TooltipCtx | null>(null);
const useHoverCard = () => {
  const ctx = React.useContext(HoverCardContext);
  if (!ctx) throw new Error("HoverCard parts must be used inside <HoverCard>");
  return ctx;
};

export interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  children?: React.ReactNode;
}

/** Rich preview shown on hover / keyboard focus of a link. Sighted-mouse enhancement only. */
export function HoverCard({ open: openProp, defaultOpen = false, onOpenChange, openDelay = 700, closeDelay = 300, children }: HoverCardProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const intent = useHoverIntent(setOpen, openDelay, closeDelay);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentId = React.useId();
  const value = React.useMemo(() => ({ open, setOpen, contentId, triggerRef, intent, delay: openDelay }), [open, setOpen, contentId, intent, openDelay]);
  return <HoverCardContext.Provider value={value}>{children}</HoverCardContext.Provider>;
}

export interface HoverCardTriggerProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, AsChildProps {}

export const HoverCardTrigger = React.forwardRef<HTMLAnchorElement, HoverCardTriggerProps>(function HoverCardTrigger(
  { asChild, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props },
  ref
) {
  const ctx = useHoverCard();
  const Comp: React.ElementType = asChild ? Slot : "a";
  return (
    <Comp
      ref={composeRefs(ref, ctx.triggerRef as React.Ref<HTMLAnchorElement>)}
      data-state={ctx.open ? "open" : "closed"}
      {...props}
      onPointerEnter={composeHandlers(onPointerEnter, (e: React.PointerEvent) => e.pointerType !== "touch" && ctx.intent.show())}
      onPointerLeave={composeHandlers(onPointerLeave, () => ctx.intent.hide())}
      onFocus={composeHandlers(onFocus, () => ctx.intent.show(0))}
      onBlur={composeHandlers(onBlur, () => ctx.intent.hide())}
    />
  );
});

export const HoverCardContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(function HoverCardContent(
  { side = "bottom", align, sideOffset = 8, alignOffset, collisionPadding, avoidCollisions, container, ...props },
  ref
) {
  const ctx = useHoverCard();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const { isPresent, ref: presenceRef } = usePresence<HTMLDivElement>(ctx.open);
  const setFloating = useFloating(ctx.open, () => ctx.triggerRef.current, { side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions });
  useDismissable(ctx.open, contentRef, () => ctx.setOpen(false), { closeOnOutside: false });

  if (!isPresent) return null;
  return (
    <Portal container={container}>
      <div
        ref={composeRefs(ref, contentRef, presenceRef, setFloating)}
        id={ctx.contentId}
        data-hover-card-content=""
        data-state={ctx.open ? "open" : "closed"}
        {...props}
        onPointerEnter={composeHandlers(props.onPointerEnter, () => ctx.intent.cancel())}
        onPointerLeave={composeHandlers(props.onPointerLeave, () => ctx.intent.hide())}
        onFocus={composeHandlers(props.onFocus, () => ctx.intent.cancel())}
        onBlur={composeHandlers(props.onBlur, () => ctx.intent.hide())}
      />
    </Portal>
  );
});
