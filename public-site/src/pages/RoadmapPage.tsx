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
  Sparkles,
  X,
} from "lucide-react";
import { DOC_MAP, QA_MAP } from "../lib/content";
import { plainInline } from "../lib/text";
import { useStore } from "../lib/store";
import questionMeta from "../data/question-meta.json";
import {
  ROADMAP_CATALOG,
  ROADMAP_CATALOG_CATEGORIES,
  ROADMAP_MAP,
  ROADMAP_OFFICIAL_DIRECTORY,
  ROADMAP_SOURCE,
  ROADMAP_SCRAPED_AT,
  ROADMAP_TOTAL,
  categoryLabelZh,
  groupLabelZh,
  roadmapCatalogCategory,
  roadmapDisplayName,
  roadmapStats,
  type Roadmap,
  type RoadmapNode,
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
        <a key={source.url + source.label} href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-surface px-2 py-1 text-[9px] text-muted transition hover:border-accent/30 hover:text-accent">
          {source.label} <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ))}
      <a href={roadmap.officialUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 rounded-lg border border-line/10 bg-raised/40 px-2 py-1 text-[9px] text-muted/70 transition hover:text-accent">
        官方完整图 <ArrowUpRight className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}

function RouteCard({ route }: { route: Roadmap }) {
  const stats = roadmapStats(route, new Set());
  return (
    <Link
      to={`/roadmap/${route.id}`}
      className="group flex min-w-0 items-center gap-3 rounded-lg border border-line/10 bg-surface px-3 py-2.5 transition hover:border-accent/35 hover:bg-accent/[0.02]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[12px] font-semibold text-ink group-hover:text-accent">{roadmapDisplayName(route)}</p>
          {route.curated ? <span className="shrink-0 rounded bg-accent/[0.08] px-1 py-0.5 text-[7.5px] font-semibold text-accent">精编</span> : null}
        </div>
        <p className="mt-0.5 truncate text-[8.5px] text-muted/70">
          {route.nameZh ? `${route.name} · ` : ""}
          {stats.docs > 0 ? `${stats.docs} 篇精读 · ${stats.officialTopics || stats.nodes} 官方主题` : `${stats.officialTopics || stats.nodes} 个官方主题`}
        </p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted/50 transition group-hover:text-accent" />
    </Link>
  );
}

export function RoadmapIndexPage() {
  const { state } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const rawCategory = searchParams.get("category") ?? "all";
  const category = ROADMAP_CATALOG_CATEGORIES.some((item) => item.id === rawCategory) ? rawCategory : "all";
  const currentGoal = state.plan ? ROADMAP_MAP.get(state.plan.goal.roadmapId) : null;

  const chooseCategory = (id: string) => {
    const params = new URLSearchParams();
    if (id !== "all") params.set("category", id);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const groups = useMemo(() => {
    const source = category === "all"
      ? ROADMAP_CATALOG.allGroups
      : ROADMAP_CATALOG.categoryGroups[category] ?? [];
    const needle = query.trim().toLowerCase();
    return source.map((group) => ({
      ...group,
      routes: group.routes.filter((item) => {
        if (!needle) return true;
        const roadmap = ROADMAP_MAP.get(item.slug);
        return `${item.title} ${item.slug} ${roadmap?.nameZh ?? ""} ${roadmap?.description ?? ""}`.toLowerCase().includes(needle);
      }),
    })).filter((group) => group.routes.length > 0);
  }, [category, query]);

  const resultCount = new Set(groups.flatMap((group) => group.routes.map((route) => route.slug))).size;
  const extras = category === "all" && !query.trim()
    ? [...ROADMAP_MAP.values()]
        .filter((route) => route.groupLabel === "平台精编补充")
        .filter((route, index, list) => list.findIndex((item) => item.id === route.id) === index)
    : [];
  const categoryMeta = ROADMAP_CATALOG_CATEGORIES.find((item) => item.id === category) ?? ROADMAP_CATALOG_CATEGORIES[0];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "路线图库" }]} className="mb-4" />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5">开发者路线图 · {ROADMAP_TOTAL} 条</p>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-ink sm:text-[38px]">路线图库</h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-muted">
            按 roadmap.sh 公开目录同步：{ROADMAP_TOTAL} 条路线、完整分类与节点清单。左侧选分类，右侧按分类分组浏览；每条路线都有站内详情页。
          </p>
        </div>
        <a href={ROADMAP_OFFICIAL_DIRECTORY} target="_blank" rel="noreferrer noopener" className="btn-ghost">
          对照官方目录 <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {currentGoal ? (
        <Link to="/plan" className="mb-5 flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/[0.045] px-4 py-3 transition hover:border-accent/40 sm:flex-row sm:items-center">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Route className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold text-ink">当前计划：{state.plan?.goal.name || state.plan?.goal.title}</p>
            <p className="text-[9.5px] text-muted">目标路线 {currentGoal.name}{currentGoal.nameZh ? ` · ${currentGoal.nameZh}` : ""} · {state.plan?.goal.days} 天</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-accent">打开计划 <ArrowRight className="h-3 w-3" /></span>
        </Link>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-[80px] lg:self-start">
          <div className="card min-w-0 p-2">
            <div className="mb-1 flex items-center justify-between px-2.5 pt-1.5">
              <p className="eyebrow">分类</p>
              <span className="font-mono text-[8px] text-muted/50">同步 {ROADMAP_SCRAPED_AT.slice(5)}</span>
            </div>
            <div className="flex w-full min-w-0 gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible">
              {ROADMAP_CATALOG_CATEGORIES.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => chooseCategory(item.id)}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[10.5px] transition lg:w-full ${
                      active ? "bg-accent/[0.09] font-semibold text-accent" : "text-muted hover:bg-raised/60 hover:text-ink"
                    }`}
                  >
                    <span className="whitespace-nowrap">{categoryLabelZh(item.id)}</span>
                    <span className={`font-mono text-[8.5px] ${active ? "text-accent/70" : "text-muted/50"}`}>{item.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-line/10 bg-raised/25 p-3 text-[8.5px] leading-4 text-muted/70">
            分类与路线名称来自 roadmap.sh 公开目录；节点清单已同步 {ROADMAP_SCRAPED_AT}。平台自己的精读与计划不覆盖官方页面的全部说明。
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-line/10 bg-surface p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索路线名称、方向或中文名…" className="input py-2 pl-9 text-[11.5px]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-muted/60">{resultCount} 条</span>
              {query ? <button onClick={() => setQuery("")} className="btn-quiet text-[10px]"><X className="h-3 w-3" /> 清除</button> : null}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold text-ink">
                {category === "all" ? "全部路线" : categoryLabelZh(categoryMeta.id)}
                <span className="ml-2 font-mono text-[9px] font-normal text-muted/60">{categoryMeta.count}</span>
              </p>
              <p className="mt-0.5 text-[8.5px] text-muted/60">
                {category === "all" ? "按 roadmap.sh 的目录分组显示；同一路线可能出现在多个分类。" : "显示该分类下命中的路线，分组名称与官方目录一致。"}
              </p>
            </div>
            {query.trim() ? <span className="text-[9px] text-accent">搜索“{query.trim()}”</span> : null}
          </div>

          <div className="space-y-6">
            {groups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line/20 py-12 text-center text-[12px] text-muted">没有匹配的路线。</div>
            ) : (
              groups.map((group) => (
                <section key={`${category}-${group.heading}`}>
                  <h2 className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-muted/70">{groupLabelZh(group.heading)}</h2>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {group.routes.map((item) => {
                      const roadmap = ROADMAP_MAP.get(item.slug);
                      return roadmap ? <RouteCard key={`${group.heading}-${item.slug}`} route={roadmap} /> : null;
                    })}
                  </div>
                </section>
              ))
            )}
          </div>

          {extras.length > 0 ? (
            <section className="mt-7 rounded-2xl border border-line/10 bg-surface p-4">
              <div className="mb-2">
                <p className="eyebrow mb-1">平台扩展</p>
                <h2 className="text-[13px] font-bold text-ink">平台精编补充 · {extras.length} 条</h2>
                <p className="mt-0.5 text-[9px] text-muted">这些是平台针对移动端求职增加的精编路线，不混入上方 {ROADMAP_TOTAL} 条官方目录计数。</p>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {extras.map((route) => <RouteCard key={route.id} route={route} />)}
              </div>
            </section>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-raised/30 px-3.5 py-2.5 text-[9px] leading-4 text-muted/70">
            <GitBranch className="h-3 w-3 text-accent" />
            <span>来源：{ROADMAP_SOURCE}（{ROADMAP_SCRAPED_AT} 同步）。分类计数沿用官方目录；平台不复制官方说明正文，详细内容通过“官方完整图”打开。</span>
          </div>
        </div>
      </div>
    </PageContainer>
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
  const category = roadmapCatalogCategory(roadmap);
  const currentDoc = roadmap.stages.flatMap((stage) => stage.nodes.flatMap((node) => node.docs ?? [])).find((id) => !state.docs[id]?.completed);
  const currentDocMeta = currentDoc ? DOC_MAP.get(currentDoc) : null;
  const filteredTopics = roadmap.officialTopics.filter((name) =>
    coverageQuery.trim() ? name.toLowerCase().includes(coverageQuery.trim().toLowerCase()) : true,
  );
  const currentPlan = state.plan?.goal.roadmapId === roadmap.id;
  const groupName = groupLabelZh(roadmap.groupLabel);
  const categoryLabels = [...new Set(
    roadmap.catalogCategories
      .map((id) => ROADMAP_CATALOG_CATEGORIES.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => categoryLabelZh(item.id)),
  )].filter((label) => label !== groupName);

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "总览", to: "/" },
          { label: "路线图库", to: "/roadmap" },
          ...(roadmap.catalogCategories.length > 0 ? [{ label: categoryLabelZh(category.id), to: `/roadmap?category=${category.id}` }] : []),
          { label: roadmapDisplayName(roadmap) },
        ]}
        className="mb-4"
      />

      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line/10 bg-surface p-5 shadow-card lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {stats.docs > 0 ? (
            <ProgressRing percent={(stats.completed / stats.docs) * 100} size={70} label={`${stats.completed}/${stats.docs}`} />
          ) : (
            <div className="flex h-[70px] w-[70px] shrink-0 flex-col items-center justify-center rounded-full border border-accent/20 bg-accent/[0.04]">
              <span className="font-display text-[19px] font-bold text-accent">{stats.officialTopics || stats.nodes}</span>
              <span className="text-[7.5px] text-muted">官方主题</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="eyebrow mb-1">{[groupName, ...categoryLabels].slice(0, 4).join(" · ")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] font-bold leading-tight text-ink sm:text-[34px]">{roadmapDisplayName(roadmap)}</h1>
              {roadmap.nameZh ? <span className="chip border-line/15">{roadmap.name}</span> : null}
              {currentPlan ? <span className="chip border-accent/25 text-accent">当前计划路线</span> : null}
            </div>
            <p className="mt-1 text-[11px] leading-5 text-muted">{roadmap.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px]">
              <span className="chip">{stats.stages} 个阶段</span>
              <span className="chip">{stats.nodes} 个学习节点</span>
              {stats.officialTopics > 0 ? <span className="chip">{stats.officialTopics} 个官方主题</span> : null}
              {stats.docs > 0 ? <span className="chip">{stats.docs} 篇关联精读</span> : null}
              <span className={`chip ${roadmap.curated ? "border-accent/20 text-accent" : "border-line/15"}`}>{roadmap.curated ? "平台精编" : "官方节点 · 站内计划"}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to={`/plan?roadmap=${roadmap.id}`} className="btn-primary">
            <Route className="h-3.5 w-3.5" /> {currentPlan ? "当前计划 · 打开计划" : "用此路线做计划"}
          </Link>
          {currentDoc ? (
            <Link to={`/doc/${currentDoc}`} className="btn-ghost">
              <Play className="h-3.5 w-3.5" /> 继续 {currentDocMeta?.shortTitle ?? currentDoc}
            </Link>
          ) : null}
          <a href={roadmap.officialUrl} target="_blank" rel="noreferrer noopener" className="btn-ghost">
            官方完整图 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {!roadmap.curated ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky/20 bg-sky/[0.04] px-3.5 py-2.5 text-[9.5px] leading-5 text-muted">
          <Sparkles className="h-3.5 w-3.5 text-sky" />
          这条路线已同步 {stats.officialTopics} 个官方主题节点，并按基础 / 核心 / 进阶 / 工程重排成站内学习路径；平台尚未逐篇精编，节点资料通过官方路线打开。
        </div>
      ) : null}

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
          {roadmap.stages.map((stage, stageIndex) => (
            <section key={stage.id} id={`node-stage-${stage.id}`} className="scroll-mt-24">
              <div className="mb-3 flex items-start gap-3 border-b border-line/10 pb-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-[11px] font-semibold text-lime dark:bg-lime dark:text-[#172014]">
                  {String(stageIndex + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[16px] font-bold text-ink">{stage.title}</h2>
                    <span className="text-[9.5px] text-muted">{stage.subtitle}</span>
                    <span className="ml-auto font-mono text-[8.5px] text-muted/60">{stage.nodes.length} 节点</span>
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
                              {status === "done" ? "已完成" : status === "active" ? "在学" : status === "external" ? "官方资料" : "未开始"}
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
          ))}

          {roadmap.officialTopics.length > 0 ? (
            <details className="card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="eyebrow mb-0.5">OFFICIAL TOPICS</p>
                  <p className="text-[12px] font-semibold text-ink">官方完整主题清单 · {roadmap.officialTopics.length}</p>
                </div>
                <span className="text-[9px] text-muted">点击展开</span>
              </summary>
              <div className="border-t border-line/10 p-4">
                <p className="text-[9.5px] leading-5 text-muted">
                  这里同步 roadmap.sh 官方路线中的主题名称，用于确认范围完整；具体说明、前后关系和最新资源请打开官方路线。平台不复制官方正文。
                </p>
                <input value={coverageQuery} onChange={(event) => setCoverageQuery(event.target.value)} placeholder="在官方主题清单里搜索…" className="input mt-2 py-1.5 text-[10.5px]" />
                <div className="mt-2 flex max-h-80 flex-wrap gap-1 overflow-y-auto">
                  {filteredTopics.map((name) => (
                    <a key={name} href={roadmap.officialUrl} target="_blank" rel="noreferrer noopener" className="rounded-md border border-line/10 bg-surface px-1.5 py-1 text-[8.5px] text-muted transition hover:border-accent/30 hover:text-accent">
                      {name} ↗
                    </a>
                  ))}
                </div>
              </div>
            </details>
          ) : null}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[80px] lg:self-start">
          <div className="card p-4">
            <p className="eyebrow mb-2">这条路线怎么用</p>
            <ol className="space-y-2 text-[10px] leading-5 text-muted">
              <li>1. 先从“基础与路线地图”知道整条路线有哪些主题。</li>
              <li>2. 有站内精读的节点，先精读再做自测和题库。</li>
              <li>3. 没有精读的节点，打开官方路线看资料，再回到计划勾完成。</li>
              <li>4. 用“用此路线做计划”把节点排进日程，进度只统计这个计划。</li>
            </ol>
          </div>
          <div className="card p-4">
            <p className="eyebrow mb-2">覆盖范围</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{stats.stages}</p><p className="text-[8.5px] text-muted">学习阶段</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{stats.officialTopics || stats.nodes}</p><p className="text-[8.5px] text-muted">官方主题</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{stats.docs}</p><p className="text-[8.5px] text-muted">站内精读</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[18px] font-bold text-ink">{roadmap.catalogCategories.length}</p><p className="text-[8.5px] text-muted">所属分类</p></div>
            </div>
            {roadmap.catalogCategories.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {roadmap.catalogCategories.map((id) => {
                  const item = ROADMAP_CATALOG_CATEGORIES.find((categoryItem) => categoryItem.id === id);
                  return item ? <Link key={id} to={`/roadmap?category=${id}`} className="chip py-0.5 text-[8px] hover:border-accent/30 hover:text-accent">{categoryLabelZh(item.id)}</Link> : null;
                })}
              </div>
            ) : null}
          </div>
          <a href={ROADMAP_OFFICIAL_DIRECTORY} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-[10px] text-muted hover:text-accent">
            <span className="inline-flex items-center gap-1"><GitBranch className="h-3 w-3" /> roadmap.sh 路线索引</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </aside>
      </div>
    </PageContainer>
  );
}
