"use client";
import * as React from "react";
import { usePresence } from "../overlays/presence";
import { composeRefs } from "../utils/compose";

export interface CollapsePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  forceMount?: boolean;
}

/**
 * Shared by Collapsible and Accordion. Exposes --content-height / --content-width
 * so you can animate height: `[data-state=open]{animation: down .2s}`
 * `@keyframes down{from{height:0}to{height:var(--content-height)}}`
 */
export const CollapsePanel = React.forwardRef<HTMLDivElement, CollapsePanelProps>(function CollapsePanel(
  { open, forceMount, style, children, ...props },
  ref
) {
  const { isPresent, ref: presenceRef } = usePresence<HTMLDivElement>(open);
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<{ h: number; w: number } | null>(null);

  React.useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    const prev = { a: el.style.animationName, t: el.style.transitionDuration };
    el.style.transitionDuration = "0s";
    el.style.animationName = "none";
    const r = el.getBoundingClientRect();
    setSize({ h: r.height, w: r.width });
    el.style.transitionDuration = prev.t;
    el.style.animationName = prev.a;
  }, [open, isPresent]);

  if (!isPresent && !forceMount) return null;
  return (
    <div
      ref={composeRefs(ref, nodeRef, presenceRef)}
      hidden={!open && !isPresent}
      data-state={open ? "open" : "closed"}
      style={{
        ["--content-height" as string]: size ? `${size.h}px` : undefined,
        ["--content-width" as string]: size ? `${size.w}px` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
