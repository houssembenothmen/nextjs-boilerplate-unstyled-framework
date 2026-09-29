"use client";
import * as React from "react";
import { useFieldControl } from "../forms/form-field";
import { dataAttr } from "../utils/attrs";
import { useControllableState } from "../utils/use-controllable-state";

export interface TimePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** 24-hour "HH:mm", like <input type="time">. null = empty. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  hourCycle?: 12 | 24;
  /** Arrow up/down step for minutes. Default: 1. */
  minuteStep?: number;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  /** Segment accessible names. Localize these. */
  labels?: { hour?: string; minute?: string; period?: string };
  /** AM / PM text. Localize these. */
  periodLabels?: { am: string; pm: string };
}

type Parts = { h: number | null; m: number | null };

function parse(v: string | null | undefined): Parts {
  const m = v ? /^(\d{1,2}):(\d{2})/.exec(v) : null;
  return m ? { h: Math.min(23, +m[1]!), m: Math.min(59, +m[2]!) } : { h: null, m: null };
}
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Segmented time field: [HH] : [mm] [AM|PM]. Each segment is a real <input>
 * (style via [data-time-segment]). Type digits, or use ↑ ↓ (PageUp / PageDown ±10 min).
 */
export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(function TimePicker(props, ref) {
  const {
    value: valueProp, defaultValue = null, onValueChange, hourCycle = 24, minuteStep = 1,
    labels = {}, periodLabels = { am: "AM", pm: "PM" }, ...others
  } = props;
  const { rest, native, invalid, disabled, labelledBy, describedBy } = useFieldControl(others);
  const [value, setValue] = useControllableState<string | null>({ value: valueProp, defaultValue, onChange: onValueChange });
  const [parts, setParts] = React.useState<Parts>(() => parse(value));
  const [buffer, setBuffer] = React.useState<{ seg: "h" | "m"; text: string } | null>(null);
  const refs = { h: React.useRef<HTMLInputElement>(null), m: React.useRef<HTMLInputElement>(null), p: React.useRef<HTMLInputElement>(null) };

  // Sync from outside when the controlled value differs from what we hold.
  React.useEffect(() => {
    const p = parse(value);
    if (value === null) setParts((cur) => (cur.h === null && cur.m === null ? cur : cur.h !== null && cur.m !== null ? { h: null, m: null } : cur));
    else setParts((cur) => (cur.h === p.h && cur.m === p.m ? cur : p));
  }, [value]);

  const commit = (next: Parts) => {
    setParts(next);
    setValue(next.h !== null && next.m !== null ? `${pad(next.h)}:${pad(next.m)}` : null);
  };

  const is12 = hourCycle === 12;
  const isPM = parts.h !== null && parts.h >= 12;
  const displayHour = parts.h === null ? "" : pad(is12 ? parts.h % 12 || 12 : parts.h);
  const displayMin = parts.m === null ? "" : pad(parts.m);

  const setHour12 = (h12: number, pm: boolean) => (h12 % 12) + (pm ? 12 : 0);
  const wrap = (n: number, max: number) => ((n % max) + max) % max;

  const step = (seg: "h" | "m", delta: number) => {
    if (seg === "h") {
      const cur = parts.h ?? (delta > 0 ? -1 : 0);
      commit({ ...parts, h: wrap(cur + delta, 24), m: parts.m ?? 0 });
    } else {
      const cur = parts.m ?? (delta > 0 ? -delta : 0);
      commit({ ...parts, m: wrap(cur + delta, 60), h: parts.h ?? 0 });
    }
  };

  const onDigit = (seg: "h" | "m", digit: string) => {
    const text = (buffer?.seg === seg ? buffer.text : "") + digit;
    const n = Number(text);
    const max = seg === "m" ? 59 : is12 ? 12 : 23;
    const min = seg === "h" && is12 ? 1 : 0;
    const firstCap = seg === "m" ? 5 : is12 ? 1 : 2;
    const complete = text.length === 2 || Number(digit) > firstCap;
    if (n > max || (complete && n < min)) return setBuffer(null);
    const val = seg === "h" ? (is12 ? setHour12(n, isPM) : n) : n;
    commit(seg === "h" ? { h: val, m: parts.m ?? 0 } : { h: parts.h ?? 0, m: val });
    if (complete) {
      setBuffer(null);
      (seg === "h" ? refs.m : refs.p).current?.focus();
    } else setBuffer({ seg, text });
  };

  const segKeys = (seg: "h" | "m") => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(e.key)) return (e.preventDefault(), onDigit(seg, e.key));
    if (e.key === "ArrowUp") return (e.preventDefault(), step(seg, seg === "m" ? minuteStep : 1));
    if (e.key === "ArrowDown") return (e.preventDefault(), step(seg, seg === "m" ? -minuteStep : -1));
    if (seg === "m" && e.key === "PageUp") return (e.preventDefault(), step("m", 10));
    if (seg === "m" && e.key === "PageDown") return (e.preventDefault(), step("m", -10));
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setBuffer(null);
      return commit(seg === "h" ? { h: null, m: null } : { ...parts, m: null });
    }
    if (e.key === ":" || (e.key === "ArrowRight" && seg === "h" && !e.shiftKey && getComputedStyle(e.currentTarget).direction !== "rtl")) {
      e.preventDefault();
      if (seg === "h") refs.m.current?.focus();
    }
    if (e.key === "ArrowLeft" && seg === "m" && getComputedStyle(e.currentTarget).direction !== "rtl") {
      e.preventDefault();
      refs.h.current?.focus();
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) e.preventDefault();
  };

  const togglePeriod = (pm: boolean) => {
    if (parts.h === null) return commit({ h: pm ? 12 : 0, m: parts.m ?? 0 });
    commit({ ...parts, h: setHour12(parts.h % 12, pm) });
  };

  const common = { disabled, inputMode: "numeric" as const, autoComplete: "off", "aria-invalid": invalid || undefined, "data-time-segment": "", onBlur: () => setBuffer(null), onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.currentTarget.select() };

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-time-picker=""
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(disabled)}
      {...rest}
    >
      <input
        ref={refs.h}
        id={native.id}
        role="spinbutton"
        aria-label={labels.hour ?? "Hour"}
        aria-valuemin={is12 ? 1 : 0}
        aria-valuemax={is12 ? 12 : 23}
        aria-valuenow={parts.h === null ? undefined : is12 ? parts.h % 12 || 12 : parts.h}
        placeholder="––"
        value={displayHour}
        onChange={() => {}}
        onKeyDown={segKeys("h")}
        data-segment="hour"
        {...common}
      />
      <span aria-hidden data-time-separator="">:</span>
      <input
        ref={refs.m}
        role="spinbutton"
        aria-label={labels.minute ?? "Minute"}
        aria-valuemin={0}
        aria-valuemax={59}
        aria-valuenow={parts.m ?? undefined}
        placeholder="––"
        value={displayMin}
        onChange={() => {}}
        onKeyDown={segKeys("m")}
        data-segment="minute"
        {...common}
      />
      {is12 && (
        <input
          ref={refs.p}
          role="spinbutton"
          aria-label={labels.period ?? "AM/PM"}
          aria-valuetext={parts.h === null ? undefined : isPM ? periodLabels.pm : periodLabels.am}
          aria-valuenow={parts.h === null ? undefined : isPM ? 1 : 0}
          aria-valuemin={0}
          aria-valuemax={1}
          placeholder="––"
          value={parts.h === null ? "" : isPM ? periodLabels.pm : periodLabels.am}
          onChange={() => {}}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") return (e.preventDefault(), togglePeriod(!isPM));
            if (e.key.toLowerCase() === periodLabels.am[0]!.toLowerCase()) return (e.preventDefault(), togglePeriod(false));
            if (e.key.toLowerCase() === periodLabels.pm[0]!.toLowerCase()) return (e.preventDefault(), togglePeriod(true));
            if (e.key === "ArrowLeft" && getComputedStyle(e.currentTarget).direction !== "rtl") (e.preventDefault(), refs.m.current?.focus());
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) e.preventDefault();
          }}
          data-segment="period"
          {...common}
        />
      )}
      {native.name && <input type="hidden" name={native.name} value={value ?? ""} />}
    </div>
  );
});
