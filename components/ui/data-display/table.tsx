import * as React from "react";

/** Plain table parts with data hooks. All server-component safe. */
export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(function Table(props, ref) {
  return <table ref={ref} data-table="" {...props} />;
});
export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(function TableCaption(props, ref) {
  return <caption ref={ref} {...props} />;
});
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableHeader(props, ref) {
  return <thead ref={ref} {...props} />;
});
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableBody(props, ref) {
  return <tbody ref={ref} {...props} />;
});
export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableFooter(props, ref) {
  return <tfoot ref={ref} {...props} />;
});

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow({ selected, ...props }, ref) {
  return <tr ref={ref} aria-selected={selected || undefined} data-selected={selected ? "" : undefined} {...props} />;
});

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Sets aria-sort and [data-sort]. */
  sort?: "asc" | "desc" | "none";
}
export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead({ sort, scope = "col", ...props }, ref) {
  return (
    <th
      ref={ref}
      scope={scope}
      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : sort === "none" ? "none" : undefined}
      data-sort={sort}
      {...props}
    />
  );
});
export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(function TableCell(props, ref) {
  return <td ref={ref} {...props} />;
});
