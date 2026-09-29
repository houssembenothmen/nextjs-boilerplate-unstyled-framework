"use client";
import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export interface LocaleLinkProps extends React.ComponentProps<typeof NextLink> {
  /** Target locale. Defaults to the locale segment already in the current path. */
  locale?: string;
  /** How the locale is encoded in the path. Default: "segment" (/fr/about). */
  strategy?: "segment";
  /** Known locales, used to detect and strip the current segment. */
  locales: string[];
}

function withLocale(path: string, locale: string | undefined, locales: string[]) {
  const [, maybeLocale, ...rest] = path.split("/");
  const stripped = locales.includes(maybeLocale ?? "") ? `/${rest.join("/")}` : path;
  const target = locale ?? (locales.includes(maybeLocale ?? "") ? maybeLocale : locales[0]);
  return target ? `/${target}${stripped === "/" ? "" : stripped}` : stripped;
}

/**
 * next/link for a `/[locale]/...` routing setup. Rewrites `href` to the target
 * locale, preserving the current locale by default.
 */
export const LocaleLink = React.forwardRef<HTMLAnchorElement, LocaleLinkProps>(function LocaleLink(
  { href, locale, locales, ...props },
  ref
) {
  const pathname = usePathname() ?? "/";
  const resolvedHref =
    typeof href === "string"
      ? withLocale(href, locale, locales)
      : { ...href, pathname: withLocale(href.pathname ?? pathname, locale, locales) };
  return <NextLink ref={ref} href={resolvedHref} {...props} />;
});
