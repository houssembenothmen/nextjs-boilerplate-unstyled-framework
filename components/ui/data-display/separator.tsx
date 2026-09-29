import * as React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  /** Purely visual: hidden from assistive tech. Default: true. */
  decorative?: boolean;
}

/** Server-component safe. */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = "horizontal", decorative = true, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative || orientation === "horizontal" ? undefined : "vertical"}
      data-separator=""
      data-orientation={orientation}
      {...props}
    />
  );
});
export { Separator as Divider };
