import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Search,
  X,
} from "lucide-react";
import { DOCS, TOTAL_QA, TOTAL_LINES, knowledgePointsForDoc } from "../lib/content";
import { knowledgePointTotal, knowledgePointsForRoute, routesForDoc } from "../lib/knowledge";
import { useStore } from "../lib/store";
import {
  ROADMAP_CATALOG,
  ROADMAP_CATALOG_CATEGORIES,
  ROADMAP_MAP,
  ROADMAP_TOTAL,
  categoryLabelZh,
  groupLabelZh,
  roadmapDisplayName,
} from "../data/roadmaps";
import { Breadcrumbs, PageContainer } from "../components/ui";
import type { Roadmap } from "../data/roadmaps";

const ROLE_ROUTES = ROADMAP_CATALOG.allGroups.find((group) => group.heading === "Role Based Roadmaps")?.routes ?? [];
const CATEGORY_TABS = [
  { id: "all", label: "全部路线", count: ROADMAP_TOTAL },
  { id: "role", label: "职业路线", count: ROLE_ROUTES.length },
  ...ROADMAP_CATALOG_CATEGORIES.filter((item) => item.id !== "all").map((item) => ({ id: item.id, label: categoryLabelZh(item.id), count: item.count })),
];

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

function uniqueRoadmaps(): Roadmap[] {
  return [...new Map([...ROADMAP_MAP.values()].map((roadmap) => [roadmap.id, roadmap])).values()];
}

function KnowledgeCard({ route }: { route: Roadmap }) {
  const bundles = knowledgePointsForRoute(route.id);
  const points = bundles.flatMap((bundle) => bundle.points.map((point) => ({ doc: bundle.doc, point })));

  return (
    <div className="flex flex-col rounded-xl border border-line/10 bg-surface p-3.5 transition hover:border-accent/30">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link to={`/roadmap/${route.id}`} className="text-[12.5px] font-semibold text-ink hover:text-accent">{roadmapDisplayName(route)}</Link>
          <p className="mt-0.5 text-[8.5px] text-muted/70">
            {route.nameZh ? `${route.name} · ` : ""}
            {points.length > 0 ? `${bundles.length} 篇精编 · ${points.length} 个知识点` : `${route.officialTopics.length} 个学习主题`}
          </p>
        </div>
        <Link to={`/roadmap/${route.id}`} className="rounded-md p-1 text-muted/40 transition hover:bg-raised/60 hover:text-accent" aria-label="打开路线">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {points.length > 0 ? (
        <div className="mt-2 space-y-0.5 border-t border-line/10 pt-2">
          {points.slice(0, 3).map((item) => (
            <Link key={`${item.doc.id}-${item.point.slug}`} to={`/learn/${item.doc.id}/${item.point.slug}`} className="flex items-center gap-1.5 rounded-md px-1 py-1 text-[9px] text-muted hover:bg-accent/[0.05] hover:text-accent">
              <BookOpen className="h-2.5 w-2.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.point.title}</span>
            </Link>
          ))}
          {points.length > 3 ? (
            <Link to={`/roadmap/${route.id}`} className="inline-flex items-center gap-1 px-1 pt-1 text-[8.5px] text-accent">
              查看本路线全部 {points.length} 个知识点 <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between border-t border-line/10 pt-2">
          <span className="text-[8.5px] text-muted/60">暂无精编正文，先看主题学习指引</span>
          <Link to={`/roadmap/${route.id}`} className="text-[8.5px] text-accent">去学习 <ArrowRight className="h-2.5 w-2.5" /></Link>
        </div>
      )}
    </div>
  );
}

export function DocsPage() {
  const { state } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const rawCategory = searchParams.get("category") ?? "all";
  const categoryMeta = CATEGORY_TABS.find((item) => item.id === rawCategory) ?? CATEGORY_TABS[0];

  const searchable = useMemo(
    () => uniqueRoadmaps().map((roadmap) => {
      const bundles = knowledgePointsForRoute(roadmap.id);
      return {
        roadmap,
        text: `${roadmap.name} ${roadmap.nameZh ?? ""} ${roadmap.description} ${groupLabelZh(roadmap.groupLabel)} ${roadmap.catalogCategories.map((id) => categoryLabelZh(id)).join(" ")} ${bundles.map((bundle) => `${bundle.doc.title} ${bundle.points.map((point) => point.title).join(" ")}`).join(" ")} ${roadmap.officialTopics.join(" ")}`.toLowerCase(),
        nameText: `${roadmap.name} ${roadmap.nameZh ?? ""}`.toLowerCase(),
      };
    }),
    [],
  );

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return searchable
      .filter((item) => item.text.includes(needle))
      .sort((a, b) => Number(b.nameText.includes(needle)) - Number(a.nameText.includes(needle)) || a.roadmap.name.localeCompare(b.roadmap.name))
      .map((item) => item.roadmap);
  }, [query, searchable]);

  const groups = useMemo(() => {
    if (query.trim()) return [{ heading: `搜索结果 · ${searchResults.length} 条`, routes: searchResults.map((roadmap) => ({ slug: roadmap.id, title: roadmap.name })) }];
    if (categoryMeta.id === "all") return dedupeGroups(ROADMAP_CATALOG.allGroups);
    if (categoryMeta.id === "role") return [{ heading: `职业路线 · ${ROLE_ROUTES.length} 条`, routes: ROLE_ROUTES }];
    return dedupeGroups(ROADMAP_CATALOG.categoryGroups[categoryMeta.id] ?? []);
  }, [categoryMeta, query, searchResults]);

  const resultCount = searchResults.length || new Set(groups.flatMap((group) => group.routes.map((route) => route.slug))).size;
  const totalPoints = knowledgePointTotal();
  const completedPoints = Object.values(state.lessons).filter((lesson) => lesson.completed).length;
  const extras = !query.trim() && categoryMeta.id === "all"
    ? [...ROADMAP_MAP.values()]
        .filter((route) => route.groupLabel === "平台精编补充")
        .filter((route, index, list) => list.findIndex((item) => item.id === route.id) === index)
    : [];
  const searching = query.trim().length > 0;

  const chooseCategory = (id: string) => {
    const params = new URLSearchParams();
    if (id !== "all") params.set("category", id);
    setSearchParams(params, { replace: true });
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "知识库" }]} className="mb-4" />
      <div className="mb-5">
        <p className="eyebrow mb-1.5">知识库 · {DOCS.length} 篇精编 · {totalPoints} 个知识点</p>
        <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-ink sm:text-[38px]">知识库</h1>
        <p className="mt-2 max-w-2xl text-[12px] leading-6 text-muted">
          分类和路线技术保持一致。{DOCS.length} 篇精编拆成 {totalPoints} 个知识点，每个知识点单独学习；其他技术路线提供主题学习页。搜索会跨路线、文档、知识点和主题关键词。
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-muted">
          <span className="chip">{totalPoints} 个精编知识点</span>
          <span className="chip">{completedPoints} 个已学完</span>
          <span className="chip">{ROADMAP_TOTAL} 条技术路线</span>
          <span className="chip">{TOTAL_QA} 道面试问答</span>
          <span className="chip">约 {Math.round(TOTAL_LINES / 1000)}k 行正文</span>
        </div>
      </div>

      <section className="card mb-4 p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow">分类</p>
          <span className="text-[8.5px] text-muted/60">与路线图技术分类一致</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map((tab) => {
            const active = !searching && categoryMeta.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => chooseCategory(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] transition ${active ? "border-accent/35 bg-accent/[0.07] font-semibold text-accent" : "border-line/10 bg-surface text-muted hover:border-accent/25 hover:text-ink"}`}
              >
                {tab.label}
                <span className={`font-mono text-[8px] ${active ? "text-accent/70" : "text-muted/50"}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-line/10 pt-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索全部路线、文档标题、知识点或主题关键词…" className="input py-2 pl-9 text-[11.5px]" />
            {query ? <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:bg-raised" aria-label="清空搜索"><X className="h-3 w-3" /></button> : null}
          </div>
          <span className="font-mono text-[9px] text-muted/60">{resultCount} 条技术路线</span>
        </div>
      </section>

      <div className="space-y-6">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line/20 py-12 text-center text-[12px] text-muted">没有匹配的路线、文档或知识点。</div>
        ) : (
          groups.map((group) => (
            <section key={`${categoryMeta.id}-${group.heading}`}>
              <h2 className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-muted/70">{groupLabelZh(group.heading)}</h2>
              <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {group.routes.map((item) => {
                  const route = ROADMAP_MAP.get(item.slug);
                  return route ? <KnowledgeCard key={`${group.heading}-${item.slug}`} route={route} /> : null;
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {extras.length > 0 ? (
        <section className="mt-7 rounded-2xl border border-line/10 bg-surface p-4">
          <p className="eyebrow mb-1">平台扩展</p>
          <h2 className="mb-2 text-[13px] font-bold text-ink">平台精编补充 · {extras.length} 条</h2>
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {extras.map((route) => <KnowledgeCard key={route.id} route={route} />)}
          </div>
        </section>
      ) : null}

      <section className="mt-7 card p-4">
        <p className="eyebrow mb-2">精编文档入口</p>
        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {DOCS.map((doc) => {
            const points = knowledgePointsForDoc(doc);
            const routes = routesForDoc(doc.id);
            return (
              <Link key={doc.id} to={`/learn/${doc.id}`} className="flex items-center gap-2 rounded-lg border border-line/10 bg-surface px-3 py-2.5 transition hover:border-accent/30">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-raised font-mono text-[9px] text-muted">{doc.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10.5px] font-medium text-ink">{doc.title}</span>
                  <span className="block text-[8.5px] text-muted/60">{points.length} 个知识点{routes.length ? ` · ${routes.map((route) => roadmapDisplayName(route)).slice(0, 2).join(" / ")}` : ""}</span>
                </span>
                <ArrowRight className="h-3 w-3 text-muted" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-5 rounded-xl bg-raised/30 px-3.5 py-2.5 text-[9px] leading-4 text-muted/70">
        每个精编文档按章节拆成独立知识点；先完成当前知识点，再进入下一节。没有精编正文的技术路线会提供主题学习页和示例工作单，不会用一个整页文档代替逐点学习。
      </div>
    </PageContainer>
  );
}
