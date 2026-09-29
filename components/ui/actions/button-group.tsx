import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement>, AsChildProps {
  orientation?: "horizontal" | "vertical";
}

/** Groups related buttons. Style via [data-button-group] and [data-orientation]. Server-component safe. */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  { asChild, orientation = "horizontal", ...props },
  ref
) {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} role="group" data-button-group="" data-orientation={orientation} {...props} />;
});
