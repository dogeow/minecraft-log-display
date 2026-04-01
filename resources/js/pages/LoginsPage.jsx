import { Link, useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginsPage({ logins }) {
    if (!logins) return null;
    const { theme } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get("search") || "";
    const cardBg = theme === "dark" ? "bg-white/10" : "bg-white";
    const textOnDark = theme === "dark" ? "text-white" : "text-gray-800";
    const inputBg =
        theme === "dark" ? "bg-white text-gray-900" : "bg-white text-gray-900";

    return (
        <div className="container mx-auto p-4">
            <div className={`${cardBg} backdrop-blur rounded-lg shadow-lg p-6`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-semibold ${textOnDark}`}>
                        登录记录
                    </h3>
                </div>

                <form className="flex space-x-2 mb-6">
                    <input
                        type="search"
                        name="search"
                        value={search}
                        onChange={(e) => {
                            const params = new URLSearchParams(searchParams);
                            if (e.target.value)
                                params.set("search", e.target.value);
                            else params.delete("search");
                            setSearchParams(params);
                        }}
                        placeholder="搜索用户名..."
                        className={`px-4 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        搜索
                    </button>
                    {search && (
                        <Link
                            to="/logins"
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            清除
                        </Link>
                    )}
                </form>

                <div className="bg-white rounded-lg shadow p-4">
                    <table className="w-full whitespace-nowrap">
                        <thead>
                            <tr className="text-left font-bold">
                                <th className="px-4 py-2">用户</th>
                                <th className="px-4 py-2">登录时间</th>
                                <th className="px-4 py-2">登出时间</th>
                                <th className="px-4 py-2">在线时长(秒)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logins.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="border px-4 py-2 text-center"
                                    >
                                        没有找到记录
                                    </td>
                                </tr>
                            ) : (
                                logins.data.map((login) => (
                                    <tr key={login.id}>
                                        <td className="border px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <img
                                                    src={`https://crafthead.net/avatar/${login.user.username}`}
                                                    alt={login.user.username}
                                                    className="w-6 h-6 rounded-sm"
                                                />
                                                <span>
                                                    {login.user.username}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="border px-4 py-2">
                                            {login.login_at}
                                        </td>
                                        <td className="border px-4 py-2">
                                            {login.logout_at || "-"}
                                        </td>
                                        <td className="border px-4 py-2">
                                            {login.duration}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <Pagination items={logins} searchParams={searchParams} />
                </div>
            </div>
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
        <div className="mt-4 flex justify-center space-x-1">
            {items.links.map((link, i) => (
                <Link
                    key={i}
                    to={buildUrl(link.page)}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1 rounded ${link.active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                />
            ))}
        </div>
    );
}
