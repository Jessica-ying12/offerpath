import { DOCS } from "./content";
import type { DocMeta, RoleId } from "./types";

const RULES: Array<{ label: string; keys: string[]; docs: string[] }> = [
  { label: "React Native", keys: ["react native", "react-native", "rn", "expo"], docs: ["05", "14", "15", "17"] },
  { label: "微信小程序", keys: ["小程序", "uni-app", "uniapp", "微信"], docs: ["06", "21"] },
  { label: "TypeScript", keys: ["typescript", " ts ", "ts、", "类型"], docs: ["14"] },
  { label: "Hybrid / JSBridge", keys: ["hybrid", "jsbridge", "webview", "h5", "离线包"], docs: ["15"] },
  { label: "Flutter", keys: ["flutter", "dart"], docs: ["10", "17"] },
  { label: "前端测试", keys: ["jest", "vitest", "单测", "自动化测试", "e2e"], docs: ["16"] },
  { label: "Node.js", keys: ["node", "express", "nestjs", "bff"], docs: ["18"] },
  { label: "性能与监控", keys: ["性能", "监控", "埋点", "告警", "稳定性"], docs: ["20", "12"] },
  { label: "安全", keys: ["安全", "xss", "csrf", "csp", "隐私"], docs: ["20"] },
  { label: "计算机基础", keys: ["算法", "数据结构", "网络", "tcp", "http", "操作系统"], docs: ["11"] },
  { label: "工程化", keys: ["webpack", "vite", "工程化", "构建", "ci/cd", "git"], docs: ["07"] },
  { label: "React", keys: ["react", "hooks", "redux", "状态管理"], docs: ["05"] },
  { label: "小程序进阶", keys: ["skyline", "云开发", "订阅消息"], docs: ["21"] },
  { label: "原生开发", keys: ["android", "ios", "原生", "kotlin", "swift"], docs: ["17"] },
  { label: "系统设计", keys: ["系统设计", "架构", "monorepo", "微前端", "组件库"], docs: ["19"] },
  { label: "混合 App", keys: ["混合 app", "混合app", "hybrid app"], docs: ["15", "05"] },
  { label: "前端基础", keys: ["html", "css", "javascript", "js"], docs: ["01", "02", "03", "04"] },
];

export type JdAnalysis = {
  matched: Array<{ label: string; docs: string[] }>;
  docIds: string[];
  missingCore: DocMeta[];
};

export function analyzeJd(text: string): JdAnalysis {
  const lower = ` ${text.toLowerCase()} `;
  const matched = RULES.filter((rule) => rule.keys.some((key) => lower.includes(key)));
  const docIds = [...new Set(matched.flatMap((rule) => rule.docs))];
  const core = DOCS.filter((doc) => doc.priority === "P0");
  const missingCore = core.filter((doc) => !docIds.includes(doc.id));
  return { matched, docIds, missingCore };
}

export function docsForRole(role: RoleId): DocMeta[] {
  return DOCS.filter((doc) => doc.roles.includes(role));
}

export function prioritizedDocs(role: RoleId, jd: string): DocMeta[] {
  const roleDocs = docsForRole(role);
  const analysis = analyzeJd(jd);
  const matchSet = new Set(analysis.docIds);
  return [...roleDocs].sort((a, b) => {
    const aMatch = matchSet.has(a.id) ? 1 : 0;
    const bMatch = matchSet.has(b.id) ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    const rank = { P0: 0, P1: 1, P2: 2 };
    if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
    return a.id.localeCompare(b.id);
  });
}
