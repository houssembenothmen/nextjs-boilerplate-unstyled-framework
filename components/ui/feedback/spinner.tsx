import * as React from "react";
import { VisuallyHidden } from "../foundation/visually-hidden";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Announced by screen readers. Localize this. */
  label?: string;
}

/**
 * Empty element for you to draw (CSS border, background, or pass an <svg> as children).
 * Server-component safe.
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner({ label = "Loading", children, ...props }, ref) {
  return (
    <span ref={ref} role="status" data-spinner="" {...props}>
      {children}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
});
