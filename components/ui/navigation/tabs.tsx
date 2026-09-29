"use client";
import * as React from "react";
import { useDirection, type Direction } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { getNextFocusTarget } from "../utils/roving";
import { useControllableState } from "../utils/use-controllable-state";

interface Ctx {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
  orientation: "horizontal" | "vertical";
  activationMode: "automatic" | "manual";
  dir?: Direction;
}
const TabsContext = React.createContext<Ctx | null>(null);
const useTabs = () => {
  const c = React.useContext(TabsContext);
  if (!c) throw new Error("Tabs parts must be used inside <Tabs>");
  return c;
};
const safe = (v: string) => v.replace(/\s+/g, "_");

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "dir"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  /** "automatic": arrow keys select. "manual": arrow keys only move focus. */
  activationMode?: "automatic" | "manual";
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value: valueProp, defaultValue = "", onValueChange, orientation = "horizontal", activationMode = "automatic", ...props },
  ref
) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange: onValueChange });
  const baseId = React.useId();
  const dir = useDirection();
  const ctx = React.useMemo(() => ({ value, setValue, baseId, orientation, activationMode, dir }), [value, setValue, baseId, orientation, activationMode, dir]);
  return (
    <TabsContext.Provider value={ctx}>
      <div ref={ref} data-tabs="" data-orientation={orientation} {...props} />
    </TabsContext.Provider>
  );
});

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function TabsList({ onKeyDown, ...props }, ref) {
  const c = useTabs();
  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={c.orientation}
      data-tabs-list=""
      data-orientation={c.orientation}
      {...props}
      onKeyDown={composeHandlers(onKeyDown, (e) => {
        const next = getNextFocusTarget(e, e.currentTarget, { selector: '[role="tab"]', orientation: c.orientation, dir: c.dir });
        if (!next) return;
        e.preventDefault();
        next.focus();
        if (c.activationMode === "automatic") next.click();
      })}
    />
  );
});

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

/** Style hooks: [data-state="active|inactive"] [data-disabled] */
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, disabled, onClick, onFocus, ...props },
  ref
) {
  const c = useTabs();
  const active = c.value === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${c.baseId}-trigger-${safe(value)}`}
      aria-selected={active}
      aria-controls={`${c.baseId}-content-${safe(value)}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      data-state={active ? "active" : "inactive"}
      data-disabled={dataAttr(disabled)}
      data-orientation={c.orientation}
      {...props}
      onClick={composeHandlers(onClick, () => c.setValue(value))}
    />
  );
});

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Keep mounted (hidden) while inactive. Default: false. */
  forceMount?: boolean;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, forceMount, ...props },
  ref
) {
  const c = useTabs();
  const active = c.value === value;
  if (!active && !forceMount) return null;
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${c.baseId}-content-${safe(value)}`}
      aria-labelledby={`${c.baseId}-trigger-${safe(value)}`}
      hidden={!active}
      tabIndex={0}
      data-state={active ? "active" : "inactive"}
      data-orientation={c.orientation}
      {...props}
    />
  );
});
