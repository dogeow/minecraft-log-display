import { formatDuration } from "../lib/formatDuration";
import SortButton from "../components/listing/SortButton";
import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function DailyStatsPage({ dailyStats }) {
  const { search, sort, direction, searchParams, setSearch, toggleSort } =
    useListQuery({ sort: "date", direction: "desc" });
  const sortedHeader = (field, label) => (
    <SortButton
      field={field}
      activeField={sort}
      direction={direction}
      onSort={toggleSort}
    >
      {label}
    </SortButton>
  );
  const ariaSort = (field) =>
    sort === field
      ? direction === "asc"
        ? "ascending"
        : "descending"
      : undefined;

  if (!dailyStats) return null;

  return (
    <ListPage title="每日统计">
      <SearchToolbar
        dates
        value={search}
        onChange={setSearch}
        clearTo="/daily-stats"
        placeholder="搜索用户名..."
      />
      <DataTable
        columns={[
          { key: "user", header: "用户" },
          {
            key: "date",
            header: sortedHeader("date", "日期"),
            ariaSort: ariaSort("date"),
          },
          {
            key: "onlineTime",
            header: sortedHeader("online_time", "在线时长"),
            ariaSort: ariaSort("online_time"),
          },
        ]}
        rows={dailyStats.data}
        minWidth="min-w-[500px]"
        paginationItems={dailyStats}
        searchParams={searchParams}
        renderRow={(stat) => (
          <>
            <td className="px-3 py-2">
              <PlayerCell username={stat.user.username} compact />
            </td>
            <td className="px-3 py-2 text-xs">{stat.date}</td>
            <td className="px-3 py-2 text-xs">
              {formatDuration(stat.online_time)}
            </td>
          </>
        )}
      />
    </ListPage>
  );
}
