import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function Nav({ isAdmin }) {
  const location = useLocation();
  const navRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navLinks = [
    { path: "/admin", label: "控制台" },
    { path: "/users", label: "玩家" },
    { path: "/daily-stats", label: "每日统计" },
    { path: "/logins", label: "登录记录" },
    { path: "/chat", label: "聊天记录" },
    { path: "/login-locations", label: "登录位置" },
  ];
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnResize = () => setMenuOpen(false);
    const closeOutside = (event) => {
      if (!navRef.current?.contains(event.target)) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnResize);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      desktop.removeEventListener("change", closeOnResize);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, []);
  useEffect(() => {
    const resetPending = () => setLoggingOut(false);
    window.addEventListener("pageshow", resetPending);
    return () => window.removeEventListener("pageshow", resetPending);
  }, []);
  const csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? "";
  const logout = (
    <form
      action="/logout"
      method="POST"
      onSubmit={(event) => {
        if (loggingOut) event.preventDefault();
        else setLoggingOut(true);
      }}
    >
      <input type="hidden" name="_token" value={csrfToken} />
      <button
        className={`mc-nav-link inline-flex items-center gap-1.5 ${textColor}`}
        disabled={loggingOut}
        type="submit"
      >
        <LogOut size={15} aria-hidden="true" />
        {loggingOut ? "正在退出…" : "退出"}
      </button>
    </form>
  );
  const links = navLinks.map((link) => (
    <Link
      key={link.path}
      to={link.path}
      aria-current={location.pathname === link.path ? "page" : undefined}
      className={`mc-nav-link ${textColor} ${location.pathname === link.path ? "is-active" : ""}`}
    >
      {link.label}
    </Link>
  ));

  return (
    <nav ref={navRef} className="mc-nav" aria-label="主导航">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          {/* Title row */}
          <Link to="/" className={`mc-brand ${textColor}`}>
            <span className="mc-brand__block" aria-hidden="true" />
            <span className="mc-brand__copy">
              <strong>我的世界</strong>
              <small>服务器档案</small>
            </span>
          </Link>
          {/* Desktop menu */}
          {isAdmin && (
            <div className="archive-desktop-nav">
              {links}
              {logout}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`archive-icon-button ${textColor}`}
              aria-label={
                theme === "dark" ? "切换为日间模式" : "切换为夜间模式"
              }
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {!isAdmin && (
              <Link
                to="/login"
                className={`mc-nav-link inline-flex items-center gap-1.5 ${textColor}`}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                管理入口
              </Link>
            )}
            {isAdmin && (
              <button
                type="button"
                className={`archive-icon-button archive-menu-toggle ${textColor}`}
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
          {/* Mobile dropdown */}
          {isAdmin && menuOpen && (
            <div id="mobile-navigation" className="archive-mobile-nav">
              {links}
              {logout}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
