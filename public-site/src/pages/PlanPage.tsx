import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
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
import { ROADMAPS, ROADMAP_MAP, ROADMAP_PLAN_GROUPS } from "../data/roadmaps";
import {
  buildPlan,
  defaultStageIds,
  PLAN_CATEGORIES,
  PLAN_TEMPLATES,
  templateById,
  type BuiltPlan,
  type PlanModule,
  type PlanTask,
} from "../lib/plan";
import { analyzeJd } from "../lib/jd";
import { useStore } from "../lib/store";
import type { LearningPlanState, PlanTemplateId } from "../lib/types";
import { Breadcrumbs, PageContainer, PageHeader, ProgressRing } from "../components/ui";

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

const MODULE_HINT: Record<PlanTemplateId, string> = {
  normal: "按路线阶段分模块，每个知识点一次完成精读、自测和练题。",
  "ten-week": "按周分模块，每周有推进范围；每周最后一个任务用来验收。",
  interview: "按简历拆解、技术问答、笔试题、模拟面试、补短板分模块。",
  foundation: "只取路线前半段核心节点，按基础阶段分模块，不安排问答和项目。",
  project: "按项目拆解、调试、代码题、系统设计、复盘表达分模块。",
  jd: "按 JD 命中技术、岗位缺口、项目追问、全真演练分模块。",
  daily: "按周分模块，每天只有一个最小任务，周末回看。",
};

function formatDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${parsed.getMonth() + 1} 月 ${parsed.getDate()} 日 · ${parsed.toLocaleDateString("zh-CN", { weekday: "short" })}`;
}

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function HrefLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer noopener" className={className}>{children}</a>;
  }
  return <Link to={href} className={className}>{children}</Link>;
}

function typeCounts(tasks: PlanTask[]) {
  return (Object.keys(TYPE_LABEL) as PlanTask["type"][])
    .map((type) => ({ type, count: tasks.filter((task) => task.type === type).length }))
    .filter((item) => item.count > 0);
}

function todayIndex(plan: LearningPlanState): number {
  const now = new Date();
  const start = new Date(`${plan.goal.startDate}T00:00:00`);
  const day = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  if (!Number.isFinite(day)) return 0;
  return Math.min(plan.goal.days - 1, Math.max(0, day));
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
  const [nameTouched, setNameTouched] = useState(Boolean(existing));
  const [error, setError] = useState("");

  const roadmap = ROADMAP_MAP.get(roadmapId) ?? ROADMAPS[0];
  const plan = existing;
  const planRoadmap = plan ? ROADMAP_MAP.get(plan.goal.roadmapId) : null;
  const built = useMemo(() => (plan && planRoadmap ? buildPlan(plan, planRoadmap) : null), [plan, planRoadmap]);
  const completedIds = new Set(plan?.progress.completedTaskIds ?? []);
  const firstUndone = built?.allTasks.find((task) => !completedIds.has(task.id));
  const stageBased = ["normal", "ten-week", "daily"].includes(templateId);
  const planAnalysis = plan
    ? plan.goal.templateId === "interview"
      ? analyzeJd(plan.goal.resumeText ?? "")
      : plan.goal.templateId === "jd"
        ? analyzeJd(plan.goal.jdText ?? "")
        : null
    : null;
  const draftAnalysis =
    templateId === "interview" ? analyzeJd(resumeText) : templateId === "jd" ? analyzeJd(jdText) : null;

  const preview = useMemo(() => {
    const previewStages =
      stageBased || templateId === "foundation" ? stageIds : roadmap.stages.map((stage) => stage.id);
    const goal: LearningPlanState["goal"] = {
      roadmapId: roadmap.id,
      templateId,
      name: planName.trim() || `${templateById(templateId).name} · ${roadmap.name}`,
      title: `${templateById(templateId).name} · ${roadmap.name}`,
      days: templateId === "ten-week" ? 70 : days,
      dailyMinutes,
      startDate,
      includedStageIds: previewStages.length > 0 ? previewStages : roadmap.stages.map((stage) => stage.id),
      includeOptional,
      jdText,
      resumeText,
      createdAt: "",
      updatedAt: "",
    };
    return buildPlan(
      { goal, progress: { completedTaskIds: [], excludedTaskIds: [], customTasks: [] } },
      roadmap,
    );
  }, [stageBased, stageIds, roadmap, templateId, planName, days, dailyMinutes, startDate, includeOptional, jdText, resumeText]);

  useEffect(() => {
    if (!queryRoadmap || !ROADMAP_MAP.has(queryRoadmap)) return;
    if (existing?.goal.roadmapId === queryRoadmap) return;
    const next = ROADMAP_MAP.get(queryRoadmap)!;
    setRoadmapId(queryRoadmap);
    setEditing(true);
    setStageIds(defaultStageIds(next, templateId));
    setPlanName(`${templateById(templateId).name} · ${next.name}`);
    setNameTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryRoadmap]);

  const chooseTemplate = (id: PlanTemplateId) => {
    const template = templateById(id);
    setTemplateId(id);
    setDays(template.days);
    setDailyMinutes(template.dailyMinutes);
    setIncludeOptional(template.includeOptional);
    setStageIds(defaultStageIds(roadmap, id));
    if (!nameTouched) setPlanName(`${template.name} · ${roadmap.name}`);
    setEditing(true);
    setError("");
  };

  const changeRoadmap = (id: string) => {
    const next = ROADMAP_MAP.get(id);
    if (!next) return;
    setRoadmapId(id);
    setStageIds(defaultStageIds(next, templateId));
    if (!nameTouched) setPlanName(`${templateById(templateId).name} · ${next.name}`);
  };

  const toggleStage = (id: string) => {
    setStageIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const generate = () => {
    if (stageBased && stageIds.length === 0) {
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
        days: templateId === "ten-week" ? 70 : days,
        dailyMinutes,
        startDate,
        includedStageIds: stageBased || templateId === "foundation" ? stageIds : roadmap.stages.map((stage) => stage.id),
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
      setNameTouched(true);
    }
    setEditing(true);
    setError("");
  };

  const deletePlan = () => {
    if (!window.confirm("删除这个计划？计划里的完成状态和自定义任务会一起清空，学习记录（精读、自测、题库）不会删除。")) return;
    clearPlan();
    setEditing(true);
    setError("");
    setNameTouched(false);
  };

  const removeTask = (taskId: string) => {
    const task = built?.allTasks.find((item) => item.id === taskId);
    if (task?.source === "custom") removeCustomPlanTask(taskId);
    else excludePlanTask(taskId);
  };

  const currentDay = plan && built ? todayIndex(plan) : 0;
  const todayTasks = plan && built ? built.days[currentDay]?.tasks ?? [] : [];
  const nextTask = firstUndone ?? todayTasks[0];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "总览", to: "/" }, { label: "学习计划" }]} className="mb-4" />
      <PageHeader
        eyebrow="GOAL → PLAN → ACTION"
        title="学习计划"
        description={
          editing
            ? "先选计划类型，再看这份计划会生成哪些模块，最后才生成。不同目标会得到不同的模块和任务，不再套同一份模板。"
            : "当前计划的模块、任务和完成状态。切换计划类型或重新生成前，旧计划仍然有效。"
        }
        actions={
          plan && !editing ? (
            <>
              <button onClick={startEditing} className="btn-ghost">
                <Edit3 className="h-3.5 w-3.5" /> 编辑目标
              </button>
              {nextTask?.href ? (
                <HrefLink href={nextTask.href} className="btn-primary">
                  <Play className="h-3.5 w-3.5" /> 继续下一步
                </HrefLink>
              ) : null}
            </>
          ) : null
        }
      />

      {editing ? (
        <div className="space-y-5">
          {plan ? (
            <div className="flex flex-col gap-2 rounded-xl border border-accent/20 bg-accent/[0.045] px-4 py-3 text-[10px] leading-5 text-muted sm:flex-row sm:items-center">
              <span className="flex-1">
                当前计划「<strong className="text-ink">{plan.goal.name || plan.goal.title}</strong>」仍然有效。只有点击“生成计划/重新生成计划”才会替换。
              </span>
              <button onClick={() => setEditing(false)} className="btn-quiet self-start"><X className="h-3 w-3" /> 取消编辑</button>
            </div>
          ) : null}

          <section className="card p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">1 · 你要解决什么问题</p>
                <h2 className="text-[15px] font-bold text-ink">先选计划类型，再决定输入什么</h2>
              </div>
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
            <p className="eyebrow mb-1">2 · 目标与输入</p>
            <h2 className="text-[15px] font-bold text-ink">{templateById(templateId).name} · 需要你提供什么</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-muted">
                  {templateId === "interview" || templateId === "jd" ? "目标路线（用于补基础范围）" : "目标路线"}
                </label>
                <select value={roadmapId} onChange={(event) => changeRoadmap(event.target.value)} className="input">
                  {ROADMAP_PLAN_GROUPS.map((group) => (
                    <optgroup key={group.id} label={`${group.label} · ${group.routes.length}`}>
                      {group.routes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}{item.nameZh ? ` · ${item.nameZh}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1.5 text-[9px] text-muted">{roadmap.description} · <Link to={`/roadmap/${roadmap.id}`} className="text-accent">查看路线</Link></p>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium text-muted">计划名称</label>
                <input
                  value={planName}
                  onChange={(event) => {
                    setPlanName(event.target.value);
                    setNameTouched(true);
                  }}
                  maxLength={60}
                  placeholder="给这个计划起个名字"
                  className="input"
                />
                <p className="mt-1.5 text-[9px] text-muted">名称会显示在总览、侧栏和学习进度里。</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium text-muted">天数</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={templateId === "ten-week" ? 70 : days}
                    disabled={templateId === "ten-week"}
                    onChange={(event) => setDays(Number(event.target.value))}
                    className="input disabled:opacity-60"
                  />
                  {templateId === "ten-week" ? <p className="mt-1 text-[8.5px] text-accent">10 周系统计划固定 70 天</p> : null}
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

            {templateId !== "ten-week" ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[10, 14, 21, 30, 45, 70].map((value) => (
                  <button key={value} onClick={() => setDays(value)} className={`chip ${days === value ? "chip-active" : ""}`}>{value} 天</button>
                ))}
              </div>
            ) : null}

            {templateId === "interview" ? (
              <div className="mt-4 rounded-xl border border-line/10 bg-paper/35 p-3.5">
                <label className="mb-1.5 block text-[10px] font-medium text-ink">简历 / 项目描述（必填）</label>
                <textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} rows={6} placeholder="粘贴简历或项目经历：技术栈、职责、难点、指标。技术问答和笔试题会按这里命中的技术生成，而不是直接铺整条路线。" className="w-full resize-y rounded-xl border border-line/12 bg-paper/45 px-3.5 py-3 text-[12px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40" />
                <p className="mt-1.5 text-[9px] leading-4 text-muted">这是规则匹配：只识别技术名词和基础缺口，不会生成或捏造你的项目经历。</p>
                {draftAnalysis && draftAnalysis.matched.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-[9px] text-muted">识别到：</span>
                    {draftAnalysis.matched.map((item) => <span key={item.label} className="chip bg-surface text-[8.5px] text-accent">{item.label}</span>)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {templateId === "jd" ? (
              <div className="mt-4 rounded-xl border border-line/10 bg-paper/35 p-3.5">
                <label className="mb-1.5 block text-[10px] font-medium text-ink">岗位 JD（必填）</label>
                <textarea value={jdText} onChange={(event) => setJdText(event.target.value)} rows={6} placeholder="粘贴目标岗位职责与要求。计划会按命中技术、岗位缺口、项目追问和全真演练分模块，不按阶段铺量。" className="w-full resize-y rounded-xl border border-line/10 bg-paper/45 px-3.5 py-3 text-[12px] leading-6 text-ink outline-none placeholder:text-muted/50 focus:border-accent/40" />
                {draftAnalysis && draftAnalysis.matched.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-[9px] text-muted">JD 命中：</span>
                    {draftAnalysis.matched.map((item) => <span key={item.label} className="chip bg-surface text-[8.5px] text-accent">{item.label}</span>)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {templateId === "project" ? (
              <p className="mt-4 rounded-lg bg-accent/[0.045] px-3 py-2 text-[9.5px] leading-5 text-muted">
                项目实战不看阶段：会固定生成项目拆解、调试专项、代码题、系统设计和复盘表达五个模块，适合已经学过基础、需要产出可讲经历的人。
              </p>
            ) : null}
            {templateId === "foundation" ? (
              <p className="mt-4 rounded-lg bg-accent/[0.045] px-3 py-2 text-[9.5px] leading-5 text-muted">
                补基础只取路线前 60% 阶段里的“核心”节点，不安排问答、项目或加分项；每个阶段结束做一次基础复盘。
              </p>
            ) : null}
            {templateId === "daily" ? (
              <p className="mt-4 rounded-lg bg-accent/[0.045] px-3 py-2 text-[9.5px] leading-5 text-muted">
                日常提升每天只排一个最小任务，按周分组；不追求覆盖整条路线，先保证能持续。
              </p>
            ) : null}
          </section>

          {stageBased ? (
            <section className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="eyebrow mb-1">3 · 计划范围</p>
                  <h2 className="text-[15px] font-bold text-ink">选择阶段（可少学，不必全选）</h2>
                </div>
                <button onClick={() => setStageIds(roadmap.stages.map((stage) => stage.id))} className="btn-quiet text-[10px]">全选</button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
              <label className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                <input type="checkbox" checked={includeOptional} onChange={(event) => setIncludeOptional(event.target.checked)} className="accent-[rgb(var(--accent))]" />
                包含“加分/可选”节点
              </label>
            </section>
          ) : (
            <section className="card p-5 sm:p-6">
              <p className="eyebrow mb-1">3 · 任务来源</p>
              <h2 className="text-[15px] font-bold text-ink">不按阶段铺量</h2>
              <p className="mt-2 text-[10px] leading-5 text-muted">{MODULE_HINT[templateId]}</p>
            </section>
          )}

          <section className="rounded-2xl border border-accent/20 bg-accent/[0.045] p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow mb-1 text-accent/80">计划结构预览 · 生成前就能看到</p>
                <h2 className="text-[15px] font-bold text-ink">{preview.modules.length} 个模块 · {preview.total} 个任务 · 约 {preview.totalMinutes} 分钟</h2>
                <p className="mt-1 text-[9.5px] text-muted">{MODULE_HINT[templateId]}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {typeCounts(preview.allTasks).map((item) => (
                  <span key={item.type} className="chip bg-surface text-[8.5px]">{TYPE_LABEL[item.type]} {item.count}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {preview.modules.slice(0, 9).map((module) => (
                <div key={module.id} className="rounded-xl border border-line/10 bg-surface p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10.5px] font-semibold text-ink">{module.title}</p>
                    <span className="font-mono text-[8.5px] text-muted">{module.total} 任务</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-4 text-muted">{module.description}</p>
                </div>
              ))}
            </div>
            {preview.allTasks.length > 0 ? (
              <div className="mt-3 rounded-xl bg-surface/60 p-3">
                <p className="mb-1.5 text-[9px] font-semibold text-muted">示例任务</p>
                <div className="flex flex-wrap gap-1">
                  {preview.allTasks.slice(0, 5).map((task) => (
                    <span key={task.id} className="rounded-md border border-line/10 bg-surface px-1.5 py-0.5 text-[8.5px] text-ink/70">{task.title}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {templateId === "interview" && resumeText.trim().length < 20 ? (
              <p className="mt-3 rounded-lg bg-coral/[0.06] px-3 py-2 text-[9.5px] text-coral">先粘贴简历，技术问答和笔试题才会按你的技术栈变化；当前预览使用通用高频范围。</p>
            ) : null}
            {templateId === "jd" && jdText.trim().length < 20 ? (
              <p className="mt-3 rounded-lg bg-coral/[0.06] px-3 py-2 text-[9.5px] text-coral">先粘贴 JD，命中技术和岗位缺口才会按岗位变化；当前预览使用通用范围。</p>
            ) : null}
          </section>

          {error ? <p className="rounded-lg bg-coral/[0.06] px-3 py-2 text-[10px] text-coral">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-2 border-t border-line/10 pt-4">
            <button onClick={generate} className="btn-primary">
              <Sparkles className="h-4 w-4" /> {plan ? "重新生成计划" : "生成计划"}
            </button>
            <span className="text-[9.5px] text-muted">重新生成会清空完成状态和自定义任务；学习记录不受影响。</span>
            {plan ? (
              <button onClick={deletePlan} className="btn-quiet ml-auto text-coral">
                <Trash2 className="h-3 w-3" /> 删除这个计划
              </button>
            ) : null}
          </div>
        </div>
      ) : plan && built ? (
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProgressRing percent={built.total ? (built.done / built.total) * 100 : 0} size={78} label={`${built.done}/${built.total}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow text-accent/80">{templateById(plan.goal.templateId).category} · {templateById(plan.goal.templateId).name}</span>
                  <span className="chip">{plan.goal.days} 天</span>
                  <span className="chip">每天 {plan.goal.dailyMinutes} 分钟</span>
                  <span className="chip">{built.modules.length} 个模块</span>
                </div>
                <h2 className="mt-1 font-display text-[24px] font-bold text-ink">{plan.goal.name || plan.goal.title}</h2>
                <p className="mt-1 text-[10.5px] text-muted">
                  {planRoadmap?.name} · 从 {plan.goal.startDate} 开始 · 当前第 {currentDay + 1} 天
                </p>
                {planAnalysis && planAnalysis.matched.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[9px] text-muted">{plan.goal.templateId === "interview" ? "简历命中" : "JD 命中"}：</span>
                    {planAnalysis.matched.slice(0, 8).map((item) => <span key={item.label} className="chip bg-surface text-[8.5px] text-accent">{item.label}</span>)}
                  </div>
                ) : null}
                {built.warning ? <p className="mt-2 rounded-lg bg-coral/[0.05] px-2.5 py-1.5 text-[9.5px] text-coral">{built.warning}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button onClick={startEditing} className="btn-ghost"><Edit3 className="h-3.5 w-3.5" /> 调整</button>
                {planRoadmap ? <Link to={`/roadmap/${planRoadmap.id}`} className="btn-ghost"><Route className="h-3.5 w-3.5" /> 路线</Link> : null}
                <button onClick={deletePlan} className="btn-quiet text-coral" aria-label="删除计划"><Trash2 className="h-3.5 w-3.5" /> 删除计划</button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line/10 pt-3 text-center sm:grid-cols-4">
              <div><p className="font-display text-[20px] font-bold text-ink">{built.total}</p><p className="text-[8.5px] text-muted">计划任务</p></div>
              <div><p className="font-display text-[20px] font-bold text-accent">{built.done}</p><p className="text-[8.5px] text-muted">已完成</p></div>
              <div><p className="font-display text-[20px] font-bold text-ink">{built.total - built.done}</p><p className="text-[8.5px] text-muted">剩余</p></div>
              <div><p className="font-display text-[20px] font-bold text-ink">{built.totalMinutes}</p><p className="text-[8.5px] text-muted">预计分钟</p></div>
            </div>
            <p className="mt-2 text-[8.5px] text-muted/60">进度只统计这个计划里的任务。删除计划后，这里会回到空状态。</p>
          </section>

          <section className="card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">TODAY / NEXT</p>
                <h2 className="text-[13.5px] font-semibold text-ink">{todayTasks.length > 0 ? `第 ${currentDay + 1} 天 · ${formatDay(built.days[currentDay]?.date ?? plan.goal.startDate)}` : "下一步"}</h2>
              </div>
              <span className="text-[9px] text-muted">{todayTasks.filter((task) => completedIds.has(task.id)).length}/{todayTasks.length || 1} 完成</span>
            </div>
            {todayTasks.length === 0 ? (
              <p className="rounded-xl bg-raised/50 p-3 text-[10px] text-muted">今天没有排任务，可以从下方模块继续，或直接添加一条。</p>
            ) : (
              <div className="space-y-1">
                {todayTasks.map((task) => <TaskRow key={task.id} task={task} date={built.days[task.dayIndex]?.date} done={completedIds.has(task.id)} onToggle={togglePlanTask} onRemove={removeTask} />)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="eyebrow mb-1">PLAN MODULES</p>
                <h2 className="text-[15px] font-bold text-ink">这份计划的模块</h2>
                <p className="mt-0.5 text-[9.5px] text-muted">{MODULE_HINT[plan.goal.templateId]}</p>
              </div>
              <span className="font-mono text-[9px] text-muted/60">{built.done}/{built.total} 完成</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {built.modules.map((module) => {
                const percent = module.total ? Math.round((module.done / module.total) * 100) : 0;
                return (
                  <button
                    key={module.id}
                    onClick={() => document.getElementById(`plan-module-${module.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="rounded-xl border border-line/10 bg-surface p-3 text-left transition hover:border-accent/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-ink">{module.title}</p>
                      <span className="font-mono text-[8.5px] text-muted">{module.done}/{module.total}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-4 text-muted">{module.description}</p>
                    <div className="progress-track mt-2 h-1"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="space-y-3">
            {built.modules.map((module, index) => (
              <ModuleSection
                key={module.id}
                module={module}
                index={index}
                built={built}
                plan={plan}
                completedIds={completedIds}
                onToggle={togglePlanTask}
                onRemove={removeTask}
                onAdd={addCustomPlanTask}
                defaultOpen={index === 0 || module.done < module.total}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-[13px] text-muted">还没有计划。选择上方计划类型开始。</p>
        </div>
      )}
    </PageContainer>
  );
}

function ModuleSection({
  module,
  index,
  built,
  plan,
  completedIds,
  onToggle,
  onRemove,
  onAdd,
  defaultOpen,
}: {
  module: PlanModule;
  index: number;
  built: BuiltPlan;
  plan: LearningPlanState;
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (dayIndex: number, title: string, module?: string) => void;
  defaultOpen: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const nextDay = module.tasks.find((task) => !completedIds.has(task.id))?.dayIndex ?? module.tasks[0]?.dayIndex ?? 0;
  const [day, setDay] = useState(nextDay);
  const percent = module.total ? Math.round((module.done / module.total) * 100) : 0;

  useEffect(() => {
    setDay(nextDay);
  }, [nextDay]);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(day, title, module.title);
    setTitle("");
    setAdding(false);
  };

  return (
    <details id={`plan-module-${module.id}`} open={defaultOpen} className="card scroll-mt-24 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raised font-mono text-[9px] text-accent">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-semibold text-ink">{module.title}</p>
            <span className="font-mono text-[8.5px] text-muted/60">{module.done}/{module.total} · {module.minutes} 分钟</span>
          </div>
          <p className="mt-0.5 text-[9px] leading-4 text-muted">{module.description}</p>
          <div className="progress-track mt-1.5 h-1 max-w-sm"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
        </div>
        <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-muted" />
      </summary>
      <div className="border-t border-line/10 p-3">
        <div className="space-y-1">
          {module.tasks.map((task) => (
            <TaskRow key={task.id} task={task} date={built.days[task.dayIndex]?.date} done={completedIds.has(task.id)} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </div>
        <div className="mt-2 border-t border-line/10 pt-2">
          {adding ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <select value={day} onChange={(event) => setDay(Number(event.target.value))} className="rounded-lg border border-line/10 bg-surface px-2 py-1.5 text-[10px] text-ink outline-none">
                {Array.from({ length: plan.goal.days }, (_, item) => (
                  <option key={item} value={item}>第 {item + 1} 天 · {formatDay(built.days[item]?.date ?? plan.goal.startDate)}</option>
                ))}
              </select>
              <input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                  if (event.key === "Escape") setAdding(false);
                }}
                maxLength={80}
                placeholder={`给「${module.title}」加一条任务`}
                className="input min-w-[220px] flex-1 py-1.5 text-[10.5px]"
              />
              <button onClick={submit} disabled={!title.trim()} className="btn-primary py-1.5 text-[10px]"><Plus className="h-3 w-3" /> 添加到本模块</button>
              <button onClick={() => setAdding(false)} className="btn-quiet text-[10px]">取消</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] text-accent transition hover:bg-accent/[0.06]">
              <Plus className="h-3 w-3" /> 给这个模块加一条任务
            </button>
          )}
        </div>
      </div>
    </details>
  );
}

function TaskRow({
  task,
  date,
  done,
  onToggle,
  onRemove,
}: {
  task: PlanTask;
  date?: string;
  done: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = TYPE_ICON[task.type];
  return (
    <div className={`flex items-start gap-2 rounded-lg px-2 py-2 ${done ? "bg-accent/[0.045]" : "hover:bg-raised/50"}`}>
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
        <span className="ml-2 text-[8px] text-muted/60">
          {TYPE_LABEL[task.type]} · 第 {task.dayIndex + 1} 天{date ? ` · ${formatDay(date)}` : ""} · {task.minutes} 分钟
        </span>
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
}
