"use client";
import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";
import { dataAttr } from "../utils/attrs";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, AsChildProps {
  /** Blocks interaction but keeps the button focusable. Sets aria-busy. */
  loading?: boolean;
  /** Toggle-button state. Sets aria-pressed. */
  pressed?: boolean;
}

/**
 * Style hooks: [data-loading] [data-disabled] [data-pressed]
 * Use any `data-*` you like for variants: <Button data-variant="primary" />
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild, loading = false, pressed, disabled = false, type, onClick, children, ...props },
  ref
) {
  const Comp: React.ElementType = asChild ? Slot : "button";
  const inert = disabled || loading;

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      aria-pressed={pressed}
      data-disabled={dataAttr(inert)}
      data-loading={dataAttr(loading)}
      data-pressed={dataAttr(pressed)}
      {...props}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (inert) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
    </Comp>
  );
});
