"use client";
import * as React from "react";
import { composeRefs } from "../utils/compose";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both";
}

/**
 * Native scrolling (best perf & accessibility) plus edge attributes for shadows / fades:
 * [data-overflow-start] [data-overflow-end] (on the scroll axis) . Style the bar with `scrollbar-width` /
 * `::-webkit-scrollbar`.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { orientation = "vertical", style, ...props },
  ref
) {
  const node = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = node.current;
    if (!el) return;
    const update = () => {
      const v = orientation !== "horizontal";
      const h = orientation !== "vertical";
      const set = (name: string, on: boolean) => (on ? el.setAttribute(name, "") : el.removeAttribute(name));
      set("data-overflow-top", v && el.scrollTop > 0);
      set("data-overflow-bottom", v && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
      set("data-overflow-left", h && Math.abs(el.scrollLeft) > 0);
      set("data-overflow-right", h && Math.abs(el.scrollLeft) + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [orientation]);

  return (
    <div
      ref={composeRefs(ref, node)}
      tabIndex={0}
      data-scroll-area=""
      data-orientation={orientation}
      style={{ overflowY: orientation !== "horizontal" ? "auto" : "hidden", overflowX: orientation !== "vertical" ? "auto" : "hidden", ...style }}
      {...props}
    />
  );
});
