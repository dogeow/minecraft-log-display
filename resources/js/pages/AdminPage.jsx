import { Link } from "react-router-dom";
import useSWR from "swr";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Users,
  LogIn,
} from "lucide-react";
import { Button } from "../components/ui/button";

const sections = [
  {
    path: "/users",
    title: "玩家档案",
    description: "在线状态、累计时长与玩家标记",
    icon: Users,
  },
  {
    path: "/daily-stats",
    title: "每日统计",
    description: "按日期查看玩家在线时长",
    icon: ChartNoAxesCombined,
  },
  {
    path: "/logins",
    title: "登录记录",
    description: "追踪登录、登出与会话时长",
    icon: LogIn,
  },
  {
    path: "/chat",
    title: "聊天档案",
    description: "按玩家、消息内容和日期检索",
    icon: MessageSquare,
  },
  {
    path: "/login-locations",
    title: "登录位置",
    description: "查看世界坐标与登录 IP",
    icon: MapPin,
  },
];

export default function AdminPage({ isAdmin, loading, error, retry }) {
  if (loading)
    return (
      <main className="archive-shell" role="status">
        正在确认管理员权限…
      </main>
    );
  if (error)
    return (
      <main className="archive-shell">
        <section className="archive-empty" role="alert">
          <h1>暂时无法确认登录状态</h1>
          <p>{error.message}</p>
          <Button onClick={retry}>重试</Button>
        </section>
      </main>
    );
  if (!isAdmin)
    return (
      <main className="archive-shell">
        <section className="archive-empty">
          <ShieldCheck size={32} aria-hidden="true" />
          <h1>需要管理员登录</h1>
          <p>登录后可以查询服务器档案和受保护的记录</p>
          <Link to="/login" className="archive-primary-link">
            前往登录
          </Link>
        </section>
      </main>
    );
  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data, error, isValidating, mutate } = useSWR(
    "/api/users?status=online&per_page=10",
    { shouldRetryOnError: false },
  );
  return (
    <main className="archive-shell">
      <h1 className="sr-only">服务器管理控制台</h1>
      <div className="archive-dashboard-banner">
        <div>
          <p className="archive-eyebrow">玩家活动快览</p>
          <p className="archive-count">
            {data && !error ? data.paginatedData.meta.total : "—"}
            <span>位玩家标记为在线</span>
          </p>
          <p className="text-sm text-muted-foreground">
            基于已导入日志的在线状态，实时情况请查看服务器首页
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/users?status=online" className="archive-primary-link">
            查看在线玩家
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Button
            variant="outline"
            onClick={() => mutate()}
            disabled={isValidating}
          >
            {isValidating ? "更新中…" : "刷新概览"}
          </Button>
        </div>
      </div>
      {error && (
        <p className="archive-error" role="alert">
          玩家概览加载失败，可重试或直接打开下方档案
        </p>
      )}
      <section className="archive-dashboard-grid" aria-label="管理功能">
        {sections.map(({ path, title, description, icon: Icon }) => (
          <Link key={path} to={path} className="archive-module-card">
            <span className="archive-module-icon">
              <Icon size={23} aria-hidden="true" />
            </span>
            <h2>
              {title}
              <ArrowUpRight size={18} aria-hidden="true" />
            </h2>
            <p>{description}</p>
            <span className="archive-module-action">打开档案 →</span>
          </Link>
        ))}
      </section>
      <aside className="archive-privacy-note">
        <ShieldCheck size={19} aria-hidden="true" />
        <p>聊天内容、IP 和坐标仅管理员可见。离开公共设备时，请退出登录。</p>
      </aside>
    </main>
  );
}
