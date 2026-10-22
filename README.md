# 职跃 OfferPath

> 面向程序员的求职与技能进阶平台：按知识点学习、按章节练习、按周期复习，用记录证明掌握。

OfferPath 面向三类真实场景：基础薄弱需要系统补课、时间紧需要按简历/JD 冲刺、想转岗需要中长期路线。学习、题库、错题、计划、模拟面试与学习报告共用一套内容与记录，避免「看课」和「面试」脱节。

公开仓库：https://github.com/Jessica-ying12/offerpath

## 两个入口

### 1. 公开深度学习站（已上线，永久公网）

**https://offerpath-deep-q1f1nhycwc5.qoder.website/**

- 21 篇移动前端深度精读（约 3.5 万行原稿）、21 份问答分册、380 道带两层追问的面试问答、**2276 道多题型练习题**。
- 全文搜索、目录、清单、笔记、问答自测、D+1 / D+3 / D+7 复习、学习路径、按岗位/JD 重排、学习进度。
- **题库**：简答 / 填空 / 判断 / 多选 / 单选五种题型，按知识点显示数量；每题提交后显示你的答案、正确答案、原因、漏选/多选和对应知识点；简答提供关键点覆盖与完整参考答案。
- **路线图库**：按 roadmap.sh 公开目录同步 96 条路线、16 个分类与 12,254 个官方主题节点，页面结构为先选路线类型（职业/技术/入门/最佳实践）和方向、下方分组双列展示；分类和可翻译路线名使用中文，技术专名保留英文；每条路线有站内详情页。平台另有 3 条移动端精编补充路线（Java 后端、微信小程序、Hybrid），不混入官方计数。
- **目标驱动计划**：普通 / 10 周系统 / 面试冲刺 / 补基础 / 项目实战 / JD 定向 / 日常提升，每种类型生成不同模块：阶段、周、简历定点/技术问答/笔试/模拟面试、JD 命中/缺口、项目拆解/调试/代码题等。生成前有结构预览；每个模块内可加任务；计划可显式删除；进度页、首页下一步与侧栏进度都只统计当前计划。
- **深度文档知识树**：按“阶段 → 模块 → 文档 → 章节”组织 21 篇精读；模块说明学完能做什么并关联路线，章节可直接跳转。
- **可点击面包屑**：路线分类、文档模块、计划与进度路径都可逐级直达；不再重复放“返回上一页”。
- **本机多用户**：每个用户独立记录；含个人经历的简历定制文档不公开。
- 无登录、无 tunnel；本机可建多个用户，每个用户独立保存阅读、笔记、问答和题库记录，支持导出/导入 JSON。
- 源码在 [`public-site/`](public-site/)，内容来自你的移动前端学习包；含个人经历的「简历定制」文档未公开。

### 2. 完整训练版（本仓库根目录）

- 5 门课程、账号体系、SQLite 记录、章节练习、技术库、题库/笔试、周期复习、报告、急冲、规划、模拟面试。
- 适合自托管：Docker + 持久磁盘 + HTTPS，见 [部署文档](docs/DEPLOYMENT.md)。

## 完整训练版能力（v2）

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

完整训练版：Next.js 15（App Router）/ React 19 / TypeScript / Tailwind CSS / SQLite（better-sqlite3）/ Zod / Vitest。

公开学习站：Vite / React 19 / TypeScript / Tailwind CSS / React Markdown / 静态部署（Qoder Sites）。

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

公开学习站：

```bash
cd public-site
npm install
npm run content:validate   # 21 篇 / 21 份 / 380 问答 / 2276 道题 / 个人数据扫描
npm run dev                # http://127.0.0.1:5173
npm run build              # 输出 public-site/dist
```

## 公网访问与部署

- **公开学习站**：已发布在 Qoder Sites，公网永久地址见上，不再使用临时隧道。静态构建、无后端依赖，重建后可通过 Qoder Sites 发布新版本。
- **完整训练版**：Next.js SSR + SQLite 单实例，需要持久磁盘，不能用静态托管。按 [部署文档](docs/DEPLOYMENT.md) 使用 Docker + 持久磁盘 + HTTPS：

```bash
docker compose up -d --build
```

## 目录

```
src/app/          页面与 API Route Handler
src/components/   UI 组件（应用壳、练习、面试对话等）
src/lib/engine/   纯函数：匹配、计划、面试评分
src/lib/services/ 业务编排（鉴权后读写 + 记录）
src/lib/db/       SQLite 连接、迁移、repository
src/lib/content/  内容契约与只读加载
data/             课程与面试题库 JSON（可校验、可审校）
public-site/      公开深度学习站（21 篇精读 + 380 问答 + 210 题，静态部署）
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
- [深度内容与公开站方案](docs/requirements/REQ-017-deep-content-and-public-site.md)
- [多题型题库、路线图与本机用户](docs/requirements/REQ-018-multi-type-bank-roadmap-and-profiles.md)
- [信息架构、计划差异化与计划驱动进度](docs/requirements/REQ-020-information-architecture-and-plan-progress.md)
- [同步 roadmap.sh 完整路线目录](docs/requirements/REQ-021-roadmap-catalog-sync.md)
- [目标驱动计划、历史返回与路线覆盖](docs/requirements/REQ-019-goal-driven-plans-and-history.md)
- [需求索引](docs/requirements/README.md)
- [后续方向规划](docs/ROADMAP.md)

## 验证状态（2026-10-22）

- 完整训练版：`npm run typecheck`、`npm test`（50/50）、`npm run content:validate`（5 门课程、210 题）、`npm run build` 均通过；真实 Chromium 走通登录 → 技术库 → 精读 → 章节练习 → 周期复习 → 报告 → 题库 → 笔试。
- 公开学习站：`npm run content:validate` 通过（21 篇精读 / 21 份问答 / 380 题 / 2276 道多题型题 / 758 层追问 / 379 个陷阱，个人数据扫描为 0）；`npm run build` 通过；公网实测总览、精读、96 条官方路线目录与站内详情、12,254 个官方主题、五类题型纠错、目标/计划生成与增删任务、计划驱动进度、移动端 390px，控制台 0 错误。
- 公网地址已验证为公开访问，不使用隧道；静态站点刷新、哈希深链与移动端均可用。
- 已复核：完整训练版未登录重定向/401、跨源 403、登录限流、跨用户隔离；公开站问答首次自测后安排 D+1，三次通过标记掌握。
- 未覆盖：公开站本机数据不跨设备同步（提供导出/导入）；完整训练版长期托管需自己的主机或平台账号；CI、密码找回、真实大模型不在本轮范围。

## 说明与边界

「智能匹配 / 面试评估」是可解释的规则引擎（技能词典 + 要点覆盖 + 表达完整度），不调用外部大模型，不在 UI 中假装 AI；结果展示依据，便于自查。SQLite 为单写者，只支持单实例运行；水平扩容需先迁移到 PostgreSQL/MySQL。题目为基于官方文档与公开大纲自行编写的原创题，不复制商业题库。
