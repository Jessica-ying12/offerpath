# 职跃 · 公开深度学习站

公网地址：**https://offerpath-deep-q1f1nhycwc5.qoder.website/**

这是平台的公开内容层：21 篇移动前端深度精读、21 份问答原稿（380 道带追问的题）、210 道练习题。无登录、无后端依赖，进度保存在本机浏览器，可导出 JSON 备份。

## 开发

```bash
npm install
npm run content:validate
npm run dev
npm run build
npm run preview
```

- 内容：`content/docs/`（21 篇）与 `content/qa/`（21 份）。
- 元数据与解析：`src/lib/content.ts`。
- 学习路径/岗位 JD：`src/lib/jd.ts`。
- 本地状态与 SRS：`src/lib/store.tsx`、`src/lib/srs.ts`。
- 页面：`src/pages/`；阅读器：`src/pages/DocPage.tsx`。

## 内容边界

- 只发布通用知识与问答。
- `简历定制/` 等含个人经历、公司、项目指标和账号线索的文档**不进入本目录、不打包、不发布**。
- `npm run content:validate` 会扫描已知个人/公司标记，并校验 21 篇 / 21 份 / 380 题。

## 部署

站点为静态构建，`dist/` 可直接部署到任意静态主机。当前由 Qoder Sites 发布，公网访问已验证。项目使用 HashRouter（`/#/doc/03`），因为静态托管的 SPA fallback 在线上未生效；哈希路由保证深链刷新可用。

## 数据

阅读进度、问答掌握度、清单、笔记、题库记录与设置都保存在 `localStorage`，键为 `offerpath-deep-v1`。在「学习进度」页可导出/导入 JSON。没有账号或云同步，清理浏览器数据会丢失记录。
