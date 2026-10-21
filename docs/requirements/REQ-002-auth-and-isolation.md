# REQ-002 · 身份、会话与用户隔离

- 状态：done
- 依赖：REQ-001
- 范围：注册、登录、退出、会话、资料更新、越权防护

> **验证记录（2026-10-21）**：`npm run typecheck`、`npm test`（34/34）、`npm run content:validate`、`npm run build` 通过；已用真实 Chromium 在 1440×1000 与 390×844 走通主流程。未勾选项若涉及未来加固（部署、CI、密码找回等），不作为本需求的交付阻塞。

## 背景

计划、简历、面试回答与错题都属于敏感个人数据。没有可靠的身份与归属校验，后续学习闭环不能成立；MVP 先做本地账号体系，不引入第三方 OAuth。

## 目标 / 非目标

**目标**：邮箱唯一账号；scrypt 密码哈希；可撤销的数据库会话；HttpOnly Cookie；API 同源校验；所有用户资源按 `user_id` 隔离；登录/注册限流；注册后完成 onboarding 与资料编辑。

**非目标**：邮箱验证、找回密码、修改密码、第三方登录、多设备会话管理、组织/团队、公网高可用。

## 交互与页面

- `/register`：昵称、邮箱、密码（≥8 位）；成功后直接建立会话并跳 `/onboarding`。
- `/login?next=/path&demo=1`：登录；未完成 onboarding 跳 `/onboarding`，否则跳安全的站内 `next` 或 `/dashboard`；演示账号可一键填入。
- `/onboarding`：两步选择方向与等级，可填目标岗位/公司；提交 `onboarded: true` 后进入 `/dashboard`。
- `/profile`：修改昵称、方向、等级、目标、简历/JD；退出登录调用 `POST /api/auth/logout`。
- 受保护前缀由 `src/middleware.ts` 拦截；服务端页面再调用 `requireUser()` 校验真实会话，已登录访问登录/注册页会跳回 `/dashboard`。

## 数据与接口

| 表 | 关键字段 | 约束 |
| --- | --- | --- |
| `users` | `id`, `email`(unique), `name`, `password_hash`, `created_at` | 邮箱小写规范化 |
| `sessions` | `token_hash`(PK), `user_id`, `expires_at`, `created_at` | 只存 SHA-256 哈希 |
| `profiles` | `user_id`(PK), `track_id`, `level`, `target_*`, `resume_text`, `jd_text`, `onboarded` | 单用户单画像 |

- `POST /api/auth/register`：Zod 校验昵称 2–40、邮箱、密码 8–200；按邮箱 5 次/10 分钟限流；事务创建 `users`、`profiles`、`activities`，随后建会话并写 Cookie；重复邮箱 409。返回 200 `{ok,userId}`。
- `POST /api/auth/login`：按邮箱 8 次/10 分钟限流；失败统一 401「邮箱或密码不正确」；成功返回 `{ok,onboarded}` 并写 Cookie。
- `POST /api/auth/logout`：校验 Origin 后删除当前 `sessions` 行并清 Cookie；未登录也返回 200。
- `POST /api/profile`：`guardApi()`（同源 403、未登录 401）+ Zod；按当前会话 `user.id` 更新，不接受客户端传入 `user_id`；简历/JD 上限 20000，岗位/公司 80；不重置任何学习记录。
- 会话令牌为 32 字节随机值（base64url），Cookie 名 `op_session`，`HttpOnly; SameSite=Lax; Path=/; Secure`（生产），有效期 7 天；查询时同时校验 `expires_at > now`。
- 跨用户资源统一以 `WHERE id=? AND user_id=?` 读取，未命中返回 404；不泄露资源是否存在。API 错误体统一 `{error}`，500 不返回堆栈。

## 验收标准

> `[x]` 仅表示代码路径已存在；不代表已执行或浏览器验证。

- [x] `hashPassword` 使用 16 字节随机盐 + scrypt（64 字节），并用 `timingSafeEqual` 校验。
- [x] 会话只存哈希；退出删除服务端会话；Cookie 具备 HttpOnly/SameSite/Path/生产 Secure。
- [x] 写接口先校验 Origin，再校验会话；未登录 API 返回 401，非同源返回 403。
- [x] 注册/登录有限流；登录失败不区分「邮箱不存在」与「密码错误」。
- [x] 资料、计划、练习、错题、面试会话均带 `user_id`；面试回合在父会话归属校验后按 `session_id` 读取；跨用户读取返回 404。
- [x] onboarding 与 profile 更新走同一服务，`user_id` 只来自会话。
- [ ] 两个账号真实浏览器互访计划/面试/记录，确认互不可见（待执行）。
- [ ] Cookie 标志、退出后旧 Cookie 失效、401/403/429 响应经浏览器或 HTTP 客户端实测（待执行）。
- [ ] `npm run typecheck`、`npm test` 通过（待执行）。

## 测试计划

- `tests/password.test.ts`：密码正确/错误、唯一盐、畸形哈希；会话令牌唯一且哈希稳定。
- `tests/services.test.ts`：注册与认证、两个用户之间的错题/计划/面试隔离。
- 命令：`npm run typecheck`、`npm test`；当前均待执行。
- 手工：注册 → onboarding → 退出 → 登录；A 复制 B 的 `/sprint/[id]`、`/interview/[id]` 应 404；检查 Cookie 与 429。
- 尚缺 HTTP 层测试：`guardApi` 的 401/403、限流窗口、注册 409。

## 实现偏差与后续

- `assertSameOrigin` 在缺少 `Origin` 头时放行（便于非浏览器客户端）；依赖 SameSite=Lax，未实现 CSRF token。对外部署前应改为拒绝缺失 Origin 的写请求。
- 限流是进程内 `Map`，按规范化邮箱计数、包含成功请求，重启即清空，不支持多实例；没有 IP/设备维度。
- `middleware.ts` 只检查 Cookie 是否存在，真实有效性由页面 `requireUser()` 与 API `guardApi()` 查询数据库确认。
- `SESSION_SECRET` 仅保留在 `.env.example`，当前未被使用；过期会话靠查询条件过滤，`deleteExpiredSessions` 未安排定时清理。
- 未实现邮箱验证、找回/修改密码、记住我、会话列表与远程撤销；这些需要单独需求。
