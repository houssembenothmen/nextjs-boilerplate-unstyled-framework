"use client";
import * as React from "react";

export interface UseFieldArrayOptions<T> {
  value: T[];
  onChange: (value: T[]) => void;
  /** Stable key per row, so React doesn't remount inputs on reorder. Default: array index (fine if rows are never reordered). */
  getKey?: (item: T, index: number) => string;
}

/**
 * Array helpers on top of a plain value + onChange pair (works with useForm's
 * `values`/`setValue`, or any state you manage yourself).
 */
export function useFieldArray<T>({ value, onChange, getKey }: UseFieldArrayOptions<T>) {
  const keys = React.useRef(new Map<T, string>());
  let counter = React.useRef(0);

  const fields = value.map((item, index) => {
    let key = getKey?.(item, index);
    if (!key) {
      key = keys.current.get(item) ?? `field-${counter.current++}`;
      keys.current.set(item, key);
    }
    return { key, value: item, index };
  });

  return {
    fields,
    append: (item: T) => onChange([...value, item]),
    prepend: (item: T) => onChange([item, ...value]),
    insert: (index: number, item: T) => onChange([...value.slice(0, index), item, ...value.slice(index)]),
    remove: (index: number) => onChange(value.filter((_, i) => i !== index)),
    update: (index: number, item: T) => onChange(value.map((v, i) => (i === index ? item : v))),
    move: (from: number, to: number) => {
      const next = value.slice();
      next.splice(to, 0, next.splice(from, 1)[0] as T);
      onChange(next);
    },
    swap: (a: number, b: number) => {
      const next = value.slice();
      [next[a], next[b]] = [next[b]!, next[a]!];
      onChange(next);
    },
    replace: (items: T[]) => onChange(items),
    clear: () => onChange([]),
  };
}
