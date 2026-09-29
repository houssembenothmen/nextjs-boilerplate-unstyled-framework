import type * as React from "react";

export type Orientation = "horizontal" | "vertical" | "both";

export function resolveDirection(el: Element | null, dir?: "ltr" | "rtl" | "auto"): "ltr" | "rtl" {
  if (dir === "ltr" || dir === "rtl") return dir;
  if (el && typeof getComputedStyle === "function") {
    return getComputedStyle(el).direction === "rtl" ? "rtl" : "ltr";
  }
  return "ltr";
}

interface MoveOptions {
  selector: string;
  orientation?: Orientation;
  loop?: boolean;
  dir?: "ltr" | "rtl" | "auto";
}

/**
 * Keyboard navigation for a group of items. Returns the element that should
 * receive focus, or null when the key isn't a navigation key.
 */
export function getNextFocusTarget(
  e: React.KeyboardEvent,
  container: HTMLElement,
  { selector, orientation = "both", loop = true, dir }: MoveOptions
): HTMLElement | null {
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-disabled") !== "true" &&
      !el.hasAttribute("data-disabled")
  );
  if (items.length === 0) return null;

  const current = items.indexOf((e.target as HTMLElement).closest<HTMLElement>(selector) as HTMLElement);
  const rtl = resolveDirection(container, dir) === "rtl";
  const horizontal = orientation !== "vertical";
  const vertical = orientation !== "horizontal";

  let delta = 0;
  switch (e.key) {
    case "ArrowRight": if (horizontal) delta = rtl ? -1 : 1; break;
    case "ArrowLeft":  if (horizontal) delta = rtl ? 1 : -1; break;
    case "ArrowDown":  if (vertical) delta = 1; break;
    case "ArrowUp":    if (vertical) delta = -1; break;
    case "Home": return items[0] ?? null;
    case "End": return items[items.length - 1] ?? null;
  }
  if (delta === 0) return null;

  let next = (current === -1 ? (delta > 0 ? -1 : 0) : current) + delta;
  if (next < 0) next = loop ? items.length - 1 : 0;
  if (next >= items.length) next = loop ? 0 : items.length - 1;
  return items[next] ?? null;
}
