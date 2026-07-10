import { useSearchParams } from "react-router-dom";

export default function useListQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "";
  const direction = searchParams.get("direction") || "asc";

  const setSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    setSearchParams(params);
  };

  const toggleSort = (field) => {
    const params = new URLSearchParams(searchParams);
    const nextDirection =
      sort === field && direction === "asc" ? "desc" : "asc";
    params.set("sort", field);
    params.set("direction", nextDirection);
    setSearchParams(params);
  };

  return {
    search,
    sort,
    direction,
    searchParams,
    setSearch,
    toggleSort,
  };
}
