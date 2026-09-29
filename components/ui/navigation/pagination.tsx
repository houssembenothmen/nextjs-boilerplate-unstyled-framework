"use client";
import * as React from "react";
import { usePagination, type UsePaginationOptions, type PaginationRangeItem } from "../hooks/use-pagination";
import { dataAttr } from "../utils/attrs";
import { composeHandlers } from "../utils/compose";

type Api = ReturnType<typeof usePagination>;
const Ctx = React.createContext<Api | null>(null);
export const usePaginationContext = () => {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("Pagination parts must be used inside <Pagination>");
  return c;
};

export interface PaginationProps extends UsePaginationOptions, Omit<React.HTMLAttributes<HTMLElement>, "onChange" | "children"> {
  children?: React.ReactNode;
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { pageCount, total, pageSize, page, defaultPage, onPageChange, siblingCount, boundaryCount, "aria-label": label = "Pagination", ...props },
  ref
) {
  const api = usePagination({ pageCount, total, pageSize, page, defaultPage, onPageChange, siblingCount, boundaryCount });
  return (
    <Ctx.Provider value={api}>
      <nav ref={ref} aria-label={label} data-pagination="" {...props} />
    </Ctx.Provider>
  );
});

export interface PaginationPageRenderInfo {
  page: number;
  selected: boolean;
  /** Spread onto your element (button or link) for correct ARIA. */
  ariaProps: { "aria-current"?: "page"; "aria-label": string; "data-selected"?: "" };
  onSelect: () => void;
}

export interface PaginationItemsProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Label of a page button. Localize this. Default: "Page N". */
  getPageLabel?: (page: number) => string;
  /** Render pages as links instead of buttons (better for SEO with Next <Link>). */
  renderPage?: (info: PaginationPageRenderInfo) => React.ReactNode;
  /** Content of the "…" placeholder. */
  ellipsis?: React.ReactNode;
}

export const PaginationItems = React.forwardRef<HTMLUListElement, PaginationItemsProps>(function PaginationItems(
  { getPageLabel = (p) => `Page ${p}`, renderPage, ellipsis = "…", ...props },
  ref
) {
  const api = usePaginationContext();
  return (
    <ul ref={ref} data-pagination-list="" {...props}>
      {api.items.map((item: PaginationRangeItem) =>
        typeof item === "number" ? (
          <li key={item} data-pagination-item="">
            {(() => {
              const selected = item === api.page;
              const info: PaginationPageRenderInfo = {
                page: item,
                selected,
                onSelect: () => api.setPage(item),
                ariaProps: { "aria-label": getPageLabel(item), ...(selected ? { "aria-current": "page" as const, "data-selected": "" as const } : {}) },
              };
              return renderPage ? (
                renderPage(info)
              ) : (
                <button type="button" onClick={info.onSelect} {...info.ariaProps}>
                  {item}
                </button>
              );
            })()}
          </li>
        ) : (
          <li key={item} data-pagination-ellipsis="" aria-hidden>
            {ellipsis}
          </li>
        )
      )}
    </ul>
  );
});

function navButton(name: "previous" | "next" | "first" | "last", fallbackLabel: string) {
  return React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function NavButton(
    { onClick, disabled, "aria-label": label = fallbackLabel, ...props },
    ref
  ) {
    const api = usePaginationContext();
    const blocked = name === "previous" || name === "first" ? !api.hasPrevious : !api.hasNext;
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        disabled={disabled || blocked}
        data-disabled={dataAttr(disabled || blocked)}
        {...{ [`data-pagination-${name}`]: "" }}
        {...props}
        onClick={composeHandlers(onClick, () => api[name]())}
      />
    );
  });
}

export const PaginationPrevious = navButton("previous", "Previous page");
export const PaginationNext = navButton("next", "Next page");
export const PaginationFirst = navButton("first", "First page");
export const PaginationLast = navButton("last", "Last page");
