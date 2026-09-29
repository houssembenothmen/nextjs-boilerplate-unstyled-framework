"use client";
import * as React from "react";
import { useFieldControl } from "./form-field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, ref) {
  const { rest, native } = useFieldControl(props);
  return <textarea ref={ref} {...rest} {...native} />;
});
