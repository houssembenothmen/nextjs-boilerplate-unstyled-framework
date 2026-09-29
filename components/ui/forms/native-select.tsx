"use client";
import * as React from "react";
import { useFieldControl } from "./form-field";

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/** The plain <select>: best mobile UX, full native a11y, zero JS listbox to maintain. */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(props, ref) {
  const { rest, native } = useFieldControl(props);
  return <select ref={ref} {...rest} {...native} />;
});
