import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  ListChecks,
  MessageSquareQuote,
  Route,
  Sparkles,
  Target,
} from "lucide-react";
import { DOCS, ROLES, TOTAL_QA } from "../lib/content";
import { analyzeJd, prioritizedDocs } from "../lib/jd";
import { ALL_QA } from "../lib/content";
import { isDue } from "../lib/srs";
import { useStore } from "../lib/store";
import { DocCard, PageContainer, ProgressRing, StatCard } from "../components/ui";
import { plainInline } from "../lib/text";
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
  const { state, completedDocs, masteredQa, dueQa, streak } = useStore();
  const role = ROLES.find((item) => item.id === state.role) ?? ROLES[0];
  const recommended = prioritizedDocs(state.role, state.jd).slice(0, 6);
  const lastDoc = DOCS.filter((doc) => state.docs[doc.id]?.lastReadAt).sort(
    (a, b) =>
      new Date(state.docs[b.id]?.lastReadAt ?? 0).getTime() -
      new Date(state.docs[a.id]?.lastReadAt ?? 0).getTime(),
  )[0];
  const nextDoc = lastDoc && !state.docs[lastDoc.id]?.completed ? lastDoc : recommended[0];
  const nextHeading = nextDoc ? state.docs[nextDoc.id]?.lastHeading : null;
  const editContinueHref = nextDoc
    ? `/doc/${nextDoc.id}${nextHeading ? `?h=${encodeURIComponent(nextHeading)}` : ""}`
    : "/docs";
  const dueQuestions = ALL_QA.filter(
    (item) => state.qa[item.id] && isDue(state.qa[item.id]),
  ).slice(0, 4);
  const readingMinutes = Math.round(
    DOCS.reduce((sum, doc) => {
      const percent = state.docs[doc.id]?.percent ?? 0;
      return sum + (doc.minutes * percent) / 100;
    }, 0),
  );
  const analysis = state.jd ? analyzeJd(state.jd) : null;

  const layers = [...new Set(DOCS.map((doc) => doc.layer))].map((layer) => {
    const docs = DOCS.filter((doc) => doc.layer === layer);
    const done = docs.filter((doc) => state.docs[doc.id]?.completed).length;
    return { layer, total: docs.length, done };
  });

  return (
    <PageContainer>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted">
          {new Date().toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
          <span className="mx-2 text-line/30">/</span>
          {greeting()}，今天只做三件事。
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted">
          <Flame className="h-3.5 w-3.5 text-coral" />
          连续学习 {streak} 天
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-line/10 bg-surface p-5 shadow-card sm:p-7 lg:p-8">
        <div className="absolute inset-0 paper-grid opacity-40" />
        <div className="relative grid gap-7 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow mb-3">DEEP LEARNING · 移动前端 0 → 面试</p>
            <h1 className="max-w-2xl font-display text-[28px] font-bold leading-[1.22] tracking-tight text-ink sm:text-[34px]">
              把每个知识点，
              <br className="hidden sm:block" />
              练到能答、能写、记得住。
            </h1>
            <p className="mt-3 max-w-xl text-[12.5px] leading-6 text-muted">
              21 篇深度精读、{TOTAL_QA} 道带追问的面试问答、210 道练习题。比原 Markdown 多了全文搜索、
              目录、笔记、清单、自测与 D+1 / D+3 / D+7 复习。按目标岗位排序，学完能讲、能写。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={editContinueHref} className="btn-primary">
                {nextDoc ? (
                  <>
                    <BookOpen className="h-4 w-4" />
                    继续读 {nextDoc.id}
                  </>
                ) : (
                  "开始第一篇"
                )}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/plan" className="btn-ghost">
                <Route className="h-4 w-4" />
                打开 10 周路径
              </Link>
              <Link to="/qa" className="btn-ghost">
                <MessageSquareQuote className="h-4 w-4" />
                今日自测
              </Link>
            </div>
            {state.jd && analysis ? (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted">JD 命中：</span>
                {analysis.matched.slice(0, 6).map((item) => (
                  <span key={item.label} className="chip border-accent/20 bg-accent/[0.06] text-accent">
                    {item.label}
                  </span>
                ))}
                <Link to="/plan" className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-accent">
                  调整 <ArrowUpRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            ) : (
              <Link
                to="/plan"
                className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] text-muted underline decoration-line/30 underline-offset-4 hover:text-accent"
              >
                <Target className="h-3 w-3" />
                粘贴目标 JD，让模块按岗位需求排序
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-line/10 bg-paper/70 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                percent={(completedDocs / DOCS.length) * 100}
                size={72}
                stroke={5}
                label={`${completedDocs}/${DOCS.length}`}
              />
              <div>
                <p className="text-[12px] font-semibold text-ink">精读进度</p>
                <p className="mt-1 text-[10.5px] leading-5 text-muted">
                  已完成 {completedDocs} 篇，约 {readingMinutes} 分钟
                </p>
                <p className="mt-0.5 text-[10px] text-muted/70">
                  还有 {DOCS.length - completedDocs} 篇未精读
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line/10 pt-3">
              <div>
                <p className="font-display text-[19px] font-bold text-ink">{masteredQa}</p>
                <p className="text-[9px] text-muted">问答已掌握</p>
              </div>
              <div>
                <p className="font-display text-[19px] font-bold text-ink">{dueQa}</p>
                <p className="text-[9px] text-muted">今日待复习</p>
              </div>
              <div>
                <p className="font-display text-[19px] font-bold text-ink">{TOTAL_QA}</p>
                <p className="text-[9px] text-muted">问答总量</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-1">TODAY · 3 ACTIONS</p>
            <h2 className="text-[16px] font-bold text-ink">今天的三个动作</h2>
          </div>
          <Link to="/review" className="text-[10.5px] text-muted hover:text-accent">
            查看复习队列 →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link
            to={editContinueHref}
            className="group rounded-2xl border border-accent/20 bg-accent/[0.05] p-4 transition hover:border-accent/40"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="eyebrow text-accent/70">01 · 精读</span>
            </div>
            <p className="mt-3 line-clamp-2 text-[13px] font-semibold leading-5 text-ink">
              {nextDoc ? `${nextDoc.id} · ${nextDoc.title}` : "从第一篇开始"}
            </p>
            <p className="mt-1 text-[10.5px] leading-5 text-muted">
              {nextDoc
                ? `${nextDoc.minutes} 分钟 · ${nextDoc.layer}${state.docs[nextDoc.id]?.percent ? ` · 已读 ${state.docs[nextDoc.id]?.percent}%` : ""}`
                : "打开深度文档库"}
            </p>
          </Link>

          <Link
            to={
              dueQuestions[0]
                ? `/qa/${dueQuestions[0].docId}/session?mode=due`
                : "/qa"
            }
            className="group rounded-2xl border border-line/10 bg-surface p-4 transition hover:border-accent/30"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral/10 text-coral">
                <MessageSquareQuote className="h-4 w-4" />
              </span>
              <span className="eyebrow">02 · 自测</span>
            </div>
            <p className="mt-3 text-[13px] font-semibold text-ink">
              {dueQa > 0 ? `${dueQa} 道问答到期` : "做一组面试自测"}
            </p>
            <p className="mt-1 text-[10.5px] leading-5 text-muted">
              {dueQa > 0
                ? "先自己回答，再看直接回答和两层追问。"
                : "380 道题带直接回答、追问与陷阱提示。"}
            </p>
          </Link>

          <Link
            to="/quiz"
            className="group rounded-2xl border border-line/10 bg-surface p-4 transition hover:border-accent/30"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky/10 text-sky">
                <ListChecks className="h-4 w-4" />
              </span>
              <span className="eyebrow">03 · 练习</span>
            </div>
            <p className="mt-3 text-[13px] font-semibold text-ink">10 道题检查理解</p>
            <p className="mt-1 text-[10.5px] leading-5 text-muted">
              210 道题按课程/等级筛选，答错自动进入错题。
            </p>
          </Link>
        </div>
      </section>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-1">FOR YOUR TARGET</p>
                <h2 className="text-[16px] font-bold text-ink">按目标推荐 · {role.label}</h2>
              </div>
              <Link to="/docs" className="text-[10.5px] text-muted hover:text-accent">
                全部 21 篇 →
              </Link>
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {ROLES.map((item) => (
                <Link
                  key={item.id}
                  to="/plan"
                  className={`chip ${item.id === state.role ? "chip-active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommended.map((doc) => (
                <DocCard key={doc.id} doc={doc} showMatch compact />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-1">CAPABILITY MAP</p>
                <h2 className="text-[16px] font-bold text-ink">能力地图</h2>
              </div>
              <Link to="/progress" className="text-[10.5px] text-muted hover:text-accent">
                查看报告 →
              </Link>
            </div>
            <div className="card divide-y divide-line/10 p-2">
              {layers.map((layer) => (
                <div key={layer.layer} className="flex items-center gap-4 px-3 py-3">
                  <span className="w-[96px] shrink-0 font-mono text-[10px] text-muted">
                    {layer.layer.split(" ")[0]}
                  </span>
                  <span className="w-[112px] shrink-0 text-[11px] font-medium text-ink">
                    {layer.layer.split(" ").slice(1).join(" ")}
                  </span>
                  <div className="progress-track flex-1">
                    <div
                      className="progress-fill"
                      style={{ width: `${(layer.done / layer.total) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted">
                    {layer.done}/{layer.total}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                <Flame className="h-3.5 w-3.5 text-coral" /> 复习队列
              </span>
              <span className="font-mono text-[10px] text-muted">{dueQa}</span>
            </div>
            {dueQuestions.length === 0 ? (
              <div className="rounded-xl bg-raised/50 p-3">
                <p className="text-[11px] leading-5 text-muted">
                  还没有到期问答。先完成一次自测，系统会在 D+1 把题放回队列。
                </p>
                <Link to="/qa" className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent">
                  去自测 <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {dueQuestions.map((item) => (
                  <Link
                    key={item.id}
                    to={`/qa/${item.docId}/session?q=${item.id}`}
                    className="block rounded-lg px-2 py-2 transition hover:bg-raised/60"
                  >
                    <p className="line-clamp-1 text-[11px] font-medium text-ink">{plainInline(item.question)}</p>
                    <p className="mt-0.5 text-[9px] text-muted">
                      {item.bankTitle} · Q{item.number}
                    </p>
                  </Link>
                ))}
                <Link
                  to="/review"
                  className="mt-1 inline-flex items-center gap-1 px-2 text-[10px] text-accent"
                >
                  查看全部到期 <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold">最近记录</span>
              <Link to="/progress" className="text-[9px] text-muted hover:text-accent">
                全部
              </Link>
            </div>
            {state.activity.length === 0 ? (
              <p className="rounded-xl bg-raised/50 p-3 text-[10.5px] leading-5 text-muted">
                完成精读、自测或题库后，这里会留下记录。记录只保存在本机。
              </p>
            ) : (
              <div className="space-y-2.5">
                {state.activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-raised text-muted">
                      <ActivityIcon type={item.type} />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[10.5px] text-ink/105">{item.label}</p>
                      <p className="text-[8.5px] text-muted/60">
                        {new Date(item.at).toLocaleString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line/10 bg-raised/30 p-4">
            <p className="eyebrow mb-2">LOCAL FIRST</p>
            <p className="text-[10.5px] leading-5 text-muted">
              阅读进度、笔记、掌握度保存在本机浏览器，不需要登录。可在「学习进度」导出 JSON
              备份或换设备导入。
            </p>
            <Link to="/progress" className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent">
              备份与设置 <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
