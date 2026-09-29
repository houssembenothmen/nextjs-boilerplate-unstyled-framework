import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, AsChildProps {
  /** Exposed as [data-variant] (or use any data-* you like). */
  variant?: string;
}

/** Server-component safe. */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ asChild, variant, ...props }, ref) {
  const Comp: React.ElementType = asChild ? Slot : "span";
  return <Comp ref={ref} data-badge="" data-variant={variant} {...props} />;
});
