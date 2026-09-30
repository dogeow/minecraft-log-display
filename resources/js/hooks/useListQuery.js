import { useSearchParams } from "react-router-dom";
import { updateListQuery } from "../lib/listQuery";

export default function useListQuery(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || defaults.sort || "";
  const direction =
    searchParams.get("direction") || defaults.direction || "desc";

  const setFilters = (values) =>
    setSearchParams(updateListQuery(searchParams, values));
  const setSearch = (value) => setFilters({ search: value.trim() });
  const toggleSort = (field) =>
    setFilters({
      sort: field,
      direction: sort === field && direction === "asc" ? "desc" : "asc",
    });

  return {
    search,
    sort,
    direction,
    searchParams,
    setSearch,
    setFilters,
    toggleSort,
  };
}
