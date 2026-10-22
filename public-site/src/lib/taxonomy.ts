export type DocModuleStage = "基础" | "进阶" | "生产" | "求职";

export type DocModule = {
  id: string;
  title: string;
  stage: DocModuleStage;
  description: string;
  outcome: string;
  docs: string[];
  roadmapIds: string[];
};

export const DOC_MODULES: DocModule[] = [
  {
    id: "cs",
    title: "计算机与底层基础",
    stage: "基础",
    description: "网络、操作系统、数据结构与数据库，解释前端问题的底层原因。",
    outcome: "能解释一次请求从浏览器到服务端再到数据库发生了什么。",
    docs: ["11"],
    roadmapIds: ["computer-science", "frontend-beginner", "backend-beginner"],
  },
  {
    id: "web",
    title: "Web 语言与页面",
    stage: "基础",
    description: "HTML 语义、CSS 布局、JavaScript 核心、ES 新特性与 TypeScript。",
    outcome: "能手写响应式页面，并用语言机制解释常见面试题。",
    docs: ["01", "02", "03", "04", "14"],
    roadmapIds: ["frontend-beginner", "frontend", "javascript", "typescript"],
  },
  {
    id: "framework",
    title: "框架与跨端",
    stage: "进阶",
    description: "React、React Native、小程序、Hybrid、Flutter 与原生基础。",
    outcome: "能选对端侧方案，讲清渲染、通信、状态和性能边界。",
    docs: ["05", "06", "10", "15", "17", "21"],
    roadmapIds: ["react", "react-native", "mini-program", "flutter", "hybrid"],
  },
  {
    id: "engineering",
    title: "工程化与服务端",
    stage: "进阶",
    description: "构建、测试、Node.js 服务端与团队交付流程。",
    outcome: "能搭起可构建、可测试、可部署的前后端协作闭环。",
    docs: ["07", "16", "18"],
    roadmapIds: ["frontend", "backend", "nodejs", "testing", "devops"],
  },
  {
    id: "production",
    title: "生产与架构",
    stage: "生产",
    description: "调试排错、系统设计、监控、安全与线上稳定性。",
    outcome: "能定位线上问题，并为自己的项目做一次架构与稳定性设计。",
    docs: ["12", "19", "20"],
    roadmapIds: ["system-design", "backend", "devops", "frontend"],
  },
  {
    id: "interview",
    title: "项目与面试实战",
    stage: "求职",
    description: "项目逐行拆解、代码题、面试话术与追问。",
    outcome: "能把项目讲成证据，在限时问答和手写题中稳定输出。",
    docs: ["08", "09", "13"],
    roadmapIds: ["frontend", "backend", "react-native", "full-stack"],
  },
];

export const DOC_MODULE_MAP = new Map(DOC_MODULES.map((module) => [module.id, module]));
const DOC_TO_MODULE = new Map(DOC_MODULES.flatMap((module) => module.docs.map((id) => [id, module] as const)));

export function moduleForDoc(docId: string): DocModule | null {
  return DOC_TO_MODULE.get(docId) ?? null;
}

export function docsModuleHref(moduleId: string): string {
  return `/docs?module=${moduleId}`;
}
