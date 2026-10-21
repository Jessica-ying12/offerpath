import GithubSlugger from "github-slugger";
import type { DocHeading, DocMeta, QaBank, QaItem, QuizQuestion, RoleId } from "./types";
import mobile from "../data/curriculum/mobile.json";
import fullstack from "../data/curriculum/fullstack.json";
import backend from "../data/curriculum/backend-java.json";
import database from "../data/curriculum/database-mysql.json";
import csAi from "../data/curriculum/cs-ai-foundations.json";

const docFiles = import.meta.glob("../../content/docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const qaFiles = import.meta.glob("../../content/qa/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type MetaInput = Omit<
  DocMeta,
  "markdown" | "headings" | "minutes" | "chars" | "qaId" | "number"
> & { file: string; qaFile: string | null; qaFileAlt?: string | null };

const META: MetaInput[] = [
  {
    id: "01",
    file: "01-HTML基础与浏览器渲染.md",
    qaFile: "01-HTML-面试问答.md",
    title: "HTML 基础与浏览器渲染",
    shortTitle: "HTML",
    description: "语义化、表单、DOM、浏览器渲染流程与移动端页面基础。",
    layer: "L1 语言基础",
    category: "基础",
    week: "第 1 周",
    priority: "P0",
    tags: ["HTML", "语义化", "表单", "渲染", "移动端"],
    roles: ["mobile", "mini", "web"],
  },
  {
    id: "02",
    file: "02-CSS布局与移动端适配.md",
    qaFile: "02-CSS-面试问答.md",
    title: "CSS 布局与移动端适配",
    shortTitle: "CSS",
    description: "盒模型、Flex/Grid、定位、BFC、1px、安全区与动画性能。",
    layer: "L1 语言基础",
    category: "基础",
    week: "第 1-2 周",
    priority: "P0",
    tags: ["CSS", "Flex", "Grid", "BFC", "适配"],
    roles: ["mobile", "mini", "web"],
  },
  {
    id: "03",
    file: "03-JavaScript核心与底层原理.md",
    qaFile: "03-JavaScript-面试问答.md",
    title: "JavaScript 核心与底层原理",
    shortTitle: "JavaScript",
    description: "作用域、闭包、this、原型、异步、事件循环与手写实现。",
    layer: "L1 语言基础",
    category: "基础",
    week: "第 3-4 周",
    priority: "P0",
    tags: ["JavaScript", "闭包", "原型", "事件循环", "Promise"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "04",
    file: "04-ES6到ES2024新特性.md",
    qaFile: "04-ES6-面试问答.md",
    title: "ES6 到 ES2024 新特性",
    shortTitle: "ES6+",
    description: "let/const、解构、模块、class、Promise 与新 API 的边界。",
    layer: "L1 语言基础",
    category: "基础",
    week: "第 4-5 周",
    priority: "P0",
    tags: ["ES6", "模块", "Promise", "class", "新 API"],
    roles: ["mobile", "rn", "mini", "web"],
  },
  {
    id: "05",
    file: "05-React与ReactNative.md",
    qaFile: "05-React-面试问答.md",
    qaFileAlt: "06-ReactNative-面试问答.md",
    title: "React 与 React Native",
    shortTitle: "React / RN",
    description: "Hooks、diff/Fiber、组件通信、RN 组件、导航、新架构与性能。",
    layer: "L2 框架与端",
    category: "框架",
    week: "第 5-6 周",
    priority: "P0",
    tags: ["React", "React Native", "Hooks", "Fiber", "FlatList"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "06",
    file: "06-微信小程序开发.md",
    qaFile: "07-微信小程序-面试问答.md",
    title: "微信小程序开发",
    shortTitle: "小程序",
    description: "双线程、生命周期、setData、组件、路由、分包、登录与支付。",
    layer: "L2 框架与端",
    category: "框架",
    week: "第 6 周",
    priority: "P0",
    tags: ["微信小程序", "双线程", "setData", "分包", "登录"],
    roles: ["mobile", "mini"],
  },
  {
    id: "07",
    file: "07-前端工程化.md",
    qaFile: "08-前端工程化-面试问答.md",
    title: "前端工程化",
    shortTitle: "工程化",
    description: "npm、Webpack、Babel、Git、ESLint、请求封装与性能。",
    layer: "L3 工程化",
    category: "工程化",
    week: "第 7 周",
    priority: "P0",
    tags: ["Webpack", "Vite", "Babel", "Git", "ESLint"],
    roles: ["mobile", "rn", "mini", "web"],
  },
  {
    id: "08",
    file: "08-实战代码逐行注释.md",
    qaFile: "09-项目实战-面试问答.md",
    title: "实战项目逐行拆解",
    shortTitle: "项目实战",
    description: "从零写项目、完整代码、报错字典、自测清单与面试讲法。",
    layer: "面试实战",
    category: "实战",
    week: "第 3-8 周",
    priority: "P0",
    tags: ["项目", "代码", "报错", "自测", "STAR"],
    roles: ["mobile", "rn", "mini", "web"],
  },
  {
    id: "09",
    file: "09-面试题库与回答话术.md",
    qaFile: null,
    title: "面试题库与回答话术",
    shortTitle: "面试话术",
    description: "题库、追问、STAR、反问、表达结构与冲刺计划。",
    layer: "面试实战",
    category: "面试",
    week: "第 8 周",
    priority: "P0",
    tags: ["面试", "STAR", "追问", "反问", "表达"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "10",
    file: "10-Flutter开发.md",
    qaFile: "10-Flutter-面试问答.md",
    title: "Flutter 开发",
    shortTitle: "Flutter",
    description: "Dart、三棵树、布局、状态管理、平台通道、性能与打包。",
    layer: "L2 框架与端",
    category: "框架",
    week: "第 9 周",
    priority: "P2",
    tags: ["Flutter", "Dart", "Widget", "Platform Channel"],
    roles: ["mobile", "flutter"],
  },
  {
    id: "11",
    file: "11-计算机基础.md",
    qaFile: "11-计算机基础-面试问答.md",
    title: "计算机基础",
    shortTitle: "计算机基础",
    description: "数据结构、算法、操作系统、网络、数据库、安全与手写题。",
    layer: "L0 计算机基础",
    category: "基础",
    week: "第 10 周",
    priority: "P1",
    tags: ["数据结构", "算法", "网络", "操作系统", "数据库"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "12",
    file: "12-调试与找错实战.md",
    qaFile: "12-调试找错-面试问答.md",
    title: "调试与找错实战",
    shortTitle: "调试找错",
    description: "34 道找错题、调试八步法、读报错、线上排查与错题本。",
    layer: "L4 底层与生产",
    category: "实战",
    week: "每天 1 题",
    priority: "P0",
    tags: ["调试", "报错", "排查", "监控", "错题"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "13",
    file: "13-代码题与异步专项.md",
    qaFile: "13-代码题-面试问答.md",
    title: "代码题与异步专项",
    shortTitle: "代码题",
    description: "异步、数据处理、React/RN/小程序代码题与限时练习。",
    layer: "L4 底层与生产",
    category: "实战",
    week: "每天 1 题",
    priority: "P0",
    tags: ["异步", "手写", "Promise", "防抖", "数据处理"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "14",
    file: "14-TypeScript.md",
    qaFile: "14-TypeScript-面试问答.md",
    title: "TypeScript",
    shortTitle: "TypeScript",
    description: "类型、泛型、接口、React/RN 类型与 tsconfig 工程配置。",
    layer: "L1 语言基础",
    category: "基础",
    week: "第 3-5 周",
    priority: "P0",
    tags: ["TypeScript", "泛型", "类型", "React", "tsconfig"],
    roles: ["mobile", "rn", "mini", "web"],
  },
  {
    id: "15",
    file: "15-Hybrid与JSBridge.md",
    qaFile: "15-Hybrid与JSBridge-面试问答.md",
    title: "Hybrid 与 JSBridge",
    shortTitle: "Hybrid",
    description: "WebView 生命周期、JSBridge、离线包、H5 与原生通信。",
    layer: "L2 框架与端",
    category: "框架",
    week: "第 6 周",
    priority: "P1",
    tags: ["Hybrid", "WebView", "JSBridge", "离线包", "H5"],
    roles: ["mobile", "rn", "web"],
  },
  {
    id: "16",
    file: "16-前端测试.md",
    qaFile: "16-前端测试-面试问答.md",
    title: "前端测试",
    shortTitle: "前端测试",
    description: "Jest、RTL、RN Testing Library、小程序自动化与 E2E。",
    layer: "L3 工程化",
    category: "工程化",
    week: "第 7 周",
    priority: "P1",
    tags: ["Jest", "RTL", "E2E", "单测", "自动化"],
    roles: ["mobile", "rn", "mini", "web", "flutter"],
  },
  {
    id: "17",
    file: "17-原生基础-Android-iOS.md",
    qaFile: "17-原生基础-面试问答.md",
    title: "原生基础（Android / iOS）",
    shortTitle: "原生基础",
    description: "生命周期、权限、打包签名、崩溃排查与跨端原生模块。",
    layer: "L2 框架与端",
    category: "架构与生产",
    week: "第 8 周",
    priority: "P1",
    tags: ["Android", "iOS", "生命周期", "打包", "原生模块"],
    roles: ["mobile", "rn", "flutter"],
  },
  {
    id: "18",
    file: "18-Nodejs后端.md",
    qaFile: "18-Nodejs后端-面试问答.md",
    title: "Node.js 后端",
    shortTitle: "Node.js",
    description: "Express/Nest、REST、鉴权、数据库与部署。",
    layer: "L3 工程化",
    category: "工程化",
    week: "第 8 周",
    priority: "P1",
    tags: ["Node.js", "Express", "Nest", "REST", "鉴权"],
    roles: ["web", "rn", "mobile"],
  },
  {
    id: "19",
    file: "19-前端系统设计.md",
    qaFile: "19-前端系统设计-面试问答.md",
    title: "前端系统设计",
    shortTitle: "系统设计",
    description: "组件库、Monorepo、微前端、SSR/BFF、状态管理与架构题。",
    layer: "L4 底层与生产",
    category: "架构与生产",
    week: "第 8 周",
    priority: "P2",
    tags: ["系统设计", "Monorepo", "微前端", "BFF", "组件库"],
    roles: ["mobile", "rn", "web", "flutter"],
  },
  {
    id: "20",
    file: "20-生产监控与安全.md",
    qaFile: "20-生产监控与安全-面试问答.md",
    title: "生产监控与安全",
    shortTitle: "监控与安全",
    description: "错误/性能监控、埋点、告警、XSS/CSRF/CSP、Token 与依赖安全。",
    layer: "L4 底层与生产",
    category: "架构与生产",
    week: "第 8 周",
    priority: "P2",
    tags: ["监控", "安全", "XSS", "CSRF", "CSP"],
    roles: ["mobile", "rn", "web"],
  },
  {
    id: "21",
    file: "21-小程序进阶.md",
    qaFile: "21-小程序进阶-面试问答.md",
    title: "小程序进阶",
    shortTitle: "小程序进阶",
    description: "云开发、订阅消息、隐私授权、Skyline、CI 与高级性能。",
    layer: "L2 框架与端",
    category: "框架",
    week: "第 9 周",
    priority: "P2",
    tags: ["小程序", "云开发", "Skyline", "隐私", "CI"],
    roles: ["mobile", "mini"],
  },
];

function findFile(files: Record<string, string>, suffix: string): string | null {
  const entry = Object.entries(files).find(([path]) => path.endsWith(`/${suffix}`));
  return entry?.[1] ?? null;
}

export function slugifyHeading(text: string): string {
  return new GithubSlugger().slug(text);
}

export function extractHeadings(markdown: string): DocHeading[] {
  const slugger = new GithubSlugger();
  const headings: DocHeading[] = [];
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(##|###)\s+(.+?)\s*$/);
    if (!match) continue;
    const text = match[2]
      .replace(/[*_`~]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    headings.push({
      depth: match[1].length as 2 | 3,
      text,
      slug: slugger.slug(text),
    });
  }
  return headings;
}

function stripTitle(markdown: string): string {
  return markdown.replace(/^#\s+.+\r?\n/, "").replace(/^\s*\r?\n/, "");
}

function parseQa(docId: string, markdown: string): QaBank {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "面试问答";
  const intro = markdown.match(/^>\s*(.+)$/m)?.[1]?.replace(/^对应知识文档：/, "").trim() ?? "";
  const sections = markdown.split(/^##\s+Q(\d+)\.\s*(.+)$/gm);
  const items: QaItem[] = [];
  for (let index = 1; index < sections.length; index += 3) {
    const number = Number(sections[index]);
    const question = sections[index + 1]?.replace(/\s*？\s*$/, "？").trim() ?? "";
    const body = sections[index + 2] ?? "";
    const direct =
      body.match(/\*\*直接回答[^*]*\*\*\s*\n+([\s\S]*?)(?=\n\*\*追问\s|\n\*\*陷阱|\n---|$)/)?.[1]?.trim() ??
      "";
    const followUps: Array<{ question: string; answer: string }> = [];
    const followRegex =
      /\*\*追问\s*(\d+)：(.+?)\*\*\s*\n+([\s\S]*?)(?=\n\*\*追问\s|\n\*\*陷阱|\n---|$)/g;
    for (const match of body.matchAll(followRegex)) {
      followUps.push({
        question: match[2].replace(/\s*？\s*$/, "？").trim(),
        answer: match[3].trim(),
      });
    }
    const trap =
      body.match(/\*\*陷阱\/加分[^*]*\*\*\s*\n+([\s\S]*?)(?=\n---|$)/)?.[1]?.trim() ?? "";
    if (question) {
      items.push({
        id: `${docId}-q${number}`,
        number,
        question,
        direct: direct || body.trim(),
        followUps,
        trap,
      });
    }
  }
  return { docId, title, intro, items };
}

const QA_BANKS = new Map<string, QaBank>();
for (const meta of META) {
  const files = [meta.qaFile, meta.qaFileAlt].filter((file): file is string => Boolean(file));
  if (files.length === 0) continue;
  const banks = files
    .map((file) => findFile(qaFiles, file))
    .filter((raw): raw is string => Boolean(raw))
    .map((raw) => parseQa(meta.id, raw.replace(/\r\n/g, "\n")));
  if (banks.length === 0) continue;
  const items = banks
    .flatMap((bank) => bank.items)
    .map((item, index) => ({
      ...item,
      id: `${meta.id}-q${index + 1}`,
      number: index + 1,
    }));
  QA_BANKS.set(meta.id, {
    docId: meta.id,
    title: banks.length > 1 ? `${meta.id} · React 与 React Native 面试问答` : banks[0].title,
    intro: banks[0].intro,
    items,
  });
}

export const DOCS: DocMeta[] = META.map((meta) => {
  const raw = findFile(docFiles, meta.file) ?? "";
  const markdown = stripTitle(raw.replace(/\r\n/g, "\n"));
  return {
    ...meta,
    number: meta.id,
    qaId: meta.qaFile ? meta.id : null,
    markdown,
    headings: extractHeadings(markdown),
    chars: markdown.length,
    minutes: Math.max(2, Math.ceil(markdown.length / 450)),
  };
}).sort((a, b) => a.id.localeCompare(b.id));

export const DOC_MAP = new Map(DOCS.map((doc) => [doc.id, doc]));
export const QA_BANKS_LIST = [...QA_BANKS.values()].sort((a, b) =>
  a.docId.localeCompare(b.docId),
);
export const QA_MAP = new Map(QA_BANKS_LIST.map((bank) => [bank.docId, bank]));
export const ALL_QA = QA_BANKS_LIST.flatMap((bank) =>
  bank.items.map((item) => ({ ...item, docId: bank.docId, bankTitle: bank.title })),
);
export const QA_BY_ID = new Map(ALL_QA.map((item) => [item.id, item]));

export const TOTAL_QA = ALL_QA.length;
export const TOTAL_LINES = DOCS.reduce(
  (sum, doc) => sum + doc.markdown.split("\n").length,
  0,
);

export const ROLES: Array<{ id: RoleId; label: string; desc: string }> = [
  { id: "mobile", label: "移动前端（综合）", desc: "React Native + 小程序 + Web 全链路" },
  { id: "rn", label: "React Native", desc: "RN 组件、架构、原生模块与发版" },
  { id: "mini", label: "微信小程序", desc: "双线程、分包、登录支付与进阶能力" },
  { id: "web", label: "Web 前端", desc: "HTML/CSS/JS、工程化、测试与 Node" },
  { id: "flutter", label: "Flutter", desc: "Dart、三棵树、状态管理与原生通道" },
];

type RawTrack = {
  id: string;
  shortName: string;
  chapters: Array<{ id: string; title: string; level: string }>;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    answerIndex: number;
    explanation: string;
    skills: string[];
    level: string;
    chapterId: string;
  }>;
};

const TRACKS = [mobile, fullstack, backend, database, csAi] as unknown as RawTrack[];

export const QUIZ_QUESTIONS: QuizQuestion[] = TRACKS.flatMap((track) =>
  track.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
    skills: question.skills,
    level: question.level,
    chapterId: question.chapterId,
    courseId: track.id,
    courseName: track.shortName,
    chapterTitle:
      track.chapters.find((chapter) => chapter.id === question.chapterId)?.title ?? "",
  })),
);

export const QUIZ_COURSES = TRACKS.map((track) => ({
  id: track.id,
  name: track.shortName,
  count: track.questions.length,
}));

export const QUIZ_LEVELS = [
  { id: "junior", label: "初级" },
  { id: "middle", label: "中级" },
  { id: "senior", label: "高级" },
];

export const PLAN_WEEKS = [
  {
    week: 1,
    title: "HTML + CSS 基础",
    output: "仿写一个移动端静态页",
    docs: ["01", "02"],
    daily: "读 01/02，手写一个三栏布局、居中、卡片页面",
  },
  {
    week: 2,
    title: "CSS 布局 + 移动端适配",
    output: "商品列表 + 底部导航",
    docs: ["02", "01"],
    daily: "适配 390px、1px 边框、安全区，自己制造并修复错位",
  },
  {
    week: 3,
    title: "JS 基础 + DOM",
    output: "原生 JS 待办/列表",
    docs: ["03", "08"],
    daily: "增删改查、本地存储，写一个最小可运行项目",
  },
  {
    week: 4,
    title: "JS 进阶 + 异步",
    output: "搜索 + 请求 + 防抖",
    docs: ["03", "04", "13"],
    daily: "闭包、this、原型、事件循环输出题，手写防抖节流",
  },
  {
    week: 5,
    title: "ES6+ + React 基础",
    output: "React 版待办",
    docs: ["04", "05", "14"],
    daily: "Hooks、key、组件拆分，补 TypeScript 类型",
  },
  {
    week: 6,
    title: "React 进阶 + 小程序",
    output: "React 列表详情 + 小程序列表",
    docs: ["05", "06", "15"],
    daily: "路由、请求、loading/error/empty，理解双线程与 JSBridge",
  },
  {
    week: 7,
    title: "RN + 工程化 + 测试",
    output: "RN 列表 App + 可构建工程",
    docs: ["05", "07", "16"],
    daily: "FlatList、导航、webpack 配置、Jest/RTL 单测",
  },
  {
    week: 8,
    title: "面试冲刺",
    output: "高频题 + 项目讲述 + 模拟面试",
    docs: ["09", "12", "13", "18", "19", "20"],
    daily: "Q&A 自测 20 题、2 个 bug 故事、1 次限时代码题",
  },
  {
    week: 9,
    title: "加分项：Flutter / 小程序进阶",
    output: "Flutter 列表 + 小程序进阶方案",
    docs: ["10", "21", "17"],
    daily: "只学能讲清楚的最小闭环，不做广度堆叠",
  },
  {
    week: 10,
    title: "计算机基础",
    output: "手写题 + 网络/OS/DB 答题卡",
    docs: ["11", "13"],
    daily: "每天 30 分钟：数据结构、网络、索引与事务",
  },
];
