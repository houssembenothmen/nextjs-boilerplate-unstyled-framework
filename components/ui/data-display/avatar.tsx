"use client";
import * as React from "react";

type Status = "idle" | "loading" | "loaded" | "error";
const Ctx = React.createContext<{ status: Status; setStatus: (s: Status) => void } | null>(null);

export const Avatar = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(function Avatar(props, ref) {
  const [status, setStatus] = React.useState<Status>("idle");
  const value = React.useMemo(() => ({ status, setStatus }), [status]);
  return (
    <Ctx.Provider value={value}>
      <span ref={ref} data-avatar="" data-status={status} {...props} />
    </Ctx.Provider>
  );
});

export interface AvatarImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string;
  onLoadingStatusChange?: (status: Status) => void;
}

/** Renders only after the image has actually loaded, so the fallback never flickers. */
export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(function AvatarImage(
  { src, onLoadingStatusChange, alt = "", ...props },
  ref
) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("AvatarImage must be used inside <Avatar>");
  const { status, setStatus } = ctx;
  const cb = React.useRef(onLoadingStatusChange);
  cb.current = onLoadingStatusChange;

  React.useLayoutEffect(() => {
    if (!src) return setStatus("error");
    let alive = true;
    setStatus("loading");
    const img = new window.Image();
    const done = (s: Status) => () => alive && (setStatus(s), cb.current?.(s));
    img.onload = done("loaded");
    img.onerror = done("error");
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src, setStatus]);

  return status === "loaded" ? <img ref={ref} src={src} alt={alt} data-avatar-image="" {...props} /> : null;
});

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Wait this long before showing (avoids a flash for fast images). */
  delayMs?: number;
}

export const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(function AvatarFallback({ delayMs, ...props }, ref) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("AvatarFallback must be used inside <Avatar>");
  const [ready, setReady] = React.useState(delayMs === undefined);
  React.useEffect(() => {
    if (delayMs === undefined) return;
    const id = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
  return ready && ctx.status !== "loaded" ? <span ref={ref} data-avatar-fallback="" {...props} /> : null;
});

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show at most this many avatars, then an overflow element. */
  max?: number;
  /** Custom overflow content. Default: "+N". */
  renderOverflow?: (count: number) => React.ReactNode;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { max, renderOverflow = (n) => `+${n}`, children, ...props },
  ref
) {
  const all = React.Children.toArray(children);
  const shown = max !== undefined && all.length > max ? all.slice(0, max) : all;
  const extra = all.length - shown.length;
  return (
    <div ref={ref} role="group" data-avatar-group="" {...props}>
      {shown}
      {extra > 0 && <span data-avatar-overflow="">{renderOverflow(extra)}</span>}
    </div>
  );
});
