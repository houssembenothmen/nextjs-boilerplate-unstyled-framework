"use client";
import * as React from "react";

export type Direction = "ltr" | "rtl" | "auto";

const DirectionContext = React.createContext<Direction | undefined>(undefined);

export interface DirectionProviderProps {
  dir: Direction;
  children?: React.ReactNode;
}

/**
 * Tells direction-aware components (keyboard navigation, etc.) which way the
 * UI flows. Does not render DOM: set `dir` on <html> or a wrapper yourself.
 * With no provider, components read the computed CSS direction instead.
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return <DirectionContext.Provider value={dir}>{children}</DirectionContext.Provider>;
}

export function useDirection(): Direction | undefined {
  return React.useContext(DirectionContext);
}
