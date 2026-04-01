import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export default function Nav({ isAdmin }) {
  const location = useLocation();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <nav>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3">
          {/* Title row */}
          <div className="flex justify-between items-center w-full">
            <Link to="/" className={`text-xl font-bold ${textColor}`}>
              我的世界
            </Link>
            {isAdmin && (
              <button
                className={`md:hidden rounded-lg focus:outline-none ${textColor} p-1`}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? (
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    />
                  </svg>
                ) : (
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Desktop menu */}
          {isAdmin && (
            <div className="hidden md:flex md:items-center md:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${textColor} ${hoverColor} ${location.pathname === link.path ? "font-semibold" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  const csrfToken =
                    document
                      .querySelector('meta[name="csrf-token"]')
                      ?.getAttribute("content") ?? "";
                  await fetch("/logout", {
                    method: "POST",
                    headers: { "X-CSRF-TOKEN": csrfToken },
                  });
                  window.location.href = "/";
                }}
                className={`${textColor} ${hoverColor} cursor-pointer`}
              >
                退出登录
              </a>
            </div>
          )}

          {/* Mobile dropdown */}
          {isAdmin && menuOpen && (
            <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden backdrop-blur-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 ${textColor} ${hoverColor} ${location.pathname === link.path ? "font-semibold" : ""} border-b border-gray-200 dark:border-gray-700 last:border-b-0`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  await fetch("/logout", { method: "POST" });
                  window.location.href = "/";
                }}
                className={`block px-4 py-3 ${textColor} ${hoverColor} cursor-pointer`}
              >
                退出登录
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
