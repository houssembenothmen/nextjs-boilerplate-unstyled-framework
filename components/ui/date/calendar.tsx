"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { useControllableState } from "../utils/use-controllable-state";
import {
  addDays, addMonths, compareDay, formatFullDate, formatMonthYear, getMonthGrid, getWeekdayNames, getWeekStart,
  isSameDay, isSameMonth, startOfDay, startOfMonth,
} from "./date-utils";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface CommonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Visible month (controlled). */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** BCP 47 tag, e.g. "fr", "ar-TN". Default: runtime locale. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Default: derived from locale. */
  weekStartsOn?: number;
  minDate?: Date;
  maxDate?: Date;
  isDateDisabled?: (date: Date) => boolean;
  /** Render days from adjacent months. Default: true. */
  showOutsideDays?: boolean;
  /** aria-labels, localize these. */
  previousLabel?: string;
  nextLabel?: string;
  /** Icons for the month buttons. Flip them for RTL with CSS. */
  previousIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
}

export type CalendarProps = CommonProps &
  (
    | { mode?: "single"; value?: Date | null; defaultValue?: Date | null; onValueChange?: (date: Date | null) => void }
    | { mode: "range"; value?: DateRange; defaultValue?: DateRange; onValueChange?: (range: DateRange) => void }
  );

/**
 * Accessible month grid. Keyboard: arrows (day/week), Home/End (week), PageUp/PageDown (month),
 * Shift+PageUp/PageDown (year), Enter/Space select.
 * Day hooks: [data-selected] [data-today] [data-outside] [data-disabled] [data-range-start|middle|end] [data-focused]
 */
export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(function Calendar(props, ref) {
  const {
    mode = "single", value, defaultValue, onValueChange, month: monthProp, defaultMonth, onMonthChange, locale,
    weekStartsOn: weekStartProp, minDate, maxDate, isDateDisabled, showOutsideDays = true,
    previousLabel = "Previous month", nextLabel = "Next month", previousIcon = "‹", nextIcon = "›", ...rest
  } = props as CommonProps & {
    mode?: "single" | "range";
    value?: Date | null | DateRange;
    defaultValue?: Date | null | DateRange;
    onValueChange?: ((value: Date | null) => void) | ((value: DateRange) => void);
  };

  const range = mode === "range";
  const handleValueChange = React.useCallback(
    (next: Date | null | DateRange) => {
      if (range) {
        (onValueChange as ((value: DateRange) => void) | undefined)?.(next as DateRange);
        return;
      }
      (onValueChange as ((value: Date | null) => void) | undefined)?.(next as Date | null);
    },
    [onValueChange, range]
  );

  const [selected, setSelected] = useControllableState<Date | null | DateRange>({
    value,
    defaultValue: defaultValue ?? (range ? { from: null, to: null } : null),
    onChange: handleValueChange,
  });
  const anchor = range ? ((selected as DateRange).from ?? new Date()) : ((selected as Date | null) ?? new Date());
  const [month, setMonth] = useControllableState<Date>({
    value: monthProp ? startOfMonth(monthProp) : undefined,
    defaultValue: startOfMonth(defaultMonth ?? anchor),
    onChange: onMonthChange,
  });

  const weekStartsOn = weekStartProp ?? getWeekStart(locale);
  const today = startOfDay(new Date());
  const [focused, setFocused] = React.useState<Date>(() => (isSameMonth(today, month) ? today : month));
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const shouldFocus = React.useRef(false);
  const [hover, setHover] = React.useState<Date | null>(null);

  // Keep the roving day inside the visible month.
  const focusDay = isSameMonth(focused, month) ? focused : isSameMonth(today, month) ? today : month;

  React.useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[data-focused]')?.focus();
  });

  const disabled = (d: Date) =>
    Boolean((minDate && compareDay(d, minDate) < 0) || (maxDate && compareDay(d, maxDate) > 0) || isDateDisabled?.(d));

  const moveFocus = (next: Date) => {
    shouldFocus.current = true;
    setFocused(next);
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next));
  };

  const select = (d: Date) => {
    if (disabled(d)) return;
    setFocused(d);
    if (!range) return setSelected(isSameDay(selected as Date | null, d) ? null : d);
    const r = selected as DateRange;
    if (!r.from || (r.from && r.to)) setSelected({ from: d, to: null });
    else setSelected(compareDay(d, r.from) < 0 ? { from: d, to: r.from } : { from: r.from, to: d });
  };

  const weeks = getMonthGrid(month, weekStartsOn);
  const names = getWeekdayNames(locale, weekStartsOn);
  const labelId = React.useId();
  const rangeNow = range ? (selected as DateRange) : null;
  const previewTo = rangeNow && rangeNow.from && !rangeNow.to && hover ? hover : rangeNow?.to ?? null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, d: Date) => {
    const map: Record<string, Date | undefined> = {
      ArrowLeft: addDays(d, getComputedStyle(e.currentTarget).direction === "rtl" ? 1 : -1),
      ArrowRight: addDays(d, getComputedStyle(e.currentTarget).direction === "rtl" ? -1 : 1),
      ArrowUp: addDays(d, -7),
      ArrowDown: addDays(d, 7),
      Home: addDays(d, -((d.getDay() - weekStartsOn + 7) % 7)),
      End: addDays(d, 6 - ((d.getDay() - weekStartsOn + 7) % 7)),
      PageUp: e.shiftKey ? addMonths(d, -12) : addMonths(d, -1),
      PageDown: e.shiftKey ? addMonths(d, 12) : addMonths(d, 1),
    };
    const next = map[e.key];
    if (next) {
      e.preventDefault();
      moveFocus(next);
    }
  };

  return (
    <div ref={ref} data-calendar="" data-mode={mode} {...rest}>
      <div data-calendar-header="">
        <button type="button" aria-label={previousLabel} data-calendar-previous="" onClick={() => setMonth(addMonths(month, -1))}>
          {previousIcon}
        </button>
        <div id={labelId} aria-live="polite" data-calendar-title="">
          {formatMonthYear(month, locale)}
        </div>
        <button type="button" aria-label={nextLabel} data-calendar-next="" onClick={() => setMonth(addMonths(month, 1))}>
          {nextIcon}
        </button>
      </div>
      <div ref={gridRef} role="grid" aria-labelledby={labelId} data-calendar-grid="">
        <div role="row" data-calendar-weekdays="">
          {names.map((n) => (
            <div key={n.day} role="columnheader" aria-label={n.long} data-calendar-weekday="">
              {n.label}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" data-calendar-week="">
            {week.map((d) => {
              const outside = !isSameMonth(d, month);
              const isDisabled = disabled(d);
              const isFocus = isSameDay(d, focusDay);
              const single = !range && isSameDay(selected as Date | null, d);
              const start = rangeNow && isSameDay(rangeNow.from, d);
              const end = previewTo && isSameDay(previewTo, d);
              const middle = rangeNow?.from && previewTo && compareDay(d, rangeNow.from) > 0 && compareDay(d, previewTo) < 0;
              const isSelected = single || Boolean(start) || Boolean(end && rangeNow?.to);
              if (outside && !showOutsideDays) return <div key={d.getTime()} role="gridcell" data-calendar-empty="" />;
              return (
                <div key={d.getTime()} role="gridcell" aria-selected={isSelected || undefined}>
                  <button
                    type="button"
                    tabIndex={isFocus ? 0 : -1}
                    disabled={isDisabled}
                    aria-label={formatFullDate(d, locale)}
                    aria-current={isSameDay(d, today) ? "date" : undefined}
                    data-calendar-day=""
                    data-focused={dataAttr(isFocus)}
                    data-selected={dataAttr(isSelected)}
                    data-today={dataAttr(isSameDay(d, today))}
                    data-outside={dataAttr(outside)}
                    data-disabled={dataAttr(isDisabled)}
                    data-range-start={dataAttr(start)}
                    data-range-end={dataAttr(end)}
                    data-range-middle={dataAttr(middle)}
                    onClick={() => select(d)}
                    onFocus={() => setFocused(d)}
                    onPointerEnter={() => range && setHover(d)}
                    onKeyDown={(e) => onKeyDown(e, d)}
                  >
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
