import { appConfig } from "../../lib/appConfig";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const descriptions = {
  用户列表: "查看玩家状态、最近活动与累计在线时长",
  每日统计: "按玩家和日期回顾每天的在线时长",
  登录记录: "查找玩家的登录、登出与会话时长",
  聊天记录: "检索服务器聊天档案，消息内容仅管理员可见",
  登录位置: "回溯玩家登录位置，坐标与 IP 仅管理员可见",
};

export default function ListPage({ title, children }) {
  return (
    <main className="archive-shell">
      <header className="archive-heading">
        <div>
          <p className="archive-eyebrow">SERVER ARCHIVE / 服务器档案</p>
          <h1>{title}</h1>
          <p className="text-muted-foreground">{descriptions[title]}</p>
        </div>
        <Link to="/" className="archive-back">
          <ArrowLeft size={15} aria-hidden="true" />
          服务器首页
        </Link>
      </header>
      <p className="mb-3 text-xs text-muted-foreground">
        时间按服务器时区 {appConfig.timezone || "UTC"} 显示 · 时长格式为
        时:分:秒
      </p>
      {children}
    </main>
  );
}
