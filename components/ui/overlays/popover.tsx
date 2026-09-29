"use client";
import * as React from "react";
import { Portal } from "../foundation/portal";
import { Slot, type AsChildProps } from "../foundation/slot";
import { composeHandlers, composeRefs } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useDismissable } from "./dismissable";
import { useFloating, type FloatingOptions } from "./floating";
import { usePresence } from "./presence";

interface PopoverCtx {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  anchorRef: React.RefObject<HTMLElement | null>;
}
const Ctx = React.createContext<PopoverCtx | null>(null);
const usePopover = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Popover parts must be used inside <Popover>");
  return ctx;
};

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Popover({ open: openProp, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const contentId = React.useId();
  const value = React.useMemo(() => ({ open, setOpen, contentId, triggerRef, anchorRef }), [open, setOpen, contentId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, AsChildProps {}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(
  { asChild, onClick, ...props },
  ref
) {
  const ctx = usePopover();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={composeRefs(ref, ctx.triggerRef as React.Ref<HTMLButtonElement>)}
      type={asChild ? undefined : "button"}
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.open ? "open" : "closed"}
      {...props}
      onClick={composeHandlers(onClick, () => ctx.setOpen(!ctx.open))}
    />
  );
});

/** Optional: anchor the popover to a different element than the trigger. */
export const PopoverAnchor = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & AsChildProps>(
  function PopoverAnchor({ asChild, ...props }, ref) {
    const ctx = usePopover();
    const Comp: React.ElementType = asChild ? Slot : "div";
    return <Comp ref={composeRefs(ref, ctx.anchorRef as React.Ref<HTMLDivElement>)} {...props} />;
  }
);

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement>, FloatingOptions {
  container?: Element | null;
  /** Move focus into the popover when it opens. Default: true. */
  autoFocus?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  {
    side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions,
    container, autoFocus = true, closeOnEscape = true, closeOnOutsideClick = true, ...props
  },
  ref
) {
  const ctx = usePopover();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const { isPresent, ref: presenceRef } = usePresence<HTMLDivElement>(ctx.open);
  const setFloating = useFloating(ctx.open, () => ctx.anchorRef.current ?? ctx.triggerRef.current, {
    side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions,
  });

  useDismissable(ctx.open, contentRef, () => ctx.setOpen(false), { exclude: [ctx.triggerRef], closeOnEscape, closeOnOutside: closeOnOutsideClick });

  React.useEffect(() => {
    const el = contentRef.current;
    if (!ctx.open || !el) return;
    if (autoFocus) {
      const first = el.querySelector<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      (first ?? el).focus({ preventScroll: true });
    }
    const trigger = ctx.triggerRef.current;
    return () => {
      if (trigger && document.contains(trigger) && el.contains(document.activeElement)) trigger.focus({ preventScroll: true });
    };
  }, [ctx.open, autoFocus, ctx.triggerRef]);

  if (!isPresent) return null;
  return (
    <Portal container={container}>
      <div
        ref={composeRefs(ref, contentRef, presenceRef, setFloating)}
        id={ctx.contentId}
        role="dialog"
        tabIndex={-1}
        data-popover-content=""
        data-state={ctx.open ? "open" : "closed"}
        {...props}
      />
    </Portal>
  );
});

export const PopoverClose = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverClose(
  { asChild, onClick, ...props },
  ref
) {
  const ctx = usePopover();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return <Comp ref={ref} type={asChild ? undefined : "button"} {...props} onClick={composeHandlers(onClick, () => ctx.setOpen(false))} />;
});
