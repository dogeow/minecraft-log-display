import { Link, useSearchParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import Pagination from "../components/Pagination";

export default function LoginLocationsPage({ locations, isAdmin }) {
  if (!locations) return null;
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";

  return (
    <div className="container mx-auto p-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold">登录位置</h2>
      </div>

      <form className="flex gap-2 mb-3">
        <Input
          type="search"
          name="search"
          value={search}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            if (e.target.value) params.set("search", e.target.value);
            else params.delete("search");
            setSearchParams(params);
          }}
          placeholder="搜索用户名..."
        />
        <Button type="submit" variant="default">
          搜索
        </Button>
        {search && (
          <Link to="/login-locations">
            <Button type="button" variant="secondary">
              清除
            </Button>
          </Link>
        )}
      </form>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-semibold text-xs">
                用户
              </th>
              <th className="px-3 py-2 text-left font-semibold text-xs">
                世界
              </th>
              <th className="px-3 py-2 text-left font-semibold text-xs">
                坐标
              </th>
              <th className="px-3 py-2 text-left font-semibold text-xs">IP</th>
              <th className="px-3 py-2 text-left font-semibold text-xs">
                登录时间
              </th>
            </tr>
          </thead>
          <tbody>
            {locations.data.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  没有找到记录
                </td>
              </tr>
            ) : (
              locations.data.map((location) => (
                <tr key={location.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://crafthead.net/avatar/${location.user.username}`}
                        alt={location.user.username}
                        className="w-6 h-6 rounded-sm"
                      />
                      <span className="truncate max-w-[80px]">
                        {location.user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">{location.world}</td>
                  <td className="px-3 py-2 text-xs">
                    {isAdmin ? location.formatted_coordinates : "(*,*,*)"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {isAdmin ? location.ip : "***"}
                  </td>
                  <td className="px-3 py-2 text-xs">{location.login_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination items={locations} searchParams={searchParams} />
      </div>
    </div>
  );
}
