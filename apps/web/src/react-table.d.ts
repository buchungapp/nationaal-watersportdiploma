import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    // align?: string;
    // suppressLinkBehavior?: boolean;
    header?: {
      label?: string; // Label for column header if not a string
      className?: string; // Class name for column header
    };
    cell?: {
      className?: string; // Class name for cell
    };
  }
}
