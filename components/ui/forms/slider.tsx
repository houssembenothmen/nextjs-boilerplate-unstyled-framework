"use client";
import * as React from "react";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";

export interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step" | "size"
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
}

/**
 * A native <input type="range"> (free keyboard + a11y + form support) that exposes
 * `--slider-progress` (0%-100%) so you can paint the filled track:
 *   input[type=range] { background: linear-gradient(to right, blue var(--slider-progress), gray 0) }
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider(props, ref) {
  const { value: valueProp, defaultValue, onValueChange, min = 0, max = 100, step = 1, style, ...others } = props;
  const { rest, native } = useFieldControl(others);
  const [value, setValue] = useControllableState<number>({
    value: valueProp,
    defaultValue: defaultValue ?? min,
    onChange: onValueChange,
  });
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      {...rest}
      {...native}
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      style={{ ["--slider-progress" as string]: `${progress}%`, ...style }}
    />
  );
});
