import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Filter,
  Layers3,
  ListChecks,
  MessageSquareQuote,
  Search,
  X,
} from "lucide-react";
import { DOCS, QA_MAP, ROLES, TOTAL_LINES, TOTAL_QA } from "../lib/content";
import { docsForRole } from "../lib/jd";
import { useStore } from "../lib/store";
import { DOC_MODULES, DOC_MODULE_MAP, type DocModule } from "../lib/taxonomy";
import { ROADMAP_MAP } from "../data/roadmaps";
import questionMeta from "../data/question-meta.json";
import { Breadcrumbs, PageContainer, PageHeader } from "../components/ui";
import type { DocMeta } from "../lib/types";

type Status = "all" | "todo" | "reading" | "done";

const STAGE_ORDER: DocModule["stage"][] = ["基础", "进阶", "生产", "求职"];

const STAGE_STYLE: Record<DocModule["stage"], string> = {
  基础: "border-sky/20 bg-sky/[0.05] text-sky",
  进阶: "border-accent/20 bg-accent/[0.05] text-accent",
  生产: "border-coral/20 bg-coral/[0.05] text-coral",
  求职: "border-line/15 bg-raised/60 text-ink/70",
};

function docMatches(doc: DocMeta, query: string): boolean {
  if (!query.trim()) return true;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${doc.id} ${doc.title} ${doc.description} ${doc.tags.join(" ")} ${doc.headings.map((heading) => heading.text).join(" ")}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function DocRow({ doc, query }: { doc: DocMeta; query: string }) {
  const { state } = useStore();
  const progress = state.docs[doc.id];
  const bank = QA_MAP.get(doc.id);
  const bankCount = questionMeta.byDoc[doc.id as keyof typeof questionMeta.byDoc]?.total ?? 0;
  const mastered = bank?.items.filter((item) => state.qa[item.id]?.status === "mastered").length ?? 0;
  const chapters = doc.headings
    .filter((heading) => heading.depth === 2)
    .filter((heading) => !query.trim() || heading.text.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 4);
  const stateLabel = progress?.completed ? "已精读" : progress?.percent ? `在读 ${progress.percent}%` : "未开始";

  return (
    <div className={`rounded-xl border bg-surface p-3.5 transition hover:border-accent/25 ${progress?.completed ? "border-accent/25" : "border-line/10"}`}>
      <div className="flex items-start gap-3">
        <Link to={`/doc/${doc.id}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised font-mono text-[11px] font-semibold text-muted hover:bg-accent/10 hover:text-accent">
          {doc.id}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/doc/${doc.id}`} className="text-[13px] font-semibold leading-5 text-ink hover:text-accent">{doc.title}</Link>
            <span className="chip py-0.5 text-[8px]">{doc.priority}</span>
            <span className={`ml-auto inline-flex items-center gap-1 text-[9px] ${progress?.completed ? "text-accent" : "text-muted/60"}`}>
              {progress?.completed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {stateLabel}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-muted">{doc.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {doc.tags.slice(0, 5).map((tag) => <span key={tag} className="rounded-md bg-raised/55 px-1.5 py-0.5 text-[8px] text-muted">{tag}</span>)}
          </div>
          {chapters.length > 0 ? (
            <div className="mt-2 border-t border-line/10 pt-2">
              <p className="mb-1 text-[8.5px] text-muted/60">章节直达</p>
              <div className="flex flex-wrap gap-1">
                {chapters.map((heading) => (
                  <Link
                    key={heading.slug}
                    to={`/doc/${doc.id}?h=${encodeURIComponent(heading.slug)}`}
                    className="rounded-md border border-line/10 px-1.5 py-0.5 text-[8.5px] text-muted transition hover:border-accent/30 hover:text-accent"
                  >
                    {heading.text}
                  </Link>
                ))}
                <Link to={`/doc/${doc.id}`} className="rounded-md px-1.5 py-0.5 text-[8.5px] text-accent hover:underline">
                  全部 {doc.headings.length} 节 →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/10 pt-2 text-[9px] text-muted/70">
        <span className="inline-flex items-center gap-1"><BookOpen className="h-2.5 w-2.5" /> {doc.minutes} 分钟</span>
        {bank ? <span className="inline-flex items-center gap-1"><MessageSquareQuote className="h-2.5 w-2.5" /> 问答 {mastered}/{bank.items.length} 掌握</span> : null}
        {bankCount ? <span className="inline-flex items-center gap-1"><Layers3 className="h-2.5 w-2.5" /> {bankCount} 题</span> : null}
        <span className="ml-auto flex items-center gap-1.5">
          <Link to={`/doc/${doc.id}`} className="rounded border border-line/10 px-1.5 py-0.5 text-[8.5px] hover:border-accent/30 hover:text-accent">精读</Link>
          {bank ? <Link to={`/qa/${doc.id}`} className="rounded border border-line/10 px-1.5 py-0.5 text-[8.5px] hover:border-accent/30 hover:text-accent">自测</Link> : null}
          {bankCount ? <Link to={`/quiz?doc=${doc.id}`} className="rounded border border-line/10 px-1.5 py-0.5 text-[8.5px] hover:border-accent/30 hover:text-accent">练题</Link> : null}
        </span>
      </div>
    </div>
  );
}

export function DocsPage() {
  const { state } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const status = (searchParams.get("status") as Status) || "all";
  const roleOnly = searchParams.get("role") === "1";
  const rawModule = searchParams.get("module");
  const selectedModule = rawModule && DOC_MODULE_MAP.has(rawModule) ? rawModule : "all";
  const role = ROLES.find((item) => item.id === state.role) ?? ROLES[0];

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (!value) params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const docs = useMemo(() => {
    const base = roleOnly ? docsForRole(state.role) : DOCS;
    return base.filter((doc) => {
      const progress = state.docs[doc.id];
      if (status === "done" && !progress?.completed) return false;
      if (status === "reading" && (!progress?.percent || progress.completed)) return false;
      if (status === "todo" && progress?.completed) return false;
      return docMatches(doc, query);
    });
  }, [state.role, state.docs, roleOnly, status, query]);

  const modules = useMemo(
    () =>
      DOC_MODULES.map((module) => {
        const moduleDocs = module.docs
          .map((id) => docs.find((doc) => doc.id === id))
          .filter((doc): doc is DocMeta => Boolean(doc));
        const done = moduleDocs.filter((doc) => state.docs[doc.id]?.completed).length;
        return { ...module, docs: moduleDocs, done };
      }).filter((module) => module.docs.length > 0 && (selectedModule === "all" || module.id === selectedModule)),
    [docs, state.docs, selectedModule],
  );

  const selectedMeta = selectedModule !== "all" ? DOC_MODULE_MAP.get(selectedModule) : null;
  const selectedBuild = modules.find((module) => module.id === selectedModule);
  const completed = DOCS.filter((doc) => state.docs[doc.id]?.completed).length;
  const filteredChapters = query.trim().length > 1;

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "总览", to: "/" },
          { label: "深度文档", to: "/docs" },
          ...(selectedMeta ? [{ label: selectedMeta.title }] : []),
        ]}
        className="mb-4"
      />
      <PageHeader
        eyebrow="DEEP LIBRARY · 21 DOCS"
        title="深度文档库"
        description={`${DOCS.length} 篇精读 · ${TOTAL_QA} 道带追问问答 · 约 ${Math.round(TOTAL_LINES / 1000)}k 行。按“模块 → 文档 → 章节”组织，不再把知识点混在一层卡片里。`}
        actions={
          <>
            <Link to="/plan" className="btn-ghost">生成学习计划</Link>
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
              onChange={(event) => setParam("q", event.target.value || null)}
              placeholder="搜索模块、文档标题、技术或章节名…"
              className="input pl-9"
            />
            {query ? (
              <button onClick={() => setParam("q", null)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-raised" aria-label="清空搜索">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setParam("role", roleOnly ? null : "1")} className={`chip ${roleOnly ? "chip-active" : ""}`}>
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
              <button key={value} onClick={() => setParam("status", value === "all" ? null : value)} className={`chip ${status === value ? "chip-active" : ""}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[80px] lg:self-start">
          <div className="card p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="eyebrow">知识树</p>
              <span className="font-mono text-[9px] text-muted/60">{completed}/{DOCS.length}</span>
            </div>
            <Link
              to="/docs"
              className={`mb-1 flex items-center justify-between rounded-lg px-2.5 py-2 text-[10.5px] ${selectedModule === "all" ? "bg-accent/[0.07] font-semibold text-accent" : "text-muted hover:bg-raised/60 hover:text-ink"}`}
            >
              <span>全部模块</span>
              <span className="font-mono text-[8.5px]">{docs.length}</span>
            </Link>
            {STAGE_ORDER.map((stage) => {
              const stageModules = DOC_MODULES.filter((module) => module.stage === stage);
              return (
                <div key={stage} className="mt-2">
                  <p className="px-2.5 pb-1 text-[8.5px] font-semibold uppercase tracking-wider text-muted/50">{stage}</p>
                  <div className="space-y-0.5">
                    {stageModules.map((module) => {
                      const done = module.docs.filter((id) => state.docs[id]?.completed).length;
                      const active = selectedModule === module.id;
                      return (
                        <Link
                          key={module.id}
                          to={`/docs?module=${module.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                          className={`block rounded-lg px-2.5 py-2 transition ${active ? "bg-accent/[0.07] text-accent" : "text-muted hover:bg-raised/60 hover:text-ink"}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className={`text-[10.5px] ${active ? "font-semibold" : ""}`}>{module.title}</span>
                            <span className="font-mono text-[8px] opacity-60">{done}/{module.docs.length}</span>
                          </span>
                          <span className="mt-1 block h-0.5 rounded-full bg-line/10">
                            <span className="block h-full rounded-full bg-accent/60" style={{ width: `${(done / module.docs.length) * 100}%` }} />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl border border-line/10 bg-raised/25 p-3 text-[9px] leading-4 text-muted/70">
            每个模块先说明“学完能做什么”，再列文档和章节。章节可直接跳到对应内容。
          </div>
        </aside>

        <div className="min-w-0">
          {selectedMeta ? (
            <section className="mb-4 rounded-2xl border border-accent/20 bg-accent/[0.04] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip ${STAGE_STYLE[selectedMeta.stage]}`}>{selectedMeta.stage}</span>
                <span className="text-[9px] text-muted">模块 · {selectedMeta.docs.length} 篇文档</span>
                {selectedBuild ? <span className="chip py-0.5 text-[8px]">{selectedBuild.done}/{selectedBuild.docs.length} 完成</span> : null}
              </div>
              <h2 className="mt-2 font-display text-[22px] font-bold text-ink">{selectedMeta.title}</h2>
              <p className="mt-1 text-[11px] leading-5 text-muted">{selectedMeta.description}</p>
              <p className="mt-1.5 text-[10px] leading-5 text-ink/70"><span className="font-semibold text-accent">学完能：</span>{selectedMeta.outcome}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedMeta.roadmapIds.map((id) => {
                  const roadmap = ROADMAP_MAP.get(id);
                  return roadmap ? <Link key={id} to={`/roadmap/${id}`} className="chip hover:border-accent/30 hover:text-accent">{roadmap.name} →</Link> : null;
                })}
              </div>
            </section>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted">
              显示 <span className="font-semibold text-ink">{modules.reduce((sum, module) => sum + module.docs.length, 0)}</span> 篇
              {filteredChapters ? " · 搜索同时匹配章节名" : ""}
            </p>
            {selectedModule !== "all" || query || status !== "all" || roleOnly ? (
              <button onClick={() => setSearchParams({}, { replace: true })} className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-coral">
                <X className="h-3 w-3" /> 清除筛选
              </button>
            ) : null}
          </div>

          {modules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line/20 py-14 text-center">
              <p className="text-[13px] text-muted">没有匹配的文档或章节。</p>
              <button onClick={() => setSearchParams({}, { replace: true })} className="btn-ghost mt-3">清除筛选</button>
            </div>
          ) : (
            <div className="space-y-5">
              {modules.map((module) => (
                <section key={module.id} id={`module-${module.id}`} className="scroll-mt-24">
                  {selectedModule === "all" ? (
                    <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-line/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[8px] font-semibold ${STAGE_STYLE[module.stage]}`}>{module.stage}</span>
                        <Link to={`/docs?module=${module.id}`} className="text-[14px] font-bold text-ink hover:text-accent">{module.title}</Link>
                      </div>
                      <span className="font-mono text-[8.5px] text-muted/60">{module.done}/{module.docs.length} 完成</span>
                    </div>
                  ) : (
                    <div className="mb-2 flex items-center justify-between border-b border-line/10 pb-2 text-[9px] text-muted">
                      <span>{module.docs.length} 篇文档 · 章节可直接跳转</span>
                      <span className="font-mono text-muted/60">{module.done}/{module.docs.length} 完成</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {module.docs.map((doc) => <DocRow key={doc.id} doc={doc} query={query} />)}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/10 bg-raised/25 px-3.5 py-2.5 text-[9.5px] text-muted">
            <span><ListChecks className="mr-1 inline h-3 w-3 text-accent" /> 精读完成不等于掌握：每篇至少做一次问答自测，再按 D+1/D+3/D+7 复习。</span>
            {selectedMeta ? (
              <Link to={`/plan`} className="inline-flex items-center gap-1 text-accent">
                把这个模块放进计划 <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
