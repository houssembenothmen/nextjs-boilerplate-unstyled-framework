import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement>, AsChildProps {}

/** A plain <form> that also accepts `asChild`. Server-component safe. */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form({ asChild, ...props }, ref) {
  const Comp: React.ElementType = asChild ? Slot : "form";
  return <Comp ref={ref} {...props} />;
});
