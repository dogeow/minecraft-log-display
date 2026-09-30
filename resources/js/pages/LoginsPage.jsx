import { formatDuration } from "../lib/formatDuration";
import SortButton from "../components/listing/SortButton";
import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function LoginsPage({ logins }) {
  const { search, sort, direction, searchParams, setSearch, toggleSort } =
    useListQuery({ sort: "login_at", direction: "desc" });
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

  if (!logins) return null;

  return (
    <ListPage title="登录记录">
      <SearchToolbar
        dates
        value={search}
        onChange={setSearch}
        clearTo="/logins"
        placeholder="搜索用户名..."
      />
      <DataTable
        columns={[
          { key: "user", header: "用户" },
          {
            key: "loginAt",
            header: sortedHeader("login_at", "登录时间"),
            ariaSort: ariaSort("login_at"),
          },
          {
            key: "logoutAt",
            header: sortedHeader("logout_at", "登出时间"),
            ariaSort: ariaSort("logout_at"),
          },
          {
            key: "duration",
            header: sortedHeader("duration", "在线时长"),
            ariaSort: ariaSort("duration"),
          },
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
            <td className="px-3 py-2 text-xs">{login.login_at || "—"}</td>
            <td className="px-3 py-2 text-xs">{login.logout_at || "-"}</td>
            <td className="px-3 py-2 text-xs">
              {login.duration == null && login.login_at && !login.logout_at
                ? "进行中"
                : formatDuration(login.duration)}
            </td>
          </>
        )}
      />
    </ListPage>
  );
}
