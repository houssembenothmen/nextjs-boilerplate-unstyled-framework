"use client";
import * as React from "react";

interface Options<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}

/** Controlled when `value !== undefined`, uncontrolled otherwise. */
export function useControllableState<T>({ value, defaultValue, onChange }: Options<T>) {
  const [internal, setInternal] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;

  const currentRef = React.useRef(current);
  const onChangeRef = React.useRef(onChange);
  currentRef.current = current;
  onChangeRef.current = onChange;

  const set = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(currentRef.current) : next;
      if (Object.is(resolved, currentRef.current)) return;
      currentRef.current = resolved;
      if (!isControlled) setInternal(resolved);
      onChangeRef.current?.(resolved);
    },
    [isControlled]
  );

  return [current, set] as const;
}
