"use client";
import * as React from "react";
import { composeHandlers, composeRefs } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";

export interface RangeSliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: [number, number];
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Smallest gap enforced between the two thumbs. Default: 0. */
  minStepsBetween?: number;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Accessible names for each thumb. Localize these. */
  getThumbLabel?: (index: 0 | 1) => string;
}

/**
 * Two native <input type="range"> thumbs layered in one track (the standard,
 * fully-accessible approach — each thumb keeps native keyboard/touch support).
 * Root exposes --range-start / --range-end (0%-100%) to paint the filled section:
 * [data-range-slider] { background: linear-gradient(to right, gray 0, gray var(--range-start), blue var(--range-start), blue var(--range-end), gray var(--range-end)) }
 */
export const RangeSlider = React.forwardRef<HTMLDivElement, RangeSliderProps>(function RangeSlider(props, ref) {
  const {
    value, defaultValue, onValueChange, min = 0, max = 100, step = 1, minStepsBetween = 0,
    getThumbLabel = (i) => (i === 0 ? "Minimum" : "Maximum"), ...others
  } = props;
  const { rest, native, invalid, disabled } = useFieldControl(others);
  const [range, setRange] = useControllableState<[number, number]>({
    value,
    defaultValue: defaultValue ?? [min, max],
    onChange: onValueChange,
  });
  const gap = minStepsBetween * step;
  const startRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);

  const setStart = (n: number) => setRange([Math.min(n, range[1] - gap), range[1]]);
  const setEnd = (n: number) => setRange([range[0], Math.max(n, range[0] + gap)]);
  const pct = (n: number) => (max === min ? 0 : ((n - min) / (max - min)) * 100);

  return (
    <div
      ref={ref}
      data-range-slider=""
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      style={{
        position: "relative",
        ["--range-start" as string]: `${pct(range[0])}%`,
        ["--range-end" as string]: `${pct(range[1])}%`,
      }}
      {...rest}
    >
      <input
        ref={composeRefs(startRef)}
        type="range"
        aria-label={getThumbLabel(0)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        value={range[0]}
        data-range-thumb="start"
        style={{ position: "absolute", inset: 0, width: "100%", pointerEvents: "none" }}
        onChange={(e) => setStart(Number(e.target.value))}
        onKeyDown={composeHandlers(undefined, (e: React.KeyboardEvent) => {
          if (e.key === "ArrowRight" && Number(startRef.current?.value) >= range[1] - gap) endRef.current?.focus();
        })}
      />
      <input
        ref={composeRefs(endRef)}
        type="range"
        aria-label={getThumbLabel(1)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        value={range[1]}
        data-range-thumb="end"
        style={{ position: "absolute", inset: 0, width: "100%", pointerEvents: "none" }}
        onChange={(e) => setEnd(Number(e.target.value))}
      />
      {native.name && (
        <>
          <input type="hidden" name={`${native.name}-min`} value={range[0]} />
          <input type="hidden" name={`${native.name}-max`} value={range[1]} />
        </>
      )}
    </div>
  );
});
