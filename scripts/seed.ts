import { getDb } from "../src/lib/db/client";
import { findUserWithPassword } from "../src/lib/db/users";
import { registerUser, updateProfile } from "../src/lib/services/account";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/constants";

const SAMPLE_RESUME = `张一 · 全栈开发工程师
3 年 Web 开发经验，负责电商后台与 C 端活动页面。
项目：订单履约平台（React + TypeScript + Node.js + PostgreSQL）
- 负责订单列表与详情的前后端开发，使用 React Query 管理服务端状态，接口 P95 延迟从 420ms 降到 180ms。
- 设计幂等下单与超时重试，修复重复支付问题；为热点商品增加 Redis 缓存，QPS 提升约 3 倍。
- 搭建 Vitest 单测与 GitHub Actions 流水线，发布回滚时间缩短到 5 分钟。
技能：TypeScript、React、Node.js、Express、PostgreSQL、Redis、Docker、Git、Vitest。`;

const SAMPLE_JD = `全栈开发工程师（中级）
岗位职责：
1. 负责核心业务系统前后端开发，设计并维护 REST API；
2. 优化数据库查询与缓存策略，参与关键链路性能治理；
3. 参与系统设计评审，保障安全、可观测性与发布可靠性。
任职要求：
1. 3 年以上 Web 开发经验，熟悉 React、TypeScript、Node.js；
2. 熟悉 PostgreSQL / MySQL，理解索引、事务与慢查询优化；
3. 了解 Redis、Docker 与 CI/CD，有线上故障排查经验；
4. 具备良好的工程化意识与跨角色沟通能力。`;

const db = getDb();
const existing = findUserWithPassword(db, DEMO_EMAIL);
if (existing) {
  console.log(`演示账号已存在：${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
} else {
  const user = registerUser({
    name: "演示用户",
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  updateProfile(user.id, {
    trackId: "fullstack",
    level: "middle",
    targetRole: "全栈开发工程师",
    targetCompany: "OfferPath 示例公司",
    resumeText: SAMPLE_RESUME,
    jdText: SAMPLE_JD,
    onboarded: true,
  });
  console.log(`演示账号已创建：${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}
console.log("种子数据完成。");
