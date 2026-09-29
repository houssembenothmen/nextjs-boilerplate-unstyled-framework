"use client";
import * as React from "react";
import { useControllableState } from "../utils/use-controllable-state";

export type PaginationRangeItem = number | "ellipsis-start" | "ellipsis-end";

export interface UsePaginationOptions {
  /** Total number of pages. Or pass `total` + `pageSize`. */
  pageCount?: number;
  total?: number;
  pageSize?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current page. Default: 1. */
  siblingCount?: number;
  /** Pages always shown at the start and end. Default: 1. */
  boundaryCount?: number;
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

export function getPaginationRange(page: number, pageCount: number, siblingCount = 1, boundaryCount = 1): PaginationRangeItem[] {
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);
  const siblingsStart = Math.max(Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2);
  const siblingsEnd = Math.min(Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2), endPages.length > 0 ? endPages[0]! - 2 : pageCount - 1);

  return [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2 ? (["ellipsis-start"] as const) : boundaryCount + 1 < pageCount - boundaryCount ? [boundaryCount + 1] : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < pageCount - boundaryCount - 1 ? (["ellipsis-end"] as const) : pageCount - boundaryCount > boundaryCount ? [pageCount - boundaryCount] : []),
    ...endPages,
  ];
}

export function usePagination({
  pageCount: pageCountProp,
  total,
  pageSize = 10,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
}: UsePaginationOptions) {
  const pageCount = Math.max(1, pageCountProp ?? Math.ceil((total ?? 0) / pageSize));
  const [rawPage, setRawPage] = useControllableState({ value: pageProp, defaultValue: defaultPage, onChange: onPageChange });
  const page = Math.min(Math.max(1, rawPage), pageCount);

  const setPage = React.useCallback((p: number) => setRawPage(Math.min(Math.max(1, p), pageCount)), [setRawPage, pageCount]);
  const items = React.useMemo(() => getPaginationRange(page, pageCount, siblingCount, boundaryCount), [page, pageCount, siblingCount, boundaryCount]);

  return {
    page,
    pageCount,
    items,
    setPage,
    next: () => setPage(page + 1),
    previous: () => setPage(page - 1),
    first: () => setPage(1),
    last: () => setPage(pageCount),
    hasNext: page < pageCount,
    hasPrevious: page > 1,
  };
}
