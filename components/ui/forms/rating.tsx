"use client";
import * as React from "react";
import { useDirection } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { getNextFocusTarget } from "../utils/roving";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";

export interface RatingItemState {
  /** 1-based position. */
  index: number;
  /** Item is at or below the current value. */
  filled: boolean;
  /** Item is at or below the hovered item. */
  highlighted: boolean;
}

export interface RatingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children" | "dir"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  /** Clicking the current value resets to 0. Default: true. */
  allowClear?: boolean;
  /** Render each item's content (your icon). Defaults to a "★" text glyph. */
  children?: (state: RatingItemState) => React.ReactNode;
  /** Accessible name of each item. Localize this. */
  getItemLabel?: (index: number, max: number) => string;
}

/**
 * Style hooks on each item: [data-state="filled"|"empty"] [data-highlighted]
 */
export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(function Rating(props, ref) {
  const {
    value: valueProp,
    defaultValue = 0,
    onValueChange,
    max = 5,
    readOnly = false,
    allowClear = true,
    children = () => "★",
    getItemLabel = (i, n) => `${i} of ${n}`,
    ...others
  } = props;
  const field = useFieldControl(others);
  const dir = useDirection();
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange: onValueChange });
  const [hover, setHover] = React.useState<number | null>(null);
  const interactive = !readOnly && !field.disabled;

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-labelledby={field.labelledBy}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-readonly={readOnly || undefined}
      data-rating=""
      data-value={value}
      data-invalid={dataAttr(field.invalid)}
      data-disabled={dataAttr(field.disabled)}
      data-readonly={dataAttr(readOnly)}
      {...field.rest}
      onPointerLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, k) => {
        const index = k + 1;
        const filled = index <= value;
        const highlighted = interactive && hover !== null && index <= hover;
        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={value === index}
            aria-label={getItemLabel(index, max)}
            disabled={field.disabled}
            aria-disabled={readOnly || undefined}
            tabIndex={interactive && (value === index || (value === 0 && index === 1)) ? 0 : -1}
            data-state={filled ? "filled" : "empty"}
            data-highlighted={dataAttr(highlighted)}
            onPointerEnter={(e) => {
              if (interactive && e.pointerType !== "touch") setHover(index);
            }}
            onClick={() => {
              if (!interactive) return;
              setValue(allowClear && value === index ? 0 : index);
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              const container = e.currentTarget.parentElement;
              if (!container) return;
              const next = getNextFocusTarget(e, container, {
                selector: '[role="radio"]',
                orientation: "both",
                loop: false,
                dir,
              });
              if (next) {
                e.preventDefault();
                if (next !== e.currentTarget) {
                  next.focus();
                  next.click();
                }
              }
            }}
          >
            {children({ index, filled, highlighted })}
          </button>
        );
      })}
      {field.name && <input type="hidden" name={field.name} value={value} />}
    </div>
  );
});
