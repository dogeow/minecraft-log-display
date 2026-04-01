import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function UsersPage({ users, authUser }) {
    const { theme } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '';
    const direction = searchParams.get('direction') || 'asc';

    const cardBg = theme === 'dark' ? 'bg-white/10' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-white/10' : 'border-gray-200';
    const textOnDark = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const textMuted = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
    const inputBg = theme === 'dark' ? 'bg-white text-gray-900' : 'bg-white text-gray-900';

    const handleSort = (field) => {
        const newDir = sort === field && direction === 'asc' ? 'desc' : 'asc';
        const params = new URLSearchParams(searchParams);
        params.set('sort', field);
        params.set('direction', newDir);
        setSearchParams(params);
    };

    const sortIcon = (field) => {
        if (sort !== field) return null;
        return direction === 'asc' ? '↑' : '↓';
    };

    const SortLink = ({ field, children }) => (
        <button onClick={() => handleSort(field)} className="flex items-center hover:underline">
            {children}
            {sortIcon(field) && <span className="ml-1">{sortIcon(field)}</span>}
        </button>
    );

    return (
        <div className="container mx-auto p-4">
            <div className={`${cardBg} backdrop-blur rounded-lg shadow-lg p-6`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${textOnDark}`}>用户列表</h2>
                </div>

                <form className="flex space-x-2 mb-6">
                    <input
                        type="text"
                        name="search"
                        value={search}
                        onChange={(e) => {
                            const params = new URLSearchParams(searchParams);
                            if (e.target.value) {
                                params.set('search', e.target.value);
                            } else {
                                params.delete('search');
                            }
                            setSearchParams(params);
                        }}
                        placeholder="搜索用户名..."
                        className={`px-4 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        搜索
                    </button>
                    {search && (
                        <Link
                            to="/users"
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            清除
                        </Link>
                    )}
                </form>

                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                    {users.data.map((user) => (
                        <div key={user.id} className={`${cardBg} rounded-lg shadow p-4 ${user.is_online ? 'border-l-4 border-green-500' : ''}`}>
                            <div className="flex items-center space-x-3 mb-3">
                                <img src={`https://crafthead.net/avatar/${user.username}`} alt={user.username} className="w-10 h-10 rounded-sm" />
                                <div>
                                    <div className={`font-semibold ${textOnDark}`}>{user.username}</div>
                                    <span className={`px-2 py-1 rounded text-sm ${user.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.is_online ? '在线' : '离线'}
                                    </span>
                                </div>
                            </div>
                            <div className={`space-y-2 text-sm ${textMuted}`}>
                                <div className="flex justify-between">
                                    <span>{user.is_online ? '在线时间' : '离线时间'}：</span>
                                    <span>{user.is_online ? user.last_login_at : user.last_logout_at}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>总在线时长：</span>
                                    <span>{formatDuration(user.total_online_time)}</span>
                                </div>
                                {user.is_scientist && (
                                    <div className="flex justify-end">
                                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">科学家</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <Pagination users={users} searchParams={searchParams} />
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-lg shadow p-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="px-4 py-2"><SortLink field="username">用户名</SortLink></th>
                                    <th className="px-4 py-2">状态</th>
                                    <th className="px-4 py-2"><SortLink field="last_logout_at">离线/登录</SortLink></th>
                                    <th className="px-4 py-2">总在线时长</th>
                                    <th className="px-4 py-2"><SortLink field="is_scientist">标记</SortLink></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user) => (
                                    <tr key={user.id} className={user.is_online ? 'bg-green-50' : ''}>
                                        <td className="border px-4 py-2">
                                            <div className="flex items-center space-x-2">
                                                <img src={`https://crafthead.net/avatar/${user.username}`} alt={user.username} className="w-6 h-6 rounded-sm" />
                                                <span>{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="border px-4 py-2">
                                            <span className={`px-2 py-1 rounded text-sm ${user.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {user.is_online ? '在线' : '离线'}
                                            </span>
                                        </td>
                                        <td className="border px-4 py-2">{user.is_online ? user.last_login_at : user.last_logout_at}</td>
                                        <td className="border px-4 py-2">{formatDuration(user.total_online_time)}</td>
                                        <td className="border px-4 py-2">
                                            {user.is_scientist && <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">科学家</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination users={users} searchParams={searchParams} />
                </div>
            </div>
        </div>
    );
}

function Pagination({ users, searchParams }) {
    const buildUrl = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page);
        return `?${params.toString()}`;
    };

    return (
        <div className="mt-4 flex justify-center space-x-1">
            {users.links.map((link, i) => (
                <Link
                    key={i}
                    to={buildUrl(link.page)}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1 rounded ${link.active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                />
            ))}
        </div>
    );
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
