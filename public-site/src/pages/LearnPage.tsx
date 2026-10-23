import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  ListChecks,
  MessageSquareQuote,
  Route,
} from "lucide-react";
import { DOC_MAP, QA_MAP, knowledgePointsForDoc } from "../lib/content";
import { docContextCategory, routesForDoc } from "../lib/knowledge";
import { useStore } from "../lib/store";
import { MarkdownView } from "../components/MarkdownView";
import { Breadcrumbs, PageContainer } from "../components/ui";
import { roadmapDisplayName } from "../data/roadmaps";

export function LearnPage() {
  const { docId = "", slug } = useParams();
  const navigate = useNavigate();
  const { state, toggleLesson } = useStore();
  const doc = DOC_MAP.get(docId);
  const points = doc ? knowledgePointsForDoc(doc) : [];
  const point = slug ? points.find((item) => item.slug === slug) : points[0];
  const category = doc ? docContextCategory(doc.id) : null;
  const relatedRoutes = doc ? routesForDoc(doc.id) : [];
  const bank = doc ? QA_MAP.get(doc.id) : null;
  const lessonKey = doc && point ? `${doc.id}:${point.slug}` : "";
  const completed = state.lessons[lessonKey]?.completed ?? false;

  if (!doc || !point) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "深度文档", to: "/docs" }, { label: "未找到" }]} className="mb-4" />
        <div className="rounded-2xl border border-dashed border-line/20 py-16 text-center">
          <p className="font-display text-[22px] font-bold text-ink">没有找到这个知识点</p>
          <Link to="/docs" className="btn-primary mt-4">返回深度文档</Link>
        </div>
      </PageContainer>
    );
  }

  const index = points.indexOf(point);
  const previous = index > 0 ? points[index - 1] : null;
  const next = index < points.length - 1 ? points[index + 1] : null;
  const doneCount = points.filter((item) => state.lessons[`${doc.id}:${item.slug}`]?.completed).length;

  const completeAndNext = () => {
    if (!completed) toggleLesson(doc.id, point.slug);
    if (next) navigate(`/learn/${doc.id}/${next.slug}`);
  };

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "总览", to: "/" },
          { label: "深度文档", to: "/docs" },
          ...(category ? [{ label: category.label, to: `/docs?category=${category.id}` }] : []),
          { label: doc.title, to: `/learn/${doc.id}` },
          { label: point.title },
        ]}
        className="mb-4"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0">
          <header className="rounded-2xl border border-line/10 bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip border-accent/20 text-accent">{category?.label ?? "深度文档"}</span>
              <span className="chip">{doc.id} · {doc.shortTitle}</span>
              <span className="chip">知识点 {index + 1} / {points.length}</span>
              {completed ? <span className="chip border-accent/25 text-accent"><CheckCircle2 className="h-2.5 w-2.5" /> 已学完</span> : null}
            </div>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-tight text-ink sm:text-[36px]">{point.title}</h1>
            <p className="mt-2 text-[11px] leading-5 text-muted">{doc.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={completeAndNext} className="btn-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> {completed ? "进入下一知识点" : "学完这一节，继续"}
              </button>
              <button
                onClick={() => toggleLesson(doc.id, point.slug)}
                className="btn-ghost"
              >
                {completed ? <Circle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {completed ? "标记未学完" : "仅标记学完"}
              </button>
              <Link to={`/doc/${doc.id}`} className="btn-quiet text-[10px]">整篇参考</Link>
            </div>
          </header>

          <div className="mt-4 rounded-2xl border border-line/10 bg-surface p-5 sm:p-7">
            <MarkdownView markdown={point.markdown} docId={doc.id} />
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-accent/20 bg-accent/[0.045] p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink">这一节学完了吗？</p>
              <p className="mt-0.5 text-[9.5px] text-muted">先标记学完，再进入下一个知识点；整篇文档只作为参考，不作为默认学习入口。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {bank ? <Link to={`/qa/${doc.id}`} className="btn-ghost py-1.5 text-[10px]"><MessageSquareQuote className="h-3 w-3" /> 配套自测</Link> : null}
              <Link to={`/quiz?doc=${doc.id}`} className="btn-ghost py-1.5 text-[10px]"><ListChecks className="h-3 w-3" /> 配套练题</Link>
              {next ? <Link to={`/learn/${doc.id}/${next.slug}`} className="btn-primary py-1.5 text-[10px]">下一节 <ArrowRight className="h-3 w-3" /></Link> : null}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            {previous ? (
              <Link to={`/learn/${doc.id}/${previous.slug}`} className="btn-ghost min-w-0">
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">上一节：{previous.title}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link to={`/learn/${doc.id}/${next.slug}`} className="btn-ghost min-w-0">
                <span className="truncate">下一节：{next.title}</span> <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
            ) : null}
          </div>
        </article>

        <aside className="space-y-3 lg:sticky lg:top-[80px] lg:self-start">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">本篇知识点</p>
              <span className="font-mono text-[9px] text-muted/60">{doneCount}/{points.length}</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/10">
              <div className="h-full bg-accent/60" style={{ width: `${points.length ? (doneCount / points.length) * 100 : 0}%` }} />
            </div>
            <div className="mt-3 max-h-[55vh] space-y-0.5 overflow-y-auto">
              {points.map((item) => {
                const active = item.slug === point.slug;
                const itemDone = state.lessons[`${doc.id}:${item.slug}`]?.completed;
                return (
                  <Link
                    key={item.slug}
                    to={`/learn/${doc.id}/${item.slug}`}
                    className={`flex items-start gap-2 rounded-lg px-2 py-2 text-[10px] leading-4 transition ${active ? "bg-accent/[0.07] font-semibold text-accent" : "text-muted hover:bg-raised/60 hover:text-ink"}`}
                  >
                    <span className="mt-0.5 font-mono text-[8px] opacity-60">{String(item.index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">{item.title}</span>
                    {itemDone ? <CheckCircle2 className="mt-0.5 h-2.5 w-2.5 shrink-0 text-accent" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>

          {relatedRoutes.length > 0 ? (
            <div className="card p-4">
              <p className="eyebrow mb-2">所属技术</p>
              <div className="space-y-1">
                {relatedRoutes.slice(0, 4).map((route) => (
                  <Link key={route.id} to={`/roadmap/${route.id}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[10px] text-muted hover:bg-raised/60 hover:text-ink">
                    <Route className="h-3 w-3 text-accent" />
                    <span className="min-w-0 flex-1 truncate">{roadmapDisplayName(route)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <Link to={`/doc/${doc.id}`} className="flex items-center gap-2 rounded-xl border border-line/10 bg-surface px-3 py-2.5 text-[10px] text-muted hover:text-accent">
            <BookOpen className="h-3.5 w-3.5" /> 整篇参考（不按知识点）
          </Link>
        </aside>
      </div>
    </PageContainer>
  );
}
