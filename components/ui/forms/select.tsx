"use client";
import * as React from "react";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";
import { ListboxContent, ListboxOptionItem, ListboxTrigger, useListboxRoot, type ListboxContentProps, type ListboxOptionProps, type ListboxTriggerProps } from "./listbox";

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  children?: React.ReactNode;
}

/** Custom single-select listbox. Use <NativeSelect> instead when you don't need custom option rendering. */
export function Select({ value, defaultValue = "", onValueChange, open, defaultOpen, onOpenChange, name, disabled, required, invalid, children, ...props }: SelectProps) {
  const [selected, setSelected] = useControllableState<string>({ value, defaultValue, onChange: onValueChange });
  const field = useFieldControl({ name, disabled, required, invalid });
  const { ctx, ListboxContext } = useListboxRoot({
    open, defaultOpen, onOpenChange,
    value: selected ? [selected] : [],
    onValuesChange: (v) => setSelected(v[0] ?? ""),
    multiple: false,
    disabled: field.disabled,
  });
  return (
    <ListboxContext.Provider value={ctx}>
      <div data-select="" {...props}>
        {children}
        {field.name && <input type="hidden" name={field.name} value={selected} required={field.required} />}
      </div>
    </ListboxContext.Provider>
  );
}

export const SelectTrigger = ListboxTrigger;
export const SelectContent = ListboxContent;
export const SelectOption = ListboxOptionItem;
export type { ListboxTriggerProps as SelectTriggerProps, ListboxContentProps as SelectContentProps, ListboxOptionProps as SelectOptionProps };
