# 需求索引

每个需求一份方案文档；实现、测试与文档在同一提交中完成。状态：`draft` / `in-progress` / `done` / `blocked`。

| REQ | 名称 | 状态 | 提交范围 |
| --- | --- | --- | --- |
| [REQ-000](REQ-000-product-and-rules.md) | 产品拆解与工程规范基线 | done | 产品、设计、架构、开发/AI/提交规范 |
| [REQ-001](REQ-001-baseline-and-landing.md) | 工程基座、设计系统与公开首页 | done | 工具链、基础组件、首页 |
| [REQ-002](REQ-002-auth-and-isolation.md) | 身份、会话与用户隔离 | done | 注册登录、会话、资料、越权防护 |
| [REQ-003](REQ-003-curriculum-and-microlearning.md) | 课程体系与微课学习 | done | 内容加载、目录、微课、进度 |
| [REQ-004](REQ-004-practice-code-mistakes.md) | 章节练习、代码题与错题重做 | done | 判分、代码练习、错题、记录 |
| [REQ-005](REQ-005-sprint-plan.md) | 急冲计划与简历/JD 匹配 | done | 解析、计划生成、每日任务 |
| [REQ-006](REQ-006-career-roadmap.md) | 职业规划路线图 | done | 阶段计划、技能覆盖 |
| [REQ-007](REQ-007-mock-interview.md) | 自适应模拟面试 | done | 组题、评分/提示/追问、报告 |
| [REQ-008](REQ-008-dashboard-records-mobile.md) | 仪表盘、记录中心与移动端体验 | done | 首页聚合、记录、响应式 |
| [REQ-009](REQ-009-qa-and-roadmap.md) | 质量验收、运行文档与方向规划 | done | 浏览器走查、文档、路线图 |
| [REQ-010](REQ-010-github-release.md) | GitHub 公开发布 | done | 公开仓库、remote、推送与校验 |
| [REQ-011](REQ-011-teaching-and-sources.md) | 知识点精讲与权威来源 | done | 无视频教学结构、章节来源、内容校验 |
| [REQ-012](REQ-012-backend-database-tech-catalog.md) | 后端/数据库课程与技术筛选 | done | Java 后端、MySQL、计算机基础、技术路径 |
| [REQ-013](REQ-013-question-bank-and-exam.md) | 题库扩容、筛选练习与模拟笔试 | done | 210 题、筛选练习、限时笔试 |
| [REQ-014](REQ-014-mastery-and-spaced-review.md) | 掌握度、周期复习与学习报告 | done | 掌握判定、D+1/D+3/D+7、报告 |
| [REQ-015](REQ-015-public-deployment.md) | 公网可访问与生产运行 | done | Docker、部署文档、临时公网预览 |
| [REQ-016](REQ-016-v2-qa-release.md) | v2 质量验收与发布 | in-progress | 全量测试、浏览器走查、增量提交 |

> 公开仓库：[Jessica-ying12/offerpath](https://github.com/Jessica-ying12/offerpath)；`main` 分支已推送并通过远程一致性校验。

## 依赖顺序

```
REQ-000 → REQ-001 → REQ-002 → REQ-003 → REQ-004
                                     └→ REQ-005 → REQ-006
REQ-004/005 → REQ-007 → REQ-008 → REQ-009 → REQ-010
REQ-003/004 → REQ-011 → REQ-012 → REQ-013 → REQ-014 → REQ-015 → REQ-016
```

## 约定

- 新需求先建文档，包含：背景、目标、非目标、交互、数据/接口、验收标准、测试计划、实现偏差。
- 验收项全部勾选后才可标记 `done`。
- 提交信息使用 `Refs: REQ-xxx`。
