"use client";
import * as React from "react";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";

interface Ctx {
  step: number;
  setStep: (n: number) => void;
  linear: boolean;
  orientation: "horizontal" | "vertical";
  count: number;
}
const StepperCtx = React.createContext<Ctx | null>(null);
const useStepper = () => {
  const c = React.useContext(StepperCtx);
  if (!c) throw new Error("Stepper parts must be used inside <Stepper>");
  return c;
};

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Current step, 0-based. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (step: number) => void;
  /** Total steps (enables next()/previous() bounds via useStepperControls). */
  count?: number;
  /** In linear mode users can't jump ahead of the current step. Default: true. */
  linear?: boolean;
  orientation?: "horizontal" | "vertical";
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { value, defaultValue = 0, onValueChange, count = Infinity, linear = true, orientation = "horizontal", ...props },
  ref
) {
  const [step, setStep] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const ctx = React.useMemo(() => ({ step, setStep, linear, orientation, count }), [step, setStep, linear, orientation, count]);
  return (
    <StepperCtx.Provider value={ctx}>
      <div ref={ref} data-stepper="" data-orientation={orientation} {...props} />
    </StepperCtx.Provider>
  );
});

/** next / previous / goTo, bounded by `count`. */
export function useStepperControls() {
  const { step, setStep, count } = useStepper();
  return {
    step,
    next: () => setStep(Math.min(step + 1, count - 1)),
    previous: () => setStep(Math.max(step - 1, 0)),
    goTo: setStep,
    isFirst: step === 0,
    isLast: step >= count - 1,
  };
}

export const StepperList = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(function StepperList(props, ref) {
  return <ol ref={ref} data-stepper-list="" {...props} />;
});

const ItemCtx = React.createContext<{ step: number; state: "completed" | "current" | "upcoming" } | null>(null);

export interface StepperItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** 0-based index of this step. */
  step: number;
}

/** Style hooks: [data-state="completed|current|upcoming"] */
export const StepperItem = React.forwardRef<HTMLLIElement, StepperItemProps>(function StepperItem({ step, ...props }, ref) {
  const c = useStepper();
  const state = step < c.step ? "completed" : step === c.step ? "current" : "upcoming";
  const value = React.useMemo(() => ({ step, state }) as const, [step, state]);
  return (
    <ItemCtx.Provider value={value}>
      <li ref={ref} aria-current={state === "current" ? "step" : undefined} data-stepper-item="" data-state={state} {...props} />
    </ItemCtx.Provider>
  );
});

export const StepperTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function StepperTrigger(
  { onClick, disabled, ...props },
  ref
) {
  const c = useStepper();
  const item = React.useContext(ItemCtx);
  if (!item) throw new Error("StepperTrigger must be used inside <StepperItem>");
  const blocked = disabled || (c.linear && item.step > c.step);
  return (
    <button
      ref={ref}
      type="button"
      disabled={blocked}
      data-state={item.state}
      data-disabled={dataAttr(blocked)}
      {...props}
      onClick={composeHandlers(onClick, () => c.setStep(item.step))}
    />
  );
});

export const StepperSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function StepperSeparator(props, ref) {
  const item = React.useContext(ItemCtx);
  return <div ref={ref} aria-hidden data-stepper-separator="" data-state={item?.state} {...props} />;
});

export interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  forceMount?: boolean;
}

export const StepperContent = React.forwardRef<HTMLDivElement, StepperContentProps>(function StepperContent({ step, forceMount, ...props }, ref) {
  const c = useStepper();
  const active = c.step === step;
  if (!active && !forceMount) return null;
  return <div ref={ref} hidden={!active} data-stepper-content="" data-state={active ? "current" : "inactive"} {...props} />;
});
