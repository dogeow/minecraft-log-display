import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginPage({ csrfToken, errors }) {
    const { theme } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const cardBg = theme === 'dark' ? 'bg-white/10' : 'bg-white/80';
    const textOnDark = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const inputBg = 'bg-white text-gray-900';

    return (
        <div className="container mx-auto p-4">
            <div className={`max-w-md mx-auto ${cardBg} backdrop-blur rounded-lg shadow-lg p-6`}>
                <h3 className={`text-xl font-semibold ${textOnDark} mb-6`}>管理员登录</h3>

                {errors && errors.length > 0 && (
                    <div className="mb-4 text-red-500">{errors[0]}</div>
                )}

                <form method="POST" action="/login">
                    <input type="hidden" name="_token" value={csrfToken} />

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">用户名</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">密码</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        登录
                    </button>
                </form>
            </div>
        </div>
    );
}
