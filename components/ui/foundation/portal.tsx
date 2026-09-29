"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "../utils/use-is-client";

export interface PortalProps {
  /** Defaults to document.body. */
  container?: Element | DocumentFragment | null;
  children?: React.ReactNode;
}

export function Portal({ container, children }: PortalProps) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(children, container ?? document.body);
}
