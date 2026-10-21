# REQ-003 · 课程体系与微课学习

- 状态：done
- 依赖：REQ-001、REQ-002
- 范围：内容契约、方向/章节/微课页面、学习进度、内容校验

> **验证记录（2026-10-21）**：`npm run typecheck`、`npm test`（34/34）、`npm run content:validate`、`npm run build` 通过；已用真实 Chromium 在 1440×1000 与 390×844 走通主流程。未勾选项若涉及未来加固（部署、CI、密码找回等），不作为本需求的交付阻塞。

## 背景

用户真正缺的不是长课，而是「今天学哪一个点」。课程必须结构化、可分等级、可校验，并与练习题和技能词典共用 ID；否则计划、错题和面试无法引用同一份内容。

## 目标 / 非目标

**目标**：两个首发方向；每方向 9 章 / 27 微课 / 45 单选题 / 9 代码题；每级 3 章、每章 3 微课 + 5 题 + 1 代码题；微课 3–6 分钟；路径页可切换等级；完成微课立即、幂等记录；提供结构校验脚本。

**非目标**：视频课程、CMS/后台编辑器、用户生成课程、直播、证书、其他方向正式课程、按方向复制两套进度。

## 交互与页面

- `/learn`：两个方向卡，展示等级、27 微课/45 题/9 代码题、方向进度与最近学习。
- `/learn/[trackId]?level=junior|middle|senior`：三级切换；每级 3 章，章内 3 节微课、章节练习入口、代码题状态；「继续学习」定位首个未完成微课。
- `/learn/[trackId]/[chapterId]/[atomId]`：微课正文：摘要 → 3–5 个关键点 → 可选代码例子 → 常见坑 → 面试表达；侧栏显示本章 3 节进度与练习入口。
- 完成按钮调用 `POST /api/learning/complete`，成功后跳下一微课；本章第三节完成后跳 `/practice/chapter/[chapterId]`。未登录由 middleware/requireUser 重定向 `/login`。

## 数据与接口

- 契约见 [`schema.ts`](../../src/lib/content/schema.ts)：`trackSchema` 强制 `chapters=9`、`atoms=27`、`questions=45`、`codeChallenges=9`、`levels=3`、每章 `atomIds=3`、`questionIds=5`、`codeChallengeIds=1`；`skills` 至少 8 个（移动端 12、全栈 14）。
- 微课字段：`summary`、`minutes`(2–15)、`keyPoints`(3–5)、可选 `example`、`pitfalls`(1–3)、`interviewTip`、`skills`。题目固定 4 选项、1 个 `answerIndex`、解析 ≥20 字；JS 代码题必须有 `functionName` 与 ≥2 个测试。
- 文件：`data/curriculum/{mobile,fullstack}.json`、`data/interviews/{mobile,fullstack}.json`；`npm run content:validate` 逐文件解析并检查重复 ID、引用、等级一致性、移动端 Kotlin/全栈 JavaScript 语言约束。
- 进度表 `lesson_progress(user_id, atom_id, chapter_id, track_id, completed_at)`，主键 `(user_id, atom_id)`；服务使用 `INSERT OR IGNORE`，只有首次插入才写 `lesson_completed` 动态。
- API 仅接收 `{atomId}`；未知 ID 返回 404；返回 `{newlyCompleted,nextHref}`。页面数据由服务端组件直接读服务与内容，无额外读取 API。
- 等级选择是 URL 参数与页面状态，不写回 `profiles.level`；方向页的 `nextHref` 按当前展示等级的首个未完成微课计算。

## 内容资产现状

- 两端课程文件均已生成并通过 `trackSchema` 深度校验：各 9 章 / 27 微课 / 45 道单选 / 9 道代码题。
- 两端面试库均已生成并通过 `interviewBankSchema` 校验：各 15 道，每级 5 道，含要点、参考回答与追问。
- 全栈 9 道 JavaScript 代码题的参考实现已逐题在 Node 中执行并命中全部测试；移动端 9 道 Kotlin 题提供参考实现与自评维度。
- 内容源为 `data/curriculum/*.json` 与 `data/interviews/*.json`，不再保留临时生成脚本，避免双事实源。

## 验收标准

> `[x]` 仅表示代码/文件层面已存在；运行结果待执行。

- [x] 内容契约强制 9/27/45/9、每级 3 章、每章 3/5/1；加载时用 Zod 解析。
- [x] 全栈内容文件实际满足 9/27/45/9，技能 14 个。
- [x] 路径页、微课页、章节进度、上一节/下一节与练习跳转的代码路径存在（运行依赖内容文件）。
- [x] 完成微课幂等；重复提交不重复计数、不重复写动态。
- [ ] 移动端课程文件与两份面试题库补齐，两端 9/27/45/9 均通过校验（当前缺失）。
- [ ] `npm run content:validate`、`npm test`、`npm run build` 通过（待执行）。
- [ ] 浏览器在 1440 与 390 宽走完「选方向→选等级→3 节微课→章节练习入口」，无溢出（待执行）。

## 测试计划

- `tests/content.test.ts`：两端 schema、数量、引用、答案索引、等级一致、JS 测试/Kotlin rubric、面试库 15 题。
- `tests/services.test.ts`：微课完成两次只记一次，`getTrackPageData` 显示 1 个完成。
- 命令：`npm run content:validate`、`npm run typecheck`、`npm test`；均待执行，且需先补齐上述三个 JSON。
- 手工：切换三级检查章节互不串级；刷新微课确认完成态；键盘 Tab 可达完成按钮。

## 实现偏差与后续

- - 内容已完整，无资产阻塞。内容质量提醒（少量要点超过 80 字）不阻断校验，后续可按审校需求精简。
