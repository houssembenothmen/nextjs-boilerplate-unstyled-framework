"use client";
import * as React from "react";

let locks = 0;
let previous: { overflow: string; paddingRight: string } | null = null;

/** Locks body scroll (reference-counted, compensates for the scrollbar width). */
export function useScrollLock(enabled: boolean) {
  React.useLayoutEffect(() => {
    if (!enabled) return;
    const body = document.body;
    if (locks === 0) {
      previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0 && previous) {
        body.style.overflow = previous.overflow;
        body.style.paddingRight = previous.paddingRight;
        previous = null;
      }
    };
  }, [enabled]);
}
