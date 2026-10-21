# 提交规范

## 1. 粒度

- **一个需求（REQ）一次提交**。需求文档、实现、测试、必要的样式调整属于同一提交。
- 禁止 `git add .` 后一次性提交多个需求；禁止「update」「fix bug」这类无法审计的信息。
- 同一需求的返工可追加 commit，但需说明原因；不 amend 已推送提交，不强推主分支。

## 2. 格式（Conventional Commits）

```
<type>(<scope>): <中文简述>

<可选正文：为什么、关键取舍、数据/接口变化>

<可选页脚：Refs: REQ-003 / BREAKING CHANGE: ...>
```

### type
| type | 用途 |
| --- | --- |
| feat | 新功能/新页面 |
| fix | 缺陷修复 |
| docs | 仅文档 |
| refactor | 不改变行为的重构 |
| test | 测试补充/修正 |
| chore | 工具、依赖、构建 |
| style | 纯样式/格式（不改行为） |
| perf | 性能优化 |

### scope
`auth`、`content`、`learn`、`practice`、`sprint`、`career`、`interview`、`records`、`dashboard`、`ui`、`db`、`release`。

### 示例
```
feat(auth): 增加注册登录与会话隔离
feat(learn): 实现知识点精讲与章节进度
fix(practice): 修复错题重做后未清除错题状态
docs(rules): 补充 AI 开发与提交规范
```

提交正文必须能解释「为什么」，而不是重复 diff。涉及数据库字段/接口变更时注明兼容影响。

## 3. 提交前门禁

```bash
npm run content:validate   # 内容变更时
npm run typecheck
npm test
git status                 # 确认无数据库、.env、无关文件
```

- 使用 `.gitignore` 排除 `node_modules`、`.next`、`data/*.db*`、`.env*`。
- 不提交生成的构建产物、日志、临时文件。
- 不提交任何凭据（含截图中的令牌）。

## 4. 需求文档与提交的对应

- 提交信息包含 `Refs: REQ-xxx`。
- 需求文档顶部状态：`draft` → `in-progress` → `done`；验收项勾选后才标 `done`。
- 若实现与方案不同，先更新方案中的「实现偏差」再提交。

## 5. 分支与发布（当前阶段）

- 当前为单线 MVP：个人仓库 `main` 分支直接小步提交，每次提交可运行。
- 多人协作/上线后改为：`feat/req-xxx` 短分支 + PR + 至少一次自检记录；主分支保护。
- 发布标签：`v0.1.0` 起语义化版本；发布前跑完整验收清单。

## 6. GitHub 上传约定

1. 公开仓库名：`offerpath`（若占用则 `offerpath-platform`）。
2. 仓库描述：`职跃 OfferPath — 面向程序员的求职与技能进阶平台（MVP）`。
3. 首次推送前确认无秘密与数据库文件；README 提供运行方式与演示账号。
4. 上传成功后在本工作区记录 remote 与仓库地址；后续提交保持小步推送。
