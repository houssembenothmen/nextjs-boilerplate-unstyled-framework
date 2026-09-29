"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";
import { HiddenInput } from "./hidden-input";

const SwitchContext = React.createContext(false);

export interface SwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "value" | "defaultValue" | "onChange" | "checked" | "defaultChecked"
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  /** Submitted value when on. Default: "on". */
  value?: string;
  required?: boolean;
  invalid?: boolean;
  form?: string;
}

/** Style hooks: [data-state="checked"|"unchecked"] [data-invalid] [data-disabled] */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const { checked: checkedProp, defaultChecked = false, onCheckedChange, value = "on", onClick, form, children, ...others } = props;
  const field = useFieldControl(others);
  const [checked, setChecked] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  return (
    <>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-required={field.required || undefined}
        aria-invalid={field.invalid || undefined}
        aria-describedby={field.describedBy}
        id={field.id}
        value={value}
        disabled={field.disabled}
        data-state={checked ? "checked" : "unchecked"}
        data-invalid={dataAttr(field.invalid)}
        data-disabled={dataAttr(field.disabled)}
        {...field.rest}
        onClick={composeHandlers(onClick, () => setChecked((c) => !c))}
      >
        <SwitchContext.Provider value={checked}>{children}</SwitchContext.Provider>
      </button>
      <HiddenInput type="checkbox" name={field.name} value={value} checked={checked} disabled={field.disabled} form={form} />
    </>
  );
});

/** The moving part. Read [data-state] to position it. */
export const SwitchThumb = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function SwitchThumb(props, ref) {
    const checked = React.useContext(SwitchContext);
    return <span ref={ref} data-state={checked ? "checked" : "unchecked"} {...props} />;
  }
);
