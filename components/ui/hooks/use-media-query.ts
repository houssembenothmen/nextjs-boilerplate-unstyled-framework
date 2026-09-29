"use client";
import * as React from "react";

/**
 * Subscribes to a media query. `defaultValue` is used on the server and during
 * hydration, so markup always matches; prefer CSS media queries when possible.
 */
export function useMediaQuery(query: string, defaultValue = false) {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query]
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => defaultValue
  );
}
