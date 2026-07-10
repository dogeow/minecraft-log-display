import Pagination from "../components/Pagination";
import DataTable from "../components/listing/DataTable";
import ListPage from "../components/listing/ListPage";
import PlayerCell from "../components/listing/PlayerCell";
import SearchToolbar from "../components/listing/SearchToolbar";
import useListQuery from "../hooks/useListQuery";

export default function ChatPage({ chatMessages, isAdmin }) {
  const { search, searchParams, setSearch } = useListQuery();

  if (!chatMessages) return null;

  return (
    <ListPage title="聊天记录">
      <SearchToolbar
        value={search}
        onChange={setSearch}
        clearTo="/chat"
        placeholder="搜索用户名或内容..."
      />

      <div className="space-y-4 md:hidden">
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
              {isAdmin ? message.content : "*"}
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
            header: "时间",
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
              {isAdmin ? message.content : "*"}
            </td>
            <td className="px-4 py-2">{message.sent_at}</td>
          </>
        )}
      />
    </ListPage>
  );
}
