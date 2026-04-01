import { Link, useSearchParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function UsersPage({ users }) {
    if (!users) return null;
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "";
    const direction = searchParams.get("direction") || "asc";
    const handleSort = (field) => {
        const newDir = sort === field && direction === "asc" ? "desc" : "asc";
        const params = new URLSearchParams(searchParams);
        params.set("sort", field);
        params.set("direction", newDir);
        setSearchParams(params);
    };

    const sortIcon = (field) => {
        if (sort !== field) return null;
        return direction === "asc" ? "↑" : "↓";
    };

    const SortButton = ({ field, children }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center hover:underline"
        >
            {children}
            {sortIcon(field) && <span className="ml-1">{sortIcon(field)}</span>}
        </button>
    );

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>用户列表</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="flex gap-2 mb-6">
                        <Input
                            type="text"
                            name="search"
                            value={search}
                            onChange={(e) => {
                                const params = new URLSearchParams(
                                    searchParams,
                                );
                                if (e.target.value) {
                                    params.set("search", e.target.value);
                                } else {
                                    params.delete("search");
                                }
                                setSearchParams(params);
                            }}
                            placeholder="搜索用户名..."
                        />
                        <Button type="submit" variant="default">
                            搜索
                        </Button>
                        {search && (
                            <Link to="/users">
                                <Button type="button" variant="secondary">
                                    清除
                                </Button>
                            </Link>
                        )}
                    </form>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-4">
                        {users.data.map((user) => (
                            <div
                                key={user.id}
                                className={`rounded-lg border p-4 ${user.is_online ? "border-l-4 border-l-green-500" : ""}`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <img
                                        src={`https://crafthead.net/avatar/${user.username}`}
                                        alt={user.username}
                                        className="w-10 h-10 rounded-sm"
                                    />
                                    <div>
                                        <div className="font-semibold">
                                            {user.username}
                                        </div>
                                        <Badge
                                            variant={
                                                user.is_online
                                                    ? "secondary"
                                                    : "outline"
                                            }
                                        >
                                            {user.is_online ? "在线" : "离线"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>
                                            {user.is_online
                                                ? "在线时间"
                                                : "离线时间"}
                                            ：
                                        </span>
                                        <span>
                                            {user.is_online
                                                ? user.last_login_at
                                                : user.last_logout_at}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>总在线时长：</span>
                                        <span>
                                            {formatDuration(
                                                user.total_online_time,
                                            )}
                                        </span>
                                    </div>
                                    {user.is_scientist && (
                                        <div className="flex justify-end">
                                            <Badge variant="default">
                                                科学家
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <Pagination users={users} searchParams={searchParams} />
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-2 text-left">
                                            <SortButton field="username">
                                                用户名
                                            </SortButton>
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            状态
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            <SortButton field="last_logout_at">
                                                离线/登录
                                            </SortButton>
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            总在线时长
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            <SortButton field="is_scientist">
                                                标记
                                            </SortButton>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className={
                                                user.is_online
                                                    ? "bg-green-500/10"
                                                    : ""
                                            }
                                        >
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={`https://crafthead.net/avatar/${user.username}`}
                                                        alt={user.username}
                                                        className="w-6 h-6 rounded-sm"
                                                    />
                                                    <span>{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge
                                                    variant={
                                                        user.is_online
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                >
                                                    {user.is_online
                                                        ? "在线"
                                                        : "离线"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2">
                                                {user.is_online
                                                    ? user.last_login_at
                                                    : user.last_logout_at}
                                            </td>
                                            <td className="px-4 py-2">
                                                {formatDuration(
                                                    user.total_online_time,
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {user.is_scientist && (
                                                    <Badge variant="default">
                                                        科学家
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination users={users} searchParams={searchParams} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Pagination({ users, searchParams }) {
    const buildUrl = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page);
        return `?${params.toString()}`;
    };

    return (
        <div className="mt-4 flex justify-center gap-1">
            {users.links.map((link, i) => (
                <Link
                    key={i}
                    to={buildUrl(link.page)}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1 rounded ${link.active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                />
            ))}
        </div>
    );
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
