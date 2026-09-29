"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";
import { HiddenInput } from "./hidden-input";

export type CheckedState = boolean | "indeterminate";
type State = "checked" | "unchecked" | "indeterminate";

const toState = (c: CheckedState): State => (c === "indeterminate" ? "indeterminate" : c ? "checked" : "unchecked");

/* ---------------------------- group context ---------------------------- */

interface GroupCtx {
  values: string[];
  setChecked: (value: string, checked: boolean) => void;
  name?: string;
  disabled: boolean;
}
const GroupContext = React.createContext<GroupCtx | null>(null);

export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Applied to every checkbox's hidden input; submits one entry per checked value. */
  name?: string;
  disabled?: boolean;
}

export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(function CheckboxGroup(
  { value: valueProp, defaultValue = [], onValueChange, name, disabled = false, ...props },
  ref
) {
  const field = useFieldControl({ name, disabled });
  const [values, setValues] = useControllableState<string[]>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  });

  const ctx = React.useMemo<GroupCtx>(
    () => ({
      values,
      name: field.name,
      disabled: field.disabled,
      setChecked: (v, checked) =>
        setValues((prev) => (checked ? (prev.includes(v) ? prev : [...prev, v]) : prev.filter((x) => x !== v))),
    }),
    [values, field.name, field.disabled, setValues]
  );

  return (
    <GroupContext.Provider value={ctx}>
      <div
        ref={ref}
        role="group"
        aria-labelledby={field.labelledBy}
        aria-describedby={field.describedBy}
        data-checkbox-group=""
        data-disabled={dataAttr(field.disabled)}
        {...props}
      />
    </GroupContext.Provider>
  );
});

/* ------------------------------ checkbox ------------------------------- */

const CheckboxContext = React.createContext<State>("unchecked");

export interface CheckboxProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "value" | "defaultValue" | "onChange" | "checked" | "defaultChecked"
  > {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  /** Inside a CheckboxGroup: this checkbox's entry in the group value. Otherwise: submitted value. */
  value?: string;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  form?: string;
}

/**
 * Headless checkbox (button[role=checkbox]).
 * Style hooks: [data-state="checked"|"unchecked"|"indeterminate"] [data-invalid] [data-disabled]
 * Note: `required` sets aria-required only; validate in your form logic.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(props, ref) {
  const {
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    value,
    onClick,
    onKeyDown,
    form,
    children,
    ...others
  } = props;
  const group = React.useContext(GroupContext);
  const grouped = group !== null && value !== undefined;

  const field = useFieldControl(others);
  const [own, setOwn] = useControllableState<CheckedState>({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: (c) => onCheckedChange?.(c === true),
  });

  const checked: CheckedState = grouped ? group.values.includes(value) : own;
  const state = toState(checked);
  const disabled = field.disabled || (group?.disabled ?? false);
  const name = field.name ?? group?.name;

  return (
    <>
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={state === "indeterminate" ? "mixed" : state === "checked"}
        aria-required={field.required || undefined}
        aria-invalid={field.invalid || undefined}
        aria-describedby={field.describedBy}
        id={field.id}
        value={value}
        disabled={disabled}
        data-state={state}
        data-invalid={dataAttr(field.invalid)}
        data-disabled={dataAttr(disabled)}
        {...field.rest}
        onKeyDown={composeHandlers(onKeyDown, (e) => {
          if (e.key === "Enter") e.preventDefault(); // checkboxes toggle on Space only
        })}
        onClick={composeHandlers(onClick, () => {
          const next = checked === "indeterminate" ? true : !checked;
          if (grouped) {
            group.setChecked(value, next);
            onCheckedChange?.(next);
          } else setOwn(next);
        })}
      >
        <CheckboxContext.Provider value={state}>{children}</CheckboxContext.Provider>
      </button>
      <HiddenInput
        type="checkbox"
        name={name}
        value={value ?? "on"}
        checked={state === "checked"}
        disabled={disabled}
        form={form}
      />
    </>
  );
});

export interface CheckboxIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Render even when unchecked (useful for CSS transitions). */
  forceMount?: boolean;
}

/** Only renders while checked / indeterminate, unless forceMount. */
export const CheckboxIndicator = React.forwardRef<HTMLSpanElement, CheckboxIndicatorProps>(
  function CheckboxIndicator({ forceMount, ...props }, ref) {
    const state = React.useContext(CheckboxContext);
    if (!forceMount && state === "unchecked") return null;
    return <span ref={ref} data-state={state} {...props} />;
  }
);
