"use client";
import * as React from "react";
import { FocusTrap } from "../foundation/focus-trap";
import { Portal } from "../foundation/portal";
import { Slot, type AsChildProps } from "../foundation/slot";
import { composeHandlers, composeRefs } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useDismissable } from "./dismissable";
import { usePresence } from "./presence";
import { useScrollLock } from "./scroll-lock";

interface DialogCtx {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}
const Ctx = React.createContext<DialogCtx | null>(null);
const useDialog = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("Dialog parts must be used inside <Dialog>");
  return ctx;
};

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open: openProp, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const id = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const value = React.useMemo(
    () => ({ open, setOpen, triggerRef, contentId: `${id}-content`, titleId: `${id}-title`, descriptionId: `${id}-description` }),
    [open, setOpen, id]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, AsChildProps {}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(
  { asChild, onClick, ...props },
  ref
) {
  const ctx = useDialog();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={composeRefs(ref, ctx.triggerRef)}
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

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render the backdrop element ([data-dialog-overlay]). Default: true. */
  overlay?: boolean;
  overlayProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Close on Escape. Default: true. */
  closeOnEscape?: boolean;
  /** Close when clicking the backdrop. Default: true. */
  closeOnOutsideClick?: boolean;
  /** Which edge a Drawer is attached to. Exposed as [data-side]. */
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  /** Internal: "alertdialog" for AlertDialog. */
  role?: "dialog" | "alertdialog";
  /** Selector to focus when opened, e.g. "[data-autofocus]". Default: first tabbable. */
  initialFocusSelector?: string;
  container?: Element | null;
}

/**
 * Renders in a portal with a focus trap, scroll lock and Escape / outside-click dismissal.
 * Style with [data-dialog-overlay], [data-dialog-content] and [data-state="open"|"closed"];
 * a CSS animation on `[data-state="closed"]` is awaited before unmounting.
 */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  {
    overlay = true,
    overlayProps,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    side,
    role = "dialog",
    initialFocusSelector,
    container,
    children,
    ...props
  },
  ref
) {
  const ctx = useDialog();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const { isPresent, ref: presenceRef } = usePresence<HTMLDivElement>(ctx.open);
  const overlayPresence = usePresence<HTMLDivElement>(ctx.open);

  useScrollLock(ctx.open);
  useDismissable(ctx.open, contentRef, (reason) => ctx.setOpen(false), { closeOnEscape, closeOnOutside: closeOnOutsideClick });

  if (!isPresent) return null;
  const state = ctx.open ? "open" : "closed";

  return (
    <Portal container={container}>
      {overlay && (
        <div
          ref={overlayPresence.ref}
          data-dialog-overlay=""
          data-state={state}
          aria-hidden
          {...overlayProps}
        />
      )}
      <FocusTrap
        ref={composeRefs(ref, contentRef, presenceRef)}
        active={ctx.open}
        initialFocusSelector={initialFocusSelector}
        id={ctx.contentId}
        role={role}
        aria-modal
        aria-labelledby={ctx.titleId}
        aria-describedby={ctx.descriptionId}
        data-dialog-content=""
        data-state={state}
        data-side={side}
        {...props}
      >
        {children}
      </FocusTrap>
    </Portal>
  );
});

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & AsChildProps>(
  function DialogTitle({ asChild, ...props }, ref) {
    const Comp: React.ElementType = asChild ? Slot : "h2";
    return <Comp ref={ref} id={useDialog().titleId} {...props} />;
  }
);

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & AsChildProps>(
  function DialogDescription({ asChild, ...props }, ref) {
    const Comp: React.ElementType = asChild ? Slot : "p";
    return <Comp ref={ref} id={useDialog().descriptionId} {...props} />;
  }
);

export const DialogClose = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogClose(
  { asChild, onClick, ...props },
  ref
) {
  const ctx = useDialog();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : "button"}
      {...props}
      onClick={composeHandlers(onClick, () => ctx.setOpen(false))}
    />
  );
});

/* ------------------------------ AlertDialog ------------------------------ */

export const AlertDialog = Dialog;
export type AlertDialogProps = DialogProps;
export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;

/**
 * role="alertdialog": can't be dismissed by clicking outside, and focus starts on
 * the [data-alert-dialog-cancel] element (the safe choice) when present.
 */
export const AlertDialogContent = React.forwardRef<HTMLDivElement, Omit<DialogContentProps, "role">>(
  function AlertDialogContent({ closeOnOutsideClick = false, initialFocusSelector = "[data-alert-dialog-cancel]", ...props }, ref) {
    return (
      <DialogContent
        ref={ref}
        role="alertdialog"
        closeOnOutsideClick={closeOnOutsideClick}
        initialFocusSelector={initialFocusSelector}
        {...props}
      />
    );
  }
);

export const AlertDialogCancel = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(function AlertDialogCancel(props, ref) {
  return <DialogClose ref={ref} data-alert-dialog-cancel="" {...props} />;
});

export const AlertDialogAction = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(function AlertDialogAction(props, ref) {
  return <DialogClose ref={ref} data-alert-dialog-action="" {...props} />;
});

/* -------------------------------- Drawer --------------------------------- */

export const Drawer = Dialog;
export type DrawerProps = DialogProps;
export const DrawerTrigger = DialogTrigger;
export const DrawerTitle = DialogTitle;
export const DrawerDescription = DialogDescription;
export const DrawerClose = DialogClose;

/** A Dialog attached to an edge. Style with [data-drawer][data-side="left"]. */
export const DrawerContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DrawerContent(
  { side = "inline-end", ...props },
  ref
) {
  return <DialogContent ref={ref} side={side} data-drawer="" {...(props as object)} />;
});
