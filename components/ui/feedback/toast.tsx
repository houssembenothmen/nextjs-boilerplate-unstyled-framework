"use client";
import * as React from "react";
import { Portal } from "../foundation/portal";
import { usePresence } from "../overlays/presence";
import { dataAttr } from "../utils/attrs";

/* ------------------------------------------------------------------ */
/* Store (module-level: `toast()` works anywhere, no provider needed)  */
/* ------------------------------------------------------------------ */

export type ToastType = "default" | "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: ToastType;
  /** ms before auto-dismiss. 0 or Infinity = sticky. Default: 5000. */
  duration?: number;
  action?: { label: React.ReactNode; onClick: () => void };
  /** Extra data for your own render function. */
  data?: Record<string, unknown>;
  onDismiss?: (id: string) => void;
}

export interface ToastItemState extends ToastOptions {
  id: string;
  open: boolean;
}

let toasts: ToastItemState[] = [];
const listeners = new Set<() => void>();
let counter = 0;
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
const getSnapshot = () => toasts;
const EMPTY: ToastItemState[] = [];

function create(options: ToastOptions | React.ReactNode): string {
  const opts: ToastOptions = React.isValidElement(options) || typeof options === "string" ? { title: options } : (options as ToastOptions);
  const id = opts.id ?? `toast-${++counter}`;
  const next: ToastItemState = { ...opts, id, open: true };
  toasts = toasts.some((t) => t.id === id) ? toasts.map((t) => (t.id === id ? next : t)) : [...toasts, next];
  emit();
  return id;
}

function dismiss(id?: string) {
  toasts = toasts.map((t) => (id === undefined || t.id === id ? (t.open && t.onDismiss?.(t.id), { ...t, open: false }) : t));
  emit();
}

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

type Shorthand = (options: ToastOptions | string) => string;
const withType = (type: ToastType): Shorthand => (o) => create({ ...(typeof o === "string" ? { title: o } : o), type });

/**
 * toast("Saved") · toast({ title, description, action }) · toast.success("Done") · toast.dismiss(id?)
 */
export const toast = Object.assign(create, {
  success: withType("success"),
  error: withType("error"),
  warning: withType("warning"),
  info: withType("info"),
  dismiss,
});

export function useToast() {
  const list = React.useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  return { toasts: list, toast, dismiss };
}

/* ------------------------------------------------------------------ */
/* Toaster                                                             */
/* ------------------------------------------------------------------ */

export type ToasterPosition = "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";

export interface ToasterProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  position?: ToasterPosition;
  /** Max visible toasts (oldest hidden first). Default: 5. */
  limit?: number;
  /** Default auto-dismiss time. Default: 5000. */
  duration?: number;
  /** Region label for screen readers. Localize this. */
  label?: string;
  /** aria-label of the default close button. Localize this. */
  closeLabel?: string;
  container?: Element | null;
  /** Custom rendering of a toast's inner content. Wrapper <li> (timers, ARIA) stays managed. */
  children?: (t: ToastItemState, api: { dismiss: () => void }) => React.ReactNode;
}

/** Style hooks: [data-toaster][data-position] · [data-toast][data-type][data-state="open|closed"] */
export function Toaster({ position = "bottom-end", limit = 5, duration = 5000, label = "Notifications", closeLabel = "Close", container, children, ...props }: ToasterProps) {
  const { toasts: list } = useToast();
  const visible = list.slice(-limit);
  return (
    <Portal container={container}>
      <ol
        role="region"
        aria-label={label}
        tabIndex={-1}
        data-toaster=""
        data-position={position}
        {...props}
      >
        {visible.map((t) => (
          <ToastRow key={t.id} t={t} defaultDuration={duration} closeLabel={closeLabel} render={children} />
        ))}
      </ol>
    </Portal>
  );
}

function ToastRow({
  t, defaultDuration, closeLabel, render,
}: {
  t: ToastItemState;
  defaultDuration: number;
  closeLabel: string;
  render?: ToasterProps["children"];
}) {
  const { isPresent, ref } = usePresence<HTMLLIElement>(t.open);
  const [paused, setPaused] = React.useState(false);
  const duration = t.duration ?? defaultDuration;
  const remaining = React.useRef(duration);
  const startedAt = React.useRef(0);

  // Auto-dismiss with pause on hover / focus; resumes with the time that was left.
  React.useEffect(() => {
    if (!t.open || paused || !Number.isFinite(duration) || duration <= 0) return;
    startedAt.current = Date.now();
    const id = setTimeout(() => dismiss(t.id), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [t.open, t.id, paused, duration]);

  React.useEffect(() => {
    if (!isPresent) remove(t.id);
  }, [isPresent, t.id]);

  const assertive = t.type === "error" || t.type === "warning";
  return (
    <li
      ref={ref}
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic
      data-toast=""
      data-type={t.type ?? "default"}
      data-state={t.open ? "open" : "closed"}
      data-paused={dataAttr(paused)}
      style={{ ["--toast-duration" as string]: `${duration}ms` }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => e.key === "Escape" && dismiss(t.id)}
    >
      {render ? (
        render(t, { dismiss: () => dismiss(t.id) })
      ) : (
        <>
          {t.title != null && <div data-toast-title="">{t.title}</div>}
          {t.description != null && <div data-toast-description="">{t.description}</div>}
          {t.action && (
            <button type="button" data-toast-action="" onClick={() => (t.action!.onClick(), dismiss(t.id))}>
              {t.action.label}
            </button>
          )}
          <button type="button" data-toast-close="" aria-label={closeLabel} onClick={() => dismiss(t.id)}>
            ×
          </button>
        </>
      )}
    </li>
  );
}
