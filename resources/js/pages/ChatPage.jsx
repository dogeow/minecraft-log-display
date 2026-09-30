import Pagination from "../components/Pagination";
import SortButton from "../components/listing/SortButton";
import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function ChatPage({ chatMessages, isAdmin }) {
  const { search, sort, direction, searchParams, setSearch, toggleSort } =
    useListQuery({ sort: "sent_at", direction: "desc" });
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

  if (!chatMessages) return null;

  return (
    <ListPage title="聊天记录">
      <SearchToolbar
        dates
        value={search}
        onChange={setSearch}
        clearTo="/chat"
        placeholder={isAdmin ? "搜索用户名或内容..." : "搜索用户名..."}
      />

      <div className="space-y-4 md:hidden">
        {chatMessages.data.length === 0 && (
          <div className="archive-empty">没有找到聊天记录，请调整筛选条件</div>
        )}
        {chatMessages.data.map((message) => (
          <div key={message.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-3">
              <img
                src={`https://crafthead.net/avatar/${message.username}`}
                alt={message.username}
                className="h-10 w-10 rounded-sm"
              />
              <div>
                <div className="font-semibold">{message.username}</div>
                <div className="text-sm text-muted-foreground">
                  {message.sent_at}
                </div>
              </div>
            </div>
            <div className="text-foreground break-words">
              {isAdmin ? message.content : "登录后查看消息内容"}
            </div>
          </div>
        ))}
        <Pagination items={chatMessages} searchParams={searchParams} />
      </div>

      <DataTable
        className="hidden md:block"
        columns={[
          {
            key: "username",
            header: "用户名",
            className: "px-4 py-2 text-left font-semibold",
          },
          {
            key: "content",
            header: "消息内容",
            className: "px-4 py-2 text-left font-semibold",
          },
          {
            key: "sentAt",
            header: sortedHeader("sent_at", "时间"),
            ariaSort: ariaSort("sent_at"),
            className: "px-4 py-2 text-left font-semibold",
          },
        ]}
        rows={chatMessages.data}
        paginationItems={chatMessages}
        searchParams={searchParams}
        renderRow={(message) => (
          <>
            <td className="px-4 py-2">
              <PlayerCell username={message.username} />
            </td>
            <td className="break-words px-4 py-2">
              {isAdmin ? message.content : "登录后查看消息内容"}
            </td>
            <td className="px-4 py-2">{message.sent_at}</td>
          </>
        )}
      />
    </ListPage>
  );
}
