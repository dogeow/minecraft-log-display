import Pagination from "../Pagination";

export default function DataTable({
  columns,
  rows,
  renderRow,
  paginationItems,
  searchParams,
  minWidth = "",
  className = "",
  rowClassName,
  emptyText = "没有找到记录",
}) {
  return (
    <div
      className={`archive-table overflow-x-auto rounded-xl border ${className}`}
    >
      <table aria-label="记录列表" className={`w-full ${minWidth}`}>
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((column) => (
              <th
                scope="col"
                aria-sort={column.ariaSort}
                key={column.key}
                className={
                  column.className ||
                  "px-3 py-2 text-left text-xs font-semibold"
                }
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b last:border-0 ${rowClassName?.(row) || ""}`}
              >
                {renderRow(row)}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {paginationItems && (
        <Pagination items={paginationItems} searchParams={searchParams} />
      )}
    </div>
  );
}
