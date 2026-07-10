import { Badge } from "../components/ui/badge";
import Pagination from "../components/Pagination";
import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import SortButton from "../components/listing/SortButton";
import useListQuery from "../hooks/useListQuery";

export default function UsersPage({ users }) {
  const { search, sort, direction, searchParams, setSearch, toggleSort } =
    useListQuery();

  if (!users) return null;

  const sortableHeader = (field, label) => (
    <SortButton
      field={field}
      activeField={sort}
      direction={direction}
      onSort={toggleSort}
    >
      {label}
    </SortButton>
  );

  const columns = [
    {
      key: "username",
      header: sortableHeader("username", "用户名"),
      className: "px-4 py-2 text-left",
    },
    { key: "status", header: "状态", className: "px-4 py-2 text-left" },
    {
      key: "activity",
      header: sortableHeader("last_logout_at", "离线/登录"),
      className: "px-4 py-2 text-left",
    },
    {
      key: "duration",
      header: "总在线时长",
      className: "px-4 py-2 text-left",
    },
    {
      key: "flag",
      header: sortableHeader("is_scientist", "标记"),
      className: "px-4 py-2 text-left",
    },
  ];

  return (
    <ListPage title="用户列表">
      <SearchToolbar
        value={search}
        onChange={setSearch}
        clearTo="/users"
        placeholder="搜索用户名..."
        className="mb-6"
      />

      <div className="space-y-4 md:hidden">
        {users.data.map((user) => (
          <div
            key={user.id}
            className={`rounded-lg border p-4 ${user.is_online ? "border-l-4 border-l-green-500" : ""}`}
          >
            <div className="mb-2 flex items-center gap-3">
              <img
                src={`https://crafthead.net/avatar/${user.username}`}
                alt={user.username}
                className="h-10 w-10 rounded-sm"
              />
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="truncate font-semibold">{user.username}</span>
                  {user.is_scientist == 1 && (
                    <Badge variant="default">科学家</Badge>
                  )}
                </div>
                <Badge variant={user.is_online ? "secondary" : "outline"}>
                  {user.is_online ? "在线" : "离线"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{user.is_online ? "在线时间" : "离线时间"}：</span>
                <span>
                  {user.is_online ? user.last_login_at : user.last_logout_at}
                </span>
              </div>
              <div className="flex justify-between">
                <span>总在线时长：</span>
                <span>{formatDuration(user.total_online_time)}</span>
              </div>
            </div>
          </div>
        ))}

        <Pagination items={users} searchParams={searchParams} />
      </div>

      <DataTable
        className="hidden md:block"
        columns={columns}
        rows={users.data}
        paginationItems={users}
        searchParams={searchParams}
        rowClassName={(user) => (user.is_online ? "bg-green-500/10" : "")}
        renderRow={(user) => (
          <>
            <td className="px-4 py-2">
              <PlayerCell username={user.username} />
            </td>
            <td className="px-4 py-2">
              <Badge variant={user.is_online ? "secondary" : "outline"}>
                {user.is_online ? "在线" : "离线"}
              </Badge>
            </td>
            <td className="px-4 py-2">
              {user.is_online ? user.last_login_at : user.last_logout_at}
            </td>
            <td className="px-4 py-2">
              {formatDuration(user.total_online_time)}
            </td>
            <td className="px-4 py-2">
              {user.is_scientist == 1 && (
                <Badge variant="default">科学家</Badge>
              )}
            </td>
          </>
        )}
      />
    </ListPage>
  );
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
