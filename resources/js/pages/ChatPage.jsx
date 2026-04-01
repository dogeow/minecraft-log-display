import { Link, useSearchParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import Pagination from "../components/Pagination";

export default function ChatPage({ chatMessages, isAdmin }) {
  if (!chatMessages) return null;
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";

  return (
    <div className="container mx-auto p-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold">聊天记录</h2>
      </div>

      <form className="flex gap-2 mb-3">
        <Input
          type="text"
          name="search"
          value={search}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("search", e.target.value);
            else params.delete("search");
            setSearchParams(params);
          }}
          placeholder="搜索用户名或内容..."
        />
        <Button type="submit" variant="default">
          搜索
        </Button>
        {search && (
          <Link to="/chat">
            <Button type="button" variant="secondary">
              清除
            </Button>
          </Link>
        )}
      </form>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {chatMessages.data.map((message) => (
          <div key={message.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={`https://crafthead.net/avatar/${message.username}`}
                alt={message.username}
                className="w-10 h-10 rounded-sm"
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

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-semibold">用户名</th>
              <th className="px-4 py-2 text-left font-semibold">消息内容</th>
              <th className="px-4 py-2 text-left font-semibold">时间</th>
            </tr>
          </thead>
          <tbody>
            {chatMessages.data.map((message) => (
              <tr key={message.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://crafthead.net/avatar/${message.username}`}
                      alt={message.username}
                      className="w-6 h-6 rounded-sm"
                    />
                    <span>{message.username}</span>
                  </div>
                </td>
                <td className="px-4 py-2 break-words">
                  {isAdmin ? message.content : "*"}
                </td>
                <td className="px-4 py-2">{message.sent_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination items={chatMessages} searchParams={searchParams} />
      </div>
    </div>
  );
}
