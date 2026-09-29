import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

/** A bare wrapper: `asChild` lets it be an <article>, <a>, <li>... Server-component safe. */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & AsChildProps>(function Card({ asChild, ...props }, ref) {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} data-card="" {...props} />;
});
