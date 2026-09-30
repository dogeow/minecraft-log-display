# Minecraft 状态实时更新

## 功能与边界

首页原来的“最近获取 / 每分钟自动刷新 / 刷新状态”整条工具栏已移除。原有天空太阳/月亮切换、草地站立玩家与后台筛选排序保留。

- 使用 Laravel 官方 Reverb + Echo/Pusher 协议客户端，在自己的服务器运行，不连接 Pusher 托管服务
- 页面首次仍通过 `/api/server-status` 获取数据；`minecraft:publish-status` 每 10 秒检查现有状态缓存，仅在公开状态变化时广播，变化检测延迟受 10 秒缓存和调度影响
- 没有变化时最多每分钟发送一次心跳通知，保持延迟显示更新并检测发布任务是否停止
- 公共频道固定为 `minecraft.status`，事件为 `status.changed`，消息只有不透明的 `revision`；不广播完整状态响应、模型、聊天、IP、坐标、私有配置或管理员标志
- 收到通知后重新请求原 API，仍走原有权限过滤；本批没有让后台聊天/位置列表订阅公共频道，也没有新增私有频道授权接口
- 相同状态、玩家列表顺序变化和探测耗时抖动会去重；事务中发起的发布等提交后执行，回滚不发布；发送失败不记作成功，会在下一次任务重试
- 前端合并事件突发、避免请求重叠，最小刷新间隔 5 秒；重新订阅后补取一次状态
- 页面隐藏或断网时关闭连接并暂停自动请求，恢复后补取；卸载时清理连接、事件和计时器
- 没有配置服务、连接失败，或连接成功但 90 秒未收到发布心跳时，以每分钟请求自动兜底。状态卡底部显示“实时更新 / 实时连接中 / 自动更新 · 每分钟 / 更新失败”，不会把轮询标成 WebSocket

## 默认安全配置

`MINECRAFT_REALTIME_ENABLED=false`，发布代码本身不会启动或开放服务；此时前台自动使用一分钟兜底。Reverb 默认只监听 `127.0.0.1:8080`，浏览器通过已有 HTTPS 站点上的 WSS 反向代理连接。

来源域名使用明确列表，不使用 `*`。客户端事件已禁用，访问者不能向频道发布伪造通知。Reverb 应用 secret 只在后端，Blade 只输出浏览器必须的公开 app key、主机、端口和开关。

这次没有数据库迁移，不要求 Redis 或独立队列 worker：事件采用同步广播，通知任务由已有 Laravel scheduler 驱动。若将来需要多实例，再单独设计共享缓存与扩容。

## 生产启用前需要确认

配置文件都是示例，没有自动修改 Nginx、Supervisor、网络、安全配置或任何生产服务。启用前确认实际应用目录、运行用户、PHP 路径、已有 scheduler、8080 端口占用和当前 HTTPS 配置，并对生产变更取得授权。

2026-09-30 的 `composer audit --locked` 检查发现原锁文件中 11 个既有包合计 36 条 Composer 公告；本批仅新增 13 个 Reverb 依赖，没有升级旧包，新包没有引入此次审计的公告。应在生产启用前独立评估并升级受影响依赖，重新运行测试；不要将本次功能测试视为安全审计通过。

## 环境变量

在服务器的受保护环境配置中填写真实值，绝不要提交到 Git 或发在聊天里。下面全部是占位符：

```dotenv
MINECRAFT_REALTIME_ENABLED=false
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=<operator-managed-app-id>
REVERB_APP_KEY=<public-app-key>
REVERB_APP_SECRET=<server-only-secret>

REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http

REVERB_PUBLIC_HOST=mc.dogeow.com
REVERB_PUBLIC_PORT=443
REVERB_PUBLIC_SCHEME=https
REVERB_ALLOWED_ORIGINS=mc.dogeow.com
```

`REVERB_HOST/PORT/SCHEME` 是 Laravel 到 Reverb 的服务器内部路径；`REVERB_PUBLIC_*` 是浏览器连接的公开 WSS 地址。不要把 secret 设置为 `VITE_*` 或放进 `realtime.public`。真实凭据由操作者安全创建和配置，本批只提供占位符。

## 部署步骤（人工审核后执行）

1. 安装当前锁定依赖并构建：`composer install --no-dev --prefer-dist`、`npm ci`、`npm run build`
2. 按实际目录/用户调整 `deploy/supervisor/minecraft-reverb.conf.example`；准备 Reverb 常驻进程，不监听公网地址
3. 将 `deploy/nginx/minecraft-reverb.conf.example` 的两个 location 合并进现有 HTTPS server 块。保留 PHP、前端和证书设置。`/app/` 接收 WebSocket，`/apps/` 发布 API 不对外开放；后台通过 loopback 直接发布
4. 检查 Nginx 配置后再由操作者重载；检查已有调度器，只保留一份 `schedule:run` cron 或 `schedule:work`。仅在尚无 scheduler 时参考可选 Supervisor 样例，避免重复导入日志
5. 在批准启用后设置 `MINECRAFT_REALTIME_ENABLED=true`，运行 `php artisan config:cache`，启动/重启 Reverb 进程与现有 scheduler。以后更新长驻 Reverb 代码需 `php artisan reverb:restart`；若用每分钟 `schedule:run`，发布期间可用 `php artisan schedule:interrupt` 结束旧的亚分钟调度
6. 验证 `php artisan minecraft:publish-status` 成功，浏览器网络中 WSS `/app/...` 完成 101 握手且订阅 `minecraft.status`；正常时状态卡显示“实时更新”。确认线上缓存可用，Laravel 与 Reverb 使用相同 app ID/key/secret
7. 验证玩家进出/服务离线后状态更新，草地玩家同步变化；遮蔽标签页后不持续发请求，恢复后补取；停止 Reverb 或发布任务后自动切换每分钟兜底。恢复服务后应自动回到实时模式
8. 最后检查未知 Origin 被拒绝、客户端事件被拒绝、`/apps/` 公网返回 404，原聊天/IP/坐标仍按管理员权限隐藏

运行 Reverb 需要进程管理和 WSS 代理；仅推送 Git 或仅构建前端不会完成线上启用。示例只提供配置，真实 WSS/TLS 和浏览器端验收需在目标部署环境完成。

## 回退

设置 `MINECRAFT_REALTIME_ENABLED=false` 并刷新配置缓存，前台会安静地使用一分钟轮询。经批准后可停止 Reverb 并回退代理片段；不会删除数据或改变原有日志解析任务。仅停服务而不开配置也会自动兜底，但仍会尝试重连。

## 本地验证

```bash
npm test
npm run build
# PHP tests must point only to disposable SQLite :memory: and use a test APP_KEY.
APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=:memory: CACHE_STORE=array SESSION_DRIVER=array composer test
# Launches and always stops a disposable loopback Reverb process with fixed test-only values.
PHP_BINARY=php npm run test:reverb
```

协议测试覆盖本地真实握手、公开频道订阅、服务端事件、最小负载、拒绝客户端广播和来源限制。它不使用真实 Minecraft/生产数据库，也不验证生产 TLS 或 Nginx。

官方文档：[Reverb](https://laravel.com/framework/docs/13.x/reverb)、[Broadcasting](https://laravel.com/framework/docs/13.x/broadcasting)
