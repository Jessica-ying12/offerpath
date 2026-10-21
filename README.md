# 职跃 OfferPath

> 面向程序员的求职与技能进阶平台：把求职拆成今天能完成的一小步。

OfferPath 面向三类真实场景：基础薄弱需要系统补课、时间紧需要按简历/JD 冲刺、想转岗需要中长期路线。学习、练习、错题、计划与模拟面试共用一套内容与记录，避免「看课」和「面试」脱节。

## 仓库

公开仓库：https://github.com/Jessica-ying12/offerpath

## 当前能力（MVP）

- **系统学习**：移动端开发、全栈开发两个方向，各分初级/中级/高级；每章 3 节 3–6 分钟微课 + 5 道章节练习 + 1 道代码题。
- **急冲计划**：上传简历与岗位 JD，生成可解释的技能缺口、每日知识点/练习/代码题/模拟面试任务。
- **职业规划**：按方向和周期生成阶段路线图与验收标准。
- **模拟面试**：基于简历项目与 JD 出题；答错给提示并可重答，答得好自动追问，结束后有评分报告。
- **记录闭环**：学习、练习、错题、重做、代码提交、计划、面试全部写入个人记录，错题可单独复习。
- **级别区分**：初级考使用与边界，中级考机制与取舍，高级考架构、性能、安全与系统设计。

## 技术栈

Next.js 15（App Router）/ React 19 / TypeScript / Tailwind CSS / SQLite（better-sqlite3）/ Zod / Vitest。

## 快速开始

要求 Node.js ≥ 22。

```bash
npm install
npm run seed      # 创建演示账号 demo@offerpath.dev / Demo123456
npm run dev       # http://localhost:3000
```

其他命令：

```bash
npm run typecheck
npm test
npm run content:validate   # 课程/题库结构与引用校验
npm run build
```

数据库默认写入 `data/offerpath.db`（已被 git 忽略），可通过 `DATABASE_PATH` 覆盖。

## 目录

```
src/app/          页面与 API Route Handler
src/components/   UI 组件（应用壳、练习、面试对话等）
src/lib/engine/   纯函数：匹配、计划、面试评分
src/lib/services/ 业务编排（鉴权后读写 + 记录）
src/lib/db/       SQLite 连接、迁移、repository
src/lib/content/  内容契约与只读加载
data/             课程与面试题库 JSON（可校验、可审校）
docs/             产品、设计、架构、开发/AI 规范、逐需求方案
tests/            Vitest 测试
```

## 文档

- [产品分析](docs/PRODUCT.md)
- [页面与交互设计](docs/DESIGN.md)
- [技术架构](docs/ARCHITECTURE.md)
- [开发规则](docs/DEV_RULES.md)
- [AI 开发规范](docs/AI_RULES.md)
- [提交规范](docs/COMMIT_CONVENTION.md)
- [内容规范](docs/CONTENT_SPEC.md)
- [需求索引](docs/requirements/README.md)
- [后续方向规划](docs/ROADMAP.md)

## 验证状态（2026-10-21）

- `npm run typecheck`、`npm test`（34/34）、`npm run content:validate`、`npm run build` 均通过。
- 真实 Chromium 走通：登录 → 学习 → 微课完成 → 5 题练习 → 错题队列 → JS 代码题（沙箱 4/4）→ 急冲计划 → 职业规划 → 面试（低分提示/重答、高分追问、报告）→ 记录/设置。
- 已复核：未登录页面重定向、未登录 API 401、跨源写请求 403、登录限流 429、A 账号访问 B 计划/面试 404、移动端 390px 无横向溢出。
- 未覆盖：自动化死循环沙箱测试、CI、部署、密码找回、真实大模型。浏览器验收脚本仅用于本地，不入库。
- GitHub 公开发布已完成：https://github.com/Jessica-ying12/offerpath（`main`，按需求拆分的提交历史）。

## 说明与边界

MVP 的「智能匹配 / 面试评估」是可解释的规则引擎（技能词典 + 要点覆盖 + 表达完整度），不调用外部大模型，不在 UI 中假装 AI；结果展示依据，便于自查。当前为单实例本地优先实现，公网多实例部署与账号找回不在本阶段范围。
