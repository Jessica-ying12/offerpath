# 权威学习来源与题库说明

> 核验日期：2026-10-21。课程讲解与题目为**原创编写**，依据下列官方文档/公开课程校验概念、API 与术语；没有复制付费题库或整段教材。文中的参考链接随章节展示，便于继续阅读原文。
> 官方文档会更新；若链接或版本变化，以来源站点当前版本为准。应用是求职练习工具，不替代系统课程或真实项目。

## 1. 移动端

| 主题 | 来源 |
| --- | --- |
| Kotlin 语言、协程、空安全 | [Kotlin Documentation](https://kotlinlang.org/docs/home.html) |
| Kotlin Coroutines | [Coroutines Guide](https://kotlinlang.org/docs/coroutines-guide.html) |
| Android 生命周期与架构 | [Android App Architecture](https://developer.android.com/topic/architecture) / [Lifecycle](https://developer.android.com/topic/libraries/architecture/lifecycle) |
| Jetpack Compose | [Compose Documentation](https://developer.android.com/develop/ui/compose/documentation) |
| Room / 数据存储 | [Room](https://developer.android.com/training/data-storage/room) |
| 性能与稳定性 | [Android Performance](https://developer.android.com/topic/performance) |
| 测试 | [Android Testing](https://developer.android.com/training/testing) |
| 发布 | [Publish your app](https://developer.android.com/studio/publish) |
| 跨端 | [Flutter Docs](https://docs.flutter.dev/) / [React Native Docs](https://reactnative.dev/docs/getting-started) |

## 2. Web 全栈

| 主题 | 来源 |
| --- | --- |
| HTML / CSS / JavaScript / HTTP | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web) |
| 现代 CSS 与性能 | [web.dev Learn CSS](https://web.dev/learn/css) / [web.dev Performance](https://web.dev/performance) |
| React | [React Learn](https://react.dev/learn) |
| TypeScript | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) |
| Node.js | [Node.js Documentation](https://nodejs.org/docs/latest/api/) |
| PostgreSQL | [PostgreSQL Documentation](https://www.postgresql.org/docs/current/) |
| MySQL | [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/) |
| Redis | [Redis Documentation](https://redis.io/docs/latest/) |
| 安全 | [OWASP Top 10](https://owasp.org/www-project-top-ten/) / [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) |
| 可靠性 | [Google SRE Book](https://sre.google/sre-book/table-of-contents/) |

## 3. 后端（Java / Spring）

| 主题 | 来源 |
| --- | --- |
| Java 语言与 API | [Dev.java Learn](https://dev.java/learn/) / [Java SE API](https://docs.oracle.com/en/java/javase/21/docs/api/) |
| JVM / 并发 | [Java Concurrency Tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/) / [JVM Specification](https://docs.oracle.com/javase/specs/jvms/se21/html/index.html) |
| Spring Boot | [Spring Boot Reference](https://docs.spring.io/spring-boot/index.html) / [Spring Guides](https://spring.io/guides) |
| Spring Transactions | [Spring Data Access](https://docs.spring.io/spring-framework/reference/data-access/transaction.html) |
| 消息与微服务 | [Spring for Apache Kafka](https://docs.spring.io/spring-kafka/reference/) / [microservices.io](https://microservices.io/patterns/index.html) |
| 可观测性 | [OpenTelemetry Docs](https://opentelemetry.io/docs/) / [Google SRE Workbook](https://sre.google/workbook/table-of-contents/) |

## 4. 计算机基础与前沿

| 主题 | 来源 |
| --- | --- |
| HTTP / DNS / TLS | [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) / [Cloudflare Learning Center](https://www.cloudflare.com/learning/) |
| 操作系统与系统编程 | [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) / [MIT Missing Semester](https://missing.csail.mit.edu/) |
| 计算机科学自学路线 | [OSSU Computer Science](https://github.com/ossu/computer-science) / [csdiy.wiki](https://csdiy.wiki/) |
| 后端路线 | [roadmap.sh Backend](https://roadmap.sh/backend) / [roadmap.sh Java](https://roadmap.sh/java) |
| 数据库路线 | [roadmap.sh SQL](https://roadmap.sh/sql) |
| LLM 应用与安全 | [OWASP GenAI LLM Top 10](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/) / [OWASP LLM Top 10](https://owasp.org/projects/top-10-for-large-language-model-applications) |
| 云原生与 SRE | [CNCF Landscape](https://landscape.cncf.io/) / [Google SRE](https://sre.google/) |

## 5. 公开练习与题库调研

用于了解常见题型、练习组织方式与难度分层；本平台题目不是从这些站点抓取或复制的：

- [LeetCode](https://leetcode.com/)：算法与 JavaScript 30 天计划，适合代码题参考题型。
- [JavaScript.info](https://javascript.info/)：语言机制讲解与练习。
- [SQLBolt](https://sqlbolt.com/) / [pgexercises](https://pgexercises.com/)：SQL 交互练习。
- [InterviewBit JavaScript Questions](https://www.interviewbit.com/javascript-interview-questions/)：常见面试主题分类。
- [Roadmap.sh](https://roadmap.sh/)：岗位技术地图，用于课程技术路径与先修关系参考。

## 6. 内容编写规则

1. **先查官方文档，再写讲解与题**：涉及 API 行为、版本、协议语义时以官方文档为准；不编造不存在的 API。
2. **题目原创**：题干、选项、解析由本项目编写；不从题库整段复制。引用链接只用于延伸阅读与核验。
3. **可执行题必须真跑**：JavaScript 代码题参考答案在 Node 中执行并校验全部测试；Kotlin/SQL/Java 题在当前运行时无法安全执行时，明确标注“参考实现 + 自评/对照”，不伪装自动判分。
4. **难度分层**：初级问“是什么、怎么用、边界”；中级问“机制、异常、取舍”；高级问“架构、容量、故障与成本”。
5. **更新来源**：课程改版时同步更新章节参考链接；每年至少复核一次外链有效性。

## 路线图与题型扩展（REQ-018）

公开学习站的完整路线图参考 roadmap.sh 的角色路线，并重新编排为平台的精读、问答、题库和产出节点：

- Frontend：https://roadmap.sh/frontend
- JavaScript：https://roadmap.sh/javascript
- TypeScript：https://roadmap.sh/typescript
- React：https://roadmap.sh/react
- React Native：https://roadmap.sh/react-native
- Node.js：https://roadmap.sh/nodejs
- Backend：https://roadmap.sh/backend
- Java：https://roadmap.sh/java
- Spring Boot：https://roadmap.sh/spring-boot
- MySQL：https://roadmap.sh/mysql
- Redis：https://roadmap.sh/redis
- Computer Science：https://roadmap.sh/computer-science
- System Design：https://roadmap.sh/system-design

官方参考入口：

- MDN Web Docs：https://developer.mozilla.org/zh-CN/docs/Web
- React：https://react.dev/learn
- React Native：https://reactnative.dev/docs/getting-started
- 微信小程序：https://developers.weixin.qq.com/miniprogram/dev/framework/
- TypeScript：https://www.typescriptlang.org/docs/
- Node.js：https://nodejs.org/en/learn
- Dev.java：https://dev.java/learn/
- Spring Guides：https://spring.io/guides
- MySQL 8.4 Reference：https://dev.mysql.com/doc/refman/8.4/en/
- Redis Docs：https://redis.io/docs/latest/
- OWASP Top 10：https://owasp.org/www-project-top-ten/

题型与题目来源：

- 选择题中的 210 道来自本仓库五门课程的自有题库。
- 简答、填空、判断、多选和知识点单选由 `public-site/scripts/generate-questions.mjs` 基于 380 道原创问答生成/编排，解释与参考答案保留原问答内容。
- 未抓取或复制第三方商业题库；外部练习站点仅作为资料链接。生成题会明确标注，自动纠错为本地关键词/精确匹配，不宣称语义评分。
