export type BankType = "single" | "multiple" | "boolean" | "fill" | "short";

export type BankQuestion = {
  id: string;
  type: BankType;
  stage: "main" | "followup" | "course";
  docId: string | null;
  docTitle: string | null;
  section: string;
  prompt: string;
  modelAnswer?: string;
  explanation: string;
  difficulty: number;
  source: string;
  courseId?: string;
  courseName?: string;
  chapterTitle?: string;
  options?: string[];
  answerIndex?: number;
  answerIndices?: number[];
  answer?: boolean;
  answers?: string[][];
  keyPoints?: string[];
};

export type BankData = {
  generatedAt: string;
  counts: Record<BankType, number>;
  byDoc: Record<string, { total: number; types: Partial<Record<BankType, number>> }>;
  questions: BankQuestion[];
};

export const TYPE_ORDER: BankType[] = ["short", "fill", "boolean", "multiple", "single"];
export const TYPE_LABEL: Record<BankType, string> = {
  short: "简答",
  fill: "填空",
  boolean: "判断",
  multiple: "多选",
  single: "单选",
};
export const TYPE_DESC: Record<BankType, string> = {
  short: "先自己写，再对照关键点和参考答案；适合练表达。",
  fill: "补全关键术语，自动校对答案并展示完整解释。",
  boolean: "判断说法对错，立刻看到错在哪里。",
  multiple: "选出所有正确选项，漏选/多选都会标出。",
  single: "四选一，作答后展示正确项和原因。",
};
export const TYPE_COLOR: Record<BankType, string> = {
  short: "bg-accent/10 text-accent border-accent/20",
  fill: "bg-sky/10 text-sky border-sky/20",
  boolean: "bg-coral/10 text-coral border-coral/20",
  multiple: "bg-lilac/10 text-lilac border-lilac/20",
  single: "bg-lime/20 text-ink border-lime/30",
};

const GLOSSARY = [
  "作用域", "闭包", "原型链", "原型", "事件循环", "微任务", "宏任务", "重排", "重绘",
  "语义化", "盒模型", "BFC", "层叠上下文", "虚拟 DOM", "生命周期", "状态管理", "受控组件",
  "非受控组件", "高阶组件", "防抖", "节流", "深拷贝", "浅拷贝", "继承", "严格模式",
  "暂时性死区", "TDZ", "函数作用域", "块级作用域", "变量提升", "引用类型", "原始类型",
  "事件委托", "冒泡", "捕获", "跨域", "CORS", "缓存", "强缓存", "协商缓存", "首屏",
  "懒加载", "分包", "双线程", "setData", "导航", "路由", "Hooks", "内存泄漏", "垃圾回收",
  "并发", "线程", "进程", "索引", "事务", "隔离级别", "死锁", "TCP", "UDP", "HTTP", "HTTPS",
  "DNS", "CDN", "JWT", "Cookie", "Session", "XSS", "CSRF", "CSP", "SSR", "BFF", "Monorepo",
  "微前端", "组件库", "可访问性", "性能", "监控", "埋点", "CI/CD", "WebView", "JSBridge",
  "离线包", "原生模块", "平台通道", "三棵树", "Widget", "Element", "RenderObject", "FlatList",
  "Fiber", "diff", "合成事件", "批处理", "依赖数组", "useEffect", "useMemo", "useCallback",
  "useState", "useRef", "Context", "Redux", "Zustand", "Riverpod", "GetX", "JSON", "Promise",
  "async", "await", "this", "new", "call", "apply", "bind", "map", "filter", "reduce",
  "flex", "grid", "position", "transform", "animation", "transition", "viewport", "rem", "vw",
  "TypeScript", "泛型", "接口", "类型收窄", "联合类型", "交叉类型", "可选链", "空值合并",
  "插槽", "组件通信", "props", "state", "ref", "key", "memo", "useReducer", "useContext",
  "跨端", "桥接", "Hermes", "JSCore", "Metro", "Expo", "Flutter", "Dart", "Widget 树",
];

const STOP_WORDS = new Set(
  "the and this that with from into when then than for are was were will can not but you your they their have has had use used using one two all any more most such only also may might should must about after before between over under again very just some each other which what where why how".split(
    " ",
  ),
);

export function extractTerms(text: string): string[] {
  const terms = new Set<string>();
  for (const match of text.matchAll(/[A-Za-z][A-Za-z0-9_.$#-]{1,}/g)) {
    const word = match[0].replace(/[.,;:]+$/, "");
    if (word.length > 1 && !STOP_WORDS.has(word.toLowerCase())) terms.add(word);
  }
  for (const phrase of GLOSSARY) {
    if (text.includes(phrase)) terms.add(phrase);
  }
  return [...terms];
}

export type ShortGrade = {
  keyPoints: Array<{ text: string; terms: string[]; hit: boolean; automatic: boolean }>;
  hits: number;
  automatic: number;
  total: number;
  ratio: number;
};

export function gradeShort(question: BankQuestion, answer: string): ShortGrade {
  const normalized = answer.toLowerCase();
  const keyPoints = (question.keyPoints ?? []).map((text) => {
    const terms = extractTerms(text);
    const automatic = terms.length > 0;
    const hit = automatic && terms.some((term) => normalized.includes(term.toLowerCase()));
    return { text, terms, hit, automatic };
  });
  const automatic = keyPoints.filter((point) => point.automatic).length;
  const hits = keyPoints.filter((point) => point.hit).length;
  return {
    keyPoints,
    hits,
    automatic,
    total: keyPoints.length,
    ratio: automatic > 0 ? hits / automatic : 0,
  };
}

export function normalizeFill(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/\s+/g, "")
    .replace(/[。；;，,]$/, "");
}

export function checkFill(question: BankQuestion, answer: string): boolean {
  const normalized = normalizeFill(answer);
  return (question.answers ?? []).some((group) =>
    group.some((candidate) => normalizeFill(candidate) === normalized),
  );
}

export function checkSingle(question: BankQuestion, choice: number): boolean {
  return choice === question.answerIndex;
}

export function checkMultiple(question: BankQuestion, choices: number[]): {
  correct: boolean;
  missed: number[];
  extra: number[];
} {
  const selected = new Set(choices);
  const expected = new Set(question.answerIndices ?? []);
  const missed = [...expected].filter((index) => !selected.has(index));
  const extra = [...selected].filter((index) => !expected.has(index));
  return { correct: missed.length === 0 && extra.length === 0, missed, extra };
}

export async function loadBank(): Promise<BankData> {
  const module = await import("../data/question-bank.json");
  return module.default as unknown as BankData;
}

export function displayQuestionType(question: BankQuestion): string {
  if (question.type === "short" && question.stage === "followup") return "追问";
  return TYPE_LABEL[question.type];
}

export function isObjective(question: BankQuestion): boolean {
  return question.type !== "short";
}
