import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function LoginsPage({ logins }) {
  const { search, searchParams, setSearch } = useListQuery();

  if (!logins) return null;

  return (
    <ListPage title="登录记录">
      <SearchToolbar
        value={search}
        onChange={setSearch}
        clearTo="/logins"
        placeholder="搜索用户名..."
      />
      <DataTable
        columns={[
          { key: "user", header: "用户" },
          { key: "loginAt", header: "登录时间" },
          { key: "logoutAt", header: "登出时间" },
          { key: "duration", header: "在线时长" },
        ]}
        rows={logins.data}
        minWidth="min-w-[600px]"
        paginationItems={logins}
        searchParams={searchParams}
        renderRow={(login) => (
          <>
            <td className="px-3 py-2">
              <PlayerCell username={login.user.username} compact />
            </td>
            <td className="px-3 py-2 text-xs">{login.login_at}</td>
            <td className="px-3 py-2 text-xs">{login.logout_at || "-"}</td>
            <td className="px-3 py-2 text-xs">{login.duration}</td>
          </>
        )}
      />
    </ListPage>
  );
}
