"use client";
import * as React from "react";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { Input, type InputProps } from "./input";

export interface NumberInputProps
  extends Omit<InputProps, "value" | "defaultValue" | "type" | "min" | "max" | "step" | "onChange"> {
  value?: number | null;
  defaultValue?: number | null;
  /** Fires with a number, or null when the field is empty / incomplete. */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** ArrowUp / ArrowDown step. Shift multiplies by 10. Default: 1. */
  step?: number;
  /** Clamp to min/max when the field loses focus. Default: true. */
  clampOnBlur?: boolean;
}

const format = (n: number | null) => (n === null ? "" : String(n));

function parse(text: string): number | null {
  const t = text.trim();
  if (t === "" || t === "-" || t === "." || t === "-.") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Text input with numeric semantics. Keeps the raw text while typing ("1.", "-")
 * and emits real numbers through onValueChange.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value: valueProp, defaultValue = null, onValueChange, min, max, step = 1, clampOnBlur = true, onBlur, onKeyDown, ...props },
  ref
) {
  const [value, setValue] = useControllableState<number | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });
  const [text, setText] = React.useState(() => format(value));

  // Sync text when the value changes from outside (controlled updates).
  React.useEffect(() => {
    setText((prev) => (parse(prev) === value ? prev : format(value)));
  }, [value]);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const decimals = String(step).split(".")[1]?.length ?? 0;

  const commit = (n: number | null) => {
    setText(format(n));
    setValue(n);
  };

  const stepBy = (delta: number) => {
    const base = value ?? (min !== undefined && min > 0 ? min : 0);
    commit(clamp(Number((base + delta).toFixed(decimals))));
  };

  return (
    <Input
      ref={ref}
      inputMode="decimal"
      autoComplete="off"
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value ?? undefined}
      {...props}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        if (!/^-?\d*\.?\d*$/.test(next)) return;
        setText(next);
        setValue(parse(next));
      }}
      onKeyDown={composeHandlers(onKeyDown, (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          stepBy((e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
        }
      })}
      onBlur={composeHandlers(onBlur, () => {
        if (value === null) return setText("");
        commit(clampOnBlur ? clamp(value) : value);
      })}
    />
  );
});
