import * as React from "react";
import { composeRefs } from "../utils/compose";

export interface AsChildProps {
  /** Render the single child element instead of the default element, merging props onto it. */
  asChild?: boolean;
}

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

type AnyProps = Record<string, unknown>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const s = slotProps[key];
    const c = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof s === "function" && typeof c === "function") {
      merged[key] = ((...args: unknown[]) => {
        (c as (...args: unknown[]) => void)(...args);
        (s as (...args: unknown[]) => void)(...args);
      }) as unknown;
    } else if (key === "style") {
      merged[key] = {
        ...(typeof s === "object" && s !== null ? (s as Record<string, unknown>) : {}),
        ...(typeof c === "object" && c !== null ? (c as Record<string, unknown>) : {}),
      };
    } else if (key === "className") {
      merged[key] = [String(s ?? ""), String(c ?? "")].filter(Boolean).join(" ");
    }
  }
  return merged;
}

const REACT_19 = Number(React.version.split(".")[0]) >= 19;

/**
 * Merges its props onto its single child. Powers the `asChild` pattern:
 * `<Button asChild><Link href="/x">Go</Link></Button>`.
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef
) {
  const child = React.Children.only(children) as React.ReactElement<AnyProps>;
  const childRef = REACT_19 ? child.props.ref : (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
  return React.cloneElement(child, {
    ...mergeProps(slotProps, child.props),
    ref: composeRefs(forwardedRef, childRef as React.Ref<HTMLElement> | undefined),
  });
});
