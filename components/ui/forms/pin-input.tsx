"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";

export interface PinInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  type?: "numeric" | "alphanumeric";
  /** Show dots instead of characters. */
  mask?: boolean;
  /** Adds a hidden input so the code is submitted with native forms. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  /** Accessible name of each slot. Localize this. */
  getSlotLabel?: (index: number, length: number) => string;
}

const PATTERNS = { numeric: /[^0-9]/g, alphanumeric: /[^a-zA-Z0-9]/g };

/**
 * One-time-code input. Slots are plain <input>s: style them via
 * `[data-pin-input] input`, `[data-filled]`, `[data-invalid]`.
 */
export const PinInput = React.forwardRef<HTMLDivElement, PinInputProps>(function PinInput(props, ref) {
  const {
    length = 6,
    value: valueProp,
    defaultValue = "",
    onValueChange,
    onComplete,
    type = "numeric",
    mask = false,
    autoFocus,
    placeholder,
    getSlotLabel = (i, n) => `Character ${i + 1} of ${n}`,
    ...others
  } = props;
  const { rest, native, invalid, disabled, labelledBy, describedBy } = useFieldControl(others);

  const sanitize = React.useCallback(
    (s: string) => s.replace(PATTERNS[type], "").slice(0, length),
    [type, length]
  );

  const [value, setValue] = useControllableState({
    value: valueProp === undefined ? undefined : sanitize(valueProp),
    defaultValue: sanitize(defaultValue),
    onChange: (v) => {
      onValueChange?.(v);
      if (v.length === length) onComplete?.(v);
    },
  });

  const slots = React.useRef<(HTMLInputElement | null)[]>([]);
  const focusSlot = (i: number) => slots.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  const write = (index: number, incoming: string) => {
    const next = sanitize(value.slice(0, index) + incoming + value.slice(index + incoming.length));
    setValue(next);
    focusSlot(index + incoming.length);
  };

  const remove = (index: number) => setValue(value.slice(0, index) + value.slice(index + 1));

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-pin-input=""
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(disabled)}
      data-complete={dataAttr(value.length === length)}
      {...rest}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            slots.current[i] = el;
          }}
          type={mask ? "password" : "text"}
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          placeholder={placeholder}
          value={value[i] ?? ""}
          aria-label={getSlotLabel(i, length)}
          aria-invalid={invalid || undefined}
          aria-required={native.required || undefined}
          data-pin-input-slot=""
          data-index={i}
          data-filled={dataAttr(value[i])}
          data-invalid={dataAttr(invalid)}
          onFocus={(e) => {
            // No gaps: always land on the first empty slot.
            const target = Math.min(i, value.length, length - 1);
            if (target !== i) focusSlot(target);
            else e.currentTarget.select();
          }}
          onChange={(e) => {
            let incoming = e.target.value.replace(PATTERNS[type], "");
            if (incoming === "") return remove(i);
            const existing = value[i];
            // Cursor was after the existing char: keep only the newly typed one.
            if (existing && incoming.length === 2) incoming = incoming.replace(existing, "");
            write(i, incoming);
          }}
          onKeyDown={(e) => {
            switch (e.key) {
              case "Backspace":
                e.preventDefault();
                if (value[i]) remove(i);
                else if (i > 0) {
                  remove(i - 1);
                  focusSlot(i - 1);
                }
                break;
              case "Delete":
                e.preventDefault();
                remove(i);
                break;
              case "ArrowLeft":
                e.preventDefault();
                focusSlot(i - 1);
                break;
              case "ArrowRight":
                e.preventDefault();
                focusSlot(i + 1);
                break;
              case "Home":
                e.preventDefault();
                focusSlot(0);
                break;
              case "End":
                e.preventDefault();
                focusSlot(value.length);
                break;
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(PATTERNS[type], "");
            if (pasted) write(i, pasted);
          }}
        />
      ))}
      {native.name && <input type="hidden" name={native.name} value={value} />}
    </div>
  );
});
