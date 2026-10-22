import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  GitBranch,
  Layers3,
  MessageSquareQuote,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { DOC_MAP, QA_MAP } from "../lib/content";
import { plainInline } from "../lib/text";
import { useStore } from "../lib/store";
import questionMeta from "../data/question-meta.json";
import {
  ROADMAPS,
  ROADMAP_CATEGORIES,
  ROADMAP_MAP,
  ROADMAP_OFFICIAL,
  roadmapForRole,
  roadmapStats,
  type Roadmap,
  type RoadmapCategory,
  type RoadmapNode,
} from "../data/roadmaps";
import { PageContainer, PageHeader, ProgressRing } from "../components/ui";

function completedDocSet(docs: ReturnType<typeof useStore>["state"]["docs"]): Set<string> {
  return new Set(Object.entries(docs).filter(([, value]) => value.completed).map(([id]) => id));
}

function nodeStatus(node: RoadmapNode, docs: ReturnType<typeof useStore>["state"]["docs"]): "done" | "active" | "todo" | "external" {
  if (!node.docs?.length) return "external";
  const total = node.docs.length;
  const completed = node.docs.filter((id) => docs[id]?.completed).length;
  if (completed === total) return "done";
  if (node.docs.some((id) => (docs[id]?.percent ?? 0) > 0)) return "active";
  return "todo";
}

function cleanTopic(text: string): string {
  return plainInline(text)
    .replace(/^\d+(?:\.\d+)*\.?\s*/, "")
    .replace(/[⭐]/g, "")
    .trim();
}

function topicList(node: RoadmapNode): string[] {
  const keywords = [node.title, ...node.title.split(/[、，,/与和及\s]+/)]
    .map((part) => part.replace(/[A-Za-z]+/g, (match) => match).trim())
    .filter((part) => part.length >= 2);
  const matched = (node.docs ?? []).flatMap((id) =>
    (DOC_MAP.get(id)?.headings ?? [])
      .filter((heading) => heading.depth === 2)
      .map((heading) => cleanTopic(heading.text))
      .filter((text) => keywords.some((keyword) => text.includes(keyword))),
  );
  return [...new Set([...(node.topics ?? []).map(cleanTopic), ...matched])].slice(0, 9);
}

function categoryLabel(category: RoadmapCategory): string {
  return ROADMAP_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function ResourceLinks({ node, roadmap }: { node: RoadmapNode; roadmap: Roadmap }) {
  const docs = node.docs ?? [];
  const bankCount = node.bankDoc ? questionMeta.byDoc[node.bankDoc as keyof typeof questionMeta.byDoc]?.total ?? 0 : 0;
  const qa = node.qaDoc ? QA_MAP.get(node.qaDoc) : null;
  const resources = [
    ...docs.map((id) => ({ label: `精读 ${id}`, to: `/doc/${id}`, icon: BookOpen })),
    ...(qa ? [{ label: `自测 ${qa.items.length}`, to: `/qa/${node.qaDoc}`, icon: MessageSquareQuote }] : []),
    ...(bankCount ? [{ label: `练题 ${bankCount}`, to: `/quiz?doc=${node.bankDoc}`, icon: Layers3 }] : []),
    ...(node.courseIds ?? []).map((id) => ({ label: "课程题库", to: `/quiz?tab=course&course=${id}`, icon: Layers3 })),
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {resources.map((resource) => {
        const Icon = resource.icon;
        return (
          <Link key={resource.to + resource.label} to={resource.to} className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
            <Icon className="h-2.5 w-2.5" /> {resource.label}
          </Link>
        );
      })}
      {(node.external ?? []).slice(0, 3).map((source) => (
        <a key={source.url} href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
          {source.label} <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ))}
      <a href={roadmap.officialUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-raised/40 px-2 py-1 text-[9px] text-muted/70 transition hover:text-accent">
        官方完整图 <ArrowUpRight className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}

export function RoadmapIndexPage() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RoadmapCategory | "all">("all");
  const completed = completedDocSet(state.docs);
  const roleRoadmapId = roadmapForRole(state.role);
  const roleRoadmap = ROADMAP_MAP.get(roleRoadmapId);

  const roadmaps = useMemo(
    () =>
      ROADMAPS.filter((roadmap) => {
        if (category !== "all" && roadmap.category !== category) return false;
        if (!query.trim()) return true;
        return `${roadmap.name} ${roadmap.audience} ${roadmap.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
      }),
    [category, query],
  );

  const groups = ROADMAP_CATEGORIES.map((item) => ({
    ...item,
    roadmaps: roadmaps.filter((roadmap) => roadmap.category === item.id),
  })).filter((group) => group.roadmaps.length > 0);

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> 总览
        </Link>
        <span className="text-line/30">/</span>
        <span>所有路线图</span>
        <span className="ml-auto inline-flex items-center gap-1 text-muted/60">
          <GitBranch className="h-3 w-3" /> 分类参考 roadmap.sh，节点说明由本平台编写
        </span>
      </div>

      <PageHeader
        eyebrow="ROADMAP LIBRARY · ROLE + SKILL"
        title="所有路线图"
        description="入门、职业、技术分开选。每条路线有独立的阶段和节点，不会选了不同岗位却看到同一套内容。"
        actions={
          <a href="https://roadmap.sh/roadmaps/?g=Absolute+Beginners" target="_blank" rel="noreferrer noopener" className="btn-ghost">
            打开 roadmap.sh <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      {roleRoadmap ? (
        <Link to={`/roadmap/${roleRoadmap.id}`} className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/20 bg-accent/[0.045] p-4 transition hover:border-accent/40 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-accent/70">按你的目标推荐</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">{roleRoadmap.name}</p>
            <p className="mt-0.5 text-[10px] text-muted">{roleRoadmap.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-muted">{roadmapStats(roleRoadmap, completed).nodes} 节点</span>
            <ArrowRight className="h-4 w-4 text-accent" />
          </div>
        </Link>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-line/10 bg-surface p-3.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索路线名称或岗位…" className="input py-2 pl-9 text-[11.5px]" />
        </div>
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setCategory("all")} className={`chip ${category === "all" ? "chip-active" : ""}`}>全部</button>
          {ROADMAP_CATEGORIES.map((item) => (
            <button key={item.id} onClick={() => setCategory(item.id)} className={`chip ${category === item.id ? "chip-active" : ""}`}>
              {item.label} · {ROADMAPS.filter((roadmap) => roadmap.category === item.id).length}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-7">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/20 py-12 text-center text-[12px] text-muted">没有匹配的路线。</div>
        ) : (
          groups.map((group) => (
            <section key={group.id} id={`roadmaps-${group.id}`} className="scroll-mt-24">
              <div className="mb-3 border-b border-line/10 pb-2">
                <h2 className="text-[15px] font-bold text-ink">{group.label}</h2>
                <p className="mt-0.5 text-[9.5px] text-muted">{group.description}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.roadmaps.map((roadmap) => {
                  const stats = roadmapStats(roadmap, completed);
                  const isRole = roadmap.id === roleRoadmapId;
                  return (
                    <Link
                      key={roadmap.id}
                      to={`/roadmap/${roadmap.id}`}
                      className={`card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-accent/30 ${isRole ? "border-accent/30" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raised text-accent">
                          <Layers3 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-[13px] font-semibold text-ink">{roadmap.name}</h3>
                            {isRole ? <span className="chip border-accent/20 text-accent">目标</span> : null}
                          </div>
                          <p className="mt-0.5 text-[9px] text-muted">{roadmap.audience}</p>
                        </div>
                        <span className={`chip ${group.id === "career" ? "border-accent/20 text-accent" : group.id === "beginner" ? "border-coral/15 text-coral" : ""}`}>{group.label.slice(0, 2)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-muted">{roadmap.description}</p>
                      <div className="mt-3 flex items-center gap-3 text-[9px] text-muted/70">
                        <span>{stats.stages} 阶段</span>
                        <span>{stats.nodes} 节点</span>
                        {stats.docs > 0 ? <span>{stats.completed}/{stats.docs} 精读</span> : <span>外部资料 + 题库</span>}
                      </div>
                      <div className="progress-track mt-2 h-1">
                        <div className="progress-fill" style={{ width: `${stats.docs ? (stats.completed / stats.docs) * 100 : 0}%` }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-[8.5px] text-muted/50">{roadmap.stages.length} stages · {stats.nodes} nodes</span>
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-accent">
                          打开路线 <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="mt-7 rounded-2xl border border-line/10 bg-raised/30 px-4 py-3 text-[10px] leading-5 text-muted">
        说明：路线分类参考 roadmap.sh 的 Role-Based / Skill-Based / Absolute Beginners 结构；本页节点说明、资源映射和学习顺序由本平台独立编写。官方完整交互图请通过各路线右上角链接打开。
      </div>
    </PageContainer>
  );
}

export function RoadmapDetailPage() {
  const { roadmapId = "" } = useParams();
  const roadmap = ROADMAP_MAP.get(roadmapId);
  const { state } = useStore();
  const completed = completedDocSet(state.docs);

  if (!roadmap) {
    return (
      <PageContainer>
        <PageHeader back={{ to: "/roadmap", label: "返回所有路线图" }} eyebrow="404" title="没有这条路线" description="请从路线目录重新选择。" />
      </PageContainer>
    );
  }

  const stats = roadmapStats(roadmap, completed);
  const roleRoadmapId = roadmapForRole(state.role);
  const currentStage = roadmap.stages.find((stage) => {
    const docs = [...new Set(stage.nodes.flatMap((node) => node.docs ?? []))];
    return docs.some((id) => !state.docs[id]?.completed);
  });
  const currentDoc = currentStage?.nodes.flatMap((node) => node.docs ?? []).find((id) => !state.docs[id]?.completed);
  const currentDocMeta = currentDoc ? DOC_MAP.get(currentDoc) : null;

  return (
    <PageContainer>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
        <Link to="/roadmap" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> 所有路线图
        </Link>
        <span className="text-line/30">/</span>
        <span>{categoryLabel(roadmap.category)}</span>
        <span className="text-line/30">/</span>
        <span className="text-ink/70">{roadmap.name}</span>
        {roadmap.id === roleRoadmapId ? <span className="chip border-accent/20 text-accent">目标路线</span> : null}
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line/10 bg-surface p-5 shadow-card lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ProgressRing percent={stats.docs ? (stats.completed / stats.docs) * 100 : 0} size={70} label={stats.docs ? `${stats.completed}/${stats.docs}` : "—"} />
          <div className="min-w-0">
            <p className="eyebrow mb-1">{categoryLabel(roadmap.category)} · {roadmap.audience}</p>
            <h1 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[34px]">{roadmap.name}</h1>
            <p className="mt-1 text-[11px] leading-5 text-muted">{roadmap.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px]">
              <span className="chip">{stats.stages} 个阶段</span>
              <span className="chip">{stats.nodes} 个节点</span>
              <span className="chip">{stats.docs} 篇关联精读</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {currentDoc ? (
            <Link to={`/doc/${currentDoc}`} className="btn-primary">
              <Play className="h-3.5 w-3.5" /> 继续 {currentDocMeta?.shortTitle ?? currentDoc}
            </Link>
          ) : (
            <Link to={`/quiz?tab=course&course=${roadmap.category === "skill" ? "cs-ai-foundations" : "backend-java"}`} className="btn-primary">
              <Play className="h-3.5 w-3.5" /> 去题库
            </Link>
          )}
          <a href={roadmap.officialUrl} target="_blank" rel="noreferrer noopener" className="btn-ghost">
            官方完整图 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line/10 bg-surface p-1.5">
        {roadmap.stages.map((stage, index) => {
          const docs = [...new Set(stage.nodes.flatMap((node) => node.docs ?? []))];
          const done = docs.filter((id) => state.docs[id]?.completed).length;
          return (
            <button
              key={stage.id}
              onClick={() => document.getElementById(`node-stage-${stage.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9.5px] text-muted transition hover:bg-raised/60 hover:text-ink"
            >
              <span className="font-mono text-[8px] text-accent">{String(index + 1).padStart(2, "0")}</span>
              {stage.title}
              {docs.length > 0 ? <span className="font-mono text-[8px] text-muted/50">{done}/{docs.length}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-7">
          {roadmap.stages.map((stage, stageIndex) => {
            const docs = [...new Set(stage.nodes.flatMap((node) => node.docs ?? []))];
            const done = docs.filter((id) => state.docs[id]?.completed).length;
            return (
              <section key={stage.id} id={`node-stage-${stage.id}`} className="scroll-mt-24">
                <div className="mb-3 flex items-start gap-3 border-b border-line/10 pb-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-[11px] font-semibold text-lime dark:bg-lime dark:text-[#172014]">
                    {String(stageIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[16px] font-bold text-ink">{stage.title}</h2>
                      <span className="text-[9.5px] text-muted">{stage.subtitle}</span>
                      {docs.length > 0 ? <span className="ml-auto font-mono text-[8.5px] text-muted/60">{done}/{docs.length} 精读</span> : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {stage.nodes.map((node, nodeIndex) => {
                    const status = nodeStatus(node, state.docs);
                    const topics = topicList(node);
                    return (
                      <div key={`${node.title}-${nodeIndex}`} className={`rounded-xl border bg-surface p-4 ${status === "done" ? "border-accent/25" : status === "active" ? "border-accent/35" : "border-line/10"}`}>
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${status === "done" ? "bg-accent" : status === "active" ? "bg-coral" : status === "external" ? "bg-sky" : "bg-line/25"}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-[12.5px] font-semibold text-ink">{node.title}</h3>
                              {node.priority ? <span className={`chip ${node.priority === "核心" ? "border-accent/20 text-accent" : node.priority === "进阶" ? "" : "border-coral/15 text-coral"}`}>{node.priority}</span> : null}
                              <span className="ml-auto text-[8.5px] text-muted/60">
                                {status === "done" ? "已完成" : status === "active" ? "在学" : status === "external" ? "外部资料 + 题库" : "未开始"}
                              </span>
                            </div>
                            <p className="mt-1 text-[10.5px] leading-5 text-muted">
                              {node.description ?? `理解 ${node.title} 的概念、边界与常见坑。`}
                            </p>
                            {node.outcome ? <p className="mt-1 text-[9.5px] leading-5 text-ink/70"><span className="font-semibold text-accent">学完能：</span>{node.outcome}</p> : null}
                            {topics.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {topics.map((topic) => <span key={topic} className="rounded-md bg-raised/55 px-1.5 py-0.5 text-[8.5px] text-muted">{topic}</span>)}
                              </div>
                            ) : null}
                            <ResourceLinks node={node} roadmap={roadmap} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[80px] lg:self-start">
          <div className="card p-4">
            <p className="eyebrow mb-2">这条路线怎么用</p>
            <ol className="space-y-2 text-[10px] leading-5 text-muted">
              <li>1. 按阶段顺序完成“核心”节点，不要跳着刷。</li>
              <li>2. 有精读的节点先读文档，再做自测，最后做题库。</li>
              <li>3. 没有本地精读的节点，用官方资料 + 课程题库完成。</li>
              <li>4. 每个阶段至少产出一个项目/复盘证据。</li>
            </ol>
          </div>
          <div className="rounded-xl border border-line/10 bg-raised/30 p-3.5 text-[9px] leading-5 text-muted/70">
            本路线为平台独立编排，节点命名参考行业通用知识。roadmap.sh 的官方完整图可能包含更多工具与分支；点击“官方完整图”查看。
          </div>
          <a href={ROADMAP_OFFICIAL.frontend} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-[10px] text-muted hover:text-accent">
            <span className="inline-flex items-center gap-1"><GitBranch className="h-3 w-3" /> roadmap.sh 路线索引</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </aside>
      </div>
    </PageContainer>
  );
}
