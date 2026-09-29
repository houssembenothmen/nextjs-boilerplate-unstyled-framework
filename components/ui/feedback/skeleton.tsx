import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

/** Placeholder block. Hidden from assistive tech; give the loading region aria-busy yourself. Server-component safe. */
export const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & AsChildProps>(function Skeleton(
  { asChild, ...props },
  ref
) {
  const Comp: React.ElementType = asChild ? Slot : "div";
  return <Comp ref={ref} aria-hidden data-skeleton="" {...props} />;
});
