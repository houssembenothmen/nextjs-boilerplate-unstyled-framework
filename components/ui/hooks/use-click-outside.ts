"use client";
import * as React from "react";

/** Calls `handler` on pointerdown outside every given element. */
export function useClickOutside(
  refs: React.RefObject<HTMLElement | null> | React.RefObject<HTMLElement | null>[],
  handler: (event: PointerEvent) => void,
  enabled = true
) {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;
  const list = Array.isArray(refs) ? refs : [refs];
  const listRef = React.useRef(list);
  listRef.current = list;

  React.useEffect(() => {
    if (!enabled) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (listRef.current.some((r) => r.current?.contains(target))) return;
      handlerRef.current(e);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [enabled]);
}
