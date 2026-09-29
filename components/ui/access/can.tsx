"use client";
import * as React from "react";

export interface PermissionContextValue {
  /** Return true if the current user has this permission. Memoize on your side. */
  has: (permission: string) => boolean;
}
const Ctx = React.createContext<PermissionContextValue | null>(null);

export interface PermissionProviderProps extends PermissionContextValue {
  children?: React.ReactNode;
}

export function PermissionProvider({ has, children }: PermissionProviderProps) {
  const value = React.useMemo(() => ({ has }), [has]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePermission(permission: string | string[], mode: "every" | "some" = "every") {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("usePermission (and <Can>/<Cannot>) must be used inside <PermissionProvider>");
  const list = Array.isArray(permission) ? permission : [permission];
  return mode === "every" ? list.every(ctx.has) : list.some(ctx.has);
}

export interface CanProps {
  /** One permission, or several combined with `mode`. */
  permission: string | string[];
  mode?: "every" | "some";
  children?: React.ReactNode;
  /** Rendered when the permission check fails. */
  fallback?: React.ReactNode;
}

/** <Can permission="users:create"><Button>Create</Button></Can> */
export function Can({ permission, mode = "every", children, fallback = null }: CanProps) {
  return <>{usePermission(permission, mode) ? children : fallback}</>;
}

/** Inverse of <Can>: renders children when the permission check fails. */
export function Cannot({ permission, mode = "every", children, fallback = null }: CanProps) {
  return <>{usePermission(permission, mode) ? fallback : children}</>;
}

export interface PermissionGuardProps extends CanProps {}
/** Alias of <Can>, for teams that prefer this name. */
export const PermissionGuard = Can;
