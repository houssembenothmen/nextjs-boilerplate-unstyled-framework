import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

type Div = React.HTMLAttributes<HTMLDivElement> & AsChildProps;

function part(name: string, tag: "div" | "h3" | "p" = "div") {
  return React.forwardRef<HTMLDivElement, Div>(function Part({ asChild, ...props }, ref) {
    const Comp: React.ElementType = asChild ? Slot : tag;
    return <Comp ref={ref} {...{ [`data-${name}`]: "" }} {...props} />;
  });
}

/** Structure only: <EmptyState><EmptyStateIcon/><EmptyStateTitle/><EmptyStateDescription/><EmptyStateActions/></EmptyState> */
export const EmptyState = part("empty-state");
export const EmptyStateIcon = part("empty-state-icon");
export const EmptyStateTitle = part("empty-state-title", "h3");
export const EmptyStateDescription = part("empty-state-description", "p");
export const EmptyStateActions = part("empty-state-actions");
