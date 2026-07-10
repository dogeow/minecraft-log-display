import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function LoginLocationsPage({ locations, isAdmin }) {
  const { search, searchParams, setSearch } = useListQuery();

  if (!locations) return null;

  return (
    <ListPage title="登录位置">
      <SearchToolbar
        value={search}
        onChange={setSearch}
        clearTo="/login-locations"
        placeholder="搜索用户名..."
      />
      <DataTable
        columns={[
          { key: "user", header: "用户" },
          { key: "world", header: "世界" },
          { key: "coordinates", header: "坐标" },
          { key: "ip", header: "IP" },
          { key: "loginAt", header: "登录时间" },
        ]}
        rows={locations.data}
        minWidth="min-w-[750px]"
        paginationItems={locations}
        searchParams={searchParams}
        renderRow={(location) => (
          <>
            <td className="px-3 py-2">
              <PlayerCell username={location.user.username} compact />
            </td>
            <td className="px-3 py-2 text-xs">{location.world}</td>
            <td className="px-3 py-2 text-xs">
              {isAdmin ? location.formatted_coordinates : "(*,*,*)"}
            </td>
            <td className="px-3 py-2 text-xs">
              {isAdmin ? location.ip : "***"}
            </td>
            <td className="px-3 py-2 text-xs">{location.login_at}</td>
          </>
        )}
      />
    </ListPage>
  );
}
