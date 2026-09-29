"use client";
import * as React from "react";
import { Slot, type AsChildProps, type SlotProps } from "../foundation/slot";
import { dataAttr } from "../utils/attrs";
import { composeRefs, joinIds } from "../utils/compose";

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

export interface FormFieldContextValue {
  id: string;
  labelId: string;
  descriptionId: string;
  messageId: string;
  name?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  error?: React.ReactNode;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

/** Returns the surrounding FormField's state, or null when used standalone. */
export function useFormField() {
  return React.useContext(FormFieldContext);
}

/**
 * Lets every control work standalone OR inside a <FormField>. Explicit props win
 * over field-provided values. Returns ready-to-spread native attributes too.
 */
interface FieldOwnProps {
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  "aria-describedby"?: string;
}

export function useFieldControl<T extends FieldOwnProps>(props: T) {
  const { id, name, disabled, required, invalid, "aria-describedby": describedByProp, ...rest } = props;
  const field = useFormField();

  const resolved = {
    id: id ?? field?.id,
    name: name ?? field?.name,
    disabled: disabled ?? field?.disabled ?? false,
    required: required ?? field?.required ?? false,
    invalid: invalid ?? field?.invalid ?? false,
    describedBy: joinIds(describedByProp, field?.descriptionId, field?.invalid && field.messageId),
    labelledBy: field?.labelId,
  };

  return {
    ...resolved,
    rest: rest as Omit<T, keyof FieldOwnProps>,
    /** Spread onto a native <input>/<textarea>/<select>. */
    native: {
      id: resolved.id,
      name: resolved.name,
      disabled: resolved.disabled,
      required: resolved.required,
      "aria-invalid": resolved.invalid || undefined,
      "aria-describedby": resolved.describedBy,
      "data-invalid": dataAttr(resolved.invalid),
      "data-disabled": dataAttr(resolved.disabled),
      "data-required": dataAttr(resolved.required),
    },
  };
}

/* ------------------------------------------------------------------ */
/* FormField                                                           */
/* ------------------------------------------------------------------ */

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement>, AsChildProps {
  name?: string;
  /** Marks the field invalid. Defaults to `Boolean(error)`. */
  invalid?: boolean;
  /** Error content shown by <FormMessage />. */
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

/** Wires label, control, description and message together with ids and ARIA. */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(function FormField(
  { name, invalid, error, required = false, disabled = false, asChild, ...props },
  ref
) {
  const id = React.useId();
  const isInvalid = invalid ?? Boolean(error);

  const value = React.useMemo<FormFieldContextValue>(
    () => ({
      id,
      labelId: `${id}-label`,
      descriptionId: `${id}-description`,
      messageId: `${id}-message`,
      name,
      invalid: isInvalid,
      required,
      disabled,
      error,
    }),
    [id, name, isInvalid, required, disabled, error]
  );

  const Comp: React.ElementType = asChild ? Slot : "div";
  return (
    <FormFieldContext.Provider value={value}>
      <Comp
        ref={ref}
        data-form-field=""
        data-invalid={dataAttr(isInvalid)}
        data-disabled={dataAttr(disabled)}
        data-required={dataAttr(required)}
        {...props}
      />
    </FormFieldContext.Provider>
  );
});

/* ------------------------------------------------------------------ */
/* Label / Control / Description / Message                             */
/* ------------------------------------------------------------------ */

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, AsChildProps {}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(function FormLabel(
  { asChild, ...props },
  ref
) {
  const field = useFormField();
  const Comp: React.ElementType = asChild ? Slot : "label";
  return (
    <Comp
      ref={ref}
      id={field?.labelId}
      htmlFor={field?.id}
      data-invalid={dataAttr(field?.invalid)}
      data-disabled={dataAttr(field?.disabled)}
      data-required={dataAttr(field?.required)}
      {...props}
    />
  );
});

/**
 * Injects id / aria attributes into a custom control:
 * <FormControl><MyWidget /></FormControl>
 * Built-in inputs don't need this, they read the field context themselves.
 */
export const FormControl = React.forwardRef<HTMLElement, SlotProps>(function FormControl(props, ref) {
  const field = useFormField();
  return (
    <Slot
      ref={composeRefs(ref)}
      id={field?.id}
      aria-describedby={joinIds(field?.descriptionId, field?.invalid && field.messageId)}
      aria-invalid={field?.invalid || undefined}
      aria-required={field?.required || undefined}
      data-invalid={dataAttr(field?.invalid)}
      data-disabled={dataAttr(field?.disabled)}
      {...props}
    />
  );
});

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement>, AsChildProps {}

export const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  function FormDescription({ asChild, ...props }, ref) {
    const field = useFormField();
    const Comp: React.ElementType = asChild ? Slot : "p";
    return <Comp ref={ref} id={field?.descriptionId} {...props} />;
  }
);

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement>, AsChildProps {
  /** Render even when the field is valid (e.g. for animations). */
  forceMount?: boolean;
}

/** Shows the field's error (or children) only while the field is invalid. */
export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(function FormMessage(
  { asChild, forceMount, children, ...props },
  ref
) {
  const field = useFormField();
  const content = children ?? field?.error;
  if (!forceMount && (!field?.invalid || content == null || content === false || content === true)) return null;
  const Comp: React.ElementType = asChild ? Slot : "p";
  return (
    <Comp ref={ref} id={field?.messageId} aria-live="polite" data-invalid={dataAttr(field?.invalid)} {...props}>
      {content}
    </Comp>
  );
});
