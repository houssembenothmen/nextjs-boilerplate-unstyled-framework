"use client";
import * as React from "react";

export interface UseKeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  /** Fire even while typing in inputs / textareas / contenteditable. Default: false. */
  allowInInputs?: boolean;
}

/**
 * `useKeyboardShortcut("mod+k", () => ...)`. `mod` = Cmd on macOS, Ctrl elsewhere.
 * Also accepts ctrl, meta, alt, shift and any KeyboardEvent.key ("escape", "/", "k").
 */
export function useKeyboardShortcut(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  { enabled = true, preventDefault = true, allowInInputs = false }: UseKeyboardShortcutOptions = {}
) {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!enabled) return;
    const parts = combo.toLowerCase().split("+").map((p) => p.trim());
    const key = parts[parts.length - 1]!;
    const want = {
      mod: parts.includes("mod"),
      ctrl: parts.includes("ctrl"),
      meta: parts.includes("meta"),
      alt: parts.includes("alt"),
      shift: parts.includes("shift"),
    };
    const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key) return;
      const modOk = want.mod ? (isMac ? e.metaKey : e.ctrlKey) : true;
      const ctrlOk = want.ctrl ? e.ctrlKey : want.mod ? true : !e.ctrlKey;
      const metaOk = want.meta ? e.metaKey : want.mod ? true : !e.metaKey;
      if (!modOk || !ctrlOk || !metaOk || e.altKey !== want.alt || e.shiftKey !== want.shift) return;
      if (!allowInInputs) {
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)) && !want.mod && !want.ctrl && !want.meta) return;
      }
      if (preventDefault) e.preventDefault();
      handlerRef.current(e);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled, preventDefault, allowInInputs]);
}
