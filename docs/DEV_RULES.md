# 开发规则

## 1. 基本原则

1. **先方案后代码**：每个需求有 `docs/requirements/REQ-xxx.md`，写清范围、非目标、数据/接口、验收与测试，再实现。
2. **一个提交一个需求**：禁止把多个需求合并在一次提交；提交信息见 `COMMIT_CONVENTION.md`。
3. **单一事实源**：进度、错题、成绩、计划各有唯一表/字段；不从展示层反推状态。
4. **服务端为边界**：判分、计划生成、面试评估只在服务端；客户端不能信任。
5. **用户隔离是硬约束**：任何用户资源查询都必须包含 `user_id`；写测试证明 A 不能读 B。
6. **不过度设计**：不引入当前闭环不需要的队列、缓存、微服务、状态库或抽象层。
7. **可验证**：声称完成前必须跑 `npm run check`（typecheck + tests）并真实走通页面。

## 2. 技术约定

### 命名与目录
- 文件/目录：`kebab-case`；React 组件：`PascalCase`；函数/变量：`camelCase`；常量：`UPPER_SNAKE_CASE`。
- 路由：`src/app/<segment>/page.tsx`；API：`src/app/api/<resource>/route.ts`；组件：`src/components/`。
- DB 表/列：`snake_case`；领域 ID：内容前缀（`mob-`/`fs-`/`q-`/`code-`/`iv-`），记录用 UUID。
- 服务函数动词化：`completeAtom`、`submitQuiz`、`generateSprintPlan`、`evaluateInterviewAnswer`。

### TypeScript
- `strict: true`；禁止 `any`（无法避免时局部 `unknown` + 收窄，并说明原因）。
- 对外数据（API 响应、DB JSON、内容 JSON）先 Zod 校验再使用；内部函数信任类型。
- 不使用 `as` 绕过外部数据；用 schema 推断类型。
- 日期存 ISO 字符串（UTC），展示时本地化；ID 用 `crypto.randomUUID()`。

### Next.js / React
- 默认服务端组件；只有需要交互/浏览器 API 的叶子组件加 `"use client"`。
- 页面负责鉴权与取数，交互组件只接收最小 DTO；不在客户端 import 服务端 DB 模块。
- Route Handler：解析 → `requireUser()` → 同源校验 → Zod → service → `NextResponse.json`；错误统一 `{ error: string }`，不回传堆栈。
- 禁止在组件中直接 `fetch` 自家 API 来完成服务端首屏渲染。
- 表单必须有 label；按钮 loading 时 disabled；提交失败保留用户输入。

### 数据库
- 仅 `lib/db/repositories/*` 可写 SQL；启用 `foreign_keys=ON`、`journal_mode=WAL`。
- 多步写操作使用事务；时间统一 `new Date().toISOString()`。
- 查询用户资源必须 `WHERE user_id = ?`；通过 ID 取资源时同时校验归属。
- 不把密码、令牌、完整简历写入 `activities`。

### 引擎（可测纯函数）
- `lib/engine/*` 不得 import DB、Next、浏览器 API。
- 输入输出为普通对象；随机/时间由调用方传入（便于测试）。
- 评分逻辑必须可解释：返回命中/缺失要点，而不是只有总分。
- 内容引用的 ID 必须先经过校验；缺数据时返回明确错误而不是静默空计划。

### 样式与交互
- 使用设计令牌（见 `DESIGN.md`），不写散落色值；响应式优先移动端。
- 交互必须有 hover/focus/disabled/loading/error/empty 状态；表单错误就近显示。
- 动画 ≤ 300ms，尊重 `prefers-reduced-motion`。
- 颜色不能作为唯一信息载体，状态需文字说明。

## 3. 安全

- 密码：`scrypt` + 每用户盐；比较使用 `timingSafeEqual`；不记录明文。
- 会话：随机令牌、DB 存哈希、HttpOnly Cookie；退出即撤销；过期清理。
- API 写请求校验 Origin；所有输入限长（简历/JD ≤ 20000 字符，回答 ≤ 5000，姓名 ≤ 40）。
- 防 XSS：React 默认转义；不使用 `dangerouslySetInnerHTML` 渲染用户输入。
- 防注入：SQL 一律参数化；不拼接用户输入。
- 沙箱：用户代码只进 iframe+Worker，不 eval 在主窗口；超时销毁。
- 仓库不得提交 `.env`、数据库文件、密钥。

## 4. 测试要求

| 层 | 要求 |
| --- | --- |
| 内容 | schema/引用/数量/等级一致性；关键字段非空 |
| 引擎 | 正常、边界、空输入、等级差异、评分与追问分支 |
| 服务/DB | 成功路径、事务回滚、错题状态变化、**跨用户隔离** |
| 页面 | 至少真实浏览器走通：注册→学习→练习→错题重做→冲刺→面试→记录；桌面与 390px 宽 |
| 回归 | 修 bug 先写能复现的测试（引擎/服务层），再修 |

测试数据写入临时数据库（`DATABASE_PATH` 指向临时文件），不得污染开发库。

## 5. 完成定义（DoD）

- [ ] 需求文档已更新，范围与实际一致（含非目标）。
- [ ] 类型检查通过；新增逻辑有测试且全部通过；内容校验通过。
- [ ] 所有用户数据查询带 `user_id`，错误路径有合理状态码。
- [ ] 移动端与桌面布局无溢出、无不可点击元素；键盘可完成主流程。
- [ ] 真实浏览器验证主流程与至少一个异常路径。
- [ ] 按提交规范独立提交，工作区干净。
- [ ] 没有调试日志、假数据、死代码或未说明的 TODO。
