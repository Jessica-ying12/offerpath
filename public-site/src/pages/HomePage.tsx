import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Layers3,
  ListChecks,
  MessageSquareQuote,
  Route,
  Sparkles,
  Target,
} from "lucide-react";
import { ALL_QA, DOCS, ROLES, TOTAL_QA } from "../lib/content";
import { analyzeJd, prioritizedDocs } from "../lib/jd";
import { isDue } from "../lib/srs";
import { useStore } from "../lib/store";
import { DocCard, PageContainer, ProgressRing } from "../components/ui";
import { plainInline } from "../lib/text";
import { FRONTEND_STAGES } from "../data/roadmap";
import meta from "../data/question-meta.json";
import type { ActivityItem } from "../lib/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const Icon =
    type === "complete"
      ? CheckCircle2
      : type === "qa"
        ? MessageSquareQuote
        : type === "quiz"
          ? ListChecks
          : type === "note"
            ? Sparkles
            : BookOpen;
  return <Icon className="h-3.5 w-3.5" />;
}

export function HomePage() {
  const { state, activeProfile, completedDocs, masteredQa, dueQa, streak } = useStore();
  const role = ROLES.find((item) => item.id === state.role) ?? ROLES[0];
  const lastDoc = DOCS.filter((doc) => state.docs[doc.id]?.lastReadAt).sort(
    (a, b) =>
      new Date(state.docs[b.id]?.lastReadAt ?? 0).getTime() -
      new Date(state.docs[a.id]?.lastReadAt ?? 0).getTime(),
  )[0];
  const recommendedAll = prioritizedDocs(state.role, state.jd);
  const nextDoc = lastDoc && !state.docs[lastDoc.id]?.completed ? lastDoc : recommendedAll[0];
  const nextHeading = nextDoc ? state.docs[nextDoc.id]?.lastHeading : null;
  const continueHref = nextDoc
    ? `/doc/${nextDoc.id}${nextHeading ? `?h=${encodeURIComponent(nextHeading)}` : ""}`
    : "/docs";
  const recommended = recommendedAll.filter((doc) => doc.id !== nextDoc?.id).slice(0, 3);
  const dueQuestions = ALL_QA.filter(
    (item) => state.qa[item.id] && isDue(state.qa[item.id]),
  ).slice(0, 4);
  const readingMinutes = Math.round(
    DOCS.reduce((sum, doc) => sum + (doc.minutes * (state.docs[doc.id]?.percent ?? 0)) / 100, 0),
  );
  const jdAnalysis = state.jd ? analyzeJd(state.jd) : null;
  const stages = FRONTEND_STAGES.map((stage) => {
    const docs = [...new Set(stage.nodes.flatMap((node) => node.docs ?? []))]
      .map((id) => DOCS.find((doc) => doc.id === id))
      .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
    const done = docs.filter((doc) => state.docs[doc.id]?.completed).length;
    return { ...stage, total: docs.length, done };
  });
  const currentStage = stages.find((stage) => stage.done < stage.total) ?? stages[stages.length - 1];

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5">
            TODAY · {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}
          </p>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink sm:text-[32px]">
            {greeting()}，{activeProfile.name}
          </h1>
          <p className="mt-1 text-[11px] text-muted">
            当前目标：{role.label} · {completedDocs}/{DOCS.length} 篇精读 · {masteredQa}/{TOTAL_QA} 问答掌握
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <Flame className="h-3.5 w-3.5 text-coral" />
          连续 {streak} 天
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="relative overflow-hidden rounded-3xl border border-accent/20 bg-surface p-5 shadow-card sm:p-6">
            <div className="absolute inset-0 paper-grid opacity-35" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="eyebrow text-accent/80">继续学习</span>
                {nextDoc ? <span className="chip">{nextDoc.layer}</span> : null}
                {nextDoc ? <span className="chip">{nextDoc.week}</span> : null}
              </div>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-display text-[24px] font-bold leading-tight text-ink sm:text-[30px]">
                    {nextDoc ? `${nextDoc.id} · ${nextDoc.title}` : "从第一篇精读开始"}
                  </h2>
                  <p className="mt-2 max-w-xl text-[11.5px] leading-5 text-muted">
                    {nextDoc?.description ?? "选一篇文档，按“精读 → 自测 → 题库 → 复习”的顺序推进。"}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[9.5px] text-muted/75">
                    {nextDoc ? (
                      <>
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> 约 {nextDoc.minutes} 分钟</span>
                        <span>·</span>
                        <span>{state.docs[nextDoc.id]?.percent ?? 0}% 已读</span>
                      </>
                    ) : null}
                  </p>
                  <div className="progress-track mt-3 max-w-md">
                    <div className="progress-fill" style={{ width: `${state.docs[nextDoc?.id ?? ""]?.percent ?? 0}%` }} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link to={continueHref} className="btn-primary">
                    <BookOpen className="h-4 w-4" /> {nextDoc ? "继续精读" : "开始"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link to="/roadmap" className="btn-ghost">
                    <Route className="h-4 w-4" /> 看路线
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2.5 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-1">TODAY · 3 ACTIONS</p>
                <h2 className="text-[15px] font-bold text-ink">今天做这三件</h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to={continueHref} className="rounded-2xl border border-line/10 bg-surface p-4 transition hover:border-accent/30">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent"><BookOpen className="h-4 w-4" /></span>
                  <span className="eyebrow">01</span>
                </div>
                <p className="mt-3 text-[12px] font-semibold text-ink">精读一个知识点</p>
                <p className="mt-1 text-[9.5px] leading-4 text-muted">{nextDoc ? nextDoc.shortTitle : "打开深度文档库"}</p>
              </Link>
              <Link to="/quiz" className="rounded-2xl border border-line/10 bg-surface p-4 transition hover:border-accent/30">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky/10 text-sky"><Layers3 className="h-4 w-4" /></span>
                  <span className="eyebrow">02</span>
                </div>
                <p className="mt-3 text-[12px] font-semibold text-ink">做 10 道混合题</p>
                <p className="mt-1 text-[9.5px] leading-4 text-muted">{meta.total} 道 · 五种题型 · 逐题纠正</p>
              </Link>
              <Link to={dueQuestions[0] ? `/qa/${dueQuestions[0].docId}/session?mode=due` : "/review"} className="rounded-2xl border border-line/10 bg-surface p-4 transition hover:border-accent/30">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral/10 text-coral"><Flame className="h-4 w-4" /></span>
                  <span className="eyebrow">03</span>
                </div>
                <p className="mt-3 text-[12px] font-semibold text-ink">{dueQa > 0 ? `复习 ${dueQa} 道到期` : "做一组面试自测"}</p>
                <p className="mt-1 text-[9.5px] leading-4 text-muted">{dueQa > 0 ? "先回答，再看纠正" : "380 道直接回答 + 追问"}</p>
              </Link>
            </div>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">YOUR ROADMAP</p>
                <h2 className="text-[15px] font-bold text-ink">路线位置</h2>
              </div>
              <Link to="/roadmap" className="text-[10px] text-accent">完整路线图 →</Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {stages.map((stage, index) => {
                const active = stage.id === currentStage?.id;
                return (
                  <Link
                    key={stage.id}
                    to="/roadmap"
                    className={`rounded-xl border p-2.5 transition ${active ? "border-accent/35 bg-accent/[0.045]" : "border-line/10 hover:border-accent/25"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[9px] ${active ? "text-accent" : "text-muted/60"}`}>{String(index + 1).padStart(2, "0")}</span>
                      <span className="font-mono text-[8.5px] text-muted/60">{stage.done}/{stage.total}</span>
                    </div>
                    <p className={`mt-1 text-[10.5px] font-semibold ${active ? "text-accent" : "text-ink/80"}`}>{stage.title}</p>
                    <div className="progress-track mt-1.5 h-1">
                      <div className="progress-fill" style={{ width: `${stage.total ? (stage.done / stage.total) * 100 : 0}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-2.5 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-1">NEXT UP</p>
                <h2 className="text-[15px] font-bold text-ink">推荐下一步</h2>
              </div>
              <Link to="/docs" className="text-[10px] text-muted hover:text-accent">全部 21 篇 →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {recommended.map((doc) => (
                <DocCard key={doc.id} doc={doc} showMatch compact />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <div className="flex items-center gap-3">
              <ProgressRing percent={(completedDocs / DOCS.length) * 100} size={64} label={`${completedDocs}/${DOCS.length}`} />
              <div>
                <p className="text-[12px] font-semibold text-ink">精读进度</p>
                <p className="mt-0.5 text-[9.5px] leading-4 text-muted">约 {readingMinutes} 分钟阅读</p>
                <p className="text-[9px] text-muted/60">{DOCS.length - completedDocs} 篇待读</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 border-t border-line/10 pt-3 text-center">
              <div><p className="font-display text-[18px] font-bold text-ink">{masteredQa}</p><p className="text-[8.5px] text-muted">问答掌握</p></div>
              <div><p className="font-display text-[18px] font-bold text-ink">{dueQa}</p><p className="text-[8.5px] text-muted">待复习</p></div>
              <div><p className="font-display text-[18px] font-bold text-ink">{Object.keys(state.quizMistakes).length}</p><p className="text-[8.5px] text-muted">错题</p></div>
            </div>
          </section>

          <section className="card p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold"><Flame className="h-3.5 w-3.5 text-coral" /> 复习队列</span>
              <Link to="/review" className="text-[9px] text-accent">全部 →</Link>
            </div>
            {dueQuestions.length === 0 ? (
              <p className="rounded-xl bg-raised/50 p-3 text-[10px] leading-5 text-muted">
                没有到期问答。先做一组自测，首次自测后会在 D+1 回到队列。
              </p>
            ) : (
              <div className="space-y-0.5">
                {dueQuestions.map((item) => (
                  <Link key={item.id} to={`/qa/${item.docId}/session?q=${item.id}`} className="block rounded-lg px-2 py-2 transition hover:bg-raised/60">
                    <p className="line-clamp-1 text-[10.5px] text-ink/85">{plainInline(item.question)}</p>
                    <p className="text-[8.5px] text-muted">{item.bankTitle} · Q{item.number}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[12px] font-semibold">最近记录</span>
              <Link to="/progress" className="text-[9px] text-muted hover:text-accent">全部</Link>
            </div>
            {state.activity.length === 0 ? (
              <p className="rounded-xl bg-raised/50 p-3 text-[10px] leading-5 text-muted">完成精读、自测或题库后会留下记录。</p>
            ) : (
              <div className="space-y-2">
                {state.activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-raised text-muted"><ActivityIcon type={item.type} /></span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[10px] text-ink/80">{item.label}</p>
                      <p className="text-[8px] text-muted/60">{new Date(item.at).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line/10 bg-raised/30 p-4">
            <p className="eyebrow mb-2">按需求学习</p>
            {jdAnalysis ? (
              <>
                <div className="flex flex-wrap gap-1">
                  {jdAnalysis.matched.slice(0, 4).map((item) => <span key={item.label} className="chip bg-surface text-accent">{item.label}</span>)}
                </div>
                <Link to="/plan" className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent">调整 JD <ArrowUpRight className="h-2.5 w-2.5" /></Link>
              </>
            ) : (
              <>
                <p className="text-[10px] leading-5 text-muted">粘贴目标 JD，路线和精读会按命中技术重排。</p>
                <Link to="/plan" className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent"><Target className="h-3 w-3" /> 设置目标</Link>
              </>
            )}
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}
