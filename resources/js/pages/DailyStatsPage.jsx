import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function DailyStatsPage({ dailyStats }) {
  const { search, searchParams, setSearch } = useListQuery();

  if (!dailyStats) return null;

  return (
    <ListPage title="每日统计">
      <SearchToolbar
        value={search}
        onChange={setSearch}
        clearTo="/daily-stats"
        placeholder="搜索用户名..."
      />
      <DataTable
        columns={[
          { key: "user", header: "用户" },
          { key: "date", header: "日期" },
          { key: "onlineTime", header: "在线时长" },
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
            <td className="px-3 py-2 text-xs">{stat.online_time}</td>
          </>
        )}
      />
    </ListPage>
  );
}
