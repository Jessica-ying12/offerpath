# 职跃 OfferPath

> 面向程序员的求职与技能进阶平台：按知识点学习、按章节练习、按周期复习，用记录证明掌握。

OfferPath 面向三类真实场景：基础薄弱需要系统补课、时间紧需要按简历/JD 冲刺、想转岗需要中长期路线。学习、题库、错题、计划、模拟面试与学习报告共用一套内容与记录，避免「看课」和「面试」脱节。

公开仓库：https://github.com/Jessica-ying12/offerpath

## 当前能力（v2）

- **知识点精讲（无视频）**：5 门课程共 30 章 / 90 个知识点；每个知识点有本节目标、机制讲解、分步骤说明、示例、易错点、面试表达与官方参考来源。
- **五门课程**：移动端开发（Kotlin/Android/Compose）、全栈开发（TS/React/Node）、Java 后端（Java/Spring/JVM/MySQL/Redis/高并发）、MySQL 数据库（建模/查询/事务/复制）、计算机基础与 AI 前沿（HTTP/OS/LLM 工程与安全）。
- **按岗位与技术筛选**：技术库支持按方向、等级、技术、关键词筛选；技术路径把散落在各课程的同一技术章节聚合成一条学习路线。
- **题库与模拟笔试**：210 道原创单选题，按课程/等级/技术/难度筛选，支持 10/20/30 题练习；20 题上下的模拟笔试（建议 45 分钟，不强制计时），服务端判分并记录。
- **章节练习与代码题**：每章知识点学完后做章节练习（≥60% 才通过）；30 道代码题，JavaScript 在沙箱执行，SQL/Kotlin 提供参考实现与自评清单，并明确标注执行边界。
- **掌握度与周期复习**：章节必须同时满足「3 个知识点完成 + 章节练习 ≥60% + 三次周期复习 ≥80%」才算已掌握；复习节奏为 D+1 → D+3 → D+7，答错回到 D+1。
- **学习报告**：掌握阶段分布、待复习、练习正确率、最近复习/题库/笔试成绩、薄弱技术，全部来自真实作答记录。
- **急冲与职业规划**：上传简历与岗位 JD，生成可解释的技能缺口、每日任务和阶段路线，支持五门课程。
- **模拟面试**：基于简历项目与 JD 出题；答错给提示并可重答，答得好自动追问，结束后有评分报告。
- **记录闭环**：学习、练习、错题、代码、复习、题库、笔试、计划、面试全部写入个人记录，跨用户严格隔离。
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
npm run content:validate   # 课程/题库/来源结构与引用校验
npm run build
```

数据库默认写入 `data/offerpath.db`（已被 git 忽略），可通过 `DATABASE_PATH` 覆盖。

## 公网访问与部署

本项目是 Next.js SSR + SQLite 单实例应用，不能用静态托管。当前已通过临时隧道在公网验证；长期运行请按 [部署文档](docs/DEPLOYMENT.md) 使用 Docker + 持久磁盘 + HTTPS：

```bash
docker compose up -d --build
```

临时预览地址会随进程结束失效，以交付消息中的最新地址为准，不作为长期托管。

## 目录

```
src/app/          页面与 API Route Handler
src/components/   UI 组件（应用壳、练习、面试对话等）
src/lib/engine/   纯函数：匹配、计划、面试评分
src/lib/services/ 业务编排（鉴权后读写 + 记录）
src/lib/db/       SQLite 连接、迁移、repository
src/lib/content/  内容契约与只读加载
data/             课程与面试题库 JSON（可校验、可审校）
docs/             产品、设计、架构、规范、逐需求方案、来源与部署
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
- [权威来源与题库调研](docs/SOURCES.md)
- [公网部署](docs/DEPLOYMENT.md)
- [需求索引](docs/requirements/README.md)
- [后续方向规划](docs/ROADMAP.md)

## 验证状态（2026-10-22）

- `npm run typecheck`、`npm test`（50/50）、`npm run content:validate`（5 门课程、210 题、全部来源与结构校验）、`npm run build` 均通过。
- 真实 Chromium 走通：注册登录 → 技术库筛选 → 技术路径 → 知识点精讲 → 章节练习 → 掌握度 D+1 → 周期复习 → 学习报告 → 题库筛选练习 → 模拟笔试 → 记录/设置。
- 公网临时隧道实测：登录、总览、技术库、技术路径、知识点、题库、复习、报告、来源、模拟笔试均可打开；390px 视口无横向溢出，控制台 0 错误。
- 已复核：未登录页面重定向、未登录 API 401、跨源写请求 403、登录限流 429、A 账号访问 B 计划/面试 404、反向代理下的 Origin 校验、跨用户掌握度/复习/题库/笔试记录隔离。
- 未覆盖：长期公网托管（需要主机/平台账号）、CI、密码找回、真实大模型。SQL 与 Kotlin 代码题不执行，只提供参考实现与自评。

## 说明与边界

「智能匹配 / 面试评估」是可解释的规则引擎（技能词典 + 要点覆盖 + 表达完整度），不调用外部大模型，不在 UI 中假装 AI；结果展示依据，便于自查。SQLite 为单写者，只支持单实例运行；水平扩容需先迁移到 PostgreSQL/MySQL。题目为基于官方文档与公开大纲自行编写的原创题，不复制商业题库。
