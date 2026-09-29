"use client";
import * as React from "react";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";
import { ListboxContent, ListboxOptionItem, ListboxTrigger, useListboxRoot, type ListboxContentProps, type ListboxOptionProps, type ListboxTriggerProps } from "./listbox";

export interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Submits one hidden <input> per selected value. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  children?: React.ReactNode;
}

export function MultiSelect({ value, defaultValue = [], onValueChange, open, defaultOpen, onOpenChange, name, disabled, required, invalid, children, ...props }: MultiSelectProps) {
  const [values, setValues] = useControllableState<string[]>({ value, defaultValue, onChange: onValueChange });
  const field = useFieldControl({ name, disabled, required, invalid });
  const { ctx, ListboxContext } = useListboxRoot({
    open, defaultOpen, onOpenChange, value: values, onValuesChange: setValues, multiple: true, disabled: field.disabled,
  });
  return (
    <ListboxContext.Provider value={ctx}>
      <div data-multi-select="" {...props}>
        {children}
        {field.name && values.map((v) => <input key={v} type="hidden" name={field.name} value={v} />)}
      </div>
    </ListboxContext.Provider>
  );
}

export const MultiSelectTrigger = ListboxTrigger;
export const MultiSelectContent = ListboxContent;
export const MultiSelectOption = ListboxOptionItem;
export type { ListboxTriggerProps as MultiSelectTriggerProps, ListboxContentProps as MultiSelectContentProps, ListboxOptionProps as MultiSelectOptionProps };
