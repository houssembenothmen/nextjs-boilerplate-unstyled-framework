"use client";
import * as React from "react";
import { resolveDirection } from "../utils/roving";

export type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
export type Align = "start" | "center" | "end";

export interface FloatingOptions {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
  /** Keep this far from the viewport edges. Default: 8. */
  collisionPadding?: number;
  /** Flip to the opposite side when there's no room. Default: true. */
  avoidCollisions?: boolean;
}

export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect | { top: number; left: number; right: number; bottom: number; width: number; height: number };
}

type Physical = "top" | "bottom" | "left" | "right";

function place(a: DOMRect, w: number, h: number, side: Physical, align: Align, so: number, ao: number, rtl: boolean) {
  let x = 0;
  let y = 0;
  if (side === "top" || side === "bottom") {
    y = side === "top" ? a.top - h - so : a.bottom + so;
    const start = rtl ? a.right - w : a.left;
    const end = rtl ? a.left : a.right - w;
    x = align === "start" ? start : align === "end" ? end : a.left + a.width / 2 - w / 2;
    x += rtl ? -ao : ao;
  } else {
    x = side === "left" ? a.left - w - so : a.right + so;
    y = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
    y += ao;
  }
  return { x, y };
}

const OPPOSITE: Record<Physical, Physical> = { top: "bottom", bottom: "top", left: "right", right: "left" };

export function computePosition(anchor: DOMRect, size: { width: number; height: number }, o: Required<Omit<FloatingOptions, "side">> & { side: Physical; rtl: boolean }) {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const pad = o.collisionPadding;
  let side = o.side;
  let pos = place(anchor, size.width, size.height, side, o.align, o.sideOffset, o.alignOffset, o.rtl);

  const overflows = (s: Physical, p: { x: number; y: number }) =>
    s === "top" ? p.y < pad : s === "bottom" ? p.y + size.height > vh - pad : s === "left" ? p.x < pad : p.x + size.width > vw - pad;

  if (o.avoidCollisions && overflows(side, pos)) {
    const flipped = OPPOSITE[side];
    const alt = place(anchor, size.width, size.height, flipped, o.align, o.sideOffset, o.alignOffset, o.rtl);
    if (!overflows(flipped, alt)) {
      side = flipped;
      pos = alt;
    }
  }
  // Shift along the cross axis to stay on screen.
  const x = Math.max(pad, Math.min(pos.x, vw - size.width - pad));
  const y = Math.max(pad, Math.min(pos.y, vh - size.height - pad));
  return { x: o.avoidCollisions ? x : pos.x, y: o.avoidCollisions ? y : pos.y, side };
}

/**
 * Dependency-free positioning. Returns a ref callback for the floating element;
 * position is written straight to its style (no re-renders).
 * Exposes: data-side, data-align, --anchor-width, --anchor-height, --available-height.
 */
export function useFloating(
  open: boolean,
  getAnchor: () => Element | VirtualAnchor | null,
  { side = "bottom", align = "center", sideOffset = 4, alignOffset = 0, collisionPadding = 8, avoidCollisions = true }: FloatingOptions = {}
) {
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  const getAnchorRef = React.useRef(getAnchor);
  getAnchorRef.current = getAnchor;

  React.useLayoutEffect(() => {
    if (!open || !el) return;
    const update = () => {
      const anchor = getAnchorRef.current();
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect() as DOMRect;
      const rtl = resolveDirection(anchor instanceof Element ? anchor : el) === "rtl";
      const physical: Physical =
        side === "inline-start" ? (rtl ? "right" : "left") : side === "inline-end" ? (rtl ? "left" : "right") : side;
      el.style.position = "fixed";
      el.style.top = "0px";
      el.style.left = "0px";
      el.style.maxHeight = "";
      const { x, y, side: finalSide } = computePosition(
        rect,
        { width: el.offsetWidth, height: el.offsetHeight },
        { side: physical, align, sideOffset, alignOffset, collisionPadding, avoidCollisions, rtl }
      );
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      el.dataset.side = finalSide;
      el.dataset.align = align;
      el.style.setProperty("--anchor-width", `${rect.width}px`);
      el.style.setProperty("--anchor-height", `${rect.height}px`);
      const vh = document.documentElement.clientHeight;
      el.style.setProperty(
        "--available-height",
        `${Math.max(0, finalSide === "top" ? rect.top - sideOffset - collisionPadding : vh - rect.bottom - sideOffset - collisionPadding)}px`
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [open, el, side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions]);

  return setEl;
}
