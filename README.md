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

- **后端**: Laravel 12, PHP 8.4
- **前端**: Blade 模板 + Tailwind CSS
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
| `/login` | 管理员登录 |

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

```
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
