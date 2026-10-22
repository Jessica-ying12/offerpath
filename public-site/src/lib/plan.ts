import { DOC_MAP, QA_MAP } from "./content";
import { analyzeJd } from "./jd";
import questionMeta from "../data/question-meta.json";
import type { LearningPlanState, PlanTemplateId } from "./types";
import type { Roadmap, RoadmapNode, RoadmapStage } from "../data/roadmaps";

export type PlanTemplate = {
  id: PlanTemplateId;
  name: string;
  category: "常规" | "系统" | "冲刺" | "基础" | "项目" | "定向" | "长期";
  description: string;
  days: number;
  dailyMinutes: number;
  includeOptional: boolean;
  stagePreset: "all" | "foundation" | "project" | "interview";
};

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "normal",
    name: "普通计划",
    category: "常规",
    description: "均衡推进一条路线，精读、自测、题库交替安排，天数可调。",
    days: 30,
    dailyMinutes: 45,
    includeOptional: false,
    stagePreset: "all",
  },
  {
    id: "ten-week",
    name: "十周计划",
    category: "系统",
    description: "按 10 周 / 70 天拆分阶段，每周有阶段产出，适合完整系统学习。",
    days: 70,
    dailyMinutes: 60,
    includeOptional: true,
    stagePreset: "all",
  },
  {
    id: "interview",
    name: "面试冲刺",
    category: "冲刺",
    description: "优先高频问答、代码题和项目表达，压缩阅读，适合 2 周冲刺。",
    days: 14,
    dailyMinutes: 60,
    includeOptional: false,
    stagePreset: "interview",
  },
  {
    id: "foundation",
    name: "补基础",
    category: "基础",
    description: "只推前半段核心基础，降低题量，先把语言和基础打牢。",
    days: 45,
    dailyMinutes: 45,
    includeOptional: false,
    stagePreset: "foundation",
  },
  {
    id: "project",
    name: "项目实战",
    category: "项目",
    description: "围绕项目、调试、代码题和面试表达组织任务，适合已有基础。",
    days: 21,
    dailyMinutes: 60,
    includeOptional: false,
    stagePreset: "project",
  },
  {
    id: "jd",
    name: "JD 定向",
    category: "定向",
    description: "按目标 JD 命中技术重排节点，优先补齐岗位缺口。",
    days: 21,
    dailyMinutes: 60,
    includeOptional: false,
    stagePreset: "all",
  },
  {
    id: "daily",
    name: "日常提升",
    category: "长期",
    description: "低负担长期计划，每天一小步，适合在职持续学习。",
    days: 30,
    dailyMinutes: 30,
    includeOptional: false,
    stagePreset: "all",
  },
];

export const PLAN_CATEGORIES = ["常规", "系统", "冲刺", "基础", "项目", "定向", "长期"] as const;

export function defaultStageIds(roadmap: Roadmap, template: PlanTemplateId): string[] {
  const stages = roadmap.stages;
  if (template === "foundation") {
    return stages.slice(0, Math.max(1, Math.ceil(stages.length * 0.6))).map((stage) => stage.id);
  }
  if (template === "project") {
    const projectStages = stages.filter((stage) => /项目|工程|系统|发布|质量/.test(stage.title));
    return (projectStages.length > 0 ? projectStages : stages.slice(-2)).map((stage) => stage.id);
  }
  if (template === "interview") {
    const interviewStages = stages.filter((stage) => /项目|面试|质量|系统|发布/.test(stage.title));
    return (interviewStages.length > 0 ? interviewStages : stages.slice(-3)).map((stage) => stage.id);
  }
  return stages.map((stage) => stage.id);
}

export type PlanTaskType = "read" | "qa" | "quiz" | "project" | "custom";

export type PlanTask = {
  id: string;
  dayIndex: number;
  title: string;
  type: PlanTaskType;
  href: string | null;
  nodeTitle?: string;
  stageTitle?: string;
  docIds?: string[];
  links?: Array<{ label: string; href: string }>;
  minutes: number;
  source: "generated" | "custom";
};

export type PlanDay = {
  index: number;
  date: string;
  tasks: PlanTask[];
  minutes: number;
  done: number;
};

export type BuiltPlan = {
  days: PlanDay[];
  allTasks: PlanTask[];
  total: number;
  done: number;
  excluded: number;
  tasksPerDay: number;
  totalMinutes: number;
  warning: string | null;
};

function addDays(startDate: string, days: number): string {
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return startDate;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function scoreNode(node: RoadmapNode, template: PlanTemplateId, jdDocs: Set<string>): number {
  let score = 0;
  if (template === "interview") {
    if (node.qaDoc) score += 8;
    if (node.bankDoc) score += 5;
    if ((node.docs ?? []).some((id) => ["08", "09", "12", "13"].includes(id))) score += 6;
    if (node.priority === "加分") score -= 4;
  }
  if (template === "project") {
    if ((node.docs ?? []).some((id) => ["08", "09", "12", "13", "19"].includes(id))) score += 8;
    if ((node.courseIds ?? []).length > 0) score += 3;
  }
  if (template === "jd") {
    for (const doc of node.docs ?? []) if (jdDocs.has(doc)) score += 10;
    for (const course of node.courseIds ?? []) if (jdDocs.has(course)) score += 6;
  }
  if (template === "foundation") {
    if (node.priority === "核心") score += 4;
    if ((node.courseIds ?? []).length > 0) score += 2;
  }
  return score;
}

function tasksForNode(
  roadmap: Roadmap,
  stage: RoadmapStage,
  node: RoadmapNode,
  nodeIndex: number,
  includeQa = true,
): PlanTask[] {
  const base = `generated-${roadmap.id}-${stage.id}-${nodeIndex}`;
  const actions: Array<{ label: string; href: string; minutes: number; type: PlanTaskType }> = [];
  const docs = node.docs ?? [];
  if (docs.length > 0) {
    actions.push({ label: "精读", href: `/doc/${docs[0]}`, minutes: 30, type: "read" });
  }
  if (includeQa && node.qaDoc && QA_MAP.has(node.qaDoc)) {
    actions.push({ label: "自测", href: `/qa/${node.qaDoc}`, minutes: 20, type: "qa" });
  }
  const bankCount = node.bankDoc
    ? questionMeta.byDoc[node.bankDoc as keyof typeof questionMeta.byDoc]?.total ?? 0
    : 0;
  if (node.bankDoc && bankCount > 0) {
    actions.push({ label: "练题", href: `/quiz?doc=${node.bankDoc}`, minutes: 20, type: "quiz" });
  } else if (node.courseIds?.length) {
    actions.push({ label: "课程题库", href: `/quiz?tab=course&course=${node.courseIds[0]}`, minutes: 20, type: "quiz" });
  }
  if (actions.length === 0) {
    actions.push({ label: "外部资料", href: roadmap.officialUrl, minutes: 30, type: "read" });
  }
  const primary = actions[0];
  return [{
    id: `${base}-study`,
    dayIndex: 0,
    title: `学习 · ${node.title}`,
    type: docs.length > 0 ? "read" : primary.type,
    href: primary.href,
    nodeTitle: node.title,
    stageTitle: stage.title,
    docIds: docs,
    minutes: actions.reduce((sum, action) => sum + action.minutes, 0),
    source: "generated",
    links: actions.slice(1).map((action) => ({ label: action.label, href: action.href })),
  }];
}

function uniqueDocs(ids: string[]): string[] {
  return [...new Set(ids)].filter((id) => DOC_MAP.has(id));
}

function makeDocTask(
  id: string,
  docId: string,
  type: "read" | "qa" | "quiz",
  minutes: number,
): PlanTask {
  const doc = DOC_MAP.get(docId);
  const title = doc?.title ?? docId;
  if (type === "read") {
    return {
      id,
      dayIndex: 0,
      title: `补短板 · ${title}`,
      type: "read",
      href: `/doc/${docId}`,
      nodeTitle: title,
      docIds: [docId],
      minutes,
      source: "generated",
    };
  }
  if (type === "qa") {
    return {
      id,
      dayIndex: 0,
      title: `面试问答 · ${title}`,
      type: "qa",
      href: `/qa/${docId}`,
      nodeTitle: title,
      minutes,
      source: "generated",
    };
  }
  return {
    id,
    dayIndex: 0,
    title: `笔试题 · ${title}`,
    type: "quiz",
    href: `/quiz?doc=${docId}`,
    nodeTitle: title,
    minutes,
    source: "generated",
  };
}

function bankCountFor(docId: string): number {
  return questionMeta.byDoc[docId as keyof typeof questionMeta.byDoc]?.total ?? 0;
}

function buildInterviewTasks(roadmap: Roadmap, goal: LearningPlanState["goal"]): PlanTask[] {
  const analysis = analyzeJd(goal.resumeText ?? "");
  const focus = uniqueDocs([...analysis.docIds, "09", "08", "12", "13"]).slice(0, 8);
  const tasks: PlanTask[] = [
    {
      id: `resume-${roadmap.id}-project`,
      dayIndex: 0,
      title: "简历项目追问 · 用自己的项目回答",
      type: "qa",
      href: "/qa/08",
      minutes: 30,
      source: "generated",
    },
    {
      id: `resume-${roadmap.id}-mock`,
      dayIndex: 0,
      title: "模拟面试 · 完整流程",
      type: "qa",
      href: "/qa",
      minutes: 30,
      source: "generated",
    },
  ];
  for (const docId of focus) {
    if (QA_MAP.has(docId)) tasks.push(makeDocTask(`resume-${docId}-qa`, docId, "qa", 20));
    if (bankCountFor(docId) > 0) tasks.push(makeDocTask(`resume-${docId}-quiz`, docId, "quiz", 20));
  }
  const weak = analysis.missingCore.filter((doc) => !focus.includes(doc.id)).slice(0, 3);
  for (const doc of weak) tasks.push(makeDocTask(`resume-${doc.id}-read`, doc.id, "read", 30));
  return tasks;
}

function buildJdTasks(roadmap: Roadmap, goal: LearningPlanState["goal"]): PlanTask[] {
  const analysis = analyzeJd(goal.jdText ?? "");
  const focus = uniqueDocs([
    ...analysis.docIds,
    ...analysis.missingCore.slice(0, 3).map((doc) => doc.id),
  ]).slice(0, 8);
  const tasks: PlanTask[] = [];
  for (const docId of focus) {
    tasks.push(makeDocTask(`jd-${docId}-read`, docId, "read", 30));
    if (QA_MAP.has(docId)) tasks.push(makeDocTask(`jd-${docId}-qa`, docId, "qa", 20));
    if (bankCountFor(docId) > 0) tasks.push(makeDocTask(`jd-${docId}-quiz`, docId, "quiz", 20));
  }
  tasks.push({
    id: `jd-${roadmap.id}-project`,
    dayIndex: 0,
    title: "JD 项目追问 · 对照岗位要求讲项目",
    type: "qa",
    href: "/qa/08",
    minutes: 30,
    source: "generated",
  });
  return tasks;
}

function buildProjectTasks(roadmap: Roadmap): PlanTask[] {
  const focus = uniqueDocs(["08", "09", "12", "13", "19"]);
  const tasks: PlanTask[] = [];
  for (const docId of focus) {
    tasks.push(makeDocTask(`project-${docId}-read`, docId, "read", 30));
    if (QA_MAP.has(docId)) tasks.push(makeDocTask(`project-${docId}-qa`, docId, "qa", 20));
    if (bankCountFor(docId) > 0) tasks.push(makeDocTask(`project-${docId}-quiz`, docId, "quiz", 20));
  }
  tasks.push({
    id: `project-${roadmap.id}-retro`,
    dayIndex: 0,
    title: "项目复盘 · 难点、取舍、指标、失败方案",
    type: "project",
    href: `/roadmap/${roadmap.id}`,
    minutes: 30,
    source: "generated",
  });
  return tasks;
}

function buildNodeTasks(
  roadmap: Roadmap,
  goal: LearningPlanState["goal"],
  included: Set<string>,
): PlanTask[] {
  const generated: PlanTask[] = [];
  const jd = goal.jdText ? analyzeJd(goal.jdText) : null;
  const jdDocs = new Set(jd?.docIds ?? []);
  for (const stage of roadmap.stages) {
    if (!included.has(stage.id)) continue;
    const nodes = stage.nodes
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => goal.includeOptional || node.priority !== "加分")
      .sort((a, b) => {
        const scoreA = scoreNode(a.node, goal.templateId, jdDocs);
        const scoreB = scoreNode(b.node, goal.templateId, jdDocs);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.index - b.index;
      });
    for (const { node, index } of nodes) {
      generated.push(...tasksForNode(roadmap, stage, node, index, goal.templateId !== "foundation"));
    }
  }
  if (goal.templateId === "ten-week") {
    for (const stage of roadmap.stages) {
      if (!included.has(stage.id)) continue;
      generated.push({
        id: `generated-${roadmap.id}-${stage.id}-milestone`,
        dayIndex: 0,
        title: `阶段产出 · ${stage.title}`,
        type: "project",
        href: `/roadmap/${roadmap.id}`,
        stageTitle: stage.title,
        minutes: 30,
        source: "generated",
      });
    }
  }
  return generated;
}

export function buildPlan(
  planState: LearningPlanState,
  roadmap: Roadmap,
): BuiltPlan {
  const { goal, progress } = planState;
  const included = new Set(goal.includedStageIds.length > 0 ? goal.includedStageIds : roadmap.stages.map((stage) => stage.id));
  const excluded = new Set(progress.excludedTaskIds);
  const completed = new Set(progress.completedTaskIds);
  const generated =
    goal.templateId === "interview"
      ? buildInterviewTasks(roadmap, goal)
      : goal.templateId === "jd"
        ? buildJdTasks(roadmap, goal)
        : goal.templateId === "project"
          ? buildProjectTasks(roadmap)
          : buildNodeTasks(roadmap, goal, included);

  const filtered = generated.filter((task) => !excluded.has(task.id));
  const tasksPerDay = Math.max(1, Math.ceil(filtered.length / Math.max(1, goal.days)));
  filtered.forEach((task, index) => {
    task.dayIndex = Math.min(goal.days - 1, Math.floor(index / tasksPerDay));
  });

  const custom: PlanTask[] = progress.customTasks
    .filter((task) => !excluded.has(task.id))
    .map((task) => ({
      id: task.id,
      dayIndex: Math.min(goal.days - 1, Math.max(0, task.dayIndex)),
      title: task.title,
      type: "custom",
      href: null,
      minutes: Math.max(10, Math.round(goal.dailyMinutes / 2)),
      source: "custom",
    }));
  const allTasks = [...filtered, ...custom].sort(
    (a, b) => a.dayIndex - b.dayIndex || (a.source === "custom" ? 1 : 0) - (b.source === "custom" ? 1 : 0),
  );

  const days: PlanDay[] = Array.from({ length: goal.days }, (_, index) => {
    const tasks = allTasks.filter((task) => task.dayIndex === index);
    return {
      index,
      date: addDays(goal.startDate, index),
      tasks,
      minutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
      done: tasks.filter((task) => completed.has(task.id)).length,
    };
  });

  const totalMinutes = allTasks.reduce((sum, task) => sum + task.minutes, 0);
  const warning =
    allTasks.length > goal.days * 8
      ? "任务量较大，建议增加天数或每日时间。"
      : tasksPerDay * 30 > goal.dailyMinutes
        ? "按当前任务量，每天可能需要超过设定时长；可减少阶段或增加天数。"
        : null;

  return {
    days,
    allTasks,
    total: allTasks.length,
    done: allTasks.filter((task) => completed.has(task.id)).length,
    excluded: progress.excludedTaskIds.length,
    tasksPerDay,
    totalMinutes,
    warning,
  };
}

export function templateById(id: PlanTemplateId): PlanTemplate {
  return PLAN_TEMPLATES.find((template) => template.id === id) ?? PLAN_TEMPLATES[0];
}
