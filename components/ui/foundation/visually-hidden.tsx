import * as React from "react";
import { Slot, type AsChildProps } from "./slot";

const style: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement>, AsChildProps {}

/** Hidden visually, still read by screen readers. Server-component safe. */
export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ asChild, style: userStyle, ...props }, ref) {
    const Comp: React.ElementType = asChild ? Slot : "span";
    return <Comp ref={ref} {...props} style={{ ...style, ...userStyle }} />;
  }
);
