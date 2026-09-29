"use client";
import * as React from "react";
import { Portal } from "../foundation/portal";
import { useDismissable } from "../overlays/dismissable";
import { useFloating, type FloatingOptions } from "../overlays/floating";
import { usePresence } from "../overlays/presence";
import { dataAttr } from "../utils/attrs";
import { composeHandlers, composeRefs } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { useFieldControl } from "./form-field";

/* ------------------------------------------------------------------ */
/* Combobox: text input + filtered listbox. Also covers "Autocomplete" */
/* and "AsyncSelect" (pass a loading state / debounce onInputChange).  */
/* ------------------------------------------------------------------ */

interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  value: string | null;
  select: (value: string, label: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  baseId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLElement | null>;
  disabled: boolean;
  registerOption: (id: string, disabled: boolean | undefined) => () => void;
  optionOrder: string[];
}
const ComboboxContext = React.createContext<Ctx | null>(null);
const useCombobox = () => {
  const c = React.useContext(ComboboxContext);
  if (!c) throw new Error("Combobox parts must be used inside <Combobox>");
  return c;
};

export interface ComboboxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Controls the text field independently (useful for async search). */
  inputValue?: string;
  onInputChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  children?: React.ReactNode;
}

export function Combobox({
  value: valueProp, defaultValue = null, onValueChange, inputValue: inputProp, onInputChange,
  open, defaultOpen, onOpenChange, name, disabled, required, invalid, children, ...props
}: ComboboxProps) {
  const field = useFieldControl({ name, disabled, required, invalid });
  const [value, setValue] = useControllableState<string | null>({ value: valueProp, defaultValue, onChange: onValueChange });
  const [inputValue, setInputValue] = useControllableState<string>({ value: inputProp, defaultValue: "", onChange: onInputChange });
  const [isOpen, setIsOpen] = useControllableState({ value: open, defaultValue: defaultOpen ?? false, onChange: onOpenChange });
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [optionOrder, setOptionOrder] = React.useState<string[]>([]);
  const baseId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback((o: boolean) => {
    setIsOpen(o);
    if (!o) setActiveId(null);
  }, [setIsOpen]);

  const select = React.useCallback(
    (v: string, label: string) => {
      setValue(v);
      setInputValue(label);
      setOpen(false);
      inputRef.current?.focus({ preventScroll: true });
    },
    [setValue, setInputValue, setOpen]
  );

  const registerOption = React.useCallback((id: string, disabled?: boolean) => {
    if (!disabled) setOptionOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return () => setOptionOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev));
  }, []);

  const ctx = React.useMemo<Ctx>(
    () => ({ open: isOpen, setOpen, inputValue, setInputValue, value, select, activeId, setActiveId, baseId, inputRef, listRef, disabled: field.disabled, registerOption, optionOrder }),
    [isOpen, setOpen, inputValue, setInputValue, value, select, activeId, baseId, field.disabled, registerOption, optionOrder]
  );

  return (
    <ComboboxContext.Provider value={ctx}>
      <div data-combobox="" {...props}>
        {children}
        {field.name && <input type="hidden" name={field.name} value={value ?? ""} required={field.required} />}
      </div>
    </ComboboxContext.Provider>
  );
}

export interface ComboboxInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {}

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(function ComboboxInput(
  { onChange, onKeyDown, onFocus, disabled: disabledProp, ...props },
  ref
) {
  const c = useCombobox();
  const disabled = c.disabled || disabledProp;
  return (
    <input
      ref={composeRefs(ref, c.inputRef)}
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={c.open}
      aria-controls={`${c.baseId}-listbox`}
      aria-activedescendant={c.activeId ? `${c.baseId}-option-${c.activeId}` : undefined}
      autoComplete="off"
      disabled={disabled}
      data-combobox-input=""
      {...props}
      value={c.inputValue}
      onChange={composeHandlers(onChange, (e) => {
        c.setInputValue(e.target.value);
        if (!c.open) c.setOpen(true);
      })}
      onFocus={composeHandlers(onFocus, () => c.setOpen(true))}
      onKeyDown={composeHandlers(onKeyDown, (e) => {
        if (!c.open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          e.preventDefault();
          return c.setOpen(true);
        }
        if (!c.open) return;
        const order = c.optionOrder;
        const idx = order.indexOf(c.activeId ?? "");
        const go = (i: number) => {
          e.preventDefault();
          c.setActiveId(order[(i + order.length) % order.length] ?? null);
        };
        if (e.key === "ArrowDown") return go(idx + 1);
        if (e.key === "ArrowUp") return go(idx - 1);
        if (e.key === "Escape") return c.setOpen(false);
        if (e.key === "Tab") c.setOpen(false);
      })}
    />
  );
});

export interface ComboboxContentProps extends React.HTMLAttributes<HTMLUListElement>, FloatingOptions {
  container?: Element | null;
}

export const ComboboxContent = React.forwardRef<HTMLUListElement, ComboboxContentProps>(function ComboboxContent(
  { side, align = "start", sideOffset = 4, alignOffset, collisionPadding, avoidCollisions, container, ...props },
  ref
) {
  const c = useCombobox();
  const { isPresent, ref: presenceRef } = usePresence<HTMLUListElement>(c.open);
  const setFloating = useFloating(c.open, () => c.inputRef.current, { side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions });
  useDismissable(c.open, c.listRef, () => c.setOpen(false), { exclude: [c.inputRef] });
  if (!isPresent) return null;
  return (
    <Portal container={container}>
      <ul
        ref={composeRefs(ref, c.listRef as React.Ref<HTMLUListElement>, presenceRef, setFloating)}
        id={`${c.baseId}-listbox`}
        role="listbox"
        data-combobox-content=""
        data-state={c.open ? "open" : "closed"}
        {...props}
      />
    </Portal>
  );
});

export interface ComboboxOptionProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "value"> {
  value: string;
  label?: string;
  disabled?: boolean;
}

export const ComboboxOption = React.forwardRef<HTMLLIElement, ComboboxOptionProps>(function ComboboxOption(
  { value, label, disabled, children, onClick, onPointerMove, ...props },
  ref
) {
  const c = useCombobox();
  const text = label ?? (typeof children === "string" ? children : value);
  // See the identical note in listbox.tsx: depend on the stable `registerOption`
  // function, not the whole context object (which changes when options change).
  React.useEffect(() => c.registerOption(value, disabled), [c.registerOption, value, disabled]);
  const selected = c.value === value;
  const active = c.activeId === value;
  return (
    <li
      ref={ref}
      id={`${c.baseId}-option-${value}`}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-combobox-option=""
      data-selected={dataAttr(selected)}
      data-active={dataAttr(active)}
      data-disabled={dataAttr(disabled)}
      {...props}
      onPointerMove={composeHandlers(onPointerMove, () => !disabled && c.setActiveId(value))}
      onClick={composeHandlers(onClick, () => !disabled && c.select(value, text))}
    >
      {children}
    </li>
  );
});

/** Shown when there are no matching options. Purely presentational: render it conditionally yourself. */
export const ComboboxEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function ComboboxEmpty(props, ref) {
  return <div ref={ref} role="status" data-combobox-empty="" {...props} />;
});
