import * as React from "react";
import { Slot, type AsChildProps } from "../foundation/slot";

/** All breadcrumb parts are server-component safe. */
export const Breadcrumb = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function Breadcrumb(
  { "aria-label": label = "Breadcrumb", ...props },
  ref
) {
  return <nav ref={ref} aria-label={label} data-breadcrumb="" {...props} />;
});

export const BreadcrumbList = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(function BreadcrumbList(props, ref) {
  return <ol ref={ref} data-breadcrumb-list="" {...props} />;
});

export const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(function BreadcrumbItem(props, ref) {
  return <li ref={ref} data-breadcrumb-item="" {...props} />;
});

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & AsChildProps>(function BreadcrumbLink(
  { asChild, ...props },
  ref
) {
  const Comp: React.ElementType = asChild ? Slot : "a";
  return <Comp ref={ref} data-breadcrumb-link="" {...props} />;
});

/** The current page: not a link. */
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(function BreadcrumbPage(props, ref) {
  return <span ref={ref} aria-current="page" data-breadcrumb-page="" {...props} />;
});

/** Decorative divider. Defaults to "/". Flip arrows for RTL with CSS (`[dir=rtl] ... { scale: -1 1 }`). */
export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(function BreadcrumbSeparator(
  { children = "/", ...props },
  ref
) {
  return (
    <li ref={ref} role="presentation" aria-hidden data-breadcrumb-separator="" {...props}>
      {children}
    </li>
  );
});
