"use client";
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger, type PopoverContentProps, type PopoverTriggerProps } from "../overlays/popover";
import { useFieldControl } from "../forms/form-field";
import { dataAttr } from "../utils/attrs";
import { useControllableState } from "../utils/use-controllable-state";
import { Calendar, type CalendarProps, type DateRange } from "./calendar";
import { toISODate } from "./date-utils";

type CalendarOverrides = Partial<Omit<Extract<CalendarProps, { mode?: "single" }>, "mode" | "value" | "defaultValue" | "onValueChange">>;

interface Ctx {
  mode: "single" | "range";
  value: Date | null | DateRange;
  open: boolean;
  setOpen: (o: boolean) => void;
  select: (v: Date | null | DateRange) => void;
  locale?: string;
  format: Intl.DateTimeFormatOptions;
  invalid: boolean;
  disabled: boolean;
  triggerProps: { id?: string; "aria-describedby"?: string; "aria-invalid"?: true };
}
const PickerCtx = React.createContext<Ctx | null>(null);
const usePicker = () => {
  const c = React.useContext(PickerCtx);
  if (!c) throw new Error("DatePicker parts must be used inside <DatePicker> or <DateRangePicker>");
  return c;
};

interface BaseProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  locale?: string;
  /** Intl.DateTimeFormat options for the trigger text. Default: { dateStyle: "medium" }. */
  format?: Intl.DateTimeFormatOptions;
  /** Submitted as yyyy-mm-dd (range: `${name}-from` / `${name}-to`). */
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  id?: string;
  "aria-describedby"?: string;
  children?: React.ReactNode;
}

function usePickerState(props: BaseProps, mode: "single" | "range", value: Date | null | DateRange, select: (v: Date | null | DateRange) => void) {
  const [open, setOpen] = useControllableState({ value: props.open, defaultValue: props.defaultOpen ?? false, onChange: props.onOpenChange });
  const field = useFieldControl({ id: props.id, name: props.name, disabled: props.disabled, invalid: props.invalid, required: props.required, "aria-describedby": props["aria-describedby"] });
  const ctx: Ctx = {
    mode, value, open, setOpen, select, locale: props.locale, format: props.format ?? { dateStyle: "medium" },
    invalid: field.invalid, disabled: field.disabled,
    triggerProps: { id: field.id, "aria-describedby": field.describedBy, "aria-invalid": field.invalid || undefined },
  };
  return { ctx, field, open, setOpen };
}

export interface DatePickerProps extends BaseProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
}

/**
 * <DatePicker><DatePickerTrigger placeholder="Pick a date"/><DatePickerContent/></DatePicker>
 */
export function DatePicker(props: DatePickerProps) {
  const [value, setValue] = useControllableState<Date | null>({ value: props.value, defaultValue: props.defaultValue ?? null, onChange: props.onValueChange });
  const { ctx, field, open, setOpen } = usePickerState(props, "single", value, (v: Date | null | DateRange) => {
    const next = v as Date | null;
    setValue(next);
    setOpen(false);
  });
  return (
    <PickerCtx.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        {props.children}
      </Popover>
      {field.name && <input type="hidden" name={field.name} value={value ? toISODate(value) : ""} />}
    </PickerCtx.Provider>
  );
}

export interface DateRangePickerProps extends BaseProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange) => void;
}

export function DateRangePicker(props: DateRangePickerProps) {
  const [value, setValue] = useControllableState<DateRange>({ value: props.value, defaultValue: props.defaultValue ?? { from: null, to: null }, onChange: props.onValueChange });
  const { ctx, field, open, setOpen } = usePickerState(props, "range", value, (v: Date | null | DateRange) => {
    const next = v as DateRange;
    setValue(next);
    if (next.from && next.to) setOpen(false);
  });
  return (
    <PickerCtx.Provider value={ctx}>
      <Popover open={open} onOpenChange={setOpen}>
        {props.children}
      </Popover>
      {field.name && (
        <>
          <input type="hidden" name={`${field.name}-from`} value={value.from ? toISODate(value.from) : ""} />
          <input type="hidden" name={`${field.name}-to`} value={value.to ? toISODate(value.to) : ""} />
        </>
      )}
    </PickerCtx.Provider>
  );
}

export interface DatePickerTriggerProps extends PopoverTriggerProps {
  /** Shown when no date is chosen. */
  placeholder?: React.ReactNode;
  /** Separator between range ends. Default: " – ". */
  rangeSeparator?: string;
}

export const DatePickerTrigger = React.forwardRef<HTMLButtonElement, DatePickerTriggerProps>(function DatePickerTrigger(
  { placeholder = "Select date", rangeSeparator = " – ", children, ...props },
  ref
) {
  const c = usePicker();
  const fmt = new Intl.DateTimeFormat(c.locale, c.format);
  let text: string | null = null;
  if (c.mode === "single") text = c.value ? fmt.format(c.value as Date) : null;
  else {
    const r = c.value as DateRange;
    text = r.from ? fmt.format(r.from) + (r.to ? rangeSeparator + fmt.format(r.to) : "") : null;
  }
  return (
    <PopoverTrigger
      ref={ref}
      disabled={c.disabled}
      aria-haspopup="dialog"
      data-invalid={dataAttr(c.invalid)}
      data-disabled={dataAttr(c.disabled)}
      data-placeholder={dataAttr(text === null)}
      {...c.triggerProps}
      {...props}
    >
      {children ?? text ?? placeholder}
    </PopoverTrigger>
  );
});

export interface DatePickerContentProps extends PopoverContentProps {
  calendarProps?: CalendarOverrides;
}

export const DatePickerContent = React.forwardRef<HTMLDivElement, DatePickerContentProps>(function DatePickerContent(
  { calendarProps, children, ...props },
  ref
) {
  const c = usePicker();
  return (
    <PopoverContent ref={ref} data-date-picker-content="" {...props}>
      {c.mode === "single" ? (
        <Calendar mode="single" locale={c.locale} {...calendarProps} value={c.value as Date | null} onValueChange={c.select as (d: Date | null) => void} />
      ) : (
        <Calendar mode="range" locale={c.locale} {...calendarProps} value={c.value as DateRange} onValueChange={c.select as (r: DateRange) => void} />
      )}
      {children}
    </PopoverContent>
  );
});
