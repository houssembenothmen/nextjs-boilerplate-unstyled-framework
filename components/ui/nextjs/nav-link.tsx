"use client";
import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { dataAttr } from "../utils/attrs";

export interface NavLinkProps extends React.ComponentProps<typeof NextLink> {
  /** "exact" (default): active only on an exact match. "prefix": active for any descendant route too. */
  match?: "exact" | "prefix";
  activeClassName?: string;
  inactiveClassName?: string;
}

/** next/link that knows whether it points at the current route. Exposes aria-current + [data-active]. */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { href, match = "exact", activeClassName, inactiveClassName, className, ...props },
  ref
) {
  const pathname = usePathname();
  const path = typeof href === "string" ? href.split(/[?#]/)[0]! : (href.pathname ?? "");
  const active = match === "exact" ? pathname === path : pathname === path || pathname.startsWith(path.endsWith("/") ? path : `${path}/`);

  return (
    <NextLink
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={dataAttr(active)}
      className={[className, active ? activeClassName : inactiveClassName].filter(Boolean).join(" ") || undefined}
      {...props}
    />
  );
});
