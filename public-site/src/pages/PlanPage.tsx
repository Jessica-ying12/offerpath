import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Edit3,
  ListChecks,
  MessageSquareQuote,
  Play,
  Plus,
  Route,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ROADMAPS, ROADMAP_MAP, ROADMAP_CATEGORIES } from "../data/roadmaps";
import { buildPlan, defaultStageIds, PLAN_CATEGORIES, PLAN_TEMPLATES, templateById, type PlanTask } from "../lib/plan";
import { analyzeJd } from "../lib/jd";
import { useStore } from "../lib/store";
import type { PlanTemplateId } from "../lib/types";
import { PageContainer, PageHeader, ProgressRing } from "../components/ui";

const TYPE_LABEL: Record<PlanTask["type"], string> = {
  read: "精读",
  qa: "自测",
  quiz: "题库",
  project: "产出",
  custom: "自定义",
};

const TYPE_ICON = {
  read: BookOpen,
  qa: MessageSquareQuote,
  quiz: ListChecks,
  project: Sparkles,
  custom: Plus,
} as const;

function formatDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getMonth() + 1} 月 ${parsed.getDate()} 日 · ${parsed.toLocaleDateString("zh-CN", { weekday: "short" })}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function HrefLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer noopener" className={className}>{children}</a>;
  }
  return <Link to={href} className={className}>{children}</Link>;
}

export function PlanPage() {
  const {
    state,
    savePlan,
    togglePlanTask,
    excludePlanTask,
    addCustomPlanTask,
    removeCustomPlanTask,
    clearPlan,
  } = useStore();
  const [searchParams] = useSearchParams();
  const queryRoadmap = searchParams.get("roadmap");
  const existing = state.plan;
  const initialRoadmapId =
    (queryRoadmap && ROADMAP_MAP.has(queryRoadmap) ? queryRoadmap : existing?.goal.roadmapId) ?? "frontend";
  const initialTemplate = existing?.goal.templateId ?? "normal";
  const initialRoadmap = ROADMAP_MAP.get(initialRoadmapId) ?? ROADMAPS[0];

  const [editing, setEditing] = useState(
    !existing || Boolean(queryRoadmap && queryRoadmap !== existing.goal.roadmapId),
  );
  const [templateId, setTemplateId] = useState<PlanTemplateId>(initialTemplate);
  const [templateCategory, setTemplateCategory] = useState<(typeof PLAN_CATEGORIES)[number] | "all">("all");
  const [roadmapId, setRoadmapId] = useState(initialRoadmapId);
  const [days, setDays] = useState(existing?.goal.days ?? 30);
  const [dailyMinutes, setDailyMinutes] = useState(existing?.goal.dailyMinutes ?? 45);
  const [startDate, setStartDate] = useState(existing?.goal.startDate ?? today());
  const [stageIds, setStageIds] = useState<string[]>(
    existing?.goal.includedStageIds ?? defaultStageIds(initialRoadmap, initialTemplate),
  );
  const [includeOptional, setIncludeOptional] = useState(existing?.goal.includeOptional ?? false);
  const [jdText, setJdText] = useState(existing?.goal.jdText ?? "");
  const [resumeText, setResumeText] = useState(existing?.goal.resumeText ?? "");
  const [planName, setPlanName] = useState(
    existing?.goal.name ?? existing?.goal.title ?? `${templateById(initialTemplate).name} · ${initialRoadmap.name}`,
  );
  const [customDay, setCustomDay] = useState(1);
  const [customTitle, setCustomTitle] = useState("");
  const [error, setError] = useState("");

  const roadmap = ROADMAP_MAP.get(roadmapId) ?? ROADMAPS[0];
  const plan = existing;
  const planRoadmap = plan ? ROADMAP_MAP.get(plan.goal.roadmapId) : null;
  const built = useMemo(() => (plan && planRoadmap ? buildPlan(plan, planRoadmap) : null), [plan, planRoadmap]);
  const completedIds = new Set(plan?.progress.completedTaskIds ?? []);
  const firstUndone = built?.allTasks.find((task) => !completedIds.has(task.id));
  const stageBased = ["normal", "ten-week", "foundation", "daily"].includes(templateId);
  const planAnalysis = plan
    ? plan.goal.templateId === "interview"
      ? analyzeJd(plan.goal.resumeText ?? "")
      : plan.goal.templateId === "jd"
        ? analyzeJd(plan.goal.jdText ?? "")
        : null
    : null;

  useEffect(() => {
    if (!queryRoadmap || !ROADMAP_MAP.has(queryRoadmap)) return;
    if (existing?.goal.roadmapId === queryRoadmap) return;
    setRoadmapId(queryRoadmap);
    setEditing(true);
    setStageIds(defaultStageIds(ROADMAP_MAP.get(queryRoadmap)!, templateId));
    setPlanName(`${templateById(templateId).name} · ${ROADMAP_MAP.get(queryRoadmap)!.name}`);
  }, [queryRoadmap, existing?.goal.roadmapId, templateId]);

  const chooseTemplate = (id: PlanTemplateId) => {
    const template = templateById(id);
    setTemplateId(id);
    setDays(template.days);
    setDailyMinutes(template.dailyMinutes);
    setIncludeOptional(template.includeOptional);
    setStageIds(defaultStageIds(roadmap, id));
    setPlanName(`${template.name} · ${roadmap.name}`);
    setEditing(true);
    setError("");
  };

  const changeRoadmap = (id: string) => {
    const next = ROADMAP_MAP.get(id);
    if (!next) return;
    setRoadmapId(id);
    setStageIds(defaultStageIds(next, templateId));
    setPlanName(`${templateById(templateId).name} · ${next.name}`);
  };

  const toggleStage = (id: string) => {
    setStageIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const generate = () => {
    if (stageIds.length === 0) {
      setError("至少选择一个阶段。");
      return;
    }
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      setError("计划天数需在 1–365 天之间。");
      return;
    }
    if (templateId === "jd" && jdText.trim().length < 20) {
      setError("JD 定向计划需要粘贴至少 20 个字符的岗位 JD。");
      return;
    }
    if (templateId === "interview" && resumeText.trim().length < 20) {
      setError("面试冲刺计划需要粘贴至少 20 个字符的简历/项目描述。");
      return;
    }
    const template = templateById(templateId);
    savePlan(
      {
        roadmapId,
        templateId,
        name: planName.trim() || `${template.name} · ${roadmap.name}`,
        title: `${template.name} · ${roadmap.name}`,
        days,
        dailyMinutes,
        startDate,
        includedStageIds: stageBased ? stageIds : roadmap.stages.map((stage) => stage.id),
        includeOptional,
        jdText,
        resumeText,
      },
      true,
    );
    setEditing(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditing = () => {
    if (plan) {
      setTemplateId(plan.goal.templateId);
      setRoadmapId(plan.goal.roadmapId);
      setDays(plan.goal.days);
      setDailyMinutes(plan.goal.dailyMinutes);
      setStartDate(plan.goal.startDate);
      setStageIds(plan.goal.includedStageIds);
      setIncludeOptional(plan.goal.includeOptional);
      setJdText(plan.goal.jdText);
      setResumeText(plan.goal.resumeText ?? "");
      setPlanName(plan.goal.name ?? plan.goal.title);
    }
    setEditing(true);
    setError("");
  };

  const removeTask = (taskId: string) => {
    const task = built?.allTasks.find((item) => item.id === taskId);
    if (task?.source === "custom") removeCustomPlanTask(taskId);
    else excludePlanTask(taskId);
  };

  return (
    <PageContainer>
      <PageHeader
        back={{ to: planRoadmap ? `/roadmap/${planRoadmap.id}` : "/roadmap", label: "返回上一页" }}
        eyebrow="GOAL → PLAN → ACTION"
        title="学习计划"
        description="先明确目标和计划类型，再按路线生成每日任务。计划可以删任务、加自定义任务、改阶段和周期。"
        actions={
          plan && !editing ? (
            <>
              <button onClick={startEditing} className="btn-ghost">
                <Edit3 className="h-3.5 w-3.5" /> 编辑目标
              </button>
              {firstUndone?.href ? (
                <HrefLink href={firstUndone.href} className="btn-primary">
                  <Play className="h-3.5 w-3.5" /> 继续今日任务
                </HrefLink>
              ) : null}
            </>
          ) : null
        }
      />

      {editing ? (
        <div className="space-y-5">
          {plan ? (
            <div className="rounded-xl border border-accent/20 bg-accent/[0.045] px-4 py-3 text-[10px] leading-5 text-muted">
              当前计划「<strong className="text-ink">{plan.goal.name || plan.goal.title}</strong>」仍然有效。选择新的路线/类型后，只有点击“生成计划/重新生成计划”才会替换；不会因为点选而立即覆盖。
            </div>
          ) : null}
          <section className="card p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">1 · 选择计划类型</p>
                <h2 className="text-[15px] font-bold text-ink">普通计划、十周计划，或按需求分类</h2>
              </div>
              {plan ? <button onClick={() => setEditing(false)} className="btn-quiet"><X className="h-3 w-3" /> 取消编辑</button> : null}
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button onClick={() => setTemplateCategory("all")} className={`chip ${templateCategory === "all" ? "chip-active" : ""}`}>全部</button>
              {PLAN_CATEGORIES.map((category) => (
                <button key={category} onClick={() => setTemplateCategory(category)} className={`chip ${templateCategory === category ? "chip-active" : ""}`}>{category}</button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {PLAN_TEMPLATES.filter((template) => templateCategory === "all" || template.category === templateCategory).map((template) => {
                const selected = templateId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => chooseTemplate(template.id)}
                    className={`rounded-xl border p-3 text-left transition ${selected ? "border-accent/40 bg-accent/[0.055]" : "border-line/10 bg-surface hover:border-accent/25"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11.5px] font-semibold ${selected ? "text-accent" : "text-ink"}`}>{template.name}</span>
                      <span className="chip shrink-0 py-0.5 text-[8px]">{template.category}</span>
                      {selected ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" /> : <Circle className="h-3.5 w-3.5 shrink-0 text-line/30" />}
                    </div>
                    <p className="mt-1 text-[9.5px] leading-4 text-muted">{template.description}</p>
                    <p className="mt-1.5 font-mono text-[8.5px] text-muted/60">{template.days} 天 · 每天 {template.dailyMinutes} 分钟</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <p className="eyebrow mb-1">2 · 选择目标路线和周期</p>
            <h2 className="text-[15px] font-bold text-ink">明确目标，而不是系统猜你的目标</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-muted">目标路线</label>
                <select value={roadmapId} onChange={(event) => changeRoadmap(event.target.value)} className="input">
                  {ROADMAP_CATEGORIES.map((category) => (
                    <optgroup key={category.id} label={category.label}>
                      {ROADMAPS.filter((item) => item.category === category.id).map((item) => (
                        <option key={item.id} value={item.id}>{item.name} · {item.audience}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1.5 text-[9px] text-muted">{roadmap.description} · <Link to={`/roadmap/${roadmap.id}`} className="text-accent">查看路线</Link></p>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-muted">计划名称</label>
                <input value={planName} onChange={(event) => setPlanName(event.target.value)} maxLength={60} placeholder="给这个计划起个名字" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium text-muted">天数</label>
                  <input type="number" min={1} max={365} value={days} onChange={(event) => setDays(Number(event.target.value))} className="input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium text-muted">每天分钟</label>
                  <input type="number" min={15} max={240} step={15} value={dailyMinutes} onChange={(event) => setDailyMinutes(Number(event.target.value))} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-[10px] font-medium text-muted">开始日期</label>
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="input" />
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[10, 14, 21, 30, 45, 70].map((value) => (
                <button key={value} onClick={() => setDays(value)} className={`chip ${days === value ? "chip-active" : ""}`}>{value} 天</button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-[10px] text-muted">
              <input type="checkbox" checked={includeOptional} onChange={(event) => setIncludeOptional(event.target.checked)} className="accent-[rgb(var(--accent))]" />
              包含“加分/可选”节点
            </label>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">3 · {stageBased ? "选择阶段（可少学，不必全选）" : "任务来源"}</p>
                <h2 className="text-[15px] font-bold text-ink">{stageBased ? "计划范围" : "按你的描述生成"}</h2>
              </div>
              {stageBased ? <button onClick={() => setStageIds(roadmap.stages.map((stage) => stage.id))} className="btn-quiet text-[10px]">全选</button> : null}
            </div>
            {!stageBased ? (
              <p className="mt-3 rounded-lg bg-accent/[0.045] px-3 py-2 text-[9.5px] leading-5 text-muted">
                这个计划不按阶段铺量，而是按{templateId === "interview" ? "简历中的技术栈和项目经历" : templateId === "jd" ? "岗位 JD 命中的技术" : "项目/调试/代码题/表达重点"}生成任务；下方只保留必要的学习、面试问答和笔试题。
              </p>
            ) : null}
            <div className={`mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 ${stageBased ? "" : "hidden"}`}>
              {roadmap.stages.map((stage) => {
                const selected = stageIds.includes(stage.id);
                return (
                  <button
                    key={stage.id}
                    onClick={() => toggleStage(stage.id)}
                    className={`rounded-xl border p-3 text-left transition ${selected ? "border-accent/35 bg-accent/[0.045]" : "border-line/10 bg-surface"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-semibold ${selected ? "text-accent" : "text-ink"}`}>{stage.title}</span>
                      {selected ? <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> : <Circle className="h-3.5 w-3.5 text-line/30" />}
                    </div>
                    <p className="mt-0.5 text-[9px] text-muted">{stage.subtitle} · {stage.nodes.length} 节点</p>
                  </button>
                );
              })}
            </div>
            {templateId === "jd" ? (
              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-medium text-muted">岗位 JD（JD 定向计划必填）</label>
                <textarea value={jdText} onChange={(event) => setJdText(event.target.value)} rows={5} placeholder="粘贴目标岗位职责与要求，系统会优先安排命中的技术节点。" className="w-full resize-y rounded-xl border border-line/10 bg-paper/45 px-3.5 py-3 text-[12px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40" />
              </div>
            ) : null}
            {templateId === "interview" ? (
              <div className="mt-4">
                <label className="mb-1.5 block text-[10px] font-medium text-muted">简历 / 项目描述（面试冲刺计划必填）</label>
                <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} rows={6} placeholder="粘贴简历或项目经历：技术栈、职责、难点、指标。计划会优先安排简历技术相关的面试问答和笔试题。" className="w-full resize-y rounded-xl border border-line/12 bg-paper/45 px-3.5 py-3 text-[12px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40" />
              </div>
            ) : null}
            {error ? <p className="mt-3 rounded-lg bg-coral/[0.06] px-3 py-2 text-[10px] text-coral">{error}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/10 pt-4">
              <button onClick={generate} className="btn-primary">
                <Sparkles className="h-4 w-4" /> {plan ? "重新生成计划" : "生成计划"}
              </button>
              <span className="text-[9.5px] text-muted">重新生成会清空完成状态和自定义任务。</span>
              {plan ? (
                <button
                  onClick={() => {
                    if (window.confirm("清除当前计划？学习记录不会删除。")) {
                      clearPlan();
                      setEditing(true);
                    }
                  }}
                  className="btn-quiet ml-auto text-coral"
                >
                  清除计划
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : plan && built ? (
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProgressRing percent={built.total ? (built.done / built.total) * 100 : 0} size={72} label={`${built.done}/${built.total}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow text-accent/80">{templateById(plan.goal.templateId).category} · {templateById(plan.goal.templateId).name}</span>
                  <span className="chip">{plan.goal.days} 天</span>
                  <span className="chip">每天 {plan.goal.dailyMinutes} 分钟</span>
                </div>
                <h2 className="mt-1 font-display text-[22px] font-bold text-ink">{plan.goal.name || plan.goal.title}</h2>
                <p className="mt-1 text-[10.5px] text-muted">
                  {planRoadmap?.description} · 从 {plan.goal.startDate} 开始 · {plan.goal.includedStageIds.length}/{planRoadmap?.stages.length ?? 0} 个阶段
                </p>
                {planAnalysis && (planAnalysis.matched.length > 0 || plan.goal.templateId === "interview") ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[9px] text-muted">{plan.goal.templateId === "interview" ? "简历命中" : "JD 命中"}：</span>
                    {planAnalysis.matched.slice(0, 8).map((item) => <span key={item.label} className="chip bg-surface text-[8.5px] text-accent">{item.label}</span>)}
                    {planAnalysis.matched.length === 0 ? <span className="text-[9px] text-coral">未识别到词表技术，已按通用面试重点生成；建议补充项目技术栈。</span> : null}
                  </div>
                ) : null}
                {built.warning ? <p className="mt-2 rounded-lg bg-coral/[0.05] px-2.5 py-1.5 text-[9.5px] text-coral">{built.warning}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button onClick={startEditing} className="btn-ghost"><Edit3 className="h-3.5 w-3.5" /> 调整</button>
                {planRoadmap ? <Link to={`/roadmap/${planRoadmap.id}`} className="btn-ghost"><Route className="h-3.5 w-3.5" /> 路线</Link> : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line/10 pt-3 text-center">
              <div><p className="font-display text-[20px] font-bold text-ink">{built.total}</p><p className="text-[8.5px] text-muted">任务</p></div>
              <div><p className="font-display text-[20px] font-bold text-accent">{built.done}</p><p className="text-[8.5px] text-muted">已完成</p></div>
              <div><p className="font-display text-[20px] font-bold text-ink">{built.totalMinutes}</p><p className="text-[8.5px] text-muted">预计分钟</p></div>
            </div>
          </section>

          <section className="card p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">INSERT YOUR OWN</p>
                <h2 className="text-[13px] font-semibold text-ink">加一条自己的计划</h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <select value={customDay} onChange={(event) => setCustomDay(Number(event.target.value))} className="rounded-lg border border-line/10 bg-surface px-2 py-1.5 text-[10px] text-ink outline-none">
                  {Array.from({ length: plan.goal.days }, (_, index) => (
                    <option key={index} value={index + 1}>第 {index + 1} 天</option>
                  ))}
                </select>
                <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && customTitle.trim()) { addCustomPlanTask(customDay - 1, customTitle); setCustomTitle(""); } }} maxLength={80} placeholder="例如：复盘项目接口 / 写 2 道代码题" className="input w-64 py-1.5 text-[10.5px]" />
                <button
                  onClick={() => {
                    if (!customTitle.trim()) return;
                    addCustomPlanTask(customDay - 1, customTitle);
                    setCustomTitle("");
                  }}
                  disabled={!customTitle.trim()}
                  className="btn-primary py-1.5 text-[10px]"
                >
                  <Plus className="h-3 w-3" /> 添加
                </button>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {plan.goal.templateId === "ten-week" ? (
              Array.from({ length: 10 }, (_, weekIndex) => {
                const weekDays = built.days.filter((day) => Math.floor(day.index / 7) === weekIndex);
                const tasks = weekDays.flatMap((day) => day.tasks);
                const done = tasks.filter((task) => completedIds.has(task.id)).length;
                return (
                  <details key={weekIndex} open={weekIndex === 0} className="card overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-raised font-mono text-[10px] text-muted">W{weekIndex + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-ink">第 {weekIndex + 1} 周</p>
                        <p className="text-[9px] text-muted">{formatDay(weekDays[0]?.date ?? plan.goal.startDate)} – {formatDay(weekDays[weekDays.length - 1]?.date ?? "")} · {tasks.length} 任务</p>
                      </div>
                      <span className="font-mono text-[9px] text-muted">{done}/{tasks.length}</span>
                    </summary>
                    <div className="border-t border-line/10 p-3">
                      {weekDays.filter((day) => day.tasks.length > 0).map((day) => <DayPlan key={day.index} day={day} completedIds={completedIds} onToggle={togglePlanTask} onRemove={removeTask} />)}
                    </div>
                  </details>
                );
              })
            ) : (
              built.days.filter((day) => day.tasks.length > 0).map((day) => <DayPlan key={day.index} day={day} completedIds={completedIds} onToggle={togglePlanTask} onRemove={removeTask} />)
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-[13px] text-muted">还没有计划。选择上方任意计划类型开始。</p>
        </div>
      )}
    </PageContainer>
  );
}

function DayPlan({
  day,
  completedIds,
  onToggle,
  onRemove,
}: {
  day: ReturnType<typeof buildPlan>["days"][number];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-line/10 bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-ink">Day {day.index + 1} · {formatDay(day.date)}</p>
        <span className="font-mono text-[8.5px] text-muted/60">{day.tasks.length} 任务 · 约 {day.minutes} 分钟</span>
      </div>
      <div className="space-y-1">
        {day.tasks.map((task) => {
          const done = completedIds.has(task.id);
          const Icon = TYPE_ICON[task.type];
          return (
            <div key={task.id} className={`flex items-start gap-2 rounded-lg px-2 py-2 ${done ? "bg-accent/[0.045]" : "hover:bg-raised/50"}`}>
              <button onClick={() => onToggle(task.id)} className="mt-0.5 shrink-0 text-muted hover:text-accent" aria-label={done ? "标记未完成" : "标记完成"}>
                {done ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4" />}
              </button>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-raised text-muted ${task.type === "custom" ? "text-coral" : ""}`}><Icon className="h-3 w-3" /></span>
              <div className="min-w-0 flex-1">
                {task.href ? (
                  <HrefLink href={task.href} className={`text-[10.5px] leading-5 hover:text-accent ${done ? "text-muted line-through" : "text-ink/85"}`}>{task.title}</HrefLink>
                ) : (
                  <span className={`text-[10.5px] leading-5 ${done ? "text-muted line-through" : "text-ink/85"}`}>{task.title}</span>
                )}
                <span className="ml-2 text-[8px] text-muted/60">{TYPE_LABEL[task.type]} · {task.minutes} 分钟</span>
                {task.links?.length ? (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {task.links.map((link) => (
                      <HrefLink key={link.href} href={link.href} className="rounded border border-line/10 px-1.5 py-0.5 text-[8px] text-muted hover:border-accent/30 hover:text-accent">
                        {link.label}
                      </HrefLink>
                    ))}
                  </span>
                ) : null}
              </div>
              <button onClick={() => onRemove(task.id)} className="shrink-0 rounded p-1 text-muted/40 transition hover:bg-coral/10 hover:text-coral" aria-label="从计划移除">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
