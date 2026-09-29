"use client";
import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";
import { useDirection } from "../foundation/direction-provider";
import { dataAttr } from "../utils/attrs";
import { useControllableState } from "../utils/use-controllable-state";
import { getNextFocusTarget } from "../utils/roving";
import { Button, type ButtonProps } from "./button";

interface BaseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "dir">,
    AsChildProps {
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  /** Wrap around when arrowing past either end. Default: true. */
  loop?: boolean;
}

export type ToggleGroupProps = BaseProps &
  (
    | {
        type: "single";
        value?: string;
        defaultValue?: string;
        /** Empty string means nothing is selected. */
        onValueChange?: (value: string) => void;
      }
    | {
        type: "multiple";
        value?: string[];
        defaultValue?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );

interface GroupContext {
  values: string[];
  toggle: (value: string) => void;
  disabled: boolean;
}
const Ctx = React.createContext<GroupContext | null>(null);

const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : v === "" ? [] : [v];

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(props, ref) {
  const {
    type,
    value,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    disabled = false,
    loop = true,
    asChild,
    onKeyDown,
    ...rest
  } = props as BaseProps & {
    type: "single" | "multiple";
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: ((value: string) => void) | ((value: string[]) => void);
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
    onChange: (next) => handleValueChange(single ? (next[0] ?? "") : next),
  });

  const toggle = React.useCallback(
    (v: string) =>
      setValues((prev) =>
        prev.includes(v) ? prev.filter((x) => x !== v) : single ? [v] : [...prev, v]
      ),
    [setValues, single]
  );

  const ctx = React.useMemo(() => ({ values, toggle, disabled }), [values, toggle, disabled]);
  const Comp: React.ElementType = asChild ? Slot : "div";

  return (
    <Ctx.Provider value={ctx}>
      <Comp
        ref={ref}
        role="group"
        data-toggle-group=""
        data-orientation={orientation}
        data-disabled={dataAttr(disabled)}
        {...rest}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          const next = getNextFocusTarget(e, e.currentTarget, {
            selector: "[data-toggle-group-item]",
            orientation,
            loop,
            dir,
          });
          if (next) {
            e.preventDefault();
            next.focus();
          }
        }}
      />
    </Ctx.Provider>
  );
});

export interface ToggleGroupItemProps extends Omit<ButtonProps, "pressed" | "value"> {
  value: string;
}

/** Every item stays in the tab order; arrow keys / Home / End also move focus. */
export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  function ToggleGroupItem({ value, disabled, onClick, ...props }, ref) {
    const group = React.useContext(Ctx);
    if (!group) throw new Error("ToggleGroupItem must be used inside <ToggleGroup>");
    const pressed = group.values.includes(value);
    return (
      <Button
        ref={ref}
        pressed={pressed}
        disabled={disabled || group.disabled}
        data-toggle-group-item=""
        data-state={pressed ? "on" : "off"}
        {...props}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) group.toggle(value);
        }}
      />
    );
  }
);
