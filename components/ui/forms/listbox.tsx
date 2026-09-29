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

/**
 * Shared ARIA 1.2 combobox+listbox engine behind Select, MultiSelect and Combobox.
 * Not exported on its own; each component above wraps it with its own API.
 */

export interface ListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  values: string[];
  toggleValue: (v: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  baseId: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  listRef: React.RefObject<HTMLElement | null>;
  multiple: boolean;
  disabled: boolean;
  registerOption: (o: ListboxOption) => () => void;
  options: ListboxOption[];
  getLabel: (value: string) => string | undefined;
}
const ListboxContext = React.createContext<Ctx | null>(null);
export const useListbox = () => {
  const c = React.useContext(ListboxContext);
  if (!c) throw new Error("Listbox parts must be used inside a Select, MultiSelect or Combobox");
  return c;
};

export interface UseListboxRootOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  value: string[];
  onValuesChange: (values: string[]) => void;
  multiple: boolean;
  disabled?: boolean;
}

export function useListboxRoot({ open: openProp, defaultOpen = false, onOpenChange, value, onValuesChange, multiple, disabled = false }: UseListboxRootOptions) {
  const [open, setOpenState] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState<ListboxOption[]>([]);
  const baseId = React.useId();
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const listRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback((o: boolean) => {
    setOpenState(o);
    if (!o) setActiveId(null);
  }, [setOpenState]);

  const registerOption = React.useCallback((o: ListboxOption) => {
    setOptions((prev) => {
      const existing = prev.find((p) => p.value === o.value);
      // Bail out (same array reference) when nothing actually changed, so this
      // doesn't retrigger the effects that call registerOption in the first place.
      if (existing && existing.label === o.label && existing.disabled === o.disabled) return prev;
      return existing ? prev.map((p) => (p.value === o.value ? o : p)) : [...prev, o];
    });
    return () => setOptions((prev) => (prev.some((p) => p.value === o.value) ? prev.filter((p) => p.value !== o.value) : prev));
  }, []);

  const toggleValue = React.useCallback(
    (v: string) => {
      if (multiple) onValuesChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
      else {
        onValuesChange([v]);
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    },
    [multiple, value, onValuesChange, setOpen]
  );

  const getLabel = React.useCallback((v: string) => options.find((o) => o.value === v)?.label, [options]);

  const ctx = React.useMemo<Ctx>(
    () => ({ open, setOpen, values: value, toggleValue, activeId, setActiveId, baseId, triggerRef, listRef, multiple, disabled, registerOption, options, getLabel }),
    [open, setOpen, value, toggleValue, activeId, baseId, multiple, disabled, registerOption, options, getLabel]
  );
  return { ctx, ListboxContext };
}

export interface ListboxTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "id" | "name" | "disabled" | "required"> {
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  placeholder?: React.ReactNode;
}

export const ListboxTrigger = React.forwardRef<HTMLButtonElement, ListboxTriggerProps>(function ListboxTrigger(
  { placeholder, children, onClick, onKeyDown, disabled: disabledProp, ...others },
  ref
) {
  const c = useListbox();
  const { native, invalid, disabled: fieldDisabled } = useFieldControl(others);
  const disabled = c.disabled || fieldDisabled || disabledProp;
  const label = children ?? (c.values.length ? c.values.map((v) => c.getLabel(v) ?? v).join(", ") : placeholder);

  return (
    <button
      ref={composeRefs(ref, c.triggerRef as React.Ref<HTMLButtonElement>)}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={c.open}
      aria-controls={`${c.baseId}-listbox`}
      {...native}
      disabled={disabled}
      data-invalid={dataAttr(invalid)}
      data-placeholder={dataAttr(c.values.length === 0)}
      {...others}
      onClick={composeHandlers(onClick, () => !disabled && c.setOpen(!c.open))}
      onKeyDown={composeHandlers(onKeyDown, (e) => {
        if (disabled) return;
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          c.setOpen(true);
        }
      })}
    >
      {label}
    </button>
  );
});

export interface ListboxContentProps extends React.HTMLAttributes<HTMLUListElement>, FloatingOptions {
  container?: Element | null;
}

export const ListboxContent = React.forwardRef<HTMLUListElement, ListboxContentProps>(function ListboxContent(
  { side, align = "start", sideOffset = 4, alignOffset, collisionPadding, avoidCollisions, container, onKeyDown, ...props },
  ref
) {
  const c = useListbox();
  const { isPresent, ref: presenceRef } = usePresence<HTMLUListElement>(c.open);
  const setFloating = useFloating(c.open, () => c.triggerRef.current, { side, align, sideOffset, alignOffset, collisionPadding, avoidCollisions });
  useDismissable(c.open, c.listRef, () => c.setOpen(false), { exclude: [c.triggerRef] });

  const enabledOptions = () => c.options.filter((o) => !o.disabled);

  React.useEffect(() => {
    if (c.open && c.activeId === null) {
      const firstSelected = c.values.length ? c.options.find((o) => c.values.includes(o.value) && !o.disabled) : undefined;
      setTimeout(() => c.setActiveId((firstSelected ?? enabledOptions()[0])?.value ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.open]);

  if (!isPresent) return null;
  const opts = enabledOptions();

  return (
    <Portal container={container}>
      <ul
        ref={composeRefs(ref, c.listRef as React.Ref<HTMLUListElement>, presenceRef, setFloating)}
        id={`${c.baseId}-listbox`}
        role="listbox"
        aria-multiselectable={c.multiple || undefined}
        aria-activedescendant={c.activeId ? `${c.baseId}-option-${c.activeId}` : undefined}
        tabIndex={-1}
        data-listbox=""
        data-state={c.open ? "open" : "closed"}
        {...props}
        onKeyDown={composeHandlers(onKeyDown, (e) => {
          const idx = opts.findIndex((o) => o.value === c.activeId);
          const go = (i: number) => {
            e.preventDefault();
            c.setActiveId(opts[(i + opts.length) % opts.length]?.value ?? null);
          };
          if (e.key === "ArrowDown") return go(idx + 1);
          if (e.key === "ArrowUp") return go(idx - 1);
          if (e.key === "Home") return go(0);
          if (e.key === "End") return go(opts.length - 1);
          if (e.key === "Enter" || e.key === " ") {
            if (c.activeId) {
              e.preventDefault();
              c.toggleValue(c.activeId);
            }
          }
          if (e.key === "Tab") c.setOpen(false);
        })}
      />
    </Portal>
  );
});

export interface ListboxOptionProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "value"> {
  value: string;
  /** Text used by the trigger label and typeahead. Defaults to children when a string. */
  label?: string;
  disabled?: boolean;
}

export const ListboxOptionItem = React.forwardRef<HTMLLIElement, ListboxOptionProps>(function ListboxOptionItem(
  { value, label, disabled, children, onClick, onPointerMove, ...props },
  ref
) {
  const c = useListbox();
  const text = label ?? (typeof children === "string" ? children : value);
  // Depend on `registerOption` (stable), not the whole context object `c` — `c`
  // changes whenever `options` changes, and registerOption itself updates
  // `options`, so depending on `c` here would re-fire this effect every time
  // any option (re-)registers, forever.
  React.useEffect(() => c.registerOption({ value, label: text, disabled }), [c.registerOption, value, text, disabled]);

  const selected = c.values.includes(value);
  const active = c.activeId === value;
  return (
    <li
      ref={ref}
      id={`${c.baseId}-option-${value}`}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-listbox-option=""
      data-selected={dataAttr(selected)}
      data-active={dataAttr(active)}
      data-disabled={dataAttr(disabled)}
      {...props}
      onPointerMove={composeHandlers(onPointerMove, () => !disabled && c.setActiveId(value))}
      onClick={composeHandlers(onClick, () => !disabled && c.toggleValue(value))}
    >
      {children}
    </li>
  );
});
