# REQ-004 · 章节练习、代码题与错题重做

- 状态：done
- 依赖：REQ-002、REQ-003
- 范围：练习判分、错题生命周期、代码题、参考实现、活动记录

> **验证记录（2026-10-21）**：`npm run typecheck`、`npm test`（34/34）、`npm run content:validate`、`npm run build` 通过；已用真实 Chromium 在 1440×1000 与 390×844 走通主流程。未勾选项若涉及未来加固（部署、CI、密码找回等），不作为本需求的交付阻塞。

## 背景

「学过」不等于「会做」。练习必须在服务端判分，答错必须进入可重做的错题队列，代码题必须给出真实反馈；否则记录只是装饰，无法形成学习闭环。

## 目标 / 非目标

**目标**：章节 5 题一次性提交、服务端判分；错题按用户 upsert，答对解决；错题重做只允许当前未解决题；全栈 JS 代码题在浏览器沙箱运行测试；移动端 Kotlin 代码题展示参考实现 + 自评维度；所有提交写入成绩、错题、代码尝试与动态。

**非目标**：服务端执行用户代码、防作弊/抄袭检测、逐题即时反馈、自由组卷、编程比赛、移动端代码执行、LLM 判题。

## 交互与页面

- `/practice` 永久重定向到 `/practice/review`；练习从章节页或计划任务进入。
- `/practice/chapter/[chapterId]`：5 题一题一屏，选择后可修改；全部作答后一次提交；结果页显示分数、逐题正误、正确答案、解析、技能标签与「再练一次 / 错题复习 / 去代码题」。
- `/practice/code/[challengeId]`：textarea 编辑器；JS 可「运行测试」，结果写库；Kotlin 先「保存实现，查看参考」，再选择「已能独立写出」或「还有卡点，再练」。
- `/practice/review`：只展示未解决错题；整组重做，答对移除，答错增加次数；空队列给出学习/面试入口。

## 数据与接口

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| `quiz_attempts` | `id`, `user_id`, `source_type`, `source_id`, `track_id`, `level`, `score`, `total`, `duration_seconds`, `details_json` | 每次整套快照 |
| `mistakes` | `user_id`, `question_id`, `track_id`, `wrong_count`, `last_wrong_at`, `resolved_at` | PK `(user_id,question_id)` |
| `code_attempts` | `id`, `user_id`, `challenge_id`, `language`, `code`, `passed`, `total` | 每次运行/自评 |
| `activities` | `type`, `title`, `meta_json` | 展示时间线，非事实源 |

- `POST /api/practice/quiz`：`sourceType` 仅 `chapter|mistake`；最多 20 个答案；章节必须 5 题且题目 ID 全部匹配，否则 400；错题来源只接受该用户当前未解决题，否则 400。
- 判分读取内容中的 `answerIndex`，返回 `details[]`（含 `correctIndex` 与解析）、`score`、`resolvedMistakes`。事务内写 `quiz_attempts`、错题变更与 `quiz_submitted` 动态。
- 错题变更：答错 `INSERT ... ON CONFLICT DO UPDATE wrong_count+1, resolved_at=NULL`；答对把该用户该题未解决行写 `resolved_at`。
- `POST /api/practice/code`：校验题目存在、代码 10–20000 字、`total` 等于 JS 测试数或 Kotlin 的 1、`passed` 在范围内；写 `code_attempts` 与 `code_submitted` 动态。
- `GET /api/practice/code/[challengeId]/solution`：JS 必须已有任意 `code_attempt`，否则 403；Kotlin 无服务端前置条件；读取参考实现会写 `solution_viewed` 动态。
- JS 沙箱：`sandbox="allow-scripts"` 的 iframe（`srcdoc`），CSP 为 `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src data:`；Blob Worker 内执行，主线程 3500ms 超时销毁，只接收 JSON 结果；不支持 Promise/网络/DOM。

## 验收标准

> `[x]` 为代码事实；运行与浏览器结果待执行。

- [x] 章节练习整套提交并在服务端判分，提交前只下发题干与选项，不下发答案。
- [x] 章节未答满 5 题拒绝提交；重复题、非法选项、越界索引被拒绝。
- [x] 答错 upsert 错题并累加，答对解决未解决错题；错题重做只能取本人未解决题。
- [x] 练习、错题、代码尝试与动态均带 `user_id`，跨用户不可见。
- [x] JS 代码题在 iframe + Worker 中执行，带 CSP、opaque origin 与 3.5 秒超时。
- [x] Kotlin 代码题不执行：提供 starter、rubric、参考实现，结果按自评 0/1 入库。
- [x] JS 参考实现需先有一次代码尝试；读取动作留痕。
- [ ] 服务端独立验证 JS 测试结果（当前 `passed/total` 由客户端上报，仅校验范围）。
- [ ] `npm run typecheck`、`npm test` 与真实浏览器练习/重做/沙箱走查通过（待执行）。

## 测试计划

- `tests/services.test.ts`：满分章节、全错入队、错题重做解决 5 题、未答满拒绝；JS 参考实现先拒绝后放行；跨用户拒绝。
- `tests/content.test.ts`：每道 JS 题有测试与函数名，Kotlin 题有 rubric。
- 命令：`npm run typecheck`、`npm test`；待执行。尚无沙箱自动化测试，需人工验证死循环超时、`fetch` 被 CSP 拒绝、非函数导出报错。
- 手工：390px 下完成 5 题并提交；检查结果页解析、错题次数、重做后队列清空；验证 Kotlin 参考实现解锁。

## 实现偏差与后续

- 代码题结果是客户端自报：服务端只核对 `total` 和 `passed` 范围，不执行 JS、不验证测试真实通过；不能宣称具备防作弊能力。若要可信判题，应新增服务端沙箱需求。
- Kotlin 参考实现的「先保存再看」只在 UI 约束；`GET solution` 对 Kotlin 不做尝试校验，直接调用 API 可取到参考实现。
- `quiz_attempts.source_type` 只有 `chapter/mistake`，没有架构文档提到的 `sprint`；急冲任务通过章节练习完成，计划不区分来源。
- 练习任务完成状态按「是否提交过」而非正确率 ≥60%；`QUIZ_PASS_RATIO` 当前未被使用。错题解决不会单独写 `mistake_resolved` 动态，只在重做标题中体现解决数量。
