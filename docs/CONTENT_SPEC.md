# 内容数据规范（v1）

> 内容即产品。所有课程与题库必须可被程序校验，禁止自由格式。
> 权威结构以 `src/lib/content/schema.ts` 为准；本文规定内容规划与质量标准。

## 1. 文件与校验

| 文件 | 用途 |
| --- | --- |
| `data/curriculum/mobile.json` | 移动端方向：3 级 × 3 章 × 3 知识点 × 5 题 + 9 道 Kotlin 代码题 |
| `data/curriculum/fullstack.json` | 全栈方向：3 级 × 3 章 × 3 知识点 × 5 题 + 9 道 JavaScript 代码题 |
| `data/interviews/mobile.json` | 移动端模拟面试题：每级 5 道，共 15 道 |
| `data/interviews/fullstack.json` | 全栈模拟面试题：每级 5 道，共 15 道 |

执行 `npm run content:validate` 校验结构、引用完整性与数量。

## 2. 学习颗粒度

- 每个知识点是一节 **3–6 分钟** 的微课，而不是长文。
- 字段顺序固定：摘要 → 3–5 个关键点 → 代码示例（可选）→ 常见坑 → 面试表达提示。
- 关键点必须可背诵、可追问；禁止「很重要」「需要注意」这类空话。
- 代码示例要能独立说明问题，建议 4–20 行。
- 一个章节只有 3 个知识点，学完立刻进入 5 道章节练习 + 1 道代码题。

## 3. 等级差异（强制）

| 等级 | 考察重点 | 题目风格 |
| --- | --- | --- |
| junior 初级 | 语法、常用 API、能跑通、知道概念边界 | 识别、纠错、结果判断、基础场景 |
| middle 中级 | 内部机制、状态管理、异常处理、取舍 | 线上问题定位、方案选择、边界条件 |
| senior 高级 | 架构边界、性能/稳定性/安全、成本与演进 | 系统设计、故障复盘、跨团队权衡 |

同一知识点在不同等级可以出现，但深度必须明显不同；不允许仅改措辞。

## 4. 技能 ID（必须使用）

### 移动端（12 个）

`kotlin-basics`、`android-lifecycle`、`compose-ui`、`state-management`、`coroutines`、`networking`、`local-storage`、`app-architecture`、`performance`、`testing`、`flutter-crossplatform`、`release-engineering`

### 全栈（14 个）

`html-css`、`javascript-core`、`typescript`、`react-fundamentals`、`state-data-flow`、`node-runtime`、`http-api`、`sql-database`、`auth-security`、`testing`、`performance-caching`、`deployment-devops`、`system-design`、`engineering-practices`

每个技能的 `aliases` 要覆盖简历/JD 中可能出现的写法，例如 `React` 的别名包含 `react`、`react.js`、`reactjs`。

## 5. 章节与 ID 规划

章节 ID、顺序、标题、技能归属固定如下。知识点 ID 为 `{chapterId}-a1..a3`，题目 ID 为 `q-{chapterId}-1..5`，代码题 ID 为 `code-{chapterId}`。

### 移动端

| 章节 ID | 级别 | order | 标题 | 主技能 |
| --- | --- | --- | --- | --- |
| `mob-j1-kotlin` | junior | 1 | Kotlin 语言基本功 | kotlin-basics |
| `mob-j1-android` | junior | 2 | Android 组件与生命周期 | android-lifecycle, kotlin-basics |
| `mob-j1-compose` | junior | 3 | Compose 声明式界面 | compose-ui, state-management |
| `mob-j2-coroutines` | middle | 1 | 协程与并发控制 | coroutines |
| `mob-j2-data` | middle | 2 | 网络与本地数据 | networking, local-storage |
| `mob-j2-arch` | middle | 3 | 架构与状态管理 | app-architecture, state-management |
| `mob-j3-performance` | senior | 1 | 性能与稳定性治理 | performance, android-lifecycle |
| `mob-j3-cross` | senior | 2 | 跨端与工程化 | flutter-crossplatform, release-engineering, testing |
| `mob-j3-system` | senior | 3 | 移动端系统设计 | app-architecture, performance, networking |

### 全栈

| 章节 ID | 级别 | order | 标题 | 主技能 |
| --- | --- | --- | --- | --- |
| `fs-j1-web` | junior | 1 | HTML / CSS 与响应式 | html-css |
| `fs-j1-js` | junior | 2 | JavaScript 核心 | javascript-core |
| `fs-j1-react` | junior | 3 | React 组件入门 | react-fundamentals |
| `fs-j2-ts` | middle | 1 | TypeScript 类型系统 | typescript |
| `fs-j2-node` | middle | 2 | Node.js 与 HTTP API | node-runtime, http-api |
| `fs-j2-db` | middle | 3 | 数据库与 SQL | sql-database |
| `fs-j3-security` | senior | 1 | 认证、安全与边界 | auth-security, http-api |
| `fs-j3-scale` | senior | 2 | 性能、缓存与可靠性 | performance-caching, system-design |
| `fs-j3-system` | senior | 3 | 测试、部署与系统设计 | testing, deployment-devops, system-design |

知识点建议主题（可微调，不可偏离章节目标）：

- `mob-j1-kotlin`: val/var 与空安全；data class 与集合；高阶函数与 Lambda
- `mob-j1-android`: Activity 与生命周期；Intent 与组件通信；配置变更与 Context 边界
- `mob-j1-compose`: 声明式 UI 与组合；状态与重组；列表与输入交互
- `mob-j2-coroutines`: suspend 与结构化并发；调度器与线程切换；取消与异常
- `mob-j2-data`: OkHttp/Retrofit 请求链路；Room 与迁移；离线缓存与错误分类
- `mob-j2-arch`: MVVM 与单向数据流；ViewModel/SavedState；依赖注入与模块边界
- `mob-j3-performance`: 启动与卡顿定位；内存与图片；ANR/崩溃治理
- `mob-j3-cross`: Flutter/RN 选型与混合栈；构建变体与 CI；测试与灰度发布
- `mob-j3-system`: 离线优先与同步；推送与深链；移动端方案表达
- `fs-j1-web`: 语义化与可访问性；Flex/Grid；响应式与移动适配
- `fs-j1-js`: 作用域与闭包；原型与 this；异步与事件循环
- `fs-j1-react`: 组件与 JSX；state/props 与重渲染；列表、表单与副作用
- `fs-j2-ts`: 结构化类型与联合类型；泛型与约束；类型收窄与工具类型
- `fs-j2-node`: 事件循环与流；REST 设计与校验；中间件与错误处理
- `fs-j2-db`: 表设计与索引；JOIN 与聚合；事务与并发
- `fs-j3-security`: Session/JWT/Cookie；常见 Web 攻击；权限模型与数据隔离
- `fs-j3-scale`: 缓存策略与失效；性能定位；重试/幂等/降级
- `fs-j3-system`: 测试金字塔与 CI；部署与可观测性；系统设计答题框架

## 6. 题目规范

- 单选，4 个选项，只有一个正确答案；干扰项必须合理，不能明显凑数。
- 每章 5 题覆盖 3 个知识点，至少 1 道代码阅读/故障定位题。
- 解析 50–150 字，说明「为什么对」和「错项错在哪」。
- `skills` 使用第 4 节技能 ID，便于个性化计划匹配。

## 7. 代码题规范

### JavaScript（全栈）

- 必须是**同步函数**、纯参数输入输出，不得使用 DOM、网络、文件系统、随机数、当前时间。
- `functionName` 与 `starterCode` 中函数名一致；`solutionCode` 必须通过全部 `tests`。
- `tests` 2–6 个，参数和期望值必须是 JSON 可序列化数据；覆盖正常与边界情况。
- 难度与章节匹配：初级为字符串/数组/函数；中级为异步之外的业务模拟（如限流器、分页、SQL 参数生成）；高级为缓存/状态机/去重等设计型小题。

### Kotlin（移动端）

- 提供可编译思路的 `starterCode` 与完整 `solutionCode`，场景贴近 Android 开发。
- `rubric` 描述人工自评/面试官会看的 3–4 个维度；不提供执行测试。
- 初级：集合与空安全；中级：协程/数据层；高级：架构或性能相关的小设计。

## 8. 模拟面试题规范

- 每级 5 道，共 15 道；场景化提问，避免纯背诵名词。
- `keyPoints` 3–5 个，每个要点提供 2–5 个 `aliases`，用于答案覆盖度评分。
  - aliases 必须真的可能出现在候选人口语回答里，避免过于泛化（如「使用」「可以」）。
  - 中英文写法都覆盖，例如 `["结构化并发", "structured concurrency", "coroutineScope"]`。
- `modelAnswer`: 第一人称、面试口语、100–220 字，覆盖所有要点并给出取舍。
- `followUps`: 每道 1–2 个深入追问，有自己的要点与参考回答；追问要比原题更深。
- `commonMistakes`: 1–3 条，指出典型错误认知。
- 题目要能考察该等级的核心技能，避免与学习题库完全重复。

## 9. JSON 写法

- 纯 JSON：无注释、无尾逗号、字符串内换行写 `\n`、双引号转义。
- 代码字段用字符串保存；不要嵌套 markdown 代码围栏。
- 写完后自查：所有 `chapterId` 存在；每题 `answerIndex` 指向正确选项；每章 5 个 `questionIds` 与题目一一对应。
