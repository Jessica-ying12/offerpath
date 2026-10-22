import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Route,
  Sparkles,
} from "lucide-react";
import { ROADMAPS, ROADMAP_CATALOG_CATEGORIES, ROADMAP_MAP, categoryLabelZh, groupLabelZh, roadmapContextCategory, roadmapDisplayName } from "../data/roadmaps";
import { buildTopicGuide } from "../lib/topic-guide";
import { Breadcrumbs, PageContainer } from "../components/ui";

export function TopicPage() {
  const { roadmapId = "", topicIndex = "" } = useParams();
  const roadmap = ROADMAP_MAP.get(roadmapId);
  const index = Number(topicIndex);
  const topic = roadmap?.officialTopics[index];
  const stage = roadmap?.stages.find((item) => item.nodes.some((node) => node.topicIndex === index));

  if (!roadmap || !topic || !Number.isInteger(index) || index < 0) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "路线图库", to: "/roadmap" }, { label: "未找到" }]} className="mb-4" />
        <div className="rounded-2xl border border-dashed border-line/20 py-16 text-center">
          <p className="font-display text-[22px] font-bold text-ink">没有找到这个主题</p>
          <p className="mt-2 text-[11px] text-muted">请从路线详情重新选择主题。</p>
          <Link to="/roadmap" className="btn-primary mt-4">返回路线图库</Link>
        </div>
      </PageContainer>
    );
  }

  const contextCategory = roadmapContextCategory(roadmap);
  const guide = buildTopicGuide(roadmapDisplayName(roadmap), roadmap, topic, stage?.title ?? "路线节点");
  const relatedRoutes = ROADMAPS.filter((candidate) => candidate.id !== roadmap.id)
    .filter((candidate) => {
      const names = [candidate.name, candidate.nameZh].filter((name): name is string => Boolean(name)).map((name) => name.toLowerCase());
      return names.some((name) => name.length >= 2 && (topic.toLowerCase() === name || topic.toLowerCase().includes(name)));
    })
    .slice(0, 4);
  const previous = index > 0 ? roadmap.officialTopics[index - 1] : null;
  const next = index < roadmap.officialTopics.length - 1 ? roadmap.officialTopics[index + 1] : null;
  const stageTopics = stage?.nodes.filter((item) => item.topicIndex !== undefined) ?? [];
  const categoryLabels = roadmap.catalogCategories
    .map((id) => ROADMAP_CATALOG_CATEGORIES.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => categoryLabelZh(item.id))
    .filter((label) => label !== groupLabelZh(roadmap.groupLabel));

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "总览", to: "/" },
          { label: "路线图库", to: "/roadmap" },
          ...(contextCategory ? [{ label: contextCategory.label, to: `/roadmap?category=${contextCategory.id}` }] : []),
          { label: roadmapDisplayName(roadmap), to: `/roadmap/${roadmap.id}` },
          { label: topic },
        ]}
        className="mb-4"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <header className="rounded-2xl border border-accent/20 bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip border-accent/20 text-accent">{guide.domain}</span>
              <span className="chip">{stage?.title ?? "路线节点"}</span>
              <span className="chip">第 {index + 1} / {roadmap.officialTopics.length} 个主题</span>
              <span className="chip">学习指引</span>
            </div>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-tight text-ink sm:text-[36px]">{topic}</h1>
            <p className="mt-2 text-[12px] leading-6 text-muted">{guide.intro}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/plan?roadmap=${roadmap.id}`} className="btn-primary">
                <Route className="h-3.5 w-3.5" /> 加入学习计划
              </Link>
              <Link to={`/roadmap/${roadmap.id}`} className="btn-ghost">
                <BookOpen className="h-3.5 w-3.5" /> 回到完整路线
              </Link>
            </div>
          </header>

          <section className="card mt-4 p-5">
            <p className="eyebrow mb-2">学完要能回答</p>
            <div className="space-y-2">
              {guide.goals.map((goal, goalIndex) => (
                <div key={goal} className="flex items-start gap-2 rounded-xl bg-accent/[0.035] px-3 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-[9px] text-accent">{goalIndex + 1}</span>
                  <p className="text-[11px] leading-5 text-ink/80">{goal}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card mt-4 overflow-hidden">
            <div className="border-b border-line/10 px-5 py-4">
              <p className="eyebrow mb-1">示例 · 最小可验证</p>
              <h2 className="text-[15px] font-bold text-ink">{guide.example.title}</h2>
            </div>
            <pre className="overflow-x-auto bg-ink/[0.96] p-4 text-[11px] leading-6 text-lime/90"><code>{guide.example.body}</code></pre>
            <div className="flex items-start gap-2 border-t border-line/10 px-5 py-3 text-[10px] leading-5 text-muted">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
              {guide.example.note}
            </div>
          </section>

          <section className="card mt-4 p-5">
            <p className="eyebrow mb-2">动手练习</p>
            <div className="space-y-2">
              {guide.practice.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[11px] leading-5 text-muted">
                  <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="card mt-4 p-5">
            <p className="eyebrow mb-2">自测问题</p>
            <div className="space-y-2">
              {guide.checks.map((item) => (
                <div key={item} className="rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-[11px] leading-5 text-ink/80">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[9px] leading-5 text-muted/60">回答时先给结论，再解释原因和项目场景；答不上来的点回到示例和练习。</p>
          </section>

          {relatedRoutes.length > 0 ? (
            <section className="card mt-4 p-5">
              <p className="eyebrow mb-2">这个主题的专项模块</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedRoutes.map((route) => (
                  <Link key={route.id} to={`/roadmap/${route.id}`} className="flex items-center gap-2 rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-[11px] text-ink/80 transition hover:border-accent/30 hover:text-accent">
                    <BookOpen className="h-3.5 w-3.5 text-accent" />
                    <span className="min-w-0 flex-1 truncate">{roadmapDisplayName(route)}</span>
                    <ChevronRight className="h-3 w-3 text-muted" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-2">
            {previous ? (
              <Link to={`/roadmap/${roadmap.id}/topic/${index - 1}`} className="btn-ghost min-w-0">
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">上一主题：{previous}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link to={`/roadmap/${roadmap.id}/topic/${index + 1}`} className="btn-ghost min-w-0">
                <span className="truncate">下一主题：{next}</span> <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            ) : null}
          </div>
        </article>

        <aside className="space-y-3 lg:sticky lg:top-[80px] lg:self-start">
          <div className="card p-4">
            <p className="eyebrow mb-2">当前路线</p>
            <Link to={`/roadmap/${roadmap.id}`} className="text-[13px] font-semibold text-ink hover:text-accent">{roadmapDisplayName(roadmap)}</Link>
            <p className="mt-1 text-[9px] leading-5 text-muted">{groupLabelZh(roadmap.groupLabel)}{categoryLabels.length ? ` · ${categoryLabels.join(" / ")}` : ""}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[17px] font-bold text-ink">{roadmap.officialTopics.length}</p><p className="text-[8px] text-muted">主题</p></div>
              <div className="rounded-lg bg-raised/60 py-2"><p className="font-display text-[17px] font-bold text-ink">{index + 1}</p><p className="text-[8px] text-muted">当前进度</p></div>
            </div>
            <Link to={`/plan?roadmap=${roadmap.id}`} className="btn-primary mt-3 w-full py-2 text-[10px]">用此路线做计划</Link>
          </div>

          <div className="card p-4">
            <p className="eyebrow mb-2">本阶段主题 · {stageTopics.length}</p>
            <div className="max-h-72 space-y-0.5 overflow-y-auto">
              {stageTopics.map((item) => {
                const active = item.topicIndex === index;
                return (
                  <Link
                    key={item.topicIndex}
                    to={`/roadmap/${roadmap.id}/topic/${item.topicIndex}`}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] leading-4 transition ${active ? "bg-accent/[0.07] font-semibold text-accent" : "text-muted hover:bg-raised/60 hover:text-ink"}`}
                  >
                    <span className="font-mono text-[8px] opacity-60">{String((item.topicIndex ?? 0) + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    {active ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-line/10 bg-raised/30 p-3 text-[9px] leading-5 text-muted/70">
            学习指引用于建立理解、示例和自测；完整主题范围在路线详情中。加入计划后可在任务列表中勾选完成。
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
