import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Search, X } from "lucide-react";
import { DOCS, ROLES, TOTAL_LINES, TOTAL_QA } from "../lib/content";
import { analyzeJd, docsForRole, prioritizedDocs } from "../lib/jd";
import { useStore } from "../lib/store";
import { DocCard, PageContainer, PageHeader } from "../components/ui";

const LAYER_GROUPS = [
  { id: "L0 计算机基础", title: "L0 · 计算机基础", desc: "网络、操作系统、数据结构与数据库" },
  { id: "L1 语言基础", title: "L1 · 语言基础", desc: "HTML / CSS / JavaScript / TypeScript" },
  { id: "L2 框架与端", title: "L2 · 框架与端", desc: "React / React Native / 小程序 / Hybrid / Flutter" },
  { id: "L3 工程化", title: "L3 · 工程化", desc: "构建、测试、Node 与交付" },
  { id: "L4 底层与生产", title: "L4 · 底层与生产", desc: "调试、代码题、系统设计、监控与安全" },
  { id: "面试实战", title: "面试实战", desc: "项目、表达与追问" },
];

type Status = "all" | "todo" | "reading" | "done";

export function DocsPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [roleOnly, setRoleOnly] = useState(false);
  const role = ROLES.find((item) => item.id === state.role) ?? ROLES[0];
  const analysis = state.jd ? analyzeJd(state.jd) : null;
  const recommendedOrder = useMemo(
    () => prioritizedDocs(state.role, state.jd).map((doc) => doc.id),
    [state.role, state.jd],
  );

  const docs = useMemo(() => {
    const base = roleOnly ? docsForRole(state.role) : DOCS;
    return base.filter((doc) => {
      const progress = state.docs[doc.id];
      if (status === "done" && !progress?.completed) return false;
      if (status === "reading" && (!progress?.percent || progress.completed)) return false;
      if (status === "todo" && progress?.completed) return false;
      if (!query.trim()) return true;
      const haystack = `${doc.id} ${doc.title} ${doc.description} ${doc.tags.join(" ")}`.toLowerCase();
      return query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((token) => haystack.includes(token));
    });
  }, [state.role, state.docs, roleOnly, status, query, state.jd]);

  const groups = LAYER_GROUPS.map((group) => {
    const items = docs
      .filter((doc) => doc.layer === group.id)
      .sort((a, b) => {
        const ai = recommendedOrder.indexOf(a.id);
        const bi = recommendedOrder.indexOf(b.id);
        if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        return a.id.localeCompare(b.id);
      });
    return { ...group, docs: items };
  }).filter((group) => group.docs.length > 0);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setRoleOnly(false);
  };
  const hasFilters = query.trim().length > 0 || status !== "all" || roleOnly;

  return (
    <PageContainer>
      <PageHeader
        back={{ to: "/roadmap", label: "返回完整路线图" }}
        eyebrow="DEEP LIBRARY · 21 DOCS"
        title="深度文档库"
        description={`${DOCS.length} 篇精读 · ${TOTAL_QA} 道带追问问答 · 约 ${Math.round(TOTAL_LINES / 1000)}k 行。按 L0–L4 与面试实战分组，不再用一堆筛选标签堆在一起。`}
        actions={
          <>
            <Link to="/plan" className="btn-ghost">按岗位定制</Link>
            <Link to="/qa" className="btn-primary">去面试自测</Link>
          </>
        }
      />

      <div className="mb-5 rounded-2xl border border-line/10 bg-surface p-3.5 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、技术、标签…（⌘K 可全站搜索正文）"
              className="input pl-9"
            />
            {query ? (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-raised" aria-label="清空搜索">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setRoleOnly((value) => !value)} className={`chip ${roleOnly ? "chip-active" : ""}`}>
              <Filter className="h-3 w-3" /> 只看 {role.label}
            </button>
            {(
              [
                ["all", "全部状态"],
                ["todo", "未完成"],
                ["reading", "在学"],
                ["done", "已精读"],
              ] as Array<[Status, string]>
            ).map(([value, label]) => (
              <button key={value} onClick={() => setStatus(value)} className={`chip ${status === value ? "chip-active" : ""}`}>
                {label}
              </button>
            ))}
            {hasFilters ? <button onClick={reset} className="btn-quiet text-[10.5px]">清除</button> : null}
          </div>
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto border-t border-line/10 pt-3">
          {LAYER_GROUPS.map((group) => {
            const count = docs.filter((doc) => doc.layer === group.id).length;
            if (count === 0) return null;
            return (
              <button
                key={group.id}
                onClick={() => document.getElementById(`lib-${group.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] text-muted transition hover:bg-raised/60 hover:text-ink"
              >
                {group.title} <span className="font-mono text-[8px] text-muted/60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {analysis ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent/15 bg-accent/[0.045] px-3.5 py-2.5 text-[10.5px] text-muted">
          <span className="font-semibold text-accent">JD 命中 {analysis.matched.length} 项：</span>
          {analysis.matched.slice(0, 8).map((item) => <span key={item.label} className="chip border-accent/20 bg-surface text-accent">{item.label}</span>)}
          <Link to="/plan" className="ml-auto text-accent hover:underline">重新分析 →</Link>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-muted">显示 <span className="font-semibold text-ink">{docs.length}</span> 篇</p>
        <p className="text-[9.5px] text-muted/60">精读完成 {Object.values(state.docs).filter((doc) => doc.completed).length}/{DOCS.length}</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/20 py-14 text-center">
          <p className="text-[13px] text-muted">没有符合条件的文档。</p>
          <button onClick={reset} className="btn-ghost mt-3">清除筛选</button>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.id} id={`lib-${group.id}`} className="scroll-mt-24">
              <div className="mb-3 flex items-end justify-between gap-3 border-b border-line/10 pb-2">
                <div>
                  <h2 className="text-[14px] font-bold text-ink">{group.title}</h2>
                  <p className="mt-0.5 text-[9.5px] text-muted">{group.desc}</p>
                </div>
                <span className="shrink-0 font-mono text-[9px] text-muted/60">{group.docs.length} 篇</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.docs.map((doc) => <DocCard key={doc.id} doc={doc} showMatch />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
