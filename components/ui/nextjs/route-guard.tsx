"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export interface RouteGuardProps {
  /** Redirect away unless true. */
  allow: boolean;
  /** Path to send disallowed visitors to. */
  redirectTo: string;
  /** Shown while `allow` is undefined-ish (e.g. auth still loading). Pass allow as a stable boolean once known. */
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

/** Client-side gate. For real security, also enforce this in middleware or the server component. */
export function RouteGuard({ allow, redirectTo, fallback = null, children }: RouteGuardProps) {
  const router = useRouter();
  React.useEffect(() => {
    if (!allow) router.replace(redirectTo);
  }, [allow, redirectTo, router]);
  return allow ? <>{children}</> : <>{fallback}</>;
}

export interface AuthGuardProps {
  isAuthenticated: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export function AuthGuard({ isAuthenticated, redirectTo = "/login", fallback, children }: AuthGuardProps) {
  return (
    <RouteGuard allow={isAuthenticated} redirectTo={redirectTo} fallback={fallback}>
      {children}
    </RouteGuard>
  );
}
