"use client";
import * as React from "react";
import { useFieldControl } from "./form-field";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  invalid?: boolean;
}

/** Style hooks: [data-invalid] [data-disabled] [data-required] */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { rest, native } = useFieldControl(props);
  return <input ref={ref} {...rest} {...native} />;
});
