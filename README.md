# Minecraft Log Display

Minecraft 服务器日志分析与展示系统，基于 Laravel 构建。

## 功能特性

- **玩家登录追踪** - 记录玩家登录/登出时间、在线时长
- **聊天记录** - 存储和展示服务器聊天消息
- **登录位置** - 记录玩家登录时的 IP 地址和坐标位置
- **每日统计** - 统计每日玩家在线时长
- **服务器状态** - 实时检查 Minecraft 服务器在线状态
- **日志解析** - 自动解析 Minecraft 服务器日志文件

## 技术栈

- **后端**: Laravel 13, PHP 8.3+
- **前端**: React 19 + React Router + SWR + Tailwind CSS 4，Blade 提供 SPA 入口
- **数据库**: MySQL

## 项目结构

```text
minecraft-log-display/
├── app/
│   ├── Console/Commands/     # Artisan 命令
│   ├── Http/Controllers/    # 控制器
│   ├── Models/             # Eloquent 模型
│   └── Services/           # 业务逻辑服务
├── config/                 # 配置文件
├── database/
│   ├── migrations/         # 数据库迁移
│   ├── seeders/           # 数据填充
│   └── factories/          # 模型工厂
├── resources/views/        # Blade 模板
└── routes/                # 路由定义
```

## 核心模型

- `User` - 玩家用户
- `Login` - 登录记录
- `ChatMessage` - 聊天消息
- `LoginLocation` - 登录位置信息
- `DailyStat` - 每日统计数据

## 主要路由

| 路径 | 描述 |
| :--- | :--- |
| `/` | 仪表盘首页 |
| `/ping` | 服务器健康检查 |
| `/users` | 用户列表 |
| `/daily-stats` | 每日统计 |
| `/logins` | 登录记录 |
| `/chat` | 聊天记录 |
| `/login-locations` | 登录位置 |
| `/login` | 管理员登录（账号需要 `is_admin = true`） |
| `/admin` | 管理控制台（登录后显示） |

## Artisan 命令

```bash
# 处理 Minecraft 日志
php artisan minecraft:process-logs

# 导入历史日志
php artisan minecraft:import-history

# 清理日志缓存
php artisan minecraft:trim-cache
```

## 配置

在 `.env` 文件中配置以下参数：

```plain
MINECRAFT_LOG_PATH=/path/to/minecraft/server/logs
MINECRAFT_SERVER_HOST=localhost
MINECRAFT_SERVER_PORT=25565
```

## 开发

```bash
# 安装依赖
composer install

# 运行迁移
php artisan migrate

# 启动开发服务器
php artisan serve
```


## 档案查询与管理界面

- 管理入口是站点的 `/login`，登录成功后进入 `/admin`；不提供公开注册或权限提升
- 桌面使用横向导航；1024px 以下使用可收起的菜单。切换页面、跨断点、点击外部或按 Escape 会关闭菜单
- 所有记录列表直接展示筛选和数据，不重复显示顶部介绍；支持提交搜索、重置、每页 10/25/50 条、加载失败重试和手动刷新
- 每日统计支持日期、在线时长双向排序；登录记录支持登录时间、登出时间、会话时长排序；玩家列表支持用户名、最近登录、累计时长和标记排序
- 排序在数据库查询中先执行再分页，同值以记录 ID 稳定排序，空日期/空时长排在末尾；显式玩家排序不再被“在线优先”覆盖
- 记录列表（玩家列表除外）支持开始/结束日期筛选；日期边界包含当天，使用 `APP_TIMEZONE` 指定的服务器时区。界面不对无时区的日志字符串做浏览器时区转换
- 时长以 `时:分:秒` 展示，保留原始秒数用于数据库排序；未结束的登录会话显示“进行中”
- 搜索、日期、排序和分页保存在 URL 中，可分享链接并使用浏览器前进/后退恢复
- 聊天内容、IP、坐标仍由服务端按管理员权限过滤；公开聊天搜索只匹配用户名，避免通过搜索结果探测隐藏内容
- 前台保留 Minecraft 风格，状态通过自建 WebSocket 自动更新；未启用或断连时每分钟自动兜底，无刷新工具栏。主题沿用天空太阳/月亮点击切换，在线玩家沿用草地站立角色展示
- WebSocket 默认关闭，完整启用要求、WSS/Supervisor 示例、安全边界和回退步骤见 [实时更新部署说明](docs/realtime.md)

本次界面改进不需要数据库迁移。部署时需要同时发布 PHP/React 源码并重新构建前端资源。

## 检查

```bash
npm ci
npm test
npm run build

# 使用独立测试环境，禁止指向生产数据库
APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=:memory: CACHE_STORE=array SESSION_DRIVER=array composer test
```

运行 Laravel 测试需要有效的测试用 `APP_KEY`、PHP SQLite/mbstring/XML 扩展和 Composer 依赖。新增功能测试只创建临时内存数据库，不修改真实服务器日志。
