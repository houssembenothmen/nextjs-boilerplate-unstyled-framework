import * as React from "react";

export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** null / undefined = indeterminate. */
  value?: number | null;
  max?: number;
  /** Human-readable value for screen readers, e.g. "3 of 10 files". */
  getValueLabel?: (value: number, max: number) => string;
  children?: React.ReactNode;
}

/**
 * Root exposes `--progress` (0%-100%) and [data-state="loading|complete|indeterminate"].
 * <Progress value={40}><ProgressIndicator /></Progress>
 * [data-progress-indicator] { width: var(--progress) }
 * Server-component safe.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value = null, max = 100, getValueLabel, style, ...props },
  ref
) {
  const known = value !== null && Number.isFinite(value);
  const clamped = known ? Math.min(max, Math.max(0, value as number)) : null;
  const pct = clamped === null ? null : (clamped / max) * 100;
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped ?? undefined}
      aria-valuetext={clamped === null ? undefined : getValueLabel?.(clamped, max)}
      data-progress=""
      data-state={clamped === null ? "indeterminate" : clamped >= max ? "complete" : "loading"}
      data-value={clamped ?? undefined}
      style={{ ["--progress" as string]: pct === null ? undefined : `${pct}%`, ...style }}
      {...props}
    />
  );
});

export const ProgressIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function ProgressIndicator(props, ref) {
  return <div ref={ref} data-progress-indicator="" {...props} />;
});
