import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export default function Nav({ isAdmin }) {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const navLinks = [
        { path: "/", label: "首页" },
        { path: "/users", label: "用户列表" },
        { path: "/daily-stats", label: "每日统计" },
        { path: "/logins", label: "登录记录" },
        { path: "/chat", label: "聊天记录" },
        { path: "/login-locations", label: "登录位置" },
    ];

    const textColor = theme === "dark" ? "text-white" : "text-gray-800";
    const hoverColor =
        theme === "dark" ? "hover:text-gray-200" : "hover:text-gray-600";

    return (
        <nav
            className={`${theme === "dark" ? "bg-transparent" : "bg-white/80"} backdrop-blur-sm`}
        >
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3">
                    <div className="flex justify-between items-center">
                        <Link
                            to="/"
                            className={`text-xl font-bold ${textColor}`}
                        >
                            我的世界
                        </Link>
                        <button
                            className={`md:hidden rounded-lg focus:outline-none ${textColor}`}
                            id="menuBtn"
                            onClick={() => {
                                const menu = document.getElementById("menu");
                                const menuIcon =
                                    document.getElementById("menuIcon");
                                const closeIcon =
                                    document.getElementById("closeIcon");
                                menu.classList.toggle("hidden");
                                menuIcon.classList.toggle("hidden");
                                closeIcon.classList.toggle("hidden");
                            }}
                        >
                            <svg
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                className="w-6 h-6"
                            >
                                <path
                                    id="menuIcon"
                                    fillRule="evenodd"
                                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                                ></path>
                                <path
                                    id="closeIcon"
                                    className="hidden"
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                ></path>
                            </svg>
                        </button>
                    </div>
                    <div
                        className="hidden md:flex md:items-center md:space-x-4"
                        id="menu"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`block mt-4 md:inline-block md:mt-0 ${textColor} ${hoverColor} ${location.pathname === link.path ? "font-semibold" : ""}`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <button
                            onClick={toggleTheme}
                            className={`block mt-4 md:inline-block md:mt-0 ${textColor} ${hoverColor}`}
                            title={
                                theme === "dark"
                                    ? "切换到浅色模式"
                                    : "切换到深色模式"
                            }
                        >
                            {theme === "dark" ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                    />
                                </svg>
                            )}
                        </button>

                        {isAdmin && (
                            <button
                                onClick={async () => {
                                    await fetch("/logout", { method: "POST" });
                                    window.location.href = "/";
                                }}
                                className={`block mt-4 md:inline-block md:mt-0 ${textColor} ${hoverColor} cursor-pointer`}
                            >
                                退出登录
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
