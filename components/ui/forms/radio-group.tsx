"use client";
import * as React from "react";
import { useDirection } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { getNextFocusTarget } from "../utils/roving";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";
import { HiddenInput } from "./hidden-input";

interface Ctx {
  value: string;
  setValue: (v: string) => void;
  name?: string;
  disabled: boolean;
  loop: boolean;
  orientation: "horizontal" | "vertical";
  dir?: "ltr" | "rtl" | "auto";
}
const RadioContext = React.createContext<Ctx | null>(null);

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "dir"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(props, ref) {
  const { value: valueProp, defaultValue = "", onValueChange, orientation = "vertical", loop = true, ...others } = props;
  const field = useFieldControl(others);
  const dir = useDirection();
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange: onValueChange });

  const ctx = React.useMemo<Ctx>(
    () => ({ value, setValue, name: field.name, disabled: field.disabled, loop, orientation, dir }),
    [value, setValue, field.name, field.disabled, loop, orientation, dir]
  );

  return (
    <RadioContext.Provider value={ctx}>
      <div
        ref={ref}
        role="radiogroup"
        aria-labelledby={field.labelledBy}
        aria-describedby={field.describedBy}
        aria-required={field.required || undefined}
        aria-invalid={field.invalid || undefined}
        data-radio-group=""
        data-orientation={orientation}
        data-invalid={dataAttr(field.invalid)}
        data-disabled={dataAttr(field.disabled)}
        {...field.rest}
      />
    </RadioContext.Provider>
  );
});

const ItemContext = React.createContext(false);

export interface RadioGroupItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  value: string;
}

/**
 * Style hooks: [data-state="checked"|"unchecked"] [data-disabled].
 * Arrow keys move focus AND select, per the ARIA radio pattern.
 * With no selection every item is a tab stop; once selected, only that one is.
 */
export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(function RadioGroupItem(
  { value, disabled: disabledProp, onClick, onKeyDown, children, ...props },
  ref
) {
  const group = React.useContext(RadioContext);
  if (!group) throw new Error("RadioGroupItem must be used inside <RadioGroup>");
  const checked = group.value === value;
  const disabled = disabledProp || group.disabled;
  const hasSelection = group.value !== "";

  return (
    <>
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        value={value}
        disabled={disabled}
        tabIndex={checked || !hasSelection ? 0 : -1}
        data-state={checked ? "checked" : "unchecked"}
        data-disabled={dataAttr(disabled)}
        {...props}
        onClick={composeHandlers(onClick, () => group.setValue(value))}
        onKeyDown={composeHandlers(onKeyDown, (e) => {
          const container = e.currentTarget.closest<HTMLElement>('[role="radiogroup"]');
          if (!container) return;
          const next = getNextFocusTarget(e, container, {
            selector: '[role="radio"]',
            orientation: "both",
            loop: group.loop,
            dir: group.dir,
          });
          if (next && (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End")) {
            e.preventDefault();
            next.focus();
            next.click();
          }
        })}
      >
        <ItemContext.Provider value={checked}>{children}</ItemContext.Provider>
      </button>
      <HiddenInput type="radio" name={group.name} value={value} checked={checked} disabled={disabled} />
    </>
  );
});

export interface RadioGroupIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  forceMount?: boolean;
}

export const RadioGroupIndicator = React.forwardRef<HTMLSpanElement, RadioGroupIndicatorProps>(
  function RadioGroupIndicator({ forceMount, ...props }, ref) {
    const checked = React.useContext(ItemContext);
    if (!forceMount && !checked) return null;
    return <span ref={ref} data-state={checked ? "checked" : "unchecked"} {...props} />;
  }
);
