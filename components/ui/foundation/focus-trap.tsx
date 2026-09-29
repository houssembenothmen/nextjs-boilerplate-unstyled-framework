"use client";
import * as React from "react";
import { composeRefs } from "../utils/compose";
import { Slot, type AsChildProps } from "./slot";

const TABBABLE =
  'a[href],area[href],button,input:not([type="hidden"]),select,textarea,iframe,[contenteditable]:not([contenteditable="false"]),[tabindex]';

function getTabbables(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest("[hidden],[inert]")
  );
}

export interface FocusTrapProps extends React.HTMLAttributes<HTMLDivElement>, AsChildProps {
  /** Trap is only enforced while true. Default: true. */
  active?: boolean;
  /** Move focus into the trap on activation. Default: true. */
  autoFocus?: boolean;
  /** Restore focus to the previously focused element on deactivation. Default: true. */
  returnFocus?: boolean;
  /** Element to focus first. Defaults to the first tabbable element. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** CSS selector (inside the trap) to focus first, e.g. "[data-autofocus]". */
  initialFocusSelector?: string;
}

export const FocusTrap = React.forwardRef<HTMLDivElement, FocusTrapProps>(function FocusTrap(
  { active = true, autoFocus = true, returnFocus = true, initialFocusRef, initialFocusSelector, asChild, onKeyDown, ...props },
  forwardedRef
) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    const previous = document.activeElement as HTMLElement | null;

    if (autoFocus) {
      const target =
        initialFocusRef?.current ??
        (initialFocusSelector ? container.querySelector<HTMLElement>(initialFocusSelector) : null) ??
        getTabbables(container)[0] ??
        container;
      target.focus({ preventScroll: true });
    }

    // Pull focus back if it escapes (e.g. via click or programmatic focus).
    const onFocusIn = (e: FocusEvent) => {
      if (!container.contains(e.target as Node)) {
        (getTabbables(container)[0] ?? container).focus({ preventScroll: true });
      }
    };
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      if (returnFocus && previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [active, autoFocus, returnFocus, initialFocusRef, initialFocusSelector]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !active || e.key !== "Tab") return;
    const container = containerRef.current;
    if (!container) return;
    const items = getTabbables(container);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const activeEl = document.activeElement;
    if (e.shiftKey && (activeEl === first || activeEl === container)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && activeEl === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const Comp: React.ElementType = asChild ? Slot : "div";
  return (
    <Comp
      tabIndex={-1}
      {...props}
      ref={composeRefs(forwardedRef, containerRef)}
      onKeyDown={handleKeyDown}
    />
  );
});
