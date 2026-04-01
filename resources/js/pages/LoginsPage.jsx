import { Link, useSearchParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function LoginsPage({ logins }) {
    if (!logins) return null;
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get("search") || "";

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>登录记录</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="flex gap-2 mb-6">
                        <Input
                            type="search"
                            name="search"
                            value={search}
                            onChange={(e) => {
                                const params = new URLSearchParams(
                                    searchParams,
                                );
                                if (e.target.value)
                                    params.set("search", e.target.value);
                                else params.delete("search");
                                setSearchParams(params);
                            }}
                            placeholder="搜索用户名..."
                        />
                        <Button type="submit" variant="default">
                            搜索
                        </Button>
                        {search && (
                            <Link to="/logins">
                                <Button type="button" variant="secondary">
                                    清除
                                </Button>
                            </Link>
                        )}
                    </form>

                    <div className="rounded-md border">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-2 text-left font-semibold">
                                        用户
                                    </th>
                                    <th className="px-4 py-2 text-left font-semibold">
                                        登录时间
                                    </th>
                                    <th className="px-4 py-2 text-left font-semibold">
                                        登出时间
                                    </th>
                                    <th className="px-4 py-2 text-left font-semibold">
                                        在线时长(秒)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logins.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            没有找到记录
                                        </td>
                                    </tr>
                                ) : (
                                    logins.data.map((login) => (
                                        <tr
                                            key={login.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={`https://crafthead.net/avatar/${login.user.username}`}
                                                        alt={
                                                            login.user.username
                                                        }
                                                        className="w-6 h-6 rounded-sm"
                                                    />
                                                    <span>
                                                        {login.user.username}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                {login.login_at}
                                            </td>
                                            <td className="px-4 py-2">
                                                {login.logout_at || "-"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {login.duration}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            items={logins}
                            searchParams={searchParams}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Pagination({ items, searchParams }) {
    const buildUrl = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page);
        return `?${params.toString()}`;
    };

    return (
        <div className="mt-4 overflow-x-auto">
            <div className="flex justify-center gap-1 min-w-max">
                {items.links.map((link, i) => (
                    <Link
                        key={i}
                        to={buildUrl(link.page)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`px-2 py-1 text-xs rounded ${link.active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                    />
                ))}
            </div>
        </div>
    );
}
