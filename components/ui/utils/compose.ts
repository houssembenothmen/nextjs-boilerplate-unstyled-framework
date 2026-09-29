import type * as React from "react";

export function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
}

export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) setRef(ref, node);
  };
}

/** Runs the user's handler first; skips ours if they called preventDefault(). */
export function composeHandlers<E extends { defaultPrevented: boolean }>(
  user: ((e: E) => void) | undefined,
  own: ((e: E) => void) | undefined
) {
  return (e: E) => {
    user?.(e);
    if (!e.defaultPrevented) own?.(e);
  };
}

export function joinIds(...ids: (string | undefined | false | null)[]) {
  const out = ids.filter(Boolean).join(" ");
  return out || undefined;
}
