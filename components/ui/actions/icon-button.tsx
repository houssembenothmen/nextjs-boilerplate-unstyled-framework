import * as React from "react";
import { Button, type ButtonProps } from "./button";

export interface IconButtonProps extends Omit<ButtonProps, "aria-label" | "children"> {
  /** Required: an icon-only button has no visible text. */
  "aria-label": string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  return <Button ref={ref} data-icon-button="" {...props} />;
});
