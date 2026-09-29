"use client";
import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";
import { useControllableState } from "../utils/use-controllable-state";
import { Input, type InputProps } from "./input";

interface PasswordCtx {
  visible: boolean;
  setVisible: (v: boolean | ((p: boolean) => boolean)) => void;
}
const Ctx = React.createContext<PasswordCtx | null>(null);
const useCtx = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("PasswordInput parts must be used inside <PasswordInput>");
  return ctx;
};

export interface PasswordInputProps extends React.HTMLAttributes<HTMLDivElement>, AsChildProps {
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

/**
 * <PasswordInput>
 *   <PasswordInputField />
 *   <PasswordInputToggle><EyeIcon /></PasswordInputToggle>
 * </PasswordInput>
 * Style the icon swap with [data-visible] on the toggle.
 */
export const PasswordInput = React.forwardRef<HTMLDivElement, PasswordInputProps>(function PasswordInput(
  { visible: visibleProp, defaultVisible = false, onVisibleChange, asChild, ...props },
  ref
) {
  const [visible, setVisible] = useControllableState({
    value: visibleProp,
    defaultValue: defaultVisible,
    onChange: onVisibleChange,
  });
  const value = React.useMemo(() => ({ visible, setVisible }), [visible, setVisible]);
  const Comp: React.ElementType = asChild ? Slot : "div";
  return (
    <Ctx.Provider value={value}>
      <Comp ref={ref} data-password-input="" data-visible={dataAttr(visible)} {...props} />
    </Ctx.Provider>
  );
});

export type PasswordInputFieldProps = Omit<InputProps, "type">;

export const PasswordInputField = React.forwardRef<HTMLInputElement, PasswordInputFieldProps>(
  function PasswordInputField(props, ref) {
    const { visible } = useCtx();
    return (
      <Input
        ref={ref}
        autoComplete="current-password"
        autoCapitalize="none"
        spellCheck={false}
        {...props}
        type={visible ? "text" : "password"}
      />
    );
  }
);

export interface PasswordInputToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** aria-label while the password is hidden. Localize this. */
  showLabel?: string;
  /** aria-label while the password is visible. Localize this. */
  hideLabel?: string;
}

export const PasswordInputToggle = React.forwardRef<HTMLButtonElement, PasswordInputToggleProps>(
  function PasswordInputToggle(
    { showLabel = "Show password", hideLabel = "Hide password", onClick, ...props },
    ref
  ) {
    const { visible, setVisible } = useCtx();
    return (
      <button
        ref={ref}
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        data-visible={dataAttr(visible)}
        {...props}
        onClick={composeHandlers(onClick, () => setVisible((v) => !v))}
      />
    );
  }
);
