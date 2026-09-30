import { Link } from "react-router-dom";
import { paginationPages } from "../lib/listQuery";

export default function Pagination({ items, searchParams }) {
  const meta = items?.meta ?? {};
  const current = Number(meta.current_page) || 1;
  const last = Math.max(1, Number(meta.last_page) || 1);
  const buildUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `?${params.toString()}`;
  };
  const control = (page, label, disabled = false) =>
    disabled ? (
      <span className="archive-page-link is-disabled" aria-disabled="true">
        {label}
      </span>
    ) : (
      <Link className="archive-page-link" to={buildUrl(page)}>
        {label}
      </Link>
    );

  return (
    <footer className="archive-pagination">
      <p className="text-sm text-muted-foreground" role="status">
        共 {meta.total ?? 0} 条记录
        {meta.from != null && ` · 显示 ${meta.from}–${meta.to} 条`}
      </p>
      <nav aria-label="记录分页" className="flex flex-wrap items-center gap-1">
        {control(current - 1, "上一页", current <= 1)}
        {paginationPages(current, last).map((page) =>
          typeof page === "string" ? (
            <span key={page} className="px-1" aria-hidden="true">
              …
            </span>
          ) : (
            <Link
              key={page}
              to={buildUrl(page)}
              aria-label={`第 ${page} 页`}
              aria-current={page === current ? "page" : undefined}
              className={`archive-page-link ${page === current ? "is-current" : ""}`}
            >
              {page}
            </Link>
          ),
        )}
        {control(current + 1, "下一页", current >= last)}
      </nav>
    </footer>
  );
}
