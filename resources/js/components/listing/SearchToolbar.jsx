import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { updateListQuery } from "../../lib/listQuery";

export default function SearchToolbar({
  value,
  placeholder,
  className = "mb-5",
  dates = false,
  status = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState(value);
  const [start, setStart] = useState(searchParams.get("start_date") || "");
  const [end, setEnd] = useState(searchParams.get("end_date") || "");
  const [online, setOnline] = useState(searchParams.get("status") || "");
  const [perPage, setPerPage] = useState(searchParams.get("per_page") || "");

  useEffect(() => {
    setDraft(value);
    setStart(searchParams.get("start_date") || "");
    setEnd(searchParams.get("end_date") || "");
    setOnline(searchParams.get("status") || "");
    setPerPage(searchParams.get("per_page") || "");
  }, [value, searchParams]);

  const hasFilters =
    value ||
    searchParams.has("start_date") ||
    searchParams.has("end_date") ||
    searchParams.has("status") ||
    searchParams.has("per_page");

  return (
    <form
      role="search"
      className={`archive-filters ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        setSearchParams(
          updateListQuery(searchParams, {
            search: draft.trim(),
            start_date: dates ? start : "",
            end_date: dates ? end : "",
            status: status ? online : "",
            per_page: perPage,
          }),
        );
      }}
    >
      <label className="archive-filter-search">
        <span className="archive-field-label">搜索记录</span>
        <span className="relative block">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
          />
          <Input
            type="search"
            name="search"
            className="pl-9"
            maxLength={100}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
          />
        </span>
      </label>
      {dates && (
        <>
          <label>
            <span className="archive-field-label">开始日期</span>
            <Input
              type="date"
              name="start_date"
              value={start}
              max={end || undefined}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label>
            <span className="archive-field-label">结束日期</span>
            <Input
              type="date"
              name="end_date"
              value={end}
              min={start || undefined}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
        </>
      )}
      {status && (
        <label>
          <span className="archive-field-label">玩家状态</span>
          <select
            className="archive-select"
            value={online}
            onChange={(event) => setOnline(event.target.value)}
          >
            <option value="">全部玩家</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
          </select>
        </label>
      )}
      <label>
        <span className="archive-field-label">每页记录</span>
        <select
          className="archive-select"
          value={perPage}
          onChange={(event) => setPerPage(event.target.value)}
        >
          <option value="">默认</option>
          <option value="10">10 条</option>
          <option value="25">25 条</option>
          <option value="50">50 条</option>
        </select>
      </label>
      <div className="flex gap-2">
        <Button type="submit">
          <Search size={15} aria-hidden="true" />
          筛选
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft("");
              setStart("");
              setEnd("");
              setOnline("");
              setPerPage("");
              setSearchParams(
                updateListQuery(searchParams, {
                  search: "",
                  start_date: "",
                  end_date: "",
                  status: "",
                  per_page: "",
                }),
              );
            }}
          >
            <X size={15} aria-hidden="true" />
            重置
          </Button>
        )}
      </div>
    </form>
  );
}
