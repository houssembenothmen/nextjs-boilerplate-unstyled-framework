import * as React from "react";

/**
 * Visually-hidden native input so custom (button-based) controls still take part
 * in native <form> submission. Not focusable, not announced.
 */
export function HiddenInput({
  type,
  ...props
}: {
  type: "checkbox" | "radio";
  name?: string;
  value?: string;
  checked: boolean;
  disabled?: boolean;
  form?: string;
}) {
  if (!props.name) return null;
  return (
    <input
      type={type}
      aria-hidden
      tabIndex={-1}
      readOnly
      {...props}
      style={{
        position: "absolute",
        pointerEvents: "none",
        opacity: 0,
        margin: 0,
        width: 1,
        height: 1,
        transform: "translateX(-100%)",
      }}
    />
  );
}
