"use client";
import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { CollapsePanel } from "./collapse-panel";

interface Ctx {
  open: boolean;
  setOpen: (o: boolean) => void;
  contentId: string;
  disabled: boolean;
}
const CollapsibleCtx = React.createContext<Ctx | null>(null);
const useCollapsible = () => {
  const c = React.useContext(CollapsibleCtx);
  if (!c) throw new Error("Collapsible parts must be used inside <Collapsible>");
  return c;
};

export interface CollapsibleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  { open: openProp, defaultOpen = false, onOpenChange, disabled = false, ...props },
  ref
) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const contentId = React.useId();
  const ctx = React.useMemo(() => ({ open, setOpen, contentId, disabled }), [open, setOpen, contentId, disabled]);
  return (
    <CollapsibleCtx.Provider value={ctx}>
      <div ref={ref} data-collapsible="" data-state={open ? "open" : "closed"} data-disabled={dataAttr(disabled)} {...props} />
    </CollapsibleCtx.Provider>
  );
});

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & AsChildProps>(function CollapsibleTrigger(
  { asChild, onClick, ...props },
  ref
) {
  const c = useCollapsible();
  const Comp: React.ElementType = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : "button"}
      aria-expanded={c.open}
      aria-controls={c.contentId}
      disabled={asChild ? undefined : c.disabled}
      data-state={c.open ? "open" : "closed"}
      data-disabled={dataAttr(c.disabled)}
      {...props}
      onClick={composeHandlers(onClick, () => !c.disabled && c.setOpen(!c.open))}
    />
  );
});

export const CollapsibleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { forceMount?: boolean }>(function CollapsibleContent(props, ref) {
  const c = useCollapsible();
  return <CollapsePanel ref={ref} id={c.contentId} open={c.open} {...props} />;
});
