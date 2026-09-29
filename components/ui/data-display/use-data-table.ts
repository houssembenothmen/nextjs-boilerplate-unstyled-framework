"use client";
import * as React from "react";

export type SortDirection = "asc" | "desc";
export interface SortState {
  id: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  id: string;
  /** Value used for sorting / filtering / global search. */
  accessor?: (row: T) => unknown;
  sortable?: boolean;
  /** Custom comparator. Default handles numbers, dates and strings (locale-aware). */
  sortFn?: (a: T, b: T) => number;
  /** Custom column filter. Default: case-insensitive "contains" on String(accessor(row)). */
  filterFn?: (row: T, filterValue: unknown) => boolean;
}

export interface DataTableState {
  sort: SortState | null;
  columnFilters: Record<string, unknown>;
  globalFilter: string;
  page: number; // 1-based
  pageSize: number;
  selectedIds: string[];
}

export interface UseDataTableOptions<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T, index: number) => string;
  initialState?: Partial<DataTableState>;
  /** Server mode: you sort / filter / paginate yourself, and pass the current page of `data`. */
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  /** Total rows on the server (manualPagination). */
  rowCount?: number;
  locale?: string;
  /** Fires with the full state after any change. Use it to fetch server data. */
  onStateChange?: (state: DataTableState) => void;
}

const compare = (a: unknown, b: unknown, locale?: string) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), locale, { numeric: true, sensitivity: "base" });
};

const includes = (v: unknown, q: string) => String(v ?? "").toLowerCase().includes(q.toLowerCase());

/**
 * Headless data table logic: sorting, filtering, pagination, selection.
 * Render with <Table> parts however you like.
 */
export function useDataTable<T>({
  data, columns, getRowId, initialState, manualSorting, manualFiltering, manualPagination, rowCount, locale, onStateChange,
}: UseDataTableOptions<T>) {
  const [state, setState] = React.useState<DataTableState>({
    sort: null, columnFilters: {}, globalFilter: "", page: 1, pageSize: 10, selectedIds: [], ...initialState,
  });
  const onChangeRef = React.useRef(onStateChange);
  onChangeRef.current = onStateChange;
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) return void (first.current = false);
    onChangeRef.current?.(state);
  }, [state]);

  const patch = React.useCallback((p: Partial<DataTableState>, resetPage = false) => setState((s) => ({ ...s, ...p, ...(resetPage ? { page: 1 } : null) })), []);

  const processed = React.useMemo(() => {
    let rows = data;
    if (!manualFiltering) {
      const entries = Object.entries(state.columnFilters).filter(([, v]) => v !== "" && v != null);
      if (entries.length) {
        rows = rows.filter((row) =>
          entries.every(([id, v]) => {
            const col = columns.find((c) => c.id === id);
            return col?.filterFn ? col.filterFn(row, v) : includes(col?.accessor?.(row), String(v));
          })
        );
      }
      if (state.globalFilter) {
        rows = rows.filter((row) => columns.some((c) => c.accessor && includes(c.accessor(row), state.globalFilter)));
      }
    }
    if (!manualSorting && state.sort) {
      const col = columns.find((c) => c.id === state.sort!.id);
      if (col) {
        const dir = state.sort.direction === "asc" ? 1 : -1;
        rows = [...rows].sort((a, b) => dir * (col.sortFn ? col.sortFn(a, b) : compare(col.accessor?.(a), col.accessor?.(b), locale)));
      }
    }
    return rows;
  }, [data, columns, state.columnFilters, state.globalFilter, state.sort, manualFiltering, manualSorting, locale]);

  const totalRows = manualPagination ? (rowCount ?? data.length) : processed.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / state.pageSize));
  const page = Math.min(state.page, pageCount);
  const rows = manualPagination ? processed : processed.slice((page - 1) * state.pageSize, page * state.pageSize);

  const idsOnPage = rows.map((r, i) => getRowId(r, i));
  const selected = new Set(state.selectedIds);
  const allSelected = idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id));
  const someSelected = !allSelected && idsOnPage.some((id) => selected.has(id));

  return {
    /** Rows for the current page. */
    rows,
    /** All rows after filter + sort (before pagination). */
    processedRows: processed,
    state,
    totalRows,

    sort: state.sort,
    /** Cycles none → asc → desc → none. */
    toggleSort: (id: string) =>
      patch({ sort: state.sort?.id !== id ? { id, direction: "asc" } : state.sort.direction === "asc" ? { id, direction: "desc" } : null }),
    setSort: (sort: SortState | null) => patch({ sort }),
    /** Spread onto a header button / <TableHead>: aria-sort + click handler. */
    getSortProps: (id: string) => {
      const dir = state.sort?.id === id ? state.sort.direction : null;
      return {
        "aria-sort": (dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none") as "ascending" | "descending" | "none",
        "data-sort": dir ?? "none",
      };
    },

    columnFilters: state.columnFilters,
    setColumnFilter: (id: string, value: unknown) => patch({ columnFilters: { ...state.columnFilters, [id]: value } }, true),
    globalFilter: state.globalFilter,
    setGlobalFilter: (globalFilter: string) => patch({ globalFilter }, true),
    resetFilters: () => patch({ columnFilters: {}, globalFilter: "" }, true),

    page,
    pageCount,
    pageSize: state.pageSize,
    setPage: (p: number) => patch({ page: Math.min(Math.max(1, p), pageCount) }),
    setPageSize: (pageSize: number) => patch({ pageSize }, true),

    selection: {
      selectedIds: state.selectedIds,
      count: state.selectedIds.length,
      isSelected: (id: string) => selected.has(id),
      toggle: (id: string) => patch({ selectedIds: selected.has(id) ? state.selectedIds.filter((x) => x !== id) : [...state.selectedIds, id] }),
      /** Selects / deselects every row on the current page. */
      toggleAll: () =>
        patch({ selectedIds: allSelected ? state.selectedIds.filter((id) => !idsOnPage.includes(id)) : Array.from(new Set([...state.selectedIds, ...idsOnPage])) }),
      clear: () => patch({ selectedIds: [] }),
      allSelected,
      someSelected,
    },
  };
}
