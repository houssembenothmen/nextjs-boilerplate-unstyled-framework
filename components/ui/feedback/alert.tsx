import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, AsChildProps {
  /** success | warning | danger | info | any string. Exposed as [data-variant]. */
  variant?: string;
}

/** role="alert" by default; pass role="status" for non-urgent messages. Server-component safe. */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert({ asChild, variant, role = "alert", ...props }, ref) {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} role={role} data-alert="" data-variant={variant} {...props} />;
});

export const AlertTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & AsChildProps>(function AlertTitle({ asChild, ...props }, ref) {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} data-alert-title="" {...props} />;
});

export const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & AsChildProps>(function AlertDescription({ asChild, ...props }, ref) {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} data-alert-description="" {...props} />;
});
