"use client";
import * as React from "react";

/* ------------------------------------------------------------------ */
/* Path helpers (dot / bracket paths: "addresses.0.city")              */
/* ------------------------------------------------------------------ */

type Path = string;

function get<T extends Record<string, unknown> | unknown[]>(obj: T, path: Path): unknown {
  if (path === "") return obj;
  return path.split(".").reduce<unknown>((o, k) => {
    if (o == null) return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

function set<T extends Record<string, unknown> | unknown[]>(obj: T, path: Path, value: unknown): T {
  const keys = path.split(".");
  const clone: Record<string, unknown> | unknown[] = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur: Record<string, unknown> = clone as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!;
    const next = cur[k];
    cur[k] = Array.isArray(next) ? [...next] : typeof next === "object" && next !== null ? { ...next } : {};
    cur = cur[k] as Record<string, unknown>;
  }

  cur[keys[keys.length - 1]!] = value;
  return clone as T;
}

/* ------------------------------------------------------------------ */
/* useForm                                                              */
/* ------------------------------------------------------------------ */

export type Validator<T> = (values: T) => Record<string, string> | Promise<Record<string, string>>;

export interface UseFormOptions<T extends Record<string, unknown>> {
  defaultValues: T;
  /** Return a flat map of dot-path -> error message. Empty / omitted keys are valid. */
  validate?: Validator<T>;
  onSubmit: (values: T) => void | Promise<void>;
  /** Re-run validation on every change, not just blur/submit. Default: false. */
  validateOnChange?: boolean;
}

export interface FieldMeta {
  touched: boolean;
  error?: string;
  invalid: boolean;
}

/**
 * Minimal, dependency-free form state: values, touched, errors, submitting —
 * enough to wire up this library's FormField without pulling in react-hook-form.
 * Swap in RHF/Formik for anything more advanced; the rest of the library doesn't care.
 */
export function useForm<T extends Record<string, unknown>>({ defaultValues, validate, onSubmit, validateOnChange = false }: UseFormOptions<T>) {
  const [values, setValues] = React.useState<T>(defaultValues);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [submitCount, setSubmitCount] = React.useState(0);
  const validateRef = React.useRef(validate);
  validateRef.current = validate;

  const runValidation = React.useCallback(async (v: T) => {
    const result = (await validateRef.current?.(v)) ?? {};
    setErrors(result);
    return result;
  }, []);

  const setValue = React.useCallback(
    (path: Path, value: unknown) => {
      setValues((prev) => {
        const next = set(prev, path, value);
        if (validateOnChange) runValidation(next);
        return next;
      });
    },
    [validateOnChange, runValidation]
  );

  const setFieldTouched = React.useCallback((path: Path, isTouched = true) => setTouched((prev) => ({ ...prev, [path]: isTouched })), []);

  const reset = React.useCallback((next: T = defaultValues) => {
    setValues(next);
    setTouched({});
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      setSubmitCount((n) => n + 1);
      setSubmitting(true);
      Promise.resolve(runValidation(values))
        .then((result) => {
          if (Object.keys(result).length === 0) return onSubmit(values);
          const allTouched: Record<string, boolean> = {};
          for (const k of Object.keys(result)) allTouched[k] = true;
          setTouched((prev) => ({ ...prev, ...allTouched }));
        })
        .finally(() => setSubmitting(false));
    },
    [values, runValidation, onSubmit]
  );

  const getFieldMeta = React.useCallback(
    (path: Path): FieldMeta => ({ touched: Boolean(touched[path]), error: errors[path], invalid: Boolean(touched[path] && errors[path]) }),
    [touched, errors]
  );

  /** Spreadable props for a native input bound to `path`. */
  const register = React.useCallback(
    (path: Path) => ({
      name: path,
      value: (get(values, path) as string | number | readonly string[] | undefined) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const el = e.target;
        const v = el.type === "checkbox" ? (el as HTMLInputElement).checked : el.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value;
        setValue(path, v);
      },
      onBlur: () => setFieldTouched(path, true),
    }),
    [values, setValue, setFieldTouched]
  );

  return {
    values,
    setValues,
    setValue,
    getValue: (path: Path) => get(values, path),
    touched,
    setFieldTouched,
    errors,
    getFieldMeta,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    submitCount,
    register,
    handleSubmit,
    reset,
    validate: () => runValidation(values),
  };
}

export type UseFormReturn<T extends Record<string, unknown>> = ReturnType<typeof useForm<T>>;
