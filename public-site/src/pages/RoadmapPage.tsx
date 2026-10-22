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
  OFFICIAL_NODE_TOTAL,
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

function dedupeGroups(groups: Array<{ heading: string; routes: Array<{ slug: string; title: string }> }>) {
  const seen = new Set<string>();
  return groups.map((group) => ({
    ...group,
    routes: group.routes.filter((route) => {
      if (seen.has(route.slug)) return false;
      seen.add(route.slug);
      return true;
    }),
  })).filter((group) => group.routes.length > 0);
}

const TYPE_TABS = [
  { id: "all", label: "全部路线", group: null as string | null, count: ROADMAP_TOTAL },
  { id: "role", label: "职业路线", group: "Role Based Roadmaps", count: ROADMAP_CATALOG.allGroups.find((group) => group.heading === "Role Based Roadmaps")?.routes.length ?? 0 },
  { id: "skill", label: "技术路线", group: "Skill Based Roadmaps", count: ROADMAP_CATALOG.allGroups.find((group) => group.heading === "Skill Based Roadmaps")?.routes.length ?? 0 },
  { id: "beginner", label: "入门路线", group: "Absolute Beginners", count: ROADMAP_CATALOG.allGroups.find((group) => group.heading === "Absolute Beginners")?.routes.length ?? 0 },
  { id: "best", label: "最佳实践", group: "Best Practices", count: ROADMAP_CATALOG.allGroups.find((group) => group.heading === "Best Practices")?.routes.length ?? 0 },
];

const DIRECTION_OPTIONS = ROADMAP_CATALOG_CATEGORIES.filter((category) => category.id !== "all");

function directionLabel(id: string): string {
  return id === "beginner" ? "零基础专题" : categoryLabelZh(id);
}

function routesForType(group: string | null): Array<{ slug: string; title: string }> {
  if (!group) return [];
  return ROADMAP_CATALOG.allGroups.find((item) => item.heading === group)?.routes ?? [];
}

function typeTabForGroup(group: string): string | null {
  if (group === "Role Based Roadmaps") return "role";
  if (group === "Skill Based Roadmaps") return "skill";
  if (group === "Absolute Beginners") return "beginner";
  if (group === "Best Practices") return "best";
  return null;
}

export function RoadmapIndexPage() {
  const { state } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const rawType = searchParams.get("type") ?? "all";
  const typeMeta = TYPE_TABS.find((item) => item.id === rawType) ?? TYPE_TABS[0];
  const rawCategory = searchParams.get("category") ?? "all";
  const category = DIRECTION_OPTIONS.some((item) => item.id === rawCategory) ? rawCategory : "all";
  const currentGoal = state.plan ? ROADMAP_MAP.get(state.plan.goal.roadmapId) : null;

  const applyFilter = (nextType: string, nextCategory: string) => {
    const params = new URLSearchParams();
    if (nextType !== "all") params.set("type", nextType);
    if (nextCategory !== "all") params.set("category", nextCategory);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (item: { slug: string; title: string }) => {
      if (!needle) return true;
      const roadmap = ROADMAP_MAP.get(item.slug);
      return `${item.title} ${item.slug} ${roadmap?.nameZh ?? ""} ${roadmap?.description ?? ""}`.toLowerCase().includes(needle);
    };
    if (typeMeta.id === "all") {
      const source = category === "all"
        ? ROADMAP_CATALOG.allGroups
        : ROADMAP_CATALOG.categoryGroups[category] ?? [];
      return dedupeGroups(source.map((group) => ({
        ...group,
        routes: group.routes.filter(matches),
      })));
    }
    const directionSlugs = category === "all"
      ? null
      : new Set((ROADMAP_CATALOG.categoryGroups[category] ?? []).flatMap((group) => group.routes.map((route) => route.slug)));
    const seen = new Set<string>();
    const routes = routesForType(typeMeta.group)
      .filter((item) => !directionSlugs || directionSlugs.has(item.slug))
      .filter(matches)
      .filter((item) => {
        if (seen.has(item.slug)) return false;
        seen.add(item.slug);
        return true;
      });
    if (routes.length === 0) return [];
    return [{
      heading: `${typeMeta.label}${category === "all" ? "" : ` · ${directionLabel(category)}`}`,
      routes,
    }];
  }, [category, query, typeMeta]);

  const resultCount = new Set(groups.flatMap((group) => group.routes.map((route) => route.slug))).size;
  const directionMeta = DIRECTION_OPTIONS.find((item) => item.id === category);
  const supplementalRoutes = typeMeta.id === "all" && category === "all" && !query.trim()
    ? ROADMAP_CATALOG.routes
        .filter((route) => !route.inDirectory)
        .map((route) => ROADMAP_MAP.get(route.slug))
        .filter((route): route is Roadmap => Boolean(route))
    : [];
  const extras = typeMeta.id === "all" && category === "all" && !query.trim()
    ? [...ROADMAP_MAP.values()]
        .filter((route) => route.groupLabel === "平台精编补充")
        .filter((route, index, list) => list.findIndex((item) => item.id === route.id) === index)
    : [];
  const activeFilters = typeMeta.id !== "all" || category !== "all" || query.trim().length > 0;

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "路线图库" }]} className="mb-4" />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5">开发者路线图 · {ROADMAP_TOTAL} 条</p>
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-ink sm:text-[38px]">路线图库</h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-6 text-muted">
            按 roadmap.sh 公开目录同步：{ROADMAP_TOTAL} 条路线、完整分类与节点清单。先选路线类型和方向，结果在下方展示。
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
            <p className="text-[9.5px] text-muted">目标路线 {roadmapDisplayName(currentGoal)} · {state.plan?.goal.days} 天</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-accent">打开计划 <ArrowRight className="h-3 w-3" /></span>
        </Link>
      ) : null}

      <section className="card mb-4 p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="eyebrow">路线分类</p>
          <span className="text-[8.5px] text-muted/60">{ROADMAP_TOTAL} 条 · {ROADMAP_SCRAPED_AT} 同步</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TYPE_TABS.map((tab) => {
            const active = typeMeta.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => applyFilter(tab.id, "all")}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[10.5px] transition ${
                  active ? "border-accent/35 bg-accent/[0.07] font-semibold text-accent" : "border-line/10 bg-surface text-muted hover:border-accent/25 hover:text-ink"
                }`}
              >
                {tab.label}
                <span className={`font-mono text-[8.5px] ${active ? "text-accent/70" : "text-muted/50"}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={category}
            onChange={(event) => applyFilter(typeMeta.id, event.target.value)}
            className="input w-full py-2 text-[10.5px] sm:w-[220px]"
            aria-label="选择细分方向"
          >
            <option value="all">全部方向（{ROADMAP_TOTAL}）</option>
            {DIRECTION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{directionLabel(option.id)}（{option.count}）</option>
            ))}
          </select>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`在${typeMeta.label}${category === "all" ? "" : ` / ${directionLabel(category)}`}中搜索…`} className="input py-2 pl-9 text-[11.5px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted/60">{resultCount} 条</span>
            {activeFilters ? (
              <button onClick={() => { setQuery(""); applyFilter("all", "all"); }} className="btn-quiet text-[10px]">
                <X className="h-3 w-3" /> 清除
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line/10 pt-2 text-[8.5px] text-muted/70">
          <span>当前：{typeMeta.label}{directionMeta ? ` / ${directionLabel(directionMeta.id)}` : ""}</span>
          <span className="chip border-accent/20 text-accent">分类计数已校验</span>
          <span>{ROADMAP_TOTAL}/{ROADMAP_TOTAL} 条有站内详情 · {OFFICIAL_NODE_TOTAL.toLocaleString("zh-CN")} 个官方主题</span>
        </div>
      </section>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-ink">
            {typeMeta.label}{directionMeta ? ` / ${directionLabel(directionMeta.id)}` : ""}
          </p>
          <p className="mt-0.5 text-[8.5px] text-muted/60">
            {typeMeta.id === "all" && category === "all"
              ? "按官方目录分组显示；切换上方类型可只看职业或技术路线。"
              : "按当前筛选显示路线，点击卡片打开站内详情。"}
          </p>
        </div>
        {query.trim() ? <span className="text-[9px] text-accent">搜索“{query.trim()}”</span> : null}
      </div>

      <div className="space-y-6">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line/20 py-12 text-center text-[12px] text-muted">
            当前组合没有路线。
            <button onClick={() => applyFilter("all", "all")} className="btn-ghost mt-3">查看全部路线</button>
          </div>
        ) : (
          groups.map((group) => (
            <section key={`${typeMeta.id}-${category}-${group.heading}`}>
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

      {supplementalRoutes.length > 0 ? (
        <section className="mt-7 rounded-2xl border border-line/10 bg-surface p-4">
          <div className="mb-2">
            <p className="eyebrow mb-1">分类补充</p>
            <h2 className="text-[13px] font-bold text-ink">官方分类页出现、未进入 All 96 的路线 · {supplementalRoutes.length} 条</h2>
            <p className="mt-0.5 text-[9px] text-muted">这些路线在 roadmap.sh 的分类筛选里存在，但没有出现在 All Roadmaps 的 96 张卡片中；平台仍提供站内详情和计划入口。</p>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {supplementalRoutes.map((route) => <RouteCard key={route.id} route={route} />)}
          </div>
        </section>
      ) : null}

      {extras.length > 0 ? (
        <section className="mt-7 rounded-2xl border border-line/10 bg-surface p-4">
          <div className="mb-2">
            <p className="eyebrow mb-1">平台扩展</p>
            <h2 className="text-[13px] font-bold text-ink">平台精编补充 · {extras.length} 条</h2>
            <p className="mt-0.5 text-[9px] text-muted">平台针对移动端求职增加的精编路线，不混入官方 96 条计数。</p>
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
  const groupType = typeTabForGroup(roadmap.groupLabel);
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
          ...(groupType ? [{ label: groupName, to: `/roadmap?type=${groupType}` }] : []),
          ...(roadmap.catalogCategories.length > 0 && categoryLabelZh(category.id) !== groupName
            ? [{ label: categoryLabelZh(category.id), to: `/roadmap?${groupType ? `type=${groupType}&` : ""}category=${category.id}` }]
            : []),
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
                  return item ? <Link key={id} to={`/roadmap?${groupType ? `type=${groupType}&` : ""}category=${id}`} className="chip py-0.5 text-[8px] hover:border-accent/30 hover:text-accent">{categoryLabelZh(item.id)}</Link> : null;
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
