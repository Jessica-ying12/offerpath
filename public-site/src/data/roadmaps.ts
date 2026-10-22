import type { RoleId } from "../lib/types";
import catalogJson from "./roadmap-catalog.json";
import officialNodesJson from "./official-roadmap-nodes.json";

export type RoadmapCategory = "beginner" | "career" | "skill";
export type RoadmapLink = { label: string; url: string };
export type RoadmapNode = {
  title: string;
  description?: string;
  outcome?: string;
  priority?: "核心" | "进阶" | "加分";
  topics?: string[];
  docs?: string[];
  qaDoc?: string;
  bankDoc?: string;
  courseIds?: string[];
  external?: RoadmapLink[];
};
export type RoadmapStage = {
  id: string;
  title: string;
  subtitle: string;
  nodes: RoadmapNode[];
};
export type Roadmap = {
  id: string;
  name: string;
  nameZh?: string;
  category: RoadmapCategory;
  audience: string;
  description: string;
  officialUrl: string;
  stages: RoadmapStage[];
  curated: boolean;
  groupLabel: string;
  catalogCategories: string[];
  officialTopics: string[];
};

export type CatalogRoute = {
  slug: string;
  title: string;
  categories: string[];
  inDirectory: boolean;
};
export type CatalogGroup = {
  heading: string;
  routes: Array<{ slug: string; title: string }>;
};
type CatalogData = {
  source: string;
  scrapedAt: string;
  total: number;
  categories: Array<{ id: string; label: string; count: number }>;
  allGroups: CatalogGroup[];
  categoryGroups: Record<string, CatalogGroup[]>;
  routes: CatalogRoute[];
};

export const ROADMAP_CATALOG = catalogJson as CatalogData;
export const ROADMAP_CATALOG_CATEGORIES = ROADMAP_CATALOG.categories;
export const ROADMAP_TOTAL = ROADMAP_CATALOG.total;
export const ROADMAP_SOURCE = ROADMAP_CATALOG.source;
export const ROADMAP_SCRAPED_AT = ROADMAP_CATALOG.scrapedAt;
export const ROADMAP_OFFICIAL_DIRECTORY = "https://roadmap.sh/roadmaps";

export const OFFICIAL_NODE_MAP = officialNodesJson as Record<string, { nodes: string[] }>;
export const OFFICIAL_NODE_TOTAL = Object.values(OFFICIAL_NODE_MAP).reduce((sum, item) => sum + item.nodes.length, 0);

const CATEGORY_ZH: Record<string, string> = {
  beginner: "零基础入门",
  web: "Web 开发",
  frameworks: "框架",
  languages: "语言与平台",
  ai: "AI 与机器学习",
  devops: "DevOps",
  mobile: "移动开发",
  databases: "数据库",
  cs: "计算机科学",
  management: "管理",
  game: "游戏开发",
  design: "设计",
  blockchain: "区块链",
  security: "网络安全",
  best: "最佳实践",
};

const ROADMAP_TITLE_ZH: Record<string, string> = {
  "frontend-beginner": "前端入门",
  "backend-beginner": "后端入门",
  "devops-beginner": "DevOps 入门",
  "git-github-beginner": "Git 与 GitHub 入门",
  frontend: "前端工程师",
  backend: "后端工程师",
  "full-stack": "全栈工程师",
  android: "Android 开发",
  devops: "DevOps 工程师",
  devsecops: "DevSecOps 工程师",
  "data-analyst": "数据分析师",
  "inference-engineering": "推理工程",
  "ai-engineer": "AI 工程师",
  "ai-data-scientist": "AI 与数据科学家",
  "data-engineer": "数据工程师",
  "machine-learning": "机器学习",
  "postgresql-dba": "PostgreSQL DBA",
  ios: "iOS 开发",
  blockchain: "区块链",
  qa: "QA 测试工程师",
  "software-architect": "软件架构师",
  "api-design": "API 设计",
  "cyber-security": "网络安全",
  "ux-design": "UX 设计",
  "technical-writer": "技术写作",
  "game-developer": "游戏开发者",
  "server-side-game-developer": "服务端游戏开发者",
  mlops: "MLOps 工程师",
  "product-manager": "产品经理",
  "engineering-manager": "工程经理",
  devrel: "开发者关系",
  "bi-analyst": "BI 分析师",
  "ai-red-teaming": "AI 红队",
  "network-engineer": "网络工程师",
  "forward-deployed-engineer": "交付工程师",
  "python-data-analysis": "Python 数据分析",
  "r-programming": "R 语言",
  "computer-science": "计算机科学",
  "system-design": "系统设计",
  c: "C 语言",
  cpp: "C++",
  golang: "Go",
  "ai-product-builder": "AI 产品构建",
  "software-design-architecture": "软件设计架构",
  "design-system": "设计系统",
  "prompt-engineering": "提示词工程",
  "datastructures-and-algorithms": "数据结构与算法",
  "git-github": "Git 与 GitHub",
  "ai-agents": "AI Agents",
  "swift-ui": "Swift 与 SwiftUI",
  "code-review": "代码评审",
  "product-design": "产品设计",
  "aws-best-practices": "AWS 最佳实践",
  "api-security-best-practices": "API 安全最佳实践",
  "backend-performance-best-practices": "后端性能最佳实践",
  "frontend-performance-best-practices": "前端性能最佳实践",
  "code-review-best-practices": "代码评审最佳实践",
};

const CATEGORY_LABELS_ZH: Record<string, string> = {
  all: "全部路线",
  beginner: "零基础入门",
  web: "Web 开发",
  frameworks: "框架",
  languages: "语言与平台",
  ai: "AI 与机器学习",
  devops: "DevOps",
  mobile: "移动开发",
  databases: "数据库",
  cs: "计算机科学",
  management: "管理",
  game: "游戏开发",
  design: "设计",
  blockchain: "区块链",
  security: "网络安全",
  best: "最佳实践",
};

const GROUP_LABELS_ZH: Record<string, string> = {
  "New Roadmaps": "最新路线",
  "Role Based Roadmaps": "角色路线",
  "Skill Based Roadmaps": "技术路线",
  "Absolute Beginners": "零基础入门",
  "Best Practices": "最佳实践",
  "Web Development": "Web 开发",
  "Frameworks": "框架",
  "Languages / Platforms": "语言与平台",
  "Languages": "语言",
  "AI & Machine Learning": "AI 与机器学习",
  "Data Analysis": "数据分析",
  "Mobile Development": "移动开发",
  "Databases": "数据库",
  "Computer Science": "计算机科学",
  "Management": "管理",
  "Game Development": "游戏开发",
  "Design": "设计",
  "Blockchain": "区块链",
  "Cyber Security": "网络安全",
  "DevOps": "DevOps",
  "平台精编补充": "平台精编补充",
};

export function categoryLabelZh(id: string): string {
  return CATEGORY_LABELS_ZH[id] ?? id;
}

export function groupLabelZh(label: string): string {
  return GROUP_LABELS_ZH[label] ?? label;
}

export function roadmapDisplayName(roadmap: { name: string; nameZh?: string }): string {
  return roadmap.nameZh || roadmap.name;
}

const PLAN_GROUP_LABELS: Record<string, string> = {
  "New Roadmaps": "最新路线",
  "Role Based Roadmaps": "角色路线",
  "Skill Based Roadmaps": "技术路线",
  "Absolute Beginners": "零基础路线",
  "Best Practices": "最佳实践",
  "平台精编补充": "平台精编补充",
};

const GROUP_ORDER = [
  "New Roadmaps",
  "Role Based Roadmaps",
  "Skill Based Roadmaps",
  "Absolute Beginners",
  "Best Practices",
];

const DIRECTORY_GROUP = new Map<string, string>();
for (const heading of GROUP_ORDER) {
  const group = ROADMAP_CATALOG.allGroups.find((item) => item.heading === heading);
  for (const route of group?.routes ?? []) {
    if (!DIRECTORY_GROUP.has(route.slug)) DIRECTORY_GROUP.set(route.slug, heading);
  }
}

export const ROADMAP_OFFICIAL = {
  frontend: "https://roadmap.sh/frontend",
  backend: "https://roadmap.sh/backend",
  fullstack: "https://roadmap.sh/full-stack",
  reactNative: "https://roadmap.sh/react-native",
  javascript: "https://roadmap.sh/javascript",
  typescript: "https://roadmap.sh/typescript",
  react: "https://roadmap.sh/react",
  nodejs: "https://roadmap.sh/nodejs",
  sql: "https://roadmap.sh/sql",
  git: "https://roadmap.sh/git-github",
  java: "https://roadmap.sh/java",
  spring: "https://roadmap.sh/spring-boot",
  mysql: "https://roadmap.sh/mysql",
  redis: "https://roadmap.sh/redis",
  computerScience: "https://roadmap.sh/computer-science",
  systemDesign: "https://roadmap.sh/system-design",
  devops: "https://roadmap.sh/devops",
  devopsBeginner: "https://roadmap.sh/devops",
  frontendBeginner: "https://roadmap.sh/frontend",
  backendBeginner: "https://roadmap.sh/backend",
  gitBeginner: "https://roadmap.sh/git-github",
};

const OFFICIAL: Record<string, RoadmapLink[]> = {
  devJava: [{ label: "Dev.java", url: "https://dev.java/learn/" }],
  spring: [{ label: "Spring Guides", url: "https://spring.io/guides" }],
  mysql: [{ label: "MySQL 手册", url: "https://dev.mysql.com/doc/refman/8.4/en/" }],
  redis: [{ label: "Redis Docs", url: "https://redis.io/docs/latest/" }],
  node: [{ label: "Node.js Learn", url: "https://nodejs.org/en/learn" }],
  react: [{ label: "React 官方教程", url: "https://react.dev/learn" }],
  rn: [{ label: "React Native 文档", url: "https://reactnative.dev/docs/getting-started" }],
  mdn: [{ label: "MDN", url: "https://developer.mozilla.org/zh-CN/docs/Web" }],
  mini: [{ label: "微信小程序文档", url: "https://developers.weixin.qq.com/miniprogram/dev/framework/" }],
  flutter: [{ label: "Flutter 文档", url: "https://docs.flutter.dev/" }],
  docker: [{ label: "Docker Docs", url: "https://docs.docker.com/get-started/" }],
  k8s: [{ label: "Kubernetes Docs", url: "https://kubernetes.io/docs/home/" }],
  git: [{ label: "Git 文档", url: "https://git-scm.com/doc" }],
  ts: [{ label: "TypeScript 文档", url: "https://www.typescriptlang.org/docs/" }],
};

function d(title: string, docs: string[], extra: Partial<RoadmapNode> = {}): RoadmapNode {
  return {
    title,
    docs,
    qaDoc: docs[0],
    bankDoc: docs[0],
    ...extra,
  };
}

function t(
  title: string,
  topics: string[],
  extra: Partial<RoadmapNode> = {},
): RoadmapNode {
  return { title, topics, ...extra };
}

function s(
  id: string,
  title: string,
  subtitle: string,
  nodes: RoadmapNode[],
): RoadmapStage {
  return { id, title, subtitle, nodes };
}

type CuratedRoadmap = Omit<
  Roadmap,
  "curated" | "groupLabel" | "catalogCategories" | "officialTopics" | "nameZh"
>;

const CURATED_ROADMAPS: CuratedRoadmap[] = [
  {
    id: "frontend-beginner",
    name: "前端入门",
    category: "beginner",
    audience: "零基础 / 刚转行",
    description: "从浏览器和 HTML 开始，先做出一个能上线的小项目，再进入框架。",
    officialUrl: ROADMAP_OFFICIAL.frontendBeginner,
    stages: [
      s("start", "开始", "环境、浏览器、Git", [
        d("互联网、浏览器与 HTTP", ["01"], { priority: "核心" }),
        d("编辑器、终端与 Git", ["07"], { priority: "核心" }),
      ]),
      s("page", "页面", "结构、样式与移动端", [
        d("HTML 语义化与表单", ["01"], { priority: "核心" }),
        d("CSS 盒模型与 Flex/Grid", ["02"], { priority: "核心" }),
        d("移动端适配、1px 与安全区", ["02"], { priority: "核心" }),
      ]),
      s("language", "语言", "JavaScript 与 DOM", [
        d("变量、函数与对象", ["03"], { priority: "核心" }),
        d("DOM、事件与异步请求", ["03"], { priority: "核心" }),
      ]),
      s("tools", "工具", "npm 与仓库", [
        d("npm 与构建入门", ["07"], { priority: "核心" }),
        d("Git 分支、提交与远程仓库", ["07"], { priority: "核心" }),
      ]),
      s("project", "第一个项目", "从页面到上线", [
        d("React 组件与状态入门", ["05"], { priority: "核心" }),
        d("项目实战、调试与上线", ["08", "12"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "backend-beginner",
    name: "后端入门",
    category: "beginner",
    audience: "零基础 / 想理解服务端",
    description: "以 Java + Spring + SQL 为主线，先写通一个带鉴权、数据库和部署的接口项目。",
    officialUrl: ROADMAP_OFFICIAL.backendBeginner,
    stages: [
      s("java", "Java 语言", "语法、对象与集合", [
        t("Java 语法与面向对象", ["类型", "对象", "接口", "异常"], { courseIds: ["backend-java"], external: OFFICIAL.devJava, priority: "核心" }),
        t("集合、泛型与异常处理", ["List/Map", "泛型擦除", "异常边界"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("web", "Web 基础", "HTTP、REST 与命令行", [
        t("HTTP 方法与 REST 契约", ["GET/POST", "状态码", "幂等", "错误结构"], { courseIds: ["backend-java", "cs-ai-foundations"], external: OFFICIAL.mdn, priority: "核心" }),
        d("Git、命令行与联调", ["07"], { priority: "核心" }),
      ]),
      s("data", "数据", "SQL 与表设计", [
        t("SQL、表设计与索引入门", ["SELECT", "JOIN", "主键/索引", "事务"], { courseIds: ["database-mysql"], external: OFFICIAL.mysql, priority: "核心" }),
      ]),
      s("framework", "框架", "Spring Boot", [
        t("Spring Boot 与 REST 接口", ["IoC", "MVC", "校验", "事务"], { courseIds: ["backend-java"], external: OFFICIAL.spring, priority: "核心" }),
        t("鉴权、登录与错误处理", ["Session/JWT", "密码哈希", "401/403", "异常映射"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("ship", "交付", "部署与观测", [
        t("Docker、日志与部署", ["镜像", "环境变量", "日志", "健康检查"], { courseIds: ["backend-java"], external: OFFICIAL.docker, priority: "核心" }),
        t("第一个接口项目", ["建表", "CRUD", "鉴权", "测试", "发布"], { courseIds: ["backend-java", "database-mysql"], priority: "核心" }),
      ]),
    ],
  },
  {
    id: "git-github-beginner",
    name: "Git / GitHub 入门",
    category: "beginner",
    audience: "所有开发者",
    description: "只练每天都会用的动作：提交、分支、合并、冲突、远程协作和 PR。",
    officialUrl: ROADMAP_OFFICIAL.gitBeginner,
    stages: [
      s("basics", "基础", "仓库、提交与历史", [
        d("仓库与提交", ["07"], { priority: "核心" }),
        t("查看历史、diff 与撤销", ["git log", "git diff", "restore", "reset"], { external: OFFICIAL.git, priority: "核心" }),
      ]),
      s("branch", "分支", "并行开发与合并", [
        t("创建、切换与合并分支", ["branch", "checkout/switch", "merge", "fast-forward"], { external: OFFICIAL.git, priority: "核心" }),
        t("冲突处理与回滚", ["merge conflict", "revert", "reset", "reflog"], { external: OFFICIAL.git, priority: "核心" }),
      ]),
      s("remote", "远程协作", "GitHub PR 流程", [
        t("远程仓库、推送与拉取", ["remote", "push", "pull", "fetch"], { external: OFFICIAL.git, priority: "核心" }),
        t("Issue、分支保护与 Pull Request", ["Issue", "PR", "review", "squash"], { external: OFFICIAL.git, priority: "核心" }),
      ]),
      s("quality", "质量", "自动化与发布", [
        t("Git hooks 与提交规范", ["pre-commit", "lint-staged", "commitlint"], { priority: "进阶" }),
        t("GitHub Actions 与发布", ["workflow", "test", "build", "release"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "devops-beginner",
    name: "DevOps 入门",
    category: "beginner",
    audience: "想理解部署与运维",
    description: "从 Linux、网络和 Docker 开始，能把一个应用稳定地构建、部署和观察。",
    officialUrl: ROADMAP_OFFICIAL.devopsBeginner,
    stages: [
      s("os", "系统与网络", "Linux、Shell、网络", [
        t("Linux 与 Shell 基础", ["文件系统", "权限", "进程", "管道"], { priority: "核心" }),
        t("网络与 DNS", ["TCP/IP", "DNS", "端口", "反向代理"], { priority: "核心" }),
      ]),
      s("container", "容器", "Docker 与镜像", [
        t("Docker 镜像与容器", ["Dockerfile", "volume", "network", "compose"], { external: OFFICIAL.docker, priority: "核心" }),
      ]),
      s("pipeline", "流水线", "构建、测试、发布", [
        t("CI/CD 流水线", ["build", "test", "artifact", "deploy"], { priority: "核心" }),
        t("环境与配置", ["环境变量", "Secret", "回滚", "灰度"], { priority: "核心" }),
      ]),
      s("observe", "运行", "日志、指标与告警", [
        t("日志、指标与追踪", ["结构化日志", "metrics", "tracing", "alert"], { priority: "进阶" }),
        t("第一个部署项目", ["容器化", "反向代理", "HTTPS", "健康检查"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "frontend",
    name: "前端工程师",
    category: "career",
    audience: "Web 前端 / 中高级",
    description: "完整的 Web 前端岗位能力：语言、框架、工程化、质量、进阶与项目表达。",
    officialUrl: ROADMAP_OFFICIAL.frontend,
    stages: [
      s("web-basics", "Web 基础", "互联网、HTML、CSS、Git", [
        d("互联网、浏览器与 HTTP", ["01"], { priority: "核心" }),
        d("HTML 语义化、表单与可访问性", ["01"], { priority: "核心" }),
        d("CSS 盒模型、Flex/Grid 与响应式", ["02"], { priority: "核心" }),
        d("Git 与协作", ["07"], { priority: "核心" }),
        d("npm 与包管理", ["07"], { priority: "核心" }),
      ]),
      s("language", "语言", "JavaScript、ES6+、TypeScript", [
        d("JavaScript 作用域、闭包与原型", ["03"], { priority: "核心" }),
        d("ES6+ 模块、解构与 Promise", ["04"], { priority: "核心" }),
        d("TypeScript 类型、泛型与收窄", ["14"], { priority: "核心" }),
        d("DOM、事件与浏览器存储", ["03"], { priority: "核心" }),
        d("异步、事件循环与网络请求", ["03", "11"], { priority: "核心" }),
      ]),
      s("react", "框架", "React 与状态", [
        d("React 组件、Props 与 State", ["05"], { priority: "核心" }),
        d("Hooks、依赖数组与闭包陷阱", ["05"], { priority: "核心" }),
        d("路由、表单与数据请求", ["05"], { priority: "核心" }),
        d("状态管理与组件通信", ["05"], { priority: "核心" }),
        d("组件设计与可复用边界", ["05", "19"], { priority: "进阶" }),
      ]),
      s("quality", "质量", "测试、性能、安全与调试", [
        d("前端测试：单测、组件与 E2E", ["16"], { priority: "核心" }),
        d("性能指标、首屏与长列表", ["20"], { priority: "核心" }),
        d("XSS、CSRF、CSP 与依赖安全", ["20"], { priority: "核心" }),
        d("调试、复现与线上问题", ["12"], { priority: "核心" }),
        d("可访问性与移动端体验", ["01", "02"], { priority: "进阶" }),
      ]),
      s("engineering", "工程化", "构建、CI、部署与架构", [
        d("Webpack/Vite 与构建原理", ["07"], { priority: "核心" }),
        d("ESLint、格式化与 Git hooks", ["07"], { priority: "核心" }),
        d("CI/CD 与静态部署", ["07", "20"], { priority: "核心" }),
        d("SSR、SSG 与 BFF", ["19"], { priority: "进阶" }),
        d("组件库、Monorepo 与设计系统", ["19"], { priority: "进阶" }),
      ]),
      s("career", "项目与面试", "项目、代码题、表达", [
        d("项目实战与复盘", ["08"], { priority: "核心" }),
        d("代码题与手写题", ["13"], { priority: "核心" }),
        d("面试表达与追问", ["09"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "backend",
    name: "后端工程师（语言无关）",
    category: "career",
    audience: "先选语言，再学后端通用能力",
    description: "不把后端等同于某一门语言：先选择 Java / Go / Python / Node.js，再补齐网络、API、数据、异步、部署和系统设计。",
    officialUrl: ROADMAP_OFFICIAL.backend,
    stages: [
      s("language", "先选语言", "Java / Go / Python / Node.js", [
        t("Java", ["类型", "集合", "并发", "Spring"], { courseIds: ["backend-java"], external: OFFICIAL.devJava, priority: "核心" }),
        t("Go", ["goroutine", "channel", "context", "接口"], { external: [{ label: "Go 官方文档", url: "https://go.dev/doc/" }, { label: "roadmap.sh Go", url: "https://roadmap.sh/golang" }], priority: "核心" }),
        t("Python", ["类型", "异步", "FastAPI", "虚拟环境"], { external: [{ label: "Python 文档", url: "https://docs.python.org/3/" }, { label: "roadmap.sh Python", url: "https://roadmap.sh/python" }], priority: "核心" }),
        d("Node.js", ["18"], { priority: "核心" }),
      ]),
      s("foundation", "计算机基础", "网络、OS、Linux、Git", [
        d("网络、操作系统与数据结构", ["11"], { priority: "核心" }),
        d("Linux、命令行与 Git", ["07"], { priority: "核心" }),
      ]),
      s("api", "Web 与 API", "HTTP、REST、鉴权、校验", [
        t("HTTP 与 REST 语义", ["方法/状态码", "幂等", "缓存", "错误结构"], { courseIds: ["backend-java", "cs-ai-foundations"], external: OFFICIAL.mdn, priority: "核心" }),
        t("API 设计", ["资源建模", "分页", "版本", "OpenAPI"], { external: [{ label: "roadmap.sh API Design", url: "https://roadmap.sh/api-design" }], priority: "核心" }),
        t("登录、鉴权与权限", ["Session/JWT", "OAuth", "RBAC", "限流"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("data", "数据", "SQL、建模、事务、缓存", [
        t("SQL、表设计与索引", ["JOIN", "索引", "执行计划", "迁移"], { courseIds: ["database-mysql", "backend-java"], external: OFFICIAL.mysql, priority: "核心" }),
        t("事务、并发与一致性", ["ACID", "隔离级别", "锁", "幂等"], { courseIds: ["database-mysql"], priority: "核心" }),
        t("Redis 与缓存", ["数据结构", "过期", "穿透", "一致性"], { courseIds: ["backend-java"], external: OFFICIAL.redis, priority: "核心" }),
      ]),
      s("async", "异步与扩展", "消息、限流、解耦", [
        t("消息队列与异步任务", ["MQ", "重试", "死信", "幂等消费"], { courseIds: ["backend-java"], priority: "进阶" }),
        t("限流、降级与熔断", ["令牌桶", "隔离", "降级", "超时"], { priority: "进阶" }),
        t("缓存、分片与扩展", ["读写分离", "分库分表", "热点", "容量"], { courseIds: ["backend-java", "database-mysql"], priority: "进阶" }),
      ]),
      s("production", "生产", "测试、容器、监控", [
        t("测试与质量", ["单元", "集成", "契约", "压测"], { courseIds: ["backend-java"], priority: "核心" }),
        t("Docker、CI/CD 与部署", ["镜像", "环境", "回滚", "灰度"], { external: OFFICIAL.docker, priority: "核心" }),
        t("日志、指标、追踪与告警", ["结构化日志", "metrics", "trace", "SLO"], { courseIds: ["backend-java", "cs-ai-foundations"], priority: "进阶" }),
      ]),
      s("design", "系统设计与项目", "架构、取舍、表达", [
        t("系统设计基础", ["需求", "容量", "存储", "缓存", "可用性"], { external: [{ label: "roadmap.sh System Design", url: "https://roadmap.sh/system-design" }], priority: "进阶" }),
        t("后端项目与面试", ["接口", "数据模型", "故障复盘", "STAR"], { courseIds: ["backend-java", "database-mysql"], priority: "核心" }),
      ]),
    ],
  },
  {
    id: "backend-java",
    name: "Java 后端工程师",
    category: "career",
    audience: "Java / Spring 后端",
    description: "Java、Spring、MySQL、Redis、并发、系统设计与生产交付的完整后端能力。",
    officialUrl: ROADMAP_OFFICIAL.backend,
    stages: [
      s("java-base", "Java 基础", "语言、集合、并发、JVM", [
        t("Java 语法、对象与接口", ["类型", "对象", "接口", "异常"], { courseIds: ["backend-java"], external: OFFICIAL.devJava, priority: "核心" }),
        t("集合、泛型与函数式接口", ["List/Map/Set", "泛型", "Stream", "Optional"], { courseIds: ["backend-java"], priority: "核心" }),
        t("并发、线程池与锁", ["线程", "线程池", "synchronized", "CAS", "死锁"], { courseIds: ["backend-java"], priority: "核心" }),
        t("JVM、内存与 GC", ["堆/栈", "GC", "类加载", "排查命令"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("framework", "Web 与框架", "HTTP、Spring、鉴权", [
        t("HTTP、REST 与接口契约", ["方法/状态码", "幂等", "分页", "错误码"], { courseIds: ["backend-java", "cs-ai-foundations"], external: OFFICIAL.mdn, priority: "核心" }),
        t("Maven/Gradle 与工程结构", ["依赖", "多模块", "profile", "打包"], { courseIds: ["backend-java"], priority: "核心" }),
        t("Spring IoC、MVC 与校验", ["Bean", "依赖注入", "Controller", "参数校验"], { courseIds: ["backend-java"], external: OFFICIAL.spring, priority: "核心" }),
        t("Spring Security 与登录", ["认证/授权", "JWT/Session", "密码哈希", "CSRF"], { courseIds: ["backend-java"], priority: "核心" }),
        t("ORM 与 MyBatis/JPA", ["映射", "N+1", "分页", "事务边界"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("data", "数据", "SQL、索引、事务、缓存", [
        t("SQL、表设计与索引", ["JOIN", "联合索引", "最左前缀", "覆盖索引"], { courseIds: ["database-mysql", "backend-java"], external: OFFICIAL.mysql, priority: "核心" }),
        t("事务、隔离级别与锁", ["ACID", "MVCC", "死锁", "隔离级别"], { courseIds: ["database-mysql", "backend-java"], priority: "核心" }),
        t("Redis 与缓存设计", ["数据结构", "过期", "穿透/击穿/雪崩", "一致性"], { courseIds: ["backend-java"], external: OFFICIAL.redis, priority: "核心" }),
      ]),
      s("production", "生产", "测试、容器、监控、消息", [
        t("测试与质量", ["单元测试", "集成测试", "契约", "测试数据"], { courseIds: ["backend-java"], priority: "核心" }),
        t("Docker、CI/CD 与发布", ["镜像", "环境", "滚动发布", "回滚"], { courseIds: ["backend-java"], external: OFFICIAL.docker, priority: "核心" }),
        t("日志、指标、追踪与告警", ["结构化日志", "metrics", "trace", "SLO"], { courseIds: ["backend-java", "cs-ai-foundations"], priority: "进阶" }),
        t("消息队列与异步", ["MQ", "幂等消费", "重试", "死信"], { courseIds: ["backend-java"], priority: "进阶" }),
      ]),
      s("design", "系统设计", "容量、缓存、可用性与取舍", [
        t("系统设计基础", ["需求/约束", "容量估算", "API", "存储"], { courseIds: ["backend-java", "cs-ai-foundations"], external: [{ label: "roadmap.sh System Design", url: ROADMAP_OFFICIAL.systemDesign }], priority: "进阶" }),
        t("高可用与扩展", ["限流", "降级", "分库分表", "多副本"], { courseIds: ["backend-java", "database-mysql"], priority: "进阶" }),
        t("一致性、缓存与消息", ["CAP", "最终一致", "缓存一致性", "幂等"], { courseIds: ["backend-java"], priority: "进阶" }),
      ]),
      s("career", "项目与面试", "项目、系统设计表达", [
        t("后端项目实战", ["接口设计", "数据模型", "压测", "故障复盘"], { courseIds: ["backend-java", "database-mysql"], priority: "核心" }),
        t("面试与项目讲述", ["STAR", "取舍", "指标", "追问"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
    ],
  },
  {
    id: "full-stack",
    name: "全栈工程师",
    category: "career",
    audience: "前端 + 后端 + 交付",
    description: "以 Web 全链路为主线：React 前端、Node API、数据库、鉴权、部署与系统设计。",
    officialUrl: ROADMAP_OFFICIAL.fullstack,
    stages: [
      s("web", "Web 基础", "浏览器、HTML、CSS、Git", [
        d("浏览器与 HTTP", ["01"], { priority: "核心" }),
        d("HTML 与 CSS 布局", ["01", "02"], { priority: "核心" }),
        d("Git 与协作", ["07"], { priority: "核心" }),
      ]),
      s("language", "语言", "JavaScript 与 TypeScript", [
        d("JavaScript 核心", ["03"], { priority: "核心" }),
        d("TypeScript 类型系统", ["14"], { priority: "核心" }),
      ]),
      s("frontend", "前端", "React 与体验", [
        d("React 组件与 Hooks", ["05"], { priority: "核心" }),
        d("路由、表单与数据请求", ["05"], { priority: "核心" }),
        d("性能、可访问性与安全", ["20"], { priority: "进阶" }),
      ]),
      s("backend", "后端", "Node、API 与鉴权", [
        d("Node.js 运行时与 API", ["18"], { priority: "核心" }),
        d("REST、校验与错误处理", ["18"], { priority: "核心" }),
        d("登录、Session/JWT 与权限", ["18"], { priority: "核心" }),
      ]),
      s("data", "数据", "SQL、建模与缓存", [
        t("SQL 与表设计", ["JOIN", "索引", "事务", "迁移"], { courseIds: ["database-mysql"], external: OFFICIAL.mysql, priority: "核心" }),
        d("缓存与 Redis", ["18"], { priority: "进阶" }),
      ]),
      s("delivery", "交付", "测试、容器与观测", [
        t("测试金字塔与 E2E", ["单元测试", "组件测试", "E2E"], { courseIds: ["fullstack"], priority: "核心" }),
        t("Docker、CI/CD 与观测", ["镜像", "流水线", "日志", "指标"], { courseIds: ["fullstack", "backend-java"], external: OFFICIAL.docker, priority: "核心" }),
      ]),
      s("career", "系统设计与项目", "架构、演进与表达", [
        d("前端系统设计", ["19"], { priority: "进阶" }),
        t("全栈项目与面试", ["数据模型", "鉴权", "部署", "复盘"], { courseIds: ["fullstack"], priority: "核心" }),
      ]),
    ],
  },
  {
    id: "react-native",
    name: "React Native 工程师",
    category: "career",
    audience: "RN / 移动前端",
    description: "从 JS/React 到 RN 组件、导航、原生能力、性能与发版，不混入 Web 专属杂项。",
    officialUrl: ROADMAP_OFFICIAL.reactNative,
    stages: [
      s("language", "语言与 React", "JS/TS + React 基础", [
        d("JavaScript 与 TypeScript", ["03", "14"], { priority: "核心" }),
        d("React 组件、Props 与 State", ["05"], { priority: "核心" }),
        d("Hooks、闭包与依赖数组", ["05"], { priority: "核心" }),
      ]),
      s("rn-base", "RN 基础", "环境、组件与样式", [
        t("RN 环境、Metro 与调试", ["Metro", "模拟器", "Dev Menu", "日志"], { external: OFFICIAL.rn, priority: "核心" }),
        t("View/Text/Image/Pressable", ["核心组件", "样式", "事件", "图片"], { external: OFFICIAL.rn, priority: "核心" }),
        t("Flex 布局、安全区与适配", ["Flex", "Dimensions", "SafeArea", "像素密度"], { docs: ["02"], priority: "核心" }),
        t("长列表与 FlatList", ["FlatList", "分页", "key", "空态/错误态"], { external: OFFICIAL.rn, priority: "核心" }),
      ]),
      s("data", "数据与导航", "路由、状态、请求、存储", [
        t("导航与路由", ["Stack", "Tab", "参数", "深链"], { external: OFFICIAL.rn, priority: "核心" }),
        t("本地状态与服务端状态", ["useState", "Context", "React Query", "缓存"], { priority: "核心" }),
        t("网络、鉴权与错误处理", ["fetch", "401 刷新", "超时", "重试"], { priority: "核心" }),
        t("本地存储与离线", ["AsyncStorage", "MMKV", "离线态", "同步"], { priority: "进阶" }),
      ]),
      s("native", "原生能力", "模块、权限与 WebView", [
        d("WebView 与 JSBridge", ["15"], { priority: "进阶" }),
        d("Android/iOS 生命周期、权限与签名", ["17"], { priority: "进阶" }),
        t("原生模块与 PlatformChannel", ["Native Module", "MethodChannel", "事件", "调试"], { priority: "进阶" }),
      ]),
      s("quality", "质量与性能", "调试、测试、性能", [
        d("调试与线上排查", ["12"], { priority: "核心" }),
        d("RN/前端测试", ["16"], { priority: "进阶" }),
        t("RN 性能：启动、列表、包体积", ["Hermes", "启动时间", "重渲染", "bundle"], { priority: "核心" }),
      ]),
      s("release", "发布", "构建、签名、OTA", [
        t("Android/iOS 构建与签名", ["Gradle", "Xcode", "keystore", "provisioning"], { docs: ["17"], priority: "核心" }),
        t("EAS/OTA 与商店发布", ["EAS Build", "OTA", "灰度", "审核"], { external: OFFICIAL.rn, priority: "核心" }),
      ]),
      s("career", "项目与面试", "项目证据与追问", [
        d("项目实战与复盘", ["08"], { priority: "核心" }),
        d("面试问答与表达", ["09"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "mini-program",
    name: "微信小程序工程师",
    category: "career",
    audience: "小程序 / 移动前端",
    description: "小程序不是小号 H5：独立运行时、双线程、setData、分包、登录支付与平台能力。",
    officialUrl: "https://roadmap.sh/frontend",
    stages: [
      s("base", "基础", "JS/TS、WXML/WXSS", [
        d("JavaScript 与 TypeScript", ["03", "14"], { priority: "核心" }),
        t("WXML、WXSS 与项目结构", ["数据绑定", "模板", "样式", "app.json"], { external: OFFICIAL.mini, priority: "核心" }),
      ]),
      s("runtime", "运行时", "双线程、生命周期、组件", [
        t("双线程与渲染机制", ["逻辑层", "视图层", "通信", "setData"], { external: OFFICIAL.mini, priority: "核心" }),
        t("App/Page/Component 生命周期", ["onLoad", "onShow", "onHide", "组件生命周期"], { external: OFFICIAL.mini, priority: "核心" }),
        t("组件、事件与通信", ["properties", "triggerEvent", "selectComponent", "插槽"], { external: OFFICIAL.mini, priority: "核心" }),
      ]),
      s("capability", "平台能力", "路由、网络、登录、支付", [
        t("路由与页面栈", ["navigateTo", "redirectTo", "switchTab", "页面栈"], { external: OFFICIAL.mini, priority: "核心" }),
        t("请求、存储与登录", ["wx.request", "Storage", "code2Session", "登录态"], { external: OFFICIAL.mini, priority: "核心" }),
        t("支付、订阅消息与隐私", ["支付流程", "订阅消息", "隐私协议", "授权"], { external: OFFICIAL.mini, priority: "进阶" }),
      ]),
      s("advanced", "进阶", "分包、性能与 Skyline", [
        d("小程序进阶", ["21"], { priority: "进阶" }),
        d("性能与 setData 优化", ["20", "21"], { priority: "核心" }),
      ]),
      s("engineering", "工程与发布", "CI、测试、提审", [
        d("测试与质量", ["16"], { priority: "进阶" }),
        t("CI、预览与提审", ["miniprogram-ci", "体验版", "审核", "回滚"], { external: OFFICIAL.mini, priority: "核心" }),
      ]),
      s("career", "项目与面试", "项目证据", [
        d("项目实战与复盘", ["08"], { priority: "核心" }),
        d("面试问答与表达", ["09"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "flutter",
    name: "Flutter 工程师",
    category: "career",
    audience: "Flutter / 跨端",
    description: "Dart、Widget、布局、状态、平台通道、性能、测试与发布。",
    officialUrl: "https://roadmap.sh/flutter",
    stages: [
      s("dart", "Dart", "语言与异步", [
        t("Dart 语法、空安全与集合", ["类型", "null safety", "集合", "扩展"], { docs: ["10"], priority: "核心" }),
        t("Future、Stream 与错误处理", ["Future", "Stream", "async/await", "异常"], { docs: ["10"], priority: "核心" }),
      ]),
      s("ui", "UI", "Widget、布局与适配", [
        t("Widget/Element/RenderObject", ["三棵树", "build", "复用", "key"], { docs: ["10"], priority: "核心" }),
        t("布局约束、Flex 与响应式", ["约束", "Row/Column", "Stack", "适配"], { docs: ["10"], priority: "核心" }),
      ]),
      s("state", "状态与导航", "状态管理、路由", [
        t("状态管理与依赖注入", ["setState", "Riverpod", "Bloc", "Provider"], { docs: ["10"], priority: "核心" }),
        t("路由、参数与深链", ["Navigator", "go_router", "参数", "深链"], { docs: ["10"], priority: "核心" }),
      ]),
      s("native", "平台能力", "网络、通道与原生", [
        t("网络、存储与序列化", ["http/dio", "JSON", "本地存储", "缓存"], { docs: ["10"], priority: "核心" }),
        t("Platform Channel 与原生模块", ["MethodChannel", "EventChannel", "Android/iOS", "插件"], { docs: ["10", "17"], priority: "进阶" }),
      ]),
      s("quality", "性能与质量", "调试、测试、性能", [
        t("性能、内存与启动", ["帧率", "重建", "内存", "启动"], { docs: ["10"], priority: "核心" }),
        d("测试与调试", ["16", "12"], { priority: "进阶" }),
      ]),
      s("release", "发布与项目", "打包、上架、复盘", [
        t("打包、签名与上架", ["Android/iOS", "签名", "审核", "灰度"], { docs: ["17"], priority: "核心" }),
        d("项目实战与面试", ["08", "09"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "javascript",
    name: "JavaScript",
    category: "skill",
    audience: "语言专项",
    description: "只学 JavaScript：作用域、函数、对象、浏览器、异步、模块与手写题。",
    officialUrl: ROADMAP_OFFICIAL.javascript,
    stages: [
      s("basics", "语言基础", "类型、变量、运算", [
        d("变量、作用域与提升", ["03"], { priority: "核心" }),
        d("数据类型、转换与比较", ["03"], { priority: "核心" }),
      ]),
      s("function", "函数与对象", "闭包、this、原型", [
        d("函数、闭包与作用域链", ["03"], { priority: "核心" }),
        d("this 与调用方式", ["03"], { priority: "核心" }),
        d("原型、继承与 class", ["03"], { priority: "核心" }),
        d("对象、数组与常用方法", ["03"], { priority: "核心" }),
      ]),
      s("browser", "浏览器", "DOM、事件与存储", [
        d("DOM、事件与事件委托", ["03"], { priority: "核心" }),
        d("BOM、Storage 与浏览器限制", ["03"], { priority: "核心" }),
      ]),
      s("async", "异步", "Promise、async、事件循环", [
        d("Promise 与 async/await", ["03"], { priority: "核心" }),
        d("事件循环、微任务与宏任务", ["03"], { priority: "核心" }),
        d("网络请求与错误处理", ["03", "11"], { priority: "核心" }),
      ]),
      s("engineering", "工程", "模块、错误、内存", [
        d("模块化与 ES Module", ["04"], { priority: "核心" }),
        d("错误处理、内存与垃圾回收", ["03"], { priority: "进阶" }),
      ]),
      s("practice", "练习", "手写题与测试", [
        d("代码题与异步专项", ["13"], { priority: "核心" }),
        d("测试与调试", ["16", "12"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "skill",
    audience: "类型系统专项",
    description: "从类型基础到泛型、收窄、工具类型、React 类型与工程配置。",
    officialUrl: ROADMAP_OFFICIAL.typescript,
    stages: [
      s("basics", "类型基础", "原始类型、接口、别名", [
        d("类型、接口与类型别名", ["14"], { priority: "核心" }),
        d("联合/交叉类型与字面量", ["14"], { priority: "核心" }),
      ]),
      s("advanced", "类型进阶", "泛型、收窄、工具类型", [
        d("泛型与约束", ["14"], { priority: "核心" }),
        d("类型收窄、守卫与断言", ["14"], { priority: "核心" }),
        d("工具类型与类型编程", ["14"], { priority: "进阶" }),
      ]),
      s("project", "工程", "类、模块、配置", [
        d("类、模块与装饰器边界", ["14"], { priority: "核心" }),
        d("tsconfig 与构建集成", ["14", "07"], { priority: "核心" }),
        d("声明文件与第三方类型", ["14"], { priority: "进阶" }),
      ]),
      s("react", "React 类型", "组件、Hooks、事件", [
        d("React/RN 组件类型", ["14", "05"], { priority: "核心" }),
        d("泛型组件与 Hooks 类型", ["14", "05"], { priority: "进阶" }),
      ]),
      s("quality", "质量", "测试与迁移", [
        d("类型测试、lint 与迁移", ["14", "16"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "react",
    name: "React",
    category: "skill",
    audience: "框架专项",
    description: "组件、Hooks、状态、路由、数据请求、性能、测试与 SSR。",
    officialUrl: ROADMAP_OFFICIAL.react,
    stages: [
      s("basics", "基础", "JSX、组件、Props/State", [
        d("JSX 与组件模型", ["05"], { priority: "核心" }),
        d("Props、State 与不可变更新", ["05"], { priority: "核心" }),
      ]),
      s("hooks", "Hooks", "状态、副作用、引用", [
        d("useState/useReducer", ["05"], { priority: "核心" }),
        d("useEffect 与依赖数组", ["05"], { priority: "核心" }),
        d("useRef、useMemo/useCallback", ["05"], { priority: "核心" }),
        d("Context 与状态共享", ["05"], { priority: "进阶" }),
      ]),
      s("app", "应用", "表单、路由、数据", [
        d("受控表单与校验", ["05"], { priority: "核心" }),
        d("路由与页面组织", ["05"], { priority: "核心" }),
        d("数据请求、缓存与错误态", ["05", "18"], { priority: "核心" }),
      ]),
      s("advanced", "进阶", "性能、模式、SSR", [
        d("重渲染、memo 与并发渲染", ["05"], { priority: "进阶" }),
        d("组件模式与状态提升", ["05", "19"], { priority: "进阶" }),
        d("SSR/SSG 与 Next.js 边界", ["19"], { priority: "进阶" }),
      ]),
      s("quality", "质量", "测试与调试", [
        d("React 测试与调试", ["16", "12"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "java",
    name: "Java",
    category: "skill",
    audience: "语言专项",
    description: "Java 语法、集合、泛型、异常、并发、JVM、Spring 与项目实践。",
    officialUrl: ROADMAP_OFFICIAL.java,
    stages: [
      s("language", "语言", "语法、对象、集合、泛型", [
        t("Java 语法与面向对象", ["类型", "对象", "接口", "继承"], { courseIds: ["backend-java"], external: OFFICIAL.devJava, priority: "核心" }),
        t("集合、泛型与异常", ["List/Map/Set", "泛型", "异常边界", "Stream"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("concurrency", "并发与 JVM", "线程、锁、内存、GC", [
        t("线程、线程池与锁", ["线程池", "synchronized", "CAS", "死锁"], { courseIds: ["backend-java"], priority: "核心" }),
        t("JVM、内存与 GC", ["堆/栈", "GC", "类加载", "排查"], { courseIds: ["backend-java"], priority: "核心" }),
      ]),
      s("framework", "框架", "Spring、ORM、构建", [
        t("Maven/Gradle 与工程结构", ["依赖", "多模块", "profile", "打包"], { courseIds: ["backend-java"], priority: "核心" }),
        t("Spring Boot 与 MVC", ["IoC", "依赖注入", "Controller", "校验"], { courseIds: ["backend-java"], external: OFFICIAL.spring, priority: "核心" }),
        t("MyBatis/JPA 与事务", ["映射", "N+1", "事务边界", "分页"], { courseIds: ["backend-java", "database-mysql"], priority: "核心" }),
      ]),
      s("data", "数据", "SQL、索引、Redis", [
        t("SQL、索引与事务", ["JOIN", "联合索引", "隔离级别", "锁"], { courseIds: ["database-mysql"], external: OFFICIAL.mysql, priority: "核心" }),
        t("Redis 与缓存", ["数据结构", "过期", "穿透", "一致性"], { courseIds: ["backend-java"], external: OFFICIAL.redis, priority: "进阶" }),
      ]),
      s("quality", "质量与交付", "测试、容器、监控", [
        t("测试与质量", ["单元测试", "集成测试", "契约"], { courseIds: ["backend-java"], priority: "核心" }),
        t("Docker、CI 与监控", ["镜像", "流水线", "日志", "指标"], { courseIds: ["backend-java"], external: OFFICIAL.docker, priority: "核心" }),
      ]),
    ],
  },
  {
    id: "golang",
    name: "Go",
    category: "skill",
    audience: "语言专项",
    description: "Go 类型、接口、goroutine/channel、context、HTTP、数据库、测试与部署。",
    officialUrl: "https://roadmap.sh/golang",
    stages: [
      s("basics", "语言基础", "类型、接口、错误", [
        t("Go 工具链与类型系统", ["go mod", "类型", "结构体", "接口"], { external: [{ label: "Go 官方文档", url: "https://go.dev/doc/" }], priority: "核心" }),
        t("错误处理与包组织", ["error", "panic/recover", "package", "依赖"], { external: [{ label: "Go 官方文档", url: "https://go.dev/doc/" }], priority: "核心" }),
      ]),
      s("concurrency", "并发", "goroutine、channel、context", [
        t("Goroutine 与 Channel", ["goroutine", "channel", "select", "同步"], { priority: "核心" }),
        t("Context、超时与取消", ["context", "timeout", "cancel", "泄漏"], { priority: "核心" }),
      ]),
      s("web", "Web 与数据", "HTTP、数据库、缓存", [
        t("HTTP 服务与中间件", ["net/http", "路由", "中间件", "错误"], { priority: "核心" }),
        t("SQL、事务与 Redis", ["database/sql", "事务", "连接池", "缓存"], { priority: "核心" }),
      ]),
      s("quality", "质量与部署", "测试、性能、发布", [
        t("测试、基准与竞态检测", ["testing", "benchmark", "race", "mock"], { priority: "核心" }),
        t("性能分析、Docker 与部署", ["pprof", "内存", "镜像", "发布"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "python",
    name: "Python",
    category: "skill",
    audience: "语言专项 / 数据与 AI 基础",
    description: "Python 类型、函数、模块、异步、Web、数据库、测试与部署。",
    officialUrl: "https://roadmap.sh/python",
    stages: [
      s("basics", "语言基础", "类型、函数、模块", [
        t("类型、容器与函数", ["list/dict", "类型注解", "函数", "推导式"], { external: [{ label: "Python 文档", url: "https://docs.python.org/3/" }], priority: "核心" }),
        t("模块、包与虚拟环境", ["import", "package", "venv", "依赖"], { priority: "核心" }),
      ]),
      s("advanced", "进阶", "OOP、异步、错误", [
        t("面向对象与异常", ["class", "继承", "异常", "上下文管理器"], { priority: "核心" }),
        t("异步与并发", ["asyncio", "线程/进程", "锁", "超时"], { priority: "进阶" }),
      ]),
      s("web", "Web 与数据", "API、数据库、缓存", [
        t("HTTP、FastAPI 与校验", ["路由", "Pydantic", "鉴权", "错误"], { priority: "核心" }),
        t("SQL、ORM 与 Redis", ["SQLAlchemy", "事务", "索引", "缓存"], { priority: "核心" }),
      ]),
      s("quality", "质量与交付", "测试、打包、部署", [
        t("测试与质量", ["pytest", "mock", "覆盖率", "类型检查"], { priority: "核心" }),
        t("打包、Docker 与部署", ["wheel", "镜像", "环境", "发布"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "api-design",
    name: "API 设计",
    category: "skill",
    audience: "前后端协作 / 后端面试",
    description: "资源建模、HTTP 语义、版本、分页、错误、鉴权、幂等、OpenAPI 与测试。",
    officialUrl: "https://roadmap.sh/api-design",
    stages: [
      s("basics", "基础", "HTTP 与资源", [
        t("HTTP 方法与状态码", ["GET/POST", "2xx/4xx/5xx", "幂等", "缓存头"], { external: OFFICIAL.mdn, priority: "核心" }),
        t("资源建模与命名", ["资源", "路径", "关联", "批量"], { priority: "核心" }),
      ]),
      s("contract", "契约", "版本、分页、错误", [
        t("版本、分页与过滤", ["版本", "游标", "limit/offset", "排序"], { priority: "核心" }),
        t("错误结构与幂等", ["error code", "request-id", "幂等键", "重试"], { priority: "核心" }),
      ]),
      s("security", "安全", "鉴权、限流、权限", [
        t("认证、授权与权限模型", ["JWT/OAuth", "RBAC", "资源权限", "401/403"], { priority: "核心" }),
        t("限流、审计与安全", ["限流", "审计", "输入校验", "敏感字段"], { priority: "进阶" }),
      ]),
      s("quality", "质量", "文档、契约、测试", [
        t("OpenAPI 与契约测试", ["OpenAPI", "schema", "mock server", "兼容"], { priority: "核心" }),
        t("可观测性与演进", ["日志", "指标", "弃用", "灰度"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "nodejs",
    name: "Node.js",
    category: "skill",
    audience: "服务端 JS 专项",
    description: "运行时、事件循环、HTTP、Express/Nest、鉴权、数据库、测试与部署。",
    officialUrl: ROADMAP_OFFICIAL.nodejs,
    stages: [
      s("runtime", "运行时", "事件循环、模块、包管理", [
        d("Node.js 运行时与事件循环", ["18"], { priority: "核心" }),
        d("模块、npm 与包管理", ["18", "07"], { priority: "核心" }),
        d("fs、path、Buffer 与 Stream", ["18"], { priority: "核心" }),
      ]),
      s("http", "HTTP 与框架", "REST、Express、Nest", [
        d("HTTP、REST 与 Express", ["18"], { priority: "核心" }),
        d("NestJS、校验与错误处理", ["18"], { priority: "进阶" }),
        d("鉴权、Session/JWT 与权限", ["18"], { priority: "核心" }),
      ]),
      s("data", "数据与缓存", "SQL、ORM、Redis", [
        d("数据库、ORM 与事务", ["18"], { priority: "核心" }),
        d("Redis 与缓存策略", ["18"], { priority: "进阶" }),
      ]),
      s("production", "生产", "测试、日志、部署", [
        d("测试、日志与错误监控", ["18", "16"], { priority: "核心" }),
        d("Docker、环境变量与部署", ["18"], { priority: "核心" }),
      ]),
      s("async", "异步与队列", "任务、重试、幂等", [
        d("队列、重试与幂等", ["18"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "sql",
    name: "SQL / MySQL",
    category: "skill",
    audience: "数据库专项",
    description: "建模、查询、JOIN、聚合、索引、执行计划、事务、复制与优化。",
    officialUrl: ROADMAP_OFFICIAL.sql,
    stages: [
      s("query", "查询", "SELECT、过滤、排序", [
        t("SELECT、WHERE 与排序", ["投影", "过滤", "NULL", "ORDER BY"], { courseIds: ["database-mysql"], external: OFFICIAL.mysql, priority: "核心" }),
        t("JOIN 与集合运算", ["INNER/LEFT", "自连接", "UNION", "笛卡尔积"], { courseIds: ["database-mysql"], external: OFFICIAL.mysql, priority: "核心" }),
        t("聚合、分组与窗口函数", ["GROUP BY", "HAVING", "窗口", "排名"], { courseIds: ["database-mysql"], priority: "核心" }),
        t("子查询与 CTE", ["IN/EXISTS", "相关子查询", "WITH", "递归"], { courseIds: ["database-mysql"], priority: "进阶" }),
      ]),
      s("design", "建模", "表、约束与范式", [
        t("表设计、主键与外键", ["范式", "主键", "外键", "约束"], { courseIds: ["database-mysql"], priority: "核心" }),
        t("索引与最左前缀", ["B+Tree", "联合索引", "覆盖索引", "选择性"], { courseIds: ["database-mysql"], priority: "核心" }),
      ]),
      s("performance", "性能", "EXPLAIN 与优化", [
        t("EXPLAIN 与慢查询", ["执行计划", "type/key/rows", "慢查询", "回表"], { courseIds: ["database-mysql"], priority: "核心" }),
        t("查询重写与分页优化", ["深分页", "覆盖索引", "延迟关联", "批量"], { courseIds: ["database-mysql"], priority: "进阶" }),
      ]),
      s("transaction", "事务", "ACID、隔离与锁", [
        t("事务、隔离级别与 MVCC", ["ACID", "隔离级别", "MVCC", "幻读"], { courseIds: ["database-mysql"], priority: "核心" }),
        t("锁、死锁与并发控制", ["行锁", "间隙锁", "死锁", "重试"], { courseIds: ["database-mysql"], priority: "进阶" }),
      ]),
      s("ops", "运行", "复制、备份与高可用", [
        t("复制、备份与恢复", ["主从", "延迟", "备份", "恢复演练"], { courseIds: ["database-mysql"], external: OFFICIAL.mysql, priority: "进阶" }),
        t("分库分表与容量", ["拆分键", "路由", "扩容", "一致性"], { courseIds: ["database-mysql"], priority: "加分" }),
      ]),
    ],
  },
  {
    id: "git",
    name: "Git / GitHub",
    category: "skill",
    audience: "版本控制专项",
    description: "提交、分支、合并、变基、远程协作、冲突、回滚和 CI。",
    officialUrl: ROADMAP_OFFICIAL.git,
    stages: [
      s("basics", "基础", "仓库、提交、历史", [
        d("仓库、暂存区与提交", ["07"], { priority: "核心" }),
        t("历史、diff 与撤销", ["log", "diff", "restore", "reset", "reflog"], { external: OFFICIAL.git, priority: "核心" }),
      ]),
      s("branch", "分支", "并行与合并", [
        t("分支、合并与快进", ["branch", "merge", "fast-forward", "策略"], { external: OFFICIAL.git, priority: "核心" }),
        t("Rebase、Cherry-pick 与历史整理", ["rebase", "cherry-pick", "squash", "交互式"], { external: OFFICIAL.git, priority: "进阶" }),
        t("冲突、回滚与恢复", ["conflict", "revert", "reset", "stash"], { external: OFFICIAL.git, priority: "核心" }),
      ]),
      s("remote", "协作", "远程、PR、Review", [
        t("远程仓库与同步", ["remote", "fetch", "pull", "push"], { external: OFFICIAL.git, priority: "核心" }),
        t("Issue、PR 与代码评审", ["PR", "review", "squash", "保护分支"], { priority: "核心" }),
      ]),
      s("automation", "自动化", "Hooks 与 CI", [
        t("Hooks、提交规范与自动化", ["pre-commit", "lint-staged", "commitlint"], { priority: "进阶" }),
        t("GitHub Actions 与发布", ["workflow", "matrix", "artifact", "release"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "computer-science",
    name: "计算机基础",
    category: "skill",
    audience: "基础专项",
    description: "数据结构、算法、操作系统、网络、数据库、安全与设计模式。",
    officialUrl: ROADMAP_OFFICIAL.computerScience,
    stages: [
      s("data-structure", "数据结构", "数组、链表、树、哈希", [
        d("数组、链表、栈与队列", ["11"], { priority: "核心" }),
        d("哈希表、树与堆", ["11"], { priority: "核心" }),
      ]),
      s("algorithm", "算法", "复杂度、排序、搜索、递归", [
        d("复杂度、排序与二分", ["11"], { priority: "核心" }),
        d("递归、回溯、BFS/DFS 与 DP", ["11"], { priority: "核心" }),
      ]),
      s("os", "操作系统", "进程、线程、内存", [
        d("进程、线程、锁与死锁", ["11"], { priority: "核心" }),
        d("虚拟内存、栈/堆与文件系统", ["11"], { priority: "核心" }),
      ]),
      s("network", "网络", "TCP/IP、HTTP、DNS", [
        d("TCP/IP、HTTP 与 DNS", ["11"], { priority: "核心" }),
        d("HTTPS、缓存与网络排查", ["11", "01"], { priority: "进阶" }),
      ]),
      s("database", "数据库", "索引、事务、隔离", [
        d("索引、事务与隔离级别", ["11"], { priority: "核心" }),
      ]),
      s("security", "安全与设计", "Web 安全、模式", [
        d("XSS/CSRF/SQL 注入与防御", ["20", "11"], { priority: "核心" }),
        t("常见设计模式与取舍", ["单例", "工厂", "策略", "观察者"], { external: [{ label: "roadmap.sh Computer Science", url: ROADMAP_OFFICIAL.computerScience }], priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "system-design",
    name: "系统设计",
    category: "skill",
    audience: "中高级 / 面试",
    description: "需求、容量、API、存储、缓存、异步、一致性、可用性、观测与案例。",
    officialUrl: ROADMAP_OFFICIAL.systemDesign,
    stages: [
      s("foundation", "基础", "需求、容量与 API", [
        t("需求澄清与约束", ["功能/非功能", "规模", "SLO", "成本"], { external: [{ label: "roadmap.sh System Design", url: ROADMAP_OFFICIAL.systemDesign }], priority: "核心" }),
        t("容量估算与 API 设计", ["QPS", "存储", "带宽", "幂等"], { priority: "核心" }),
      ]),
      s("data", "数据", "存储、索引、分片", [
        t("存储选型与数据模型", ["关系/NoSQL", "索引", "分区", "复制"], { priority: "核心" }),
        t("缓存与 CDN", ["缓存模式", "失效", "穿透", "一致性"], { priority: "核心" }),
      ]),
      s("scale", "扩展", "异步、解耦、限流", [
        t("消息队列与异步", ["MQ", "幂等", "重试", "顺序"], { priority: "核心" }),
        t("限流、降级与熔断", ["令牌桶", "降级", "熔断", "隔离"], { priority: "进阶" }),
      ]),
      s("reliability", "可靠性", "一致性、可用性、观测", [
        t("一致性与可用性取舍", ["CAP", "最终一致", "事务", "补偿"], { priority: "进阶" }),
        t("可观测性与故障复盘", ["日志", "指标", "追踪", "复盘"], { priority: "核心" }),
      ]),
      s("cases", "案例", "高频系统设计题", [
        t("短链、Feed、IM 与订单", ["读写路径", "存储", "缓存", "扩展"], { priority: "进阶" }),
        t("秒杀与支付", ["库存", "幂等", "限流", "对账"], { priority: "加分" }),
      ]),
    ],
  },
  {
    id: "testing",
    name: "测试与质量",
    category: "skill",
    audience: "工程能力专项",
    description: "测试策略、单元、集成、组件、E2E、契约、性能与 CI。",
    officialUrl: "https://roadmap.sh/qa",
    stages: [
      s("strategy", "策略", "测试金字塔与风险", [
        d("测试策略与风险分层", ["16"], { priority: "核心" }),
      ]),
      s("automation", "自动化", "单测、组件、E2E", [
        d("单元测试与 mock", ["16"], { priority: "核心" }),
        d("组件测试与交互", ["16"], { priority: "核心" }),
        d("E2E 与稳定性", ["16"], { priority: "核心" }),
      ]),
      s("advanced", "进阶", "契约、性能、可观测", [
        t("契约测试与 API 测试", ["schema", "mock server", "兼容"], { priority: "进阶" }),
        t("性能测试与压测", ["基准", "并发", "P95", "瓶颈"], { priority: "进阶" }),
      ]),
      s("pipeline", "流水线", "CI 与质量门禁", [
        t("CI、覆盖率与质量门禁", ["pipeline", "coverage", "flake", "报告"], { priority: "核心" }),
      ]),
    ],
  },
  {
    id: "hybrid",
    name: "Hybrid / JSBridge",
    category: "skill",
    audience: "混合 App 专项",
    description: "WebView 生命周期、JSBridge、离线包、鉴权安全、性能与调试。",
    officialUrl: "https://roadmap.sh/frontend",
    stages: [
      s("webview", "WebView", "生命周期与容器", [
        d("WebView 生命周期与 H5 容器", ["15"], { priority: "核心" }),
        t("加载、缓存与离线包", ["离线包", "预加载", "缓存", "更新"], { priority: "核心" }),
      ]),
      s("bridge", "通信", "JSBridge 与原生能力", [
        d("JSBridge 设计", ["15"], { priority: "核心" }),
        t("鉴权、白名单与安全", ["URL 白名单", "Token", "注入", "降级"], { priority: "核心" }),
      ]),
      s("quality", "质量", "性能与调试", [
        d("H5 性能与调试", ["15", "20"], { priority: "核心" }),
        d("调试、监控与降级", ["12", "20"], { priority: "进阶" }),
      ]),
    ],
  },
  {
    id: "devops",
    name: "DevOps",
    category: "skill",
    audience: "交付与运维专项",
    description: "Linux、网络、Docker、Kubernetes、CI/CD、云、IaC、观测与安全。",
    officialUrl: ROADMAP_OFFICIAL.devops,
    stages: [
      s("os", "系统与网络", "Linux、Shell、网络", [
        t("Linux、权限与进程", ["文件系统", "权限", "systemd", "日志"], { priority: "核心" }),
        t("Shell 与网络基础", ["bash", "管道", "TCP/IP", "DNS"], { priority: "核心" }),
      ]),
      s("container", "容器", "Docker 与编排", [
        t("Docker 与 Compose", ["Dockerfile", "volume", "network", "compose"], { external: OFFICIAL.docker, priority: "核心" }),
        t("Kubernetes 基础", ["Pod", "Deployment", "Service", "Ingress"], { external: OFFICIAL.k8s, priority: "进阶" }),
      ]),
      s("pipeline", "交付", "CI/CD 与 IaC", [
        t("CI/CD 流水线", ["build", "test", "artifact", "deploy"], { priority: "核心" }),
        t("Terraform / IaC", ["state", "plan/apply", "模块", "环境"], { priority: "进阶" }),
      ]),
      s("ops", "运行", "云、观测与安全", [
        t("云服务与网络", ["VM", "对象存储", "VPC", "负载均衡"], { priority: "核心" }),
        t("日志、指标、追踪与告警", ["logs", "metrics", "trace", "SLO"], { priority: "核心" }),
        t("DevSecOps 与供应链", ["镜像扫描", "Secret", "权限", "依赖"], { priority: "进阶" }),
      ]),
    ],
  },
];

const CURATED_BY_ID = new Map(CURATED_ROADMAPS.map((roadmap) => [roadmap.id, roadmap]));
const CATALOG_ALIASES: Record<string, string> = {
  "git-github": "git",
  qa: "testing",
};

function categoryForGroup(group: string): RoadmapCategory {
  if (group === "Absolute Beginners") return "beginner";
  if (group === "Role Based Roadmaps") return "career";
  return "skill";
}

function primaryGroup(slug: string): string {
  return DIRECTORY_GROUP.get(slug) ?? "Skill Based Roadmaps";
}

function officialNodes(slug: string): string[] {
  return OFFICIAL_NODE_MAP[slug]?.nodes ?? [];
}

function generatedStages(slug: string, officialUrl: string, topics: string[]): RoadmapStage[] {
  const stageMeta = [
    { id: "map", title: "基础与路线地图", subtitle: "先知道这条路线包含什么" },
    { id: "core", title: "核心能力", subtitle: "必须掌握的高频主题" },
    { id: "advanced", title: "进阶专题", subtitle: "拉开差距的专题与取舍" },
    { id: "production", title: "工程与扩展", subtitle: "把知识放进真实项目" },
  ];
  if (topics.length === 0) {
    return [{
      id: "official",
      title: "官方完整路线",
      subtitle: "打开官方图查看最新节点",
      nodes: [{ title: "查看官方完整路线", external: [{ label: "官方路线", url: officialUrl }], priority: "核心" }],
    }];
  }
  const seen = new Set<string>();
  const size = Math.ceil(topics.length / stageMeta.length);
  return stageMeta.map((stage, index) => {
    const start = index * size;
    const end = index === stageMeta.length - 1 ? topics.length : start + size;
    const nodes = topics
      .slice(start, end)
      .filter((title) => {
        const key = title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 14)
      .map((title) => ({
        title,
        description: "官方路线主题。打开官方完整图查看最新资料与前后关系。",
        priority: index < 2 ? "核心" as const : "进阶" as const,
        external: [{ label: "官方路线", url: officialUrl }],
      }));
    return {
      id: `${slug}-${stage.id}`,
      title: stage.title,
      subtitle: stage.subtitle,
      nodes,
    };
  }).filter((stage) => stage.nodes.length > 0);
}

const OFFICIAL_ROADMAPS: Roadmap[] = ROADMAP_CATALOG.routes.map((route) => {
  const curated = CURATED_BY_ID.get(CATALOG_ALIASES[route.slug] ?? route.slug);
  const officialUrl = `https://roadmap.sh/${route.slug}`;
  const topics = officialNodes(route.slug);
  const group = primaryGroup(route.slug);
  const categoryTags = route.categories.map((id) => CATEGORY_ZH[id]).filter(Boolean);
  const description = categoryTags.length > 0
    ? `roadmap.sh 官方路线，收录 ${topics.length} 个主题节点，覆盖 ${categoryTags.slice(0, 3).join(" / ")}。平台提供完整节点清单、学习计划与进度记录。`
    : `roadmap.sh 官方路线，收录 ${topics.length} 个主题节点。平台提供完整节点清单、学习计划与进度记录。`;
  if (curated) {
    return {
      ...curated,
      id: route.slug,
      name: route.title,
      nameZh: ROADMAP_TITLE_ZH[route.slug] ?? (curated.name !== route.title ? curated.name : undefined),
      category: categoryForGroup(group),
      officialUrl,
      curated: true,
      groupLabel: group,
      catalogCategories: route.categories,
      officialTopics: topics,
    };
  }
  return {
    id: route.slug,
    name: route.title,
    nameZh: ROADMAP_TITLE_ZH[route.slug],
    category: categoryForGroup(group),
    audience: `官方路线 · ${topics.length} 个主题节点`,
    description,
    officialUrl,
    stages: generatedStages(route.slug, officialUrl, topics),
    curated: false,
    groupLabel: group,
    catalogCategories: route.categories,
    officialTopics: topics,
  };
});

const DIRECTORY_CURATED_IDS = new Set(
  ROADMAP_CATALOG.routes
    .map((route) => CATALOG_ALIASES[route.slug] ?? route.slug)
    .filter((id) => CURATED_BY_ID.has(id)),
);
const EXTRA_ROADMAPS: Roadmap[] = CURATED_ROADMAPS
  .filter((roadmap) => !DIRECTORY_CURATED_IDS.has(roadmap.id))
  .map((roadmap) => ({
    ...roadmap,
    curated: true,
    groupLabel: "平台精编补充",
    catalogCategories: [],
    officialTopics: officialNodes(roadmap.id),
  }));

export const ROADMAPS: Roadmap[] = [...OFFICIAL_ROADMAPS, ...EXTRA_ROADMAPS];

export const ROADMAP_MAP = new Map<string, Roadmap>();
for (const roadmap of ROADMAPS) ROADMAP_MAP.set(roadmap.id, roadmap);
for (const [catalogSlug, curatedId] of Object.entries(CATALOG_ALIASES)) {
  const roadmap = ROADMAP_MAP.get(catalogSlug);
  if (roadmap) ROADMAP_MAP.set(curatedId, roadmap);
}

export const ROADMAP_PLAN_GROUPS = [...GROUP_ORDER, "平台精编补充"]
  .map((group) => ({
    id: group,
    label: PLAN_GROUP_LABELS[group] ?? group,
    routes: ROADMAPS.filter((roadmap) => roadmap.groupLabel === group),
  }))
  .filter((group) => group.routes.length > 0);

export function roadmapCatalogCategory(roadmap: Roadmap) {
  const id = roadmap.catalogCategories[0] ?? "all";
  return ROADMAP_CATALOG_CATEGORIES.find((category) => category.id === id) ?? ROADMAP_CATALOG_CATEGORIES[0];
}

export function roadmapForRole(role: RoleId): string {
  if (role === "rn") return "react-native";
  if (role === "mini") return "mini-program";
  if (role === "flutter") return "flutter";
  if (role === "web") return "frontend";
  return "react-native";
}

export function roadmapStats(roadmap: Roadmap, completedDocs: Set<string>): {
  docs: number;
  completed: number;
  nodes: number;
  stages: number;
  officialTopics: number;
} {
  const docs = new Set<string>();
  let nodes = 0;
  for (const stage of roadmap.stages) {
    for (const node of stage.nodes) {
      nodes += 1;
      for (const doc of node.docs ?? []) docs.add(doc);
    }
  }
  const completed = [...docs].filter((doc) => completedDocs.has(doc)).length;
  return {
    docs: docs.size,
    completed,
    nodes,
    stages: roadmap.stages.length,
    officialTopics: roadmap.officialTopics.length,
  };
}
