import type { ReactNode } from "react";

export function DataTable<T extends { id: string }>(props: {
  caption: string;
  rows: T[];
  columns: Array<{ key: string; header: string; render: (row: T) => ReactNode }>;
  empty: string;
}) {
  if (props.rows.length === 0) return <p role="status">{props.empty}</p>;
  return (
    <table className="sx-data-table">
      <caption>{props.caption}</caption>
      <thead>
        <tr>{props.columns.map((column) => <th key={column.key} scope="col">{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {props.rows.map((row) => (
          <tr key={row.id}>{props.columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
