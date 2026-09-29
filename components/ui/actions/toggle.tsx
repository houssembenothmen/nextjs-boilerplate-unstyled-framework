"use client";
import * as React from "react";
import { useControllableState } from "../utils/use-controllable-state";
import { Button, type ButtonProps } from "./button";

export interface ToggleProps extends Omit<ButtonProps, "pressed"> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

/** Two-state button. Style via [data-state="on"|"off"]. */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { pressed: pressedProp, defaultPressed = false, onPressedChange, onClick, ...props },
  ref
) {
  const [pressed, setPressed] = useControllableState({
    value: pressedProp,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  });
  return (
    <Button
      ref={ref}
      pressed={pressed}
      data-state={pressed ? "on" : "off"}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setPressed((p) => !p);
      }}
    />
  );
});
