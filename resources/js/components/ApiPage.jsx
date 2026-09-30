import useSWR from "swr";
import { Link, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

function LoadingSkeleton() {
  return (
    <div
      className="archive-shell space-y-4"
      role="status"
      aria-label="正在加载记录"
    >
      <span className="sr-only">正在加载记录</span>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ApiPage({ endpoint, includeSearch = false, children }) {
  const location = useLocation();
  const url = `${endpoint}${includeSearch ? location.search : ""}`;
  const { data, error, isLoading, isValidating, mutate } = useSWR(url, {
    keepPreviousData: true,
    shouldRetryOnError: false,
  });

  if (!data && !error) return <LoadingSkeleton />;
  if (!data && error)
    return (
      <main className="archive-shell">
        <section className="archive-empty" role="alert">
          <h1>加载失败</h1>
          <p>{error.message}</p>
          <Button onClick={() => mutate()} disabled={isValidating}>
            重新加载
          </Button>
          {includeSearch && <Link to={location.pathname}>清除筛选条件</Link>}
        </section>
      </main>
    );

  return (
    <div aria-busy={isLoading}>
      {includeSearch && (
        <div className="archive-shell archive-sync-bar">
          <p role="status">
            {error
              ? error.message
              : isValidating
                ? "正在更新记录…"
                : "记录已加载"}
            {(error || isLoading) && " · 当前显示上一次结果"}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isValidating}
            onClick={() => mutate()}
          >
            <RefreshCw
              size={14}
              className={isValidating ? "animate-spin" : ""}
              aria-hidden="true"
            />
            刷新
          </Button>
        </div>
      )}
      {children(data)}
    </div>
  );
}
