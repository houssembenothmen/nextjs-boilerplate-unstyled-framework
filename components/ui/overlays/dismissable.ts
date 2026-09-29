"use client";
import * as React from "react";

const stack: object[] = [];

export type DismissReason = "escape" | "outside";

/**
 * Escape / outside-pointer dismissal. Only the top-most layer reacts, so nested
 * overlays (menu inside dialog) close one at a time.
 */
export function useDismissable(
  enabled: boolean,
  ref: React.RefObject<HTMLElement | null>,
  onDismiss: (reason: DismissReason, event: Event) => void,
  { exclude = [], closeOnEscape = true, closeOnOutside = true }: { exclude?: React.RefObject<HTMLElement | null>[]; closeOnEscape?: boolean; closeOnOutside?: boolean } = {}
) {
  const cb = React.useRef(onDismiss);
  cb.current = onDismiss;
  const excludeRef = React.useRef(exclude);
  excludeRef.current = exclude;

  React.useEffect(() => {
    if (!enabled) return;
    const layer = {};
    stack.push(layer);
    const isTop = () => stack[stack.length - 1] === layer;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape && isTop()) cb.current("escape", e);
    };
    const onDown = (e: PointerEvent) => {
      if (!closeOnOutside || !isTop()) return;
      const t = e.target as Node;
      if (ref.current?.contains(t) || excludeRef.current.some((r) => r.current?.contains(t))) return;
      cb.current("outside", e);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [enabled, ref, closeOnEscape, closeOnOutside]);
}
