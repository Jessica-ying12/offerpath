import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { DOCS, ROLES, TOTAL_LINES, TOTAL_QA } from "../lib/content";
import { analyzeJd, docsForRole, prioritizedDocs } from "../lib/jd";
import { useStore } from "../lib/store";
import { DocCard, PageContainer, PageHeader } from "../components/ui";

const LAYERS = [...new Set(DOCS.map((doc) => doc.layer))];
const CATEGORIES = [...new Set(DOCS.map((doc) => doc.category))];
const PRIORITIES = ["P0", "P1", "P2"] as const;

type Status = "all" | "todo" | "reading" | "done";

export function DocsPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState<Status>("all");
  const [roleOnly, setRoleOnly] = useState(false);
  const [sort, setSort] = useState<"recommend" | "week" | "priority">("recommend");
  const role = ROLES.find((item) => item.id === state.role) ?? ROLES[0];
  const analysis = state.jd ? analyzeJd(state.jd) : null;
  const recommendedOrder = useMemo(
    () => prioritizedDocs(state.role, state.jd).map((doc) => doc.id),
    [state.role, state.jd],
  );

  const docs = useMemo(() => {
    const base = roleOnly ? docsForRole(state.role) : DOCS;
    const filtered = base.filter((doc) => {
      if (layer !== "all" && doc.layer !== layer) return false;
      if (category !== "all" && doc.category !== category) return false;
      if (priority !== "all" && doc.priority !== priority) return false;
      const progress = state.docs[doc.id];
      if (status === "done" && !progress?.completed) return false;
      if (status === "reading" && (!progress?.percent || progress.completed)) return false;
      if (status === "todo" && progress?.completed) return false;
      if (query.trim()) {
        const haystack = `${doc.id} ${doc.title} ${doc.description} ${doc.tags.join(" ")}`.toLowerCase();
        if (!query
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .every((token) => haystack.includes(token))) {
          return false;
        }
      }
      return true;
    });
    if (sort === "recommend") {
      return [...filtered].sort((a, b) => {
        const ai = recommendedOrder.indexOf(a.id);
        const bi = recommendedOrder.indexOf(b.id);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      });
    }
    if (sort === "priority") {
      const rank = { P0: 0, P1: 1, P2: 2 };
      return [...filtered].sort((a, b) => rank[a.priority] - rank[b.priority]);
    }
    return [...filtered].sort((a, b) => a.id.localeCompare(b.id));
  }, [
    state.role,
    state.jd,
    state.docs,
    roleOnly,
    layer,
    category,
    priority,
    status,
    query,
    sort,
    recommendedOrder,
  ]);

  const hasFilters =
    layer !== "all" ||
    category !== "all" ||
    priority !== "all" ||
    status !== "all" ||
    roleOnly ||
    query.trim().length > 0;

  const reset = () => {
    setQuery("");
    setLayer("all");
    setCategory("all");
    setPriority("all");
    setStatus("all");
    setRoleOnly(false);
    setSort("recommend");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="DEEP LIBRARY · 21 DOCS"
        title="深度文档库"
        description={`${DOCS.length} 篇精读 · ${TOTAL_QA} 道带追问问答 · 约 ${Math.round(TOTAL_LINES / 1000)}k 行。含全文搜索、目录、清单、笔记与问答自测。`}
        actions={
          <>
            <Link to="/plan" className="btn-ghost">
              按岗位定制
            </Link>
            <Link to="/qa" className="btn-primary">
              去面试自测
            </Link>
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
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-raised"
                aria-label="清空搜索"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRoleOnly((value) => !value)}
              className={`chip ${roleOnly ? "chip-active" : ""}`}
            >
              <Filter className="h-3 w-3" />
              只看 {role.label}
            </button>
            <label className="flex items-center gap-1.5 text-[10.5px] text-muted">
              <SlidersHorizontal className="h-3 w-3" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="rounded-lg border border-line/10 bg-surface px-2 py-1.5 text-[10.5px] text-ink outline-none"
              >
                <option value="recommend">推荐顺序</option>
                <option value="week">学习周</option>
                <option value="priority">优先级</option>
              </select>
            </label>
            {hasFilters ? (
              <button onClick={reset} className="btn-quiet text-[10.5px]">
                清除筛选
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/10 pt-3">
          <span className="mr-1 text-[9px] font-medium text-muted/60">层级</span>
          <button onClick={() => setLayer("all")} className={`chip ${layer === "all" ? "chip-active" : ""}`}>
            全部
          </button>
          {LAYERS.map((item) => (
            <button
              key={item}
              onClick={() => setLayer(item)}
              className={`chip ${layer === item ? "chip-active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[9px] font-medium text-muted/60">类型</span>
          <button
            onClick={() => setCategory("all")}
            className={`chip ${category === "all" ? "chip-active" : ""}`}
          >
            全部
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`chip ${category === item ? "chip-active" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[9px] font-medium text-muted/60">优先级</span>
          <button
            onClick={() => setPriority("all")}
            className={`chip ${priority === "all" ? "chip-active" : ""}`}
          >
            全部
          </button>
          {PRIORITIES.map((item) => (
            <button
              key={item}
              onClick={() => setPriority(item)}
              className={`chip ${priority === item ? "chip-active" : ""}`}
            >
              {item}
            </button>
          ))}
          <span className="ml-3 mr-1 text-[9px] font-medium text-muted/60">状态</span>
          {(
            [
              ["all", "全部"],
              ["todo", "未完成"],
              ["reading", "在学"],
              ["done", "已精读"],
            ] as Array<[Status, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`chip ${status === value ? "chip-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {analysis ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent/15 bg-accent/[0.045] px-3.5 py-2.5 text-[10.5px] text-muted">
          <span className="font-semibold text-accent">JD 已命中 {analysis.matched.length} 项：</span>
          {analysis.matched.slice(0, 8).map((item) => (
            <span key={item.label} className="chip border-accent/20 bg-surface text-accent">
              {item.label}
            </span>
          ))}
          <Link to="/plan" className="ml-auto text-accent hover:underline">
            重新分析 →
          </Link>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-muted">
          显示 <span className="font-semibold text-ink">{docs.length}</span> 篇
          {roleOnly ? ` · ${role.label}` : ""}
        </p>
        <p className="text-[9.5px] text-muted/60">
          精读完成 {Object.values(state.docs).filter((doc) => doc.completed).length}/{DOCS.length}
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/20 py-14 text-center">
          <p className="text-[13px] text-muted">没有符合条件的文档。</p>
          <button onClick={reset} className="mt-3 btn-ghost">
            清除筛选
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <DocCard key={doc.id} doc={doc} showMatch />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
