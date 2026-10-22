import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  GitBranch,
  Layers3,
  MessageSquareQuote,
  Play,
  Route,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DOC_MAP, QA_MAP } from "../lib/content";
import { plainInline } from "../lib/text";
import { useStore } from "../lib/store";
import questionMeta from "../data/question-meta.json";
import officialCoverage from "../data/official-coverage.json";
import {
  ROADMAPS,
  ROADMAP_CATEGORIES,
  ROADMAP_MAP,
  ROADMAP_TRACKS,
  OFFICIAL_SLUGS,
  ROADMAP_OFFICIAL,
  roadmapForRole,
  roadmapStats,
  roadmapTrack,
  type Roadmap,
  type RoadmapCategory,
  type RoadmapNode,
  type RoadmapTrack,
} from "../data/roadmaps";
import { Breadcrumbs, PageContainer, PageHeader, ProgressRing } from "../components/ui";

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
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
  const matched = (node.docs ?? []).flatMap((id) =>
    (DOC_MAP.get(id)?.headings ?? [])
      .filter((heading) => heading.depth === 2)
      .map((heading) => cleanTopic(heading.text))
      .filter((text) => keywords.some((keyword) => text.includes(keyword))),
  );
  return [...new Set([...(node.topics ?? []).map(cleanTopic), ...matched])].slice(0, 9);
}

function categoryMeta(category: RoadmapCategory) {
  return ROADMAP_CATEGORIES.find((item) => item.id === category) ?? ROADMAP_CATEGORIES[0];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const completed = completedDocSet(state.docs);
  const currentGoalRoadmap = state.plan ? ROADMAP_MAP.get(state.plan.goal.roadmapId) : null;

  const rawCategory = searchParams.get("category");
  const category: RoadmapCategory | "all" =
    rawCategory && ROADMAP_CATEGORIES.some((item) => item.id === rawCategory)
      ? (rawCategory as RoadmapCategory)
      : "all";
  const rawTrack = searchParams.get("track");
  const track: RoadmapTrack | "all" =
    rawTrack && (ROADMAP_TRACKS as readonly string[]).includes(rawTrack) ? (rawTrack as RoadmapTrack) : "all";

  const setFilter = (nextCategory: RoadmapCategory | "all", nextTrack: RoadmapTrack | "all") => {
    const params = new URLSearchParams();
    if (nextCategory !== "all") params.set("category", nextCategory);
    if (nextTrack !== "all") params.set("track", nextTrack);
    setSearchParams(params, { replace: true });
  };

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        ROADMAP_CATEGORIES.map((item) => [item.id, ROADMAPS.filter((roadmap) => roadmap.category === item.id).length]),
      ) as Record<RoadmapCategory, number>,
    [],
  );

  const trackCounts = useMemo(() => {
    const base = ROADMAPS.filter((roadmap) => category === "all" || roadmap.category === category);
    return Object.fromEntries(
      ROADMAP_TRACKS.map((item) => [item, base.filter((roadmap) => roadmapTrack(roadmap.id) === item).length]),
    ) as Record<RoadmapTrack, number>;
  }, [category]);

  const roadmaps = useMemo(
    () =>
      ROADMAPS.filter((roadmap) => {
        if (category !== "all" && roadmap.category !== category) return false;
        if (track !== "all" && roadmapTrack(roadmap.id) !== track) return false;
        if (!query.trim()) return true;
        const haystack = `${roadmap.name} ${roadmap.audience} ${roadmap.description} ${roadmapTrack(roadmap.id)} ${categoryMeta(roadmap.category).label}`;
        return haystack.toLowerCase().includes(query.trim().toLowerCase());
      }),
    [category, track, query],
  );

  const groups = ROADMAP_CATEGORIES.map((item) => ({
    ...item,
    roadmaps: roadmaps.filter((roadmap) => roadmap.category === item.id),
  })).filter((group) => group.roadmaps.length > 0);

  const hasFilters = category !== "all" || track !== "all" || query.trim().length > 0;

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "路线图库" }]} className="mb-4" />
      <PageHeader
        eyebrow="ROADMAP LIBRARY · ROLE + SKILL"
        title="路线图库"
        description={`${ROADMAPS.length} 条路线，按入门 / 职业 / 技术分组，再按前端、后端、移动端等方向筛选。每条路线有独立阶段和节点。`}
        actions={
          <a href="https://roadmap.sh/roadmaps/?g=Absolute+Beginners" target="_blank" rel="noreferrer noopener" className="btn-ghost">
            官方目录 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      {currentGoalRoadmap ? (
        <Link
          to="/plan"
          className="mb-5 flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/[0.045] px-4 py-3 transition hover:border-accent/40 sm:flex-row sm:items-center"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Route className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold text-ink">当前计划：{state.plan?.goal.name || state.plan?.goal.title}</p>
            <p className="text-[9.5px] text-muted">目标路线 {currentGoalRoadmap.name} · {state.plan?.goal.days} 天</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-accent">打开计划 <ArrowRight className="h-3 w-3" /></span>
        </Link>
      ) : null}

      <section className="mb-5 overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-card">
        <div className="border-b border-line/10 p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            <SlidersHorizontal className="h-3 w-3" /> 先选分类
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={() => setFilter("all", "all")}
              className={`rounded-xl border p-3 text-left transition ${category === "all" ? "border-accent/40 bg-accent/[0.06]" : "border-line/10 bg-paper/40 hover:border-accent/25"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[12px] font-semibold ${category === "all" ? "text-accent" : "text-ink"}`}>全部路线</span>
                <span className="font-mono text-[10px] text-muted">{ROADMAPS.length}</span>
              </div>
              <p className="mt-1 text-[9px] leading-4 text-muted">完整目录，按三类分组展示</p>
            </button>
            {ROADMAP_CATEGORIES.map((item) => {
              const selected = category === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id, "all")}
                  className={`rounded-xl border p-3 text-left transition ${selected ? "border-accent/40 bg-accent/[0.06]" : "border-line/10 bg-paper/40 hover:border-accent/25"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[12px] font-semibold ${selected ? "text-accent" : "text-ink"}`}>{item.label}</span>
                    <span className="font-mono text-[10px] text-muted">{categoryCounts[item.id]}</span>
                  </div>
                  <p className="mt-1 text-[9px] leading-4 text-muted">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索路线、岗位或方向…"
              className="input py-2 pl-9 text-[11.5px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[9.5px] text-muted/70">方向</span>
            <button onClick={() => setFilter(category, "all")} className={`chip ${track === "all" ? "chip-active" : ""}`}>全部</button>
            {ROADMAP_TRACKS.map((item) => {
              const count = trackCounts[item];
              if (count === 0) return null;
              return (
                <button key={item} onClick={() => setFilter(category, item)} className={`chip ${track === item ? "chip-active" : ""}`}>
                  {item} <span className="font-mono text-[8px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          找到 <span className="font-semibold text-ink">{roadmaps.length}</span> 条路线
          {category !== "all" ? ` · ${categoryMeta(category).label}` : ""}
          {track !== "all" ? ` · ${track}` : ""}
          {query.trim() ? ` · 搜索“${query.trim()}”` : ""}
        </p>
        {hasFilters ? (
          <button
            onClick={() => {
              setQuery("");
              setFilter("all", "all");
            }}
            className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-coral"
          >
            <X className="h-3 w-3" /> 清除筛选
          </button>
        ) : null}
      </div>

      <div className="space-y-8">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/20 py-14 text-center">
            <p className="text-[12px] text-muted">这个分类下没有匹配的路线。</p>
            <button onClick={() => { setQuery(""); setFilter("all", "all"); }} className="btn-ghost mt-3">查看全部路线</button>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.id} id={`roadmaps-${group.id}`} className="scroll-mt-24">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-line/10 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-bold text-ink">{group.label}</h2>
                    <span className="font-mono text-[9px] text-muted/60">{group.roadmaps.length} 条</span>
                  </div>
                  <p className="mt-0.5 text-[9.5px] text-muted">{group.description}</p>
                </div>
                {category === "all" ? (
                  <button onClick={() => setFilter(group.id, "all")} className="text-[9.5px] text-accent hover:underline">
                    只看{group.shortLabel}路线 →
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.roadmaps.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} completed={completed} current={state.plan?.goal.roadmapId === roadmap.id} />)}
              </div>
            </section>
          ))
        )}
      </div>

      <section className="mt-9 rounded-2xl border border-line/10 bg-surface p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow mb-1">OFFICIAL DIRECTORY</p>
            <h2 className="text-[16px] font-bold text-ink">官方完整路线目录</h2>
            <p className="mt-1 text-[10px] text-muted">平台精编 {ROADMAPS.length} 条；这里保留 roadmap.sh 官方目录入口，避免把“平台没精编”误认为“路线不存在”。</p>
          </div>
          <a href="https://roadmap.sh/roadmaps/?g=Absolute+Beginners" target="_blank" rel="noreferrer noopener" className="text-[10px] text-accent">打开完整目录 ↗</a>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { group: "Absolute Beginners", links: [["Frontend Beginner","frontend-beginner"],["Backend Beginner","backend-beginner"],["DevOps Beginner","devops-beginner"],["Git & GitHub Beginner","git-github-beginner"]] },
            { group: "Role-Based", links: [["Frontend","frontend"],["Backend","backend"],["Full Stack","full-stack"],["Android","android"],["iOS","ios"],["DevOps","devops"],["AI Engineer","ai-engineer"],["Data Analyst","data-analyst"],["QA","qa"],["Software Architect","software-architect"]] },
            { group: "Skill-Based", links: [["JavaScript","javascript"],["TypeScript","typescript"],["React","react"],["React Native","react-native"],["Node.js","nodejs"],["Java","java"],["Go","golang"],["Python","python"],["Spring Boot","spring-boot"],["API Design","api-design"],["SQL","sql"],["PostgreSQL","postgresql-dba"],["Redis","redis"],["Docker","docker"],["Kubernetes","kubernetes"],["System Design","system-design"],["Computer Science","computer-science"],["Git & GitHub","git-github"]] },
          ].map((group) => (
            <div key={group.group} className="rounded-xl border border-line/10 bg-paper/40 p-3">
              <p className="mb-2 text-[10px] font-semibold text-ink">{group.group}</p>
              <div className="flex flex-wrap gap-1">
                {group.links.map(([label, slug]) => (
                  <a key={slug} href={`https://roadmap.sh/${slug}`} target="_blank" rel="noreferrer noopener" className="rounded-md border border-line/10 bg-surface px-2 py-1 text-[8.5px] text-muted transition hover:border-accent/30 hover:text-accent">
                    {label} ↗
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 rounded-2xl border border-line/10 bg-raised/30 px-4 py-3 text-[10px] leading-5 text-muted">
        说明：分类与方向是平台自己的导航结构，路线节点和阶段由平台独立编排；roadmap.sh 官方完整图可能包含更多工具与分支，可通过每条路线的“官方完整图”打开。
      </div>
    </PageContainer>
  );
}

function RoadmapCard({
  roadmap,
  completed,
  current,
}: {
  roadmap: Roadmap;
  completed: Set<string>;
  current: boolean;
}) {
  const stats = roadmapStats(roadmap, completed);
  const track = roadmapTrack(roadmap.id);
  return (
    <div className={`card flex flex-col p-4 transition hover:border-accent/30 ${current ? "border-accent/35" : ""}`}>
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-accent">
          <Layers3 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link to={`/roadmap/${roadmap.id}`} className="text-[13.5px] font-semibold text-ink hover:text-accent">{roadmap.name}</Link>
            {current ? <span className="chip border-accent/25 text-accent">当前计划</span> : null}
          </div>
          <p className="mt-0.5 text-[9px] text-muted">{roadmap.audience}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="chip py-0.5 text-[8px]">{categoryMeta(roadmap.category).shortLabel}</span>
        <span className="chip py-0.5 text-[8px]">{track}</span>
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
      <div className="mt-3 flex items-center justify-between border-t border-line/10 pt-2.5">
        <Link to={`/roadmap/${roadmap.id}`} className="inline-flex items-center gap-1 text-[9.5px] text-accent">
          打开路线 <ArrowRight className="h-3 w-3" />
        </Link>
        <Link to={`/plan?roadmap=${roadmap.id}`} className="inline-flex items-center gap-1 text-[9px] text-muted hover:text-accent">
          <Route className="h-2.5 w-2.5" /> 用此路线做计划
        </Link>
      </div>
    </div>
  );
}

export function RoadmapDetailPage() {
  const { roadmapId = "" } = useParams();
  const roadmap = ROADMAP_MAP.get(roadmapId);
  const { state } = useStore();
  const completed = completedDocSet(state.docs);
  const [coverageQuery, setCoverageQuery] = useState("");

  if (!roadmap) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "路线图库", to: "/roadmap" }, { label: "未找到" }]} className="mb-4" />
        <PageHeader eyebrow="404" title="没有这条路线" description="请从路线目录重新选择。" />
      </PageContainer>
    );
  }

  const stats = roadmapStats(roadmap, completed);
  const roleRoadmapId = roadmapForRole(state.role);
  const currentPlanRoadmap = state.plan?.goal.roadmapId === roadmap.id;
  const currentStage = roadmap.stages.find((stage) => {
    const docs = [...new Set(stage.nodes.flatMap((node) => node.docs ?? []))];
    return docs.some((id) => !state.docs[id]?.completed);
  });
  const currentDoc = currentStage?.nodes.flatMap((node) => node.docs ?? []).find((id) => !state.docs[id]?.completed);
  const currentDocMeta = currentDoc ? DOC_MAP.get(currentDoc) : null;
  const officialSlug = OFFICIAL_SLUGS[roadmap.id];
  const officialNames = officialSlug
    ? (officialCoverage as Record<string, string[]>)[officialSlug] ?? []
    : [];
  const ownText = roadmap.stages
    .flatMap((stage) => stage.nodes.flatMap((node) => [node.title, ...topicList(node)]))
    .map((text) => text.toLowerCase());
  const coveredSet = new Set(
    officialNames.filter((name) =>
      ownText.some((text) => text.includes(name.toLowerCase()) || name.toLowerCase().includes(text)),
    ),
  );
  const filteredOfficialNames = officialNames.filter((name) =>
    coverageQuery.trim() ? name.toLowerCase().includes(coverageQuery.trim().toLowerCase()) : true,
  );

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "总览", to: "/" },
          { label: "路线图库", to: "/roadmap" },
          { label: categoryMeta(roadmap.category).label, to: `/roadmap?category=${roadmap.category}` },
          { label: roadmap.name },
        ]}
        className="mb-4"
      />

      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line/10 bg-surface p-5 shadow-card lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ProgressRing percent={stats.docs ? (stats.completed / stats.docs) * 100 : 0} size={70} label={stats.docs ? `${stats.completed}/${stats.docs}` : "—"} />
          <div className="min-w-0">
            <p className="eyebrow mb-1">{categoryMeta(roadmap.category).label} · {roadmapTrack(roadmap.id)} · {roadmap.audience}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[34px]">{roadmap.name}</h1>
              {currentPlanRoadmap ? <span className="chip border-accent/25 text-accent">当前计划路线</span> : null}
            </div>
            <p className="mt-1 text-[11px] leading-5 text-muted">{roadmap.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px]">
              <span className="chip">{stats.stages} 个阶段</span>
              <span className="chip">{stats.nodes} 个节点</span>
              <span className="chip">{stats.docs} 篇关联精读</span>
              <Link to={`/roadmap?category=${roadmap.category}&track=${encodeURIComponent(roadmapTrack(roadmap.id))}`} className="chip hover:border-accent/30 hover:text-accent">
                同类路线
              </Link>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to={`/plan?roadmap=${roadmap.id}`} className="btn-primary">
            <Route className="h-3.5 w-3.5" /> {currentPlanRoadmap ? "当前计划 · 打开计划" : "用此路线做计划"}
          </Link>
          {currentDoc ? (
            <Link to={`/doc/${currentDoc}`} className="btn-ghost">
              <Play className="h-3.5 w-3.5" /> 继续 {currentDocMeta?.shortTitle ?? currentDoc}
            </Link>
          ) : (
            <Link to="/quiz" className="btn-ghost">
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
          {officialNames.length > 0 ? (
            <details className="card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="eyebrow mb-0.5">OFFICIAL COVERAGE</p>
                  <p className="text-[12px] font-semibold text-ink">官方完整节点清单 · {officialNames.length}</p>
                </div>
                <span className="text-[9px] text-muted">已对应 {coveredSet.size} 个 · 点击展开</span>
              </summary>
              <div className="border-t border-line/10 p-4">
                <p className="text-[9.5px] leading-5 text-muted">
                  这里列出 roadmap.sh 官方路线的全部节点名称，保证范围完整；绿色代表平台已有对应节点/精读，灰色节点可直接打开官方资料。节点说明与学习顺序由本平台编写。
                </p>
                <input value={coverageQuery} onChange={(event) => setCoverageQuery(event.target.value)} placeholder="在官方节点清单里搜索…" className="input mt-2 py-1.5 text-[10.5px]" />
                <div className="mt-2 flex max-h-72 flex-wrap gap-1 overflow-y-auto">
                  {filteredOfficialNames.map((name) => {
                    const covered = coveredSet.has(name);
                    return (
                      <a
                        key={name}
                        href={roadmap.officialUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`rounded-md border px-1.5 py-1 text-[8.5px] transition ${covered ? "border-accent/25 bg-accent/[0.05] text-accent" : "border-line/10 bg-surface text-muted hover:border-accent/30 hover:text-ink"}`}
                      >
                        {name} {covered ? "✓" : "↗"}
                      </a>
                    );
                  })}
                </div>
              </div>
            </details>
          ) : null}
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
          <div className="card p-4">
            <p className="eyebrow mb-2">这条路线包含</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{stats.stages}</p><p className="text-[8.5px] text-muted">阶段</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{stats.nodes}</p><p className="text-[8.5px] text-muted">节点</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{stats.docs}</p><p className="text-[8.5px] text-muted">精读</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{officialNames.length || "—"}</p><p className="text-[8.5px] text-muted">官方节点</p></div>
            </div>
            {roleRoadmapId === roadmap.id ? (
              <p className="mt-3 rounded-lg bg-accent/[0.05] px-2.5 py-2 text-[9px] leading-4 text-accent">
                这条路线与你的本机角色匹配；是否作为目标由你在计划里确认。
              </p>
            ) : null}
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
