# 职跃 · 公开深度学习站

公网地址：**https://offerpath-deep-q1f1nhycwc5.qoder.website/**

这是平台的公开内容层：21 篇移动前端深度精读、21 份问答原稿（380 道带追问的题）、2276 道多题型练习题（简答/填空/判断/多选/单选），以及 26 条按入门/职业/技术分类、可按方向筛选的路线图，和按阶段/周/简历/JD/项目等真实差异生成模块的普通/10 周系统/面试/基础/项目/JD/日常计划。无登录、无后端依赖；支持本机多用户，每个用户独立保存进度，可导出 JSON 备份。

## 开发

```bash
npm install
npm run content:validate
npm run questions:generate
npm run dev
npm run build
npm run preview
```

- 内容：`content/docs/`（21 篇）与 `content/qa/`（21 份）。
- 题库：`scripts/generate-questions.mjs` 从问答与课程题库生成 `src/data/question-bank.json`（2276 题，5 种题型）。
- 路线图：`src/data/roadmaps.ts`（26 条入门/职业/技术路线，方向与语言筛选）与 `src/data/official-coverage.json`（约 2265 个官方节点名称覆盖清单）。
- 文档知识树：`src/lib/taxonomy.ts`（六个有序模块 → 文档 → 章节）。
- 计划：`src/lib/plan.ts`（普通/10 周系统/面试/基础/项目/JD/日常模板，按模板生成不同模块与任务）。
- 元数据与解析：`src/lib/content.ts`。
- 学习路径/岗位 JD：`src/lib/jd.ts`。
- 本地状态与 SRS：`src/lib/store.tsx`、`src/lib/srs.ts`。
- 页面：`src/pages/`；阅读器：`src/pages/DocPage.tsx`。

## 内容边界

- 只发布通用知识与问答。
- `简历定制/` 等含个人经历、公司、项目指标和账号线索的文档**不进入本目录、不打包、不发布**。
- `npm run content:validate` 会扫描已知个人/公司标记，并校验 21 篇 / 21 份 / 380 问答 / 2276 道题。

## 部署

站点为静态构建，`dist/` 可直接部署到任意静态主机。当前由 Qoder Sites 发布，公网访问已验证。项目使用 HashRouter（`/#/doc/03`），因为静态托管的 SPA fallback 在线上未生效；哈希路由保证深链刷新可用。

## 数据

阅读进度、问答掌握度、清单、笔记、题库记录与设置按用户保存在 `localStorage`（`offerpath-deep-v1:<用户ID>`），本机用户列表在 `offerpath-profiles-v1`。在「学习进度」页可导出/导入 JSON。没有账号或云同步，清理浏览器数据会丢失记录。
