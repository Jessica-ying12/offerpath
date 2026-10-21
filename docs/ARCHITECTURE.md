# 职跃 OfferPath · 技术架构

## 1. 决策摘要

| 维度 | 选择 | 理由 | 舍弃 |
| --- | --- | --- | --- |
| Web 框架 | Next.js 15 App Router + React 19 | 服务端渲染 + Route Handler，单仓完成前后端；部署简单 | 前后端分离（增加运维与契约成本） |
| 语言 | TypeScript strict | 内容/引擎/数据模型需要类型约束 | JS、宽松模式 |
| 样式 | Tailwind CSS 3.4 + 本地设计令牌 | 快速保持一致性，不依赖外部 UI 库 | 组件库（视觉同质、包体大） |
| 数据 | SQLite（better-sqlite3）+ SQL | 单实例 MVP、事务与索引真实可用、无外部服务 | 文件 JSON（并发/查询弱）、Postgres（MVP 运维过重） |
| 内容 | 只读 JSON + Zod 校验 | 内容与代码解耦、可测试、可审校 | CMS/数据库内容（当前无编辑后台需求） |
| 智能能力 | 可解释规则引擎 | 无外部密钥也能工作、结果可展示依据、可测试 | 直接调用 LLM（无密钥、不可验收、可能编造） |
| 认证 | Cookie Session + scrypt | 同源 Web、可撤销会话、实现透明 | JWT（撤销复杂）、第三方 OAuth（无需求） |
| 代码执行 | 仅全栈 JS 在浏览器沙箱 iframe/Worker 执行 | 用户自己的代码不进入服务端，网络被隔离；毫秒级反馈 | 服务端判题（沙箱成本/攻击面大） |

## 2. 分层

```
浏览器（React 客户端组件）
   │ 仅 JSON API / 表单
Next.js App Router
   ├─ app/(app)/*       服务端组件：鉴权 + 读取视图 DTO
   ├─ app/api/*         Route Handler：鉴权 + 同源校验 + Zod 入参
   ├─ lib/services/*    业务用例，事务边界，记录写入
   ├─ lib/engine/*      纯函数：简历/JD 匹配、计划、面试、评分
   ├─ lib/db/*          SQLite 连接、迁移、repository
   ├─ lib/content/*     内容加载 + Zod 校验
   └─ data/*.json       课程/题库（只读）
```

规则：
- 页面组件不直接写 SQL；用户数据一律经 repository，并在查询层强制带 `user_id`。
- 纯逻辑放 `engine`，不依赖 DB/Next，可直接单测。
- 一次业务动作由 service 编排：校验 → 读写 → 记录活动 → 返回 DTO。
- 客户端只拿渲染所需的最小数据；正确答案和他人数据不得下发。

## 3. 身份、权限与数据边界

- 注册：邮箱规范化 + 唯一约束；密码 ≥ 8 位，`scrypt` + 随机盐（`crypto.timingSafeEqual` 校验）。
- 会话：32 字节随机令牌，Cookie `HttpOnly; SameSite=Lax; Path=/;`（生产 `Secure`），DB 只存 SHA-256 哈希与过期时间；默认 7 天；退出删除。
- 请求：服务端组件读取 Cookie → 校验会话 → 取 user；缺失/过期统一重定向 `/login`。
- API：所有写接口先 `requireUser()`；校验 `Origin` 与 Host 同源（防 CSRF）；JSON 大小限制。
- 资源授权：计划、面试、练习记录均带 `user_id`，读取使用 `WHERE id=? AND user_id=?`；不存在返回 404，避免越权枚举。
- 输入：Route Handler 边界用 Zod；文本长度上限；简历/JD 仅本人可读。
- 日志：不打印密码、令牌、完整简历；错误响应不包含堆栈。

## 4. 数据模型（SQLite）

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| `users` | id, email(unique), name, password_hash, created_at | 身份 |
| `sessions` | token_hash(pk), user_id, expires_at | 可撤销会话 |
| `profiles` | user_id(pk), track_id, level, target_role, target_company, resume_text, jd_text, onboarded | 单一用户画像，当前方向/等级唯一归属 |
| `lesson_progress` | user_id, atom_id, chapter_id, track_id, completed_at, PK(user_id, atom_id) | 微课完成 |
| `quiz_attempts` | id, user_id, source_type, source_id, score, total, details_json | 每次练习快照 |
| `mistakes` | user_id, question_id, wrong_count, last_wrong_at, resolved_at | 错题状态 |
| `code_attempts` | id, user_id, challenge_id, code, passed, total | 代码提交与结果 |
| `plans` | id, user_id, kind(sprint/career), track_id, level, input_json, plan_json | 急冲/规划快照，可回看 |
| `interview_sessions` | id, user_id, track_id, level, mode, plan_json, status, summary_json | 面试会话 |
| `interview_turns` | id, session_id, seq, question_id, kind, answer, score, feedback_json | 逐轮记录 |
| `activities` | id, user_id, type, title, meta_json, created_at | 统一时间线（展示层，不作为业务事实源） |

索引：`activities(user_id, created_at)`、`quiz_attempts(user_id, created_at)`、`interview_turns(session_id, seq)`、`mistakes(user_id, resolved_at)`。

数据事实唯一归属：进度看 `lesson_progress`、错题看 `mistakes`、成绩看 attempts、面试看 sessions/turns；`activities` 仅为时间线，不重复定义状态。

### 派生规则
- 计划任务完成状态由真实进度派生（微课完成、章节练习达标、代码通过、面试完成），不额外维护一份会漂移的勾选表。
- 练习提交服务端判分：答对清除该题未解决错题；答错累计 `wrong_count`。重做使用同一逻辑，来源区分 `chapter/sprint/mistake`。

## 5. 内容与智能引擎

- `data/curriculum/*.json`：每方向 9 章 / 27 微课 / 45 单选题 / 9 代码题；`data/interviews/*.json`：每方向 15 道面试题。
- `schema.ts` 定义 Zod 契约与深度校验（引用、数量、等级一致），`npm run content:validate` 与单测双重把关。
- 技能词典（每方向 12/14 个技能及别名）驱动简历/JD 解析、计划优先级与面试选题。
- 计划引擎：抽取技能 → 结合等级选知识点 → 依据缺口排序 → 按周期分日/分阶段 → 生成可执行任务；输出匹配证据，前端明确标注可解释规则。
- 面试引擎：项目题（解析简历中的项目/技术线索）+ 知识题（按等级与技能缺口）；评分 = 要点覆盖（别名词匹配）+ 表达完整度；低分给提示/允许重答，高分插入追问；结束生成报告。
- 所有引擎为纯函数，输入输出可序列化，必须单测。

## 6. 代码沙箱（全栈代码题）

- 生成带 `sandbox="allow-scripts"` 的 iframe（`srcdoc`，CSP `default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:`）。
- iframe 内用 Blob Worker 执行用户函数与测试用例；opaque origin 无 Cookie 权限，CSP 禁止外联。
- 主线程 3 秒超时直接销毁 iframe，防止死循环；仅接收 JSON 序列化结果。
- 移动端 Kotlin 代码题不在浏览器执行：展示参考实现 + 自查维度，用户选择「通过/需再练」，结果入记录。

## 7. 环境与运行

- Node ≥ 22；`npm install` → `npm run seed` → `npm run dev`。
- 环境变量：`DATABASE_PATH`（默认 `data/offerpath.db`）、`SESSION_SECRET`（预留）。数据库与 `.env*` 不入库。
- 迁移：`lib/db/migrate.ts` 启动时幂等执行 `CREATE TABLE IF NOT EXISTS`，MVP 不做版本化迁移框架。
- 部署：Node 单实例 + 持久磁盘；不可用无状态 Serverless 的文件系统（除非外置数据库，后续需求）。
- 测试：Vitest（引擎、内容契约、DB/服务、越权隔离）；浏览器手工走查（桌面 + 移动视口）。

## 8. 演进边界

- 接 LLM：新增 `engine/adapters`，保持规则引擎为降级路径；需单独需求与密钥管理，不在当前实现。
- 换数据库：repository 为唯一边界，SQLite SQL 保持通用子集；迁移时替换实现与连接。
- 新方向：复用内容契约与页面骨架，只增内容与技能词典；页面不为单一方向写死。
