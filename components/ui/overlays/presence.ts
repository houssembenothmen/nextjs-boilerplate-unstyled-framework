"use client";
import * as React from "react";

/**
 * Keeps an element mounted while its CSS exit animation runs.
 * Style with `[data-state="closed"] { animation: ... }`. No animation = unmounts immediately.
 * Attach the returned `ref` to the animated element.
 */
export function usePresence<T extends HTMLElement = HTMLElement>(present: boolean) {
  const nodeRef = React.useRef<T | null>(null);
  const [mounted, setMounted] = React.useState(present);

  React.useLayoutEffect(() => {
    if (present) {
      setMounted(true);
      return;
    }
    const el = nodeRef.current;
    if (!el || typeof el.getAnimations !== "function") {
      setMounted(false);
      return;
    }
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const animations = el.getAnimations();
      if (animations.length === 0) return setMounted(false);
      Promise.allSettled(animations.map((a) => a.finished)).then(() => !cancelled && setMounted(false));
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [present]);

  const ref = React.useCallback((node: T | null) => {
    nodeRef.current = node;
  }, []);

  return { isPresent: present || mounted, ref };
}
