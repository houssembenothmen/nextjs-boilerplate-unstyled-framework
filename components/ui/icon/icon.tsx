import * as React from "react";

export type IconComponent = React.ComponentType<{ className?: string; "aria-hidden"?: boolean; size?: number | string }>;

let registry: Record<string, IconComponent> = {};

/** Register icons once at startup, e.g. from lucide-react: `registerIcons({ search: Search, trash: Trash2 })`. */
export function registerIcons(icons: Record<string, IconComponent>) {
  registry = { ...registry, ...icons };
}

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number | string;
  /** Rendered if `name` isn't registered. Default: nothing (fails quietly in production). */
  fallback?: React.ReactNode;
}

/**
 * A stable API over whatever icon set you register, so consuming apps never import
 * an icon library directly: <Icon name="trash" />. Server-component safe as long as
 * the icons you register are (most SVG icon components are).
 */
export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(function Icon({ name, size = "1em", fallback = null, ...props }, ref) {
  const Cmp = registry[name];
  if (!Cmp) {
    if (process.env.NODE_ENV !== "production") console.warn(`[Icon] "${name}" is not registered. Call registerIcons() first.`);
    return fallback as React.ReactElement | null;
  }
  return (
    <span ref={ref} data-icon={name} {...props}>
      <Cmp aria-hidden size={size} />
    </span>
  );
});
