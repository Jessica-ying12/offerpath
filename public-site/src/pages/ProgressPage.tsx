import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  Flame,
  ListChecks,
  MessageSquareQuote,
  Settings2,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { DOCS, TOTAL_QA } from "../lib/content";
import { formatDate } from "../lib/srs";
import { useStore } from "../lib/store";
import { ROADMAP_MAP } from "../data/roadmaps";
import { buildPlan, templateById, type PlanTask } from "../lib/plan";
import { analyzeJd } from "../lib/jd";
import { Breadcrumbs, EmptyState, PageContainer, PageHeader, ProgressRing, StatCard } from "../components/ui";

const TYPE_LABEL: Record<PlanTask["type"], string> = {
  read: "精读",
  qa: "自测",
  quiz: "题库",
  project: "产出",
  custom: "自定义",
};

function formatDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

export function ProgressPage() {
  const {
    state,
    completedDocs,
    masteredQa,
    dueQa,
    streak,
    setTheme,
    setFontSize,
    setLineHeight,
    exportState,
    importState,
    resetState,
  } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const plan = state.plan;
  const planRoadmap = plan ? ROADMAP_MAP.get(plan.goal.roadmapId) : null;
  const built = plan && planRoadmap ? buildPlan(plan, planRoadmap) : null;
  const completedIds = new Set(plan?.progress.completedTaskIds ?? []);
  const currentDay = useMemo(() => {
    if (!plan) return 0;
    const start = new Date(`${plan.goal.startDate}T00:00:00`);
    const day = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    if (!Number.isFinite(day)) return 0;
    return Math.min(plan.goal.days - 1, Math.max(0, day));
  }, [plan]);

  const remainingMinutes = built
    ? built.allTasks.filter((task) => !completedIds.has(task.id)).reduce((sum, task) => sum + task.minutes, 0)
    : 0;
  const planPercent = built?.total ? Math.round((built.done / built.total) * 100) : 0;

  const typeRows = built
    ? (Object.keys(TYPE_LABEL) as PlanTask["type"][])
        .map((type) => {
          const tasks = built.allTasks.filter((task) => task.type === type);
          const done = tasks.filter((task) => completedIds.has(task.id)).length;
          return { type, total: tasks.length, done };
        })
        .filter((row) => row.total > 0)
    : [];

  const nextDays = built
    ? Array.from({ length: 7 }, (_, index) => built.days[currentDay + index]).filter(Boolean)
    : [];
  const maxNextDay = Math.max(1, ...nextDays.map((day) => day.tasks.length));

  const planAnalysis = plan
    ? plan.goal.templateId === "interview"
      ? analyzeJd(plan.goal.resumeText ?? "")
      : plan.goal.templateId === "jd"
        ? analyzeJd(plan.goal.jdText ?? "")
        : null
    : null;

  const readingMinutes = Math.round(
    DOCS.reduce((sum, doc) => sum + (doc.minutes * (state.docs[doc.id]?.percent ?? 0)) / 100, 0),
  );
  const quizTotal = state.quizAttempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const quizCorrect = state.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const quizAccuracy = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0;

  const download = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `offerpath-deep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已导出备份 JSON，可换设备导入。");
    window.setTimeout(() => setMessage(""), 3000);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      importState(text);
      setMessage("备份已导入。");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "导入失败，请检查文件。");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    if (window.confirm("确定清空本机的阅读进度、笔记、问答掌握度、练习记录和当前计划吗？此操作不可撤销。")) {
      resetState();
      setMessage("本机数据已清空。");
    }
  };

  const settingsPanel = (
    <section className="card p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Settings2 className="h-3.5 w-3.5 text-accent" />
        <h2 className="text-[12px] font-semibold text-ink">阅读设置</h2>
      </div>
      <div className="space-y-3 text-[10.5px] text-muted">
        <div>
          <p className="mb-1.5">主题</p>
          <div className="flex gap-1.5">
            <button onClick={() => setTheme("light")} className={`chip ${state.theme === "light" ? "chip-active" : ""}`}>浅色</button>
            <button onClick={() => setTheme("dark")} className={`chip ${state.theme === "dark" ? "chip-active" : ""}`}>深色</button>
          </div>
        </div>
        <div>
          <p className="mb-1.5">正文字号 · {state.fontSize.toFixed(1)}px</p>
          <input type="range" min={15} max={22} step={0.5} value={state.fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="w-full accent-[rgb(var(--accent))]" />
        </div>
        <div>
          <p className="mb-1.5">行高 · {state.lineHeight.toFixed(2)}</p>
          <input type="range" min={1.5} max={2.2} step={0.05} value={state.lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="w-full accent-[rgb(var(--accent))]" />
        </div>
      </div>
    </section>
  );

  const backupPanel = (
    <section className="card p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Download className="h-3.5 w-3.5 text-accent" />
        <h2 className="text-[12px] font-semibold text-ink">数据备份</h2>
      </div>
      <p className="mb-3 text-[9.5px] leading-5 text-muted">进度、计划、笔记、问答和练习记录只在本机。换设备或清浏览器前先导出 JSON。</p>
      <div className="space-y-2">
        <button onClick={download} className="btn-primary w-full py-2 text-[11px]"><Download className="h-3.5 w-3.5" /> 导出备份</button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full py-2 text-[11px]"><Upload className="h-3.5 w-3.5" /> 导入备份</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        <button onClick={reset} className="w-full rounded-lg py-2 text-[10px] text-coral transition hover:bg-coral/[0.06]"><Trash2 className="mr-1 inline h-3 w-3" /> 清空本机数据</button>
      </div>
      {message ? <p className="mt-2 text-[9.5px] text-accent">{message}</p> : null}
      {error ? <p className="mt-2 text-[9.5px] text-coral">{error}</p> : null}
    </section>
  );

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "学习进度" }]} className="mb-4" />
      <PageHeader
        eyebrow="PLAN EVIDENCE · LOCAL FIRST"
        title="学习进度"
        description="先看当前计划完成了多少，再看全站学习证据。没有计划时，计划进度为空；不会拿平台总题量冒充你的进度。"
        actions={
          <>
            <Link to="/review" className="btn-ghost">复习队列</Link>
            <Link to="/plan" className="btn-primary">{plan ? "打开计划" : "设置计划"}</Link>
          </>
        }
      />

      {plan && built && planRoadmap ? (
        <>
          <section className="card mb-4 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProgressRing percent={planPercent} size={82} label={`${planPercent}%`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow text-accent/80">{templateById(plan.goal.templateId).category} · {templateById(plan.goal.templateId).name}</span>
                  <span className="chip">{plan.goal.days} 天</span>
                  <span className="chip">{built.modules.length} 个模块</span>
                </div>
                <h2 className="mt-1 font-display text-[22px] font-bold text-ink sm:text-[26px]">{plan.goal.name || plan.goal.title}</h2>
                <p className="mt-1 text-[10.5px] text-muted">{planRoadmap.name} · 第 {currentDay + 1} / {plan.goal.days} 天 · 从 {plan.goal.startDate} 开始</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {planAnalysis?.matched.slice(0, 8).map((item) => <span key={item.label} className="chip bg-raised/50 text-[8.5px] text-accent">{item.label}</span>)}
                </div>
              </div>
              <Link to="/plan" className="shrink-0 text-[10px] text-accent">查看计划 →</Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line/10 pt-3 text-center sm:grid-cols-4">
              <div><p className="font-display text-[20px] font-bold text-accent">{built.done}</p><p className="text-[8.5px] text-muted">已完成任务</p></div>
              <div><p className="font-display text-[20px] font-bold text-ink">{built.total - built.done}</p><p className="text-[8.5px] text-muted">剩余任务</p></div>
              <div><p className="font-display text-[20px] font-bold text-ink">{remainingMinutes}</p><p className="text-[8.5px] text-muted">剩余预计分钟</p></div>
              <div><p className="font-display text-[20px] font-bold text-ink">{dueQa}</p><p className="text-[8.5px] text-muted">今日到期复习</p></div>
            </div>
          </section>

          <div className="mb-2 mt-5 flex items-end justify-between gap-2">
            <p className="eyebrow">全站学习证据</p>
            <span className="text-[9px] text-muted/60">不属于当前计划</span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="精读完成" value={`${completedDocs}/${DOCS.length}`} icon={<CheckCircle2 className="h-3.5 w-3.5 text-accent" />} tone="accent" />
            <StatCard label="问答掌握" value={`${masteredQa}/${TOTAL_QA}`} icon={<MessageSquareQuote className="h-3.5 w-3.5" />} />
            <StatCard label="连续学习" value={`${streak} 天`} icon={<Flame className="h-3.5 w-3.5 text-coral" />} />
            <StatCard label="题库正确率" value={`${quizAccuracy}%`} hint={`${state.quizAttempts.length} 套记录`} icon={<ListChecks className="h-3.5 w-3.5" />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <section className="card p-4 sm:p-5">
                <div className="mb-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="eyebrow mb-1">MODULES</p>
                    <h2 className="text-[14px] font-semibold text-ink">这份计划的模块进度</h2>
                  </div>
                  <span className="font-mono text-[9px] text-muted/60">{built.modules.length} 个模块</span>
                </div>
                <div className="space-y-3">
                  {built.modules.map((module) => {
                    const percent = module.total ? Math.round((module.done / module.total) * 100) : 0;
                    return (
                      <div key={module.id}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-[10.5px]">
                          <span className="min-w-0 truncate text-muted">{module.title}</span>
                          <span className="shrink-0 font-mono text-muted/60">{module.done}/{module.total}</span>
                        </div>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="card p-4 sm:p-5">
                <div className="mb-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="eyebrow mb-1">NEXT 7 DAYS</p>
                    <h2 className="text-[14px] font-semibold text-ink">接下来 7 天的任务量</h2>
                  </div>
                  <span className="text-[9px] text-muted">从第 {currentDay + 1} 天开始</span>
                </div>
                <div className="flex h-32 items-end gap-2">
                  {nextDays.map((day) => (
                    <div key={day.index} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="font-mono text-[8px] text-muted/60">{day.done}/{day.tasks.length}</span>
                      <div className="flex h-20 w-full items-end rounded-md bg-raised/40">
                        <div
                          className={`w-full rounded-md transition-all ${day.index === currentDay ? "bg-accent" : "bg-accent/45"}`}
                          style={{ height: `${Math.max(4, (day.tasks.length / maxNextDay) * 100)}%` }}
                          title={`${day.tasks.length} 个任务`}
                        />
                      </div>
                      <span className={`text-[8.5px] ${day.index === currentDay ? "font-semibold text-accent" : "text-muted/60"}`}>
                        {day.index === currentDay ? "今天" : formatDay(day.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-1">TASK TYPES</p>
                    <h2 className="text-[14px] font-semibold text-ink">任务类型完成度</h2>
                  </div>
                  <span className="text-[9px] text-muted">{built.total} 个任务</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {typeRows.map((row) => (
                    <div key={row.type} className="rounded-xl bg-raised/35 p-2.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted">{TYPE_LABEL[row.type]}</span>
                        <span className="font-mono text-muted/60">{row.done}/{row.total}</span>
                      </div>
                      <div className="progress-track mt-1.5 h-1"><div className="progress-fill" style={{ width: `${(row.done / row.total) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card p-4 sm:p-5">
                <div className="mb-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="eyebrow mb-1">SCOPE</p>
                    <h2 className="text-[14px] font-semibold text-ink">这份计划覆盖什么</h2>
                  </div>
                  <Link to={`/roadmap/${plan.goal.roadmapId}`} className="text-[10px] text-accent">路线 →</Link>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[9.5px]">
                  <span className="chip">路线 · {planRoadmap.name}</span>
                  <span className="chip">{plan.goal.includedStageIds.length}/{planRoadmap.stages.length} 阶段</span>
                  <span className="chip">{plan.goal.days} 天</span>
                  <span className="chip">每天 {plan.goal.dailyMinutes} 分钟</span>
                  {plan.goal.templateId === "interview" ? <span className="chip border-accent/20 text-accent">简历驱动</span> : null}
                  {plan.goal.templateId === "jd" ? <span className="chip border-accent/20 text-accent">JD 驱动</span> : null}
                </div>
                {planAnalysis ? (
                  <p className="mt-2 text-[9px] leading-5 text-muted">
                    {plan.goal.templateId === "interview" ? "简历" : "JD"}规则匹配到 {planAnalysis.matched.length} 项技术；匹配结果决定技术问答和笔试题的范围，不会替你编造经历。
                  </p>
                ) : null}
              </section>
            </div>

            <aside className="space-y-4">
              {settingsPanel}
              {backupPanel}
              <div className="rounded-xl border border-line/10 bg-raised/30 p-3.5 text-[9px] leading-5 text-muted/70">
                所有统计来自本机记录；计划进度只统计当前计划的任务，不与平台总题量绑定。
              </div>
            </aside>
          </div>
        </>
      ) : (
        <>
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="还没有学习计划，计划进度为空"
            description="选择目标路线和计划类型后，这里才会出现计划完成度、模块进度和未来 7 天任务。下面保留的是全站学习证据，不是计划进度。"
            action={<Link to="/plan" className="btn-primary">设置学习计划</Link>}
          />
          <div className="mb-2 mt-5 flex items-end justify-between gap-2">
            <p className="eyebrow">全站学习证据</p>
            <span className="text-[9px] text-muted/60">不属于计划进度</span>
          </div>
          <div className="mt-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="精读完成" value={`${completedDocs}/${DOCS.length}`} icon={<BookOpen className="h-3.5 w-3.5 text-accent" />} />
            <StatCard label="问答掌握" value={`${masteredQa}/${TOTAL_QA}`} icon={<MessageSquareQuote className="h-3.5 w-3.5" />} />
            <StatCard label="今日到期" value={dueQa} icon={<Flame className="h-3.5 w-3.5 text-coral" />} />
            <StatCard label="题库正确率" value={`${quizAccuracy}%`} hint={`${state.quizAttempts.length} 套记录`} icon={<ListChecks className="h-3.5 w-3.5" />} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="card p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="eyebrow mb-1">RECENT EVIDENCE</p>
                  <h2 className="text-[14px] font-semibold text-ink">最近记录</h2>
                </div>
                <span className="text-[9px] text-muted">约 {readingMinutes} 分钟阅读</span>
              </div>
              {state.activity.length === 0 ? (
                <p className="rounded-xl bg-raised/50 p-3 text-[10.5px] leading-5 text-muted">还没有记录。先设置计划，或从一篇精读开始。</p>
              ) : (
                <div className="divide-y divide-line/10">
                  {state.activity.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 text-[10.5px]">
                      <span className="flex-1 truncate text-muted">{item.label}</span>
                      <span className="font-mono text-muted/60">{formatDate(item.at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <div className="space-y-4">
              <section className="card p-4">
                <div className="mb-2 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-accent" /><h2 className="text-[12px] font-semibold text-ink">从这里开始</h2></div>
                <p className="text-[9.5px] leading-5 text-muted">计划会决定模块、任务和进度统计。先选路线，再选计划类型。</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link to="/roadmap" className="btn-ghost py-1.5 text-[10px]">浏览路线</Link>
                  <Link to="/plan" className="btn-primary py-1.5 text-[10px]">设置计划</Link>
                </div>
              </section>
              {backupPanel}
              <section className="card p-4">
                <div className="mb-2 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-accent" /><h2 className="text-[12px] font-semibold text-ink">全站阅读证据</h2></div>
                <p className="text-[9.5px] leading-5 text-muted">约 {readingMinutes} 分钟阅读，{state.activity.length} 条活动记录。这些记录不属于任何计划。</p>
              </section>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
