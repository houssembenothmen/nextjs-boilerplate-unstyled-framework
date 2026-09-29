"use client";
import * as React from "react";
import { useIsClient } from "../utils/use-is-client";

export interface ClientOnlyProps {
  children?: React.ReactNode;
  /** Rendered on the server and during hydration. */
  fallback?: React.ReactNode;
}

/** Renders children only after hydration. Avoids hydration mismatches. */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  return <>{useIsClient() ? children : fallback}</>;
}
