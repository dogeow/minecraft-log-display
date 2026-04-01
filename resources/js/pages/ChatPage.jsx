import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function ChatPage({ chatMessages, isAdmin }) {
    const { theme } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get('search') || '';
    const cardBg = theme === 'dark' ? 'bg-white/10' : 'bg-white';
    const textOnDark = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const inputBg = theme === 'dark' ? 'bg-white text-gray-900' : 'bg-white text-gray-900';

    return (
        <div className="container mx-auto p-4">
            <div className={`${cardBg} backdrop-blur rounded-lg shadow-lg p-6`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold ${textOnDark}`}>聊天记录</h2>
                </div>

                <form className="flex space-x-2 mb-6">
                    <input
                        type="text"
                        name="search"
                        value={search}
                        onChange={(e) => {
                            const params = new URLSearchParams(searchParams);
                            if (e.target.value) params.set('search', e.target.value);
                            else params.delete('search');
                            setSearchParams(params);
                        }}
                        placeholder="搜索用户名或内容..."
                        className={`px-4 py-2 rounded-lg border ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">搜索</button>
                    {search && (
                        <Link to="/chat" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">清除</Link>
                    )}
                </form>

                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                    {chatMessages.data.map((message) => (
                        <div key={message.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center space-x-3 mb-2">
                                <img src={`https://crafthead.net/avatar/${message.username}`} alt={message.username} className="w-10 h-10 rounded-sm" />
                                <div>
                                    <div className="font-semibold">{message.username}</div>
                                    <div className="text-sm text-gray-500">{message.sent_at}</div>
                                </div>
                            </div>
                            <div className="text-gray-700 break-words">{isAdmin ? message.content : '*'}</div>
                        </div>
                    ))}
                    <Pagination items={chatMessages} searchParams={searchParams} />
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-lg shadow p-4">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">用户名</th>
                                <th className="px-4 py-2">消息内容</th>
                                <th className="px-4 py-2">时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chatMessages.data.map((message) => (
                                <tr key={message.id}>
                                    <td className="border px-4 py-2">
                                        <div className="flex items-center space-x-2">
                                            <img src={`https://crafthead.net/avatar/${message.username}`} alt={message.username} className="w-6 h-6 rounded-sm" />
                                            <span>{message.username}</span>
                                        </div>
                                    </td>
                                    <td className="border px-4 py-2 break-words">{isAdmin ? message.content : '*'}</td>
                                    <td className="border px-4 py-2">{message.sent_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination items={chatMessages} searchParams={searchParams} />
                </div>
            </div>
        </div>
    );
}

function Pagination({ items, searchParams }) {
    const buildUrl = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page);
        return `?${params.toString()}`;
    };

    return (
        <div className="mt-4 flex justify-center space-x-1">
            {items.links.map((link, i) => (
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
