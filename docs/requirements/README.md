# 需求索引

每个需求一份方案文档；实现、测试与文档在同一提交中完成。状态：`draft` / `in-progress` / `done`。

| REQ | 名称 | 状态 | 提交范围 |
| --- | --- | --- | --- |
| [REQ-000](REQ-000-product-and-rules.md) | 产品拆解与工程规范基线 | done | 产品、设计、架构、开发/AI/提交规范 |
| [REQ-001](REQ-001-baseline-and-landing.md) | 工程基座、设计系统与公开首页 | in-progress | 工具链、基础组件、首页 |
| [REQ-002](REQ-002-auth-and-isolation.md) | 身份、会话与用户隔离 | pending | 注册登录、会话、资料、越权防护 |
| [REQ-003](REQ-003-curriculum-and-microlearning.md) | 课程体系与微课学习 | pending | 内容加载、目录、微课、进度 |
| [REQ-004](REQ-004-practice-code-mistakes.md) | 章节练习、代码题与错题重做 | pending | 判分、代码练习、错题、记录 |
| [REQ-005](REQ-005-sprint-plan.md) | 急冲计划与简历/JD 匹配 | pending | 解析、计划生成、每日任务 |
| [REQ-006](REQ-006-career-roadmap.md) | 职业规划路线图 | pending | 阶段计划、技能覆盖 |
| [REQ-007](REQ-007-mock-interview.md) | 自适应模拟面试 | pending | 组题、评分/提示/追问、报告 |
| [REQ-008](REQ-008-dashboard-records-mobile.md) | 仪表盘、记录中心与移动端体验 | pending | 首页聚合、记录、响应式 |
| [REQ-009](REQ-009-qa-and-roadmap.md) | 质量验收、运行文档与方向规划 | pending | E2E 走查、文档、路线图 |
| [REQ-010](REQ-010-github-release.md) | GitHub 公开发布 | pending | 公开仓库、remote、推送与校验 |

## 依赖顺序

```
REQ-000 → REQ-001 → REQ-002 → REQ-003 → REQ-004
                                     └→ REQ-005 → REQ-006
REQ-004/005 → REQ-007 → REQ-008 → REQ-009 → REQ-010
```

## 约定

- 新需求先建文档，包含：背景、目标、非目标、交互、数据/接口、验收标准、测试计划、实现偏差。
- 验收项全部勾选后才可标记 `done`。
- 提交信息使用 `Refs: REQ-xxx`。
