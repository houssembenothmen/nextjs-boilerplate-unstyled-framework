"use client";
import * as React from "react";

const subscribe = () => () => {};
/** false during SSR and hydration, true afterwards. Hydration-safe. */
export function useIsClient() {
  return React.useSyncExternalStore(subscribe, () => true, () => false);
}
