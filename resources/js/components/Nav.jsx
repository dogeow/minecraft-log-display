import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";

export default function Nav({ isAdmin }) {
    const location = useLocation();
    const { theme } = useTheme();

    const navLinks = [
        { path: "/users", label: "用户列表" },
        { path: "/daily-stats", label: "每日统计" },
        { path: "/logins", label: "登录记录" },
        { path: "/chat", label: "聊天记录" },
        { path: "/login-locations", label: "登录位置" },
    ];

    const textColor = theme === "dark" ? "text-white" : "text-gray-800";
    const hoverColor =
        theme === "dark" ? "hover:text-gray-200" : "hover:text-gray-600";

    const handleMenuClick = () => {
        if (!isAdmin) return;
        const menu = document.getElementById("menu");
        const menuIcon = document.getElementById("menuIcon");
        const closeIcon = document.getElementById("closeIcon");
        menu.classList.toggle("hidden");
        menuIcon.classList.toggle("hidden");
        closeIcon.classList.toggle("hidden");
    };

    const handleNavClick = () => {
        const menu = document.getElementById("menu");
        const menuIcon = document.getElementById("menuIcon");
        const closeIcon = document.getElementById("closeIcon");
        menu.classList.add("hidden");
        menuIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
    };

    return (
        <nav className="bg-transparent backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3">
                    <div className="flex justify-between items-center w-full">
                        <Link
                            to="/"
                            className={`text-xl font-bold ${textColor}`}
                        >
                            我的世界
                        </Link>
                        {isAdmin && (
                            <button
                                className={`md:hidden rounded-lg focus:outline-none ${textColor} ms-2`}
                                id="menuBtn"
                                onClick={handleMenuClick}
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
                        )}
                    </div>
                    <div
                        className="hidden md:flex md:items-center md:space-x-4"
                        id="menu"
                    >
                        {isAdmin &&
                            navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`block mt-4 md:inline-block md:mt-0 ${textColor} ${hoverColor} ${location.pathname === link.path ? "font-semibold" : ""}`}
                                    onClick={handleNavClick}
                                >
                                    {link.label}
                                </Link>
                            ))}

                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                    await fetch("/logout", { method: "POST" });
                                    window.location.href = "/";
                                }}
                            >
                                退出登录
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
