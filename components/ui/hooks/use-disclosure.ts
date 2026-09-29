"use client";
import * as React from "react";
import { useControllableState } from "../utils/use-controllable-state";

export interface UseDisclosureOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useDisclosure({ open, defaultOpen = false, onOpenChange }: UseDisclosureOptions = {}) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  return {
    isOpen,
    setOpen,
    open: React.useCallback(() => setOpen(true), [setOpen]),
    close: React.useCallback(() => setOpen(false), [setOpen]),
    toggle: React.useCallback(() => setOpen((o) => !o), [setOpen]),
  };
}
