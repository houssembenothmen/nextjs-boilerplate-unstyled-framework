"use client";
import * as React from "react";
import { useDirection } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { getNextFocusTarget } from "../utils/roving";
import { useControllableState } from "../utils/use-controllable-state";
import { CollapsePanel } from "./collapse-panel";

interface BaseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  disabled?: boolean;
}
export type AccordionProps = BaseProps &
  (
    | { type: "single"; value?: string; defaultValue?: string; onValueChange?: (v: string) => void; /** Allow closing the open item. Default: false. */ collapsible?: boolean }
    | { type: "multiple"; value?: string[]; defaultValue?: string[]; onValueChange?: (v: string[]) => void; collapsible?: never }
  );

interface Ctx {
  values: string[];
  toggle: (v: string) => void;
  disabled: boolean;
}
const AccordionCtx = React.createContext<Ctx | null>(null);
const ItemCtx = React.createContext<{ value: string; open: boolean; disabled: boolean; triggerId: string; contentId: string } | null>(null);

const toArray = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : v === "" ? [] : [v]);

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(function Accordion(props, ref) {
  const { type, value, defaultValue, onValueChange, collapsible = false, disabled = false, onKeyDown, ...rest } = props as BaseProps & {
    type: "single" | "multiple"; value?: string | string[]; defaultValue?: string | string[]; onValueChange?: ((value: string) => void) | ((value: string[]) => void); collapsible?: boolean;
  };
  const dir = useDirection();
  const single = type === "single";
  const handleValueChange = React.useCallback(
    (next: string | string[]) => {
      if (single) {
        (onValueChange as ((value: string) => void) | undefined)?.(next as string);
        return;
      }
      (onValueChange as ((value: string[]) => void) | undefined)?.(next as string[]);
    },
    [onValueChange, single]
  );

  const [values, setValues] = useControllableState<string[]>({
    value: value === undefined ? undefined : toArray(value),
    defaultValue: toArray(defaultValue),
    onChange: (v) => handleValueChange(single ? (v[0] ?? "") : v),
  });
  const toggle = React.useCallback(
    (v: string) =>
      setValues((prev) => {
        if (prev.includes(v)) return single && !collapsible ? prev : prev.filter((x) => x !== v);
        return single ? [v] : [...prev, v];
      }),
    [setValues, single, collapsible]
  );
  const ctx = React.useMemo(() => ({ values, toggle, disabled }), [values, toggle, disabled]);
  return (
    <AccordionCtx.Provider value={ctx}>
      <div
        ref={ref}
        data-accordion=""
        data-disabled={dataAttr(disabled)}
        {...rest}
        onKeyDown={composeHandlers(onKeyDown, (e) => {
          const next = getNextFocusTarget(e, e.currentTarget, { selector: "[data-accordion-trigger]", orientation: "vertical", dir });
          if (next) {
            e.preventDefault();
            next.focus();
          }
        })}
      />
    </AccordionCtx.Provider>
  );
});

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem({ value, disabled, ...props }, ref) {
  const a = React.useContext(AccordionCtx);
  if (!a) throw new Error("AccordionItem must be used inside <Accordion>");
  const id = React.useId();
  const open = a.values.includes(value);
  const off = Boolean(disabled) || a.disabled;
  const ctx = React.useMemo(() => ({ value, open, disabled: off, triggerId: `${id}-trigger`, contentId: `${id}-content` }), [value, open, off, id]);
  return (
    <ItemCtx.Provider value={ctx}>
      <div ref={ref} data-accordion-item="" data-state={open ? "open" : "closed"} data-disabled={dataAttr(off)} {...props} />
    </ItemCtx.Provider>
  );
});

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Heading level wrapping the button. Default: 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(function AccordionTrigger(
  { headingLevel = 3, onClick, ...props },
  ref
) {
  const a = React.useContext(AccordionCtx);
  const item = React.useContext(ItemCtx);
  if (!a || !item) throw new Error("AccordionTrigger must be used inside <AccordionItem>");
  const Heading = `h${headingLevel}` as "h3";
  return (
    <Heading data-accordion-header="">
      <button
        ref={ref}
        type="button"
        id={item.triggerId}
        aria-expanded={item.open}
        aria-controls={item.contentId}
        disabled={item.disabled}
        data-accordion-trigger=""
        data-state={item.open ? "open" : "closed"}
        data-disabled={dataAttr(item.disabled)}
        {...props}
        onClick={composeHandlers(onClick, () => a.toggle(item.value))}
      />
    </Heading>
  );
});

export const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { forceMount?: boolean }>(function AccordionContent(props, ref) {
  const item = React.useContext(ItemCtx);
  if (!item) throw new Error("AccordionContent must be used inside <AccordionItem>");
  return <CollapsePanel ref={ref} id={item.contentId} role="region" aria-labelledby={item.triggerId} open={item.open} data-accordion-content="" {...props} />;
});
