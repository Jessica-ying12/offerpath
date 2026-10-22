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
    name: "常规计划",
    category: "常规",
    description: "沿一条路线按阶段推进：每个知识点一次学完精读、自测和练题，阶段结束做复盘。",
    days: 30,
    dailyMinutes: 45,
    includeOptional: false,
    stagePreset: "all",
  },
  {
    id: "ten-week",
    name: "10 周系统计划",
    category: "系统",
    description: "把路线拆成 10 个周模块，每周有明确推进范围和一个可验收的周产出。",
    days: 70,
    dailyMinutes: 60,
    includeOptional: true,
    stagePreset: "all",
  },
  {
    id: "interview",
    name: "面试冲刺",
    category: "冲刺",
    description: "先拆简历项目，再按简历技术栈安排问答、笔试、模拟面试和补短板，不铺整条路线。",
    days: 14,
    dailyMinutes: 60,
    includeOptional: false,
    stagePreset: "interview",
  },
  {
    id: "foundation",
    name: "补基础",
    category: "基础",
    description: "只取路线前半段的核心节点，去掉问答和项目，先把概念和基础题打牢。",
    days: 30,
    dailyMinutes: 40,
    includeOptional: false,
    stagePreset: "foundation",
  },
  {
    id: "project",
    name: "项目实战",
    category: "项目",
    description: "按项目拆解、调试、代码题、系统设计、复盘表达五个模块产出可讲的经历。",
    days: 21,
    dailyMinutes: 60,
    includeOptional: false,
    stagePreset: "project",
  },
  {
    id: "jd",
    name: "JD 定向",
    category: "定向",
    description: "逐条识别 JD 命中的技术，按命中技术、岗位缺口、项目追问和全真演练生成任务。",
    days: 21,
    dailyMinutes: 60,
    includeOptional: false,
    stagePreset: "all",
  },
  {
    id: "daily",
    name: "日常提升",
    category: "长期",
    description: "每天只排一个最小任务，按周推进；适合在职，坚持比堆量重要。",
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
  module: string;
  moduleId: string;
  nodeTitle?: string;
  stageTitle?: string;
  docIds?: string[];
  links?: Array<{ label: string; href: string }>;
  minutes: number;
  source: "generated" | "custom";
};

export type PlanModule = {
  id: string;
  title: string;
  description: string;
  tasks: PlanTask[];
  total: number;
  done: number;
  minutes: number;
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
  modules: PlanModule[];
  allTasks: PlanTask[];
  total: number;
  done: number;
  excluded: number;
  tasksPerDay: number;
  totalMinutes: number;
  warning: string | null;
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  简历定点: "把简历里的项目、职责和指标改写成能被追问的面试证据。",
  技术问答: "围绕简历命中的技术栈，逐题回答并准备追问。",
  笔试题: "用限时笔试检查简历技术的熟练度，而不是只看过。",
  模拟面试: "按真实节奏连续作答，最后复盘卡壳点。",
  补短板: "只补简历里没写、但目标岗位默认要会的基础。",
  "JD 命中技术": "按 JD 原文命中的技术逐项精读、练题并留下证据。",
  岗位缺口: "补 JD 要求但当前经历里没有体现的能力。",
  项目追问: "把项目选择和 JD 要求对应起来，准备三层追问。",
  全真演练: "按目标岗位流程做一轮限时问答和笔试。",
  项目拆解: "拆清架构、数据流、状态边界和关键取舍。",
  调试专项: "用真实报错练习定位、验证和回归。",
  代码题: "限时手写异步、数据处理和业务代码。",
  系统设计: "把组件、状态、缓存、性能和发布讲成一个整体。",
  "复盘与表达": "用 STAR 把项目失败方案、指标和取舍讲清楚。",
};

const FALLBACK_INTERVIEW_DOCS = ["05", "06", "03", "14", "11"];
const FOUNDATION_FALLBACK_DOCS = ["11", "01", "02", "03", "04", "14"];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(startDate: string, days: number): string {
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return startDate;
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function moduleId(title: string): string {
  return `m-${title.replace(/[^\w\u4e00-\u9fa5]+/g, "-")}`;
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
  options: { includeQa: boolean; module?: string; modulePrefix?: string },
): PlanTask[] {
  const base = `generated-${roadmap.id}-${stage.id}-${nodeIndex}`;
  const module = `${options.modulePrefix ?? ""}${options.module ?? stage.title}`;
  const actions: Array<{ label: string; href: string; minutes: number; type: PlanTaskType }> = [];
  const docs = node.docs ?? [];
  if (docs.length > 0) {
    actions.push({ label: "精读", href: `/doc/${docs[0]}`, minutes: 30, type: "read" });
  }
  if (options.includeQa && node.qaDoc && QA_MAP.has(node.qaDoc)) {
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
    const href = node.topicIndex !== undefined
      ? `/roadmap/${roadmap.id}/topic/${node.topicIndex}`
      : `/roadmap/${roadmap.id}`;
    actions.push({ label: "学习指引", href, minutes: 30, type: "read" });
  }
  const primary = actions[0];
  return [{
    id: `${base}-study`,
    dayIndex: 0,
    title: `学习 · ${node.title}`,
    type: docs.length > 0 ? "read" : primary.type,
    href: primary.href,
    module,
    moduleId: moduleId(module),
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
  module: string,
  prefix?: string,
): PlanTask {
  const doc = DOC_MAP.get(docId);
  const title = doc?.title ?? docId;
  const action = type === "read" ? "精读" : type === "qa" ? "自测" : "练题";
  return {
    id,
    dayIndex: 0,
    title: `${prefix ?? action} · ${title}`,
    type,
    href: type === "read" ? `/doc/${docId}` : type === "qa" ? `/qa/${docId}` : `/quiz?doc=${docId}`,
    module,
    moduleId: moduleId(module),
    nodeTitle: title,
    docIds: type === "read" ? [docId] : undefined,
    minutes,
    source: "generated",
  };
}

function makeProjectTask(
  id: string,
  title: string,
  href: string,
  module: string,
  minutes = 30,
  stageTitle?: string,
): PlanTask {
  return {
    id,
    dayIndex: 0,
    title,
    type: "project",
    href,
    module,
    moduleId: moduleId(module),
    stageTitle,
    minutes,
    source: "generated",
  };
}

function bankCountFor(docId: string): number {
  return questionMeta.byDoc[docId as keyof typeof questionMeta.byDoc]?.total ?? 0;
}

function buildStageTasks(
  roadmap: Roadmap,
  goal: LearningPlanState["goal"],
  included: Set<string>,
  options: { includeQa: boolean; onlyCore?: boolean; modulePrefix?: string; limit?: number },
): PlanTask[] {
  const generated: PlanTask[] = [];
  const jd = goal.jdText ? analyzeJd(goal.jdText) : null;
  const jdDocs = new Set(jd?.docIds ?? []);
  const stats = { count: 0 };
  for (const stage of roadmap.stages) {
    if (!included.has(stage.id)) continue;
    const nodes = stage.nodes
      .map((node, index) => ({ node, index }))
      .filter(({ node }) => goal.includeOptional || node.priority !== "加分")
      .filter(({ node }) => !options.onlyCore || node.priority === "核心")
      .sort((a, b) => {
        const scoreA = scoreNode(a.node, goal.templateId, jdDocs);
        const scoreB = scoreNode(b.node, goal.templateId, jdDocs);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.index - b.index;
      });
    for (const { node, index } of nodes) {
      if (options.limit && stats.count >= options.limit) return generated;
      generated.push(...tasksForNode(roadmap, stage, node, index, {
        includeQa: options.includeQa,
        modulePrefix: options.modulePrefix,
      }));
      stats.count += 1;
    }
    if (goal.templateId === "normal" || goal.templateId === "ten-week") {
      generated.push(makeProjectTask(
        `generated-${roadmap.id}-${stage.id}-review`,
        `阶段复盘 · ${stage.title}`,
        `/roadmap/${roadmap.id}`,
        `${options.modulePrefix ?? ""}${stage.title}`,
        20,
        stage.title,
      ));
    }
  }
  return generated;
}

function buildFoundationTasks(roadmap: Roadmap, goal: LearningPlanState["goal"], included: Set<string>): PlanTask[] {
  const tasks = buildStageTasks(roadmap, goal, included, {
    includeQa: false,
    onlyCore: true,
    modulePrefix: "基础 · ",
  });
  if (tasks.length === 0) {
    for (const docId of FOUNDATION_FALLBACK_DOCS) {
      tasks.push(makeDocTask(`foundation-${docId}-read`, docId, "read", 30, "基础 · 核心概念", "基础精读"));
      if (bankCountFor(docId) > 0) {
        tasks.push(makeDocTask(`foundation-${docId}-quiz`, docId, "quiz", 15, "基础 · 核心概念", "基础练题"));
      }
    }
  }
  tasks.push(makeProjectTask(
    `foundation-${roadmap.id}-retro`,
    "基础复盘 · 用自己的话讲清 5 个核心概念",
    `/roadmap/${roadmap.id}`,
    "基础 · 阶段复盘",
    30,
  ));
  return tasks;
}

function buildInterviewTasks(goal: LearningPlanState["goal"]): PlanTask[] {
  const analysis = analyzeJd(goal.resumeText ?? "");
  const focus = uniqueDocs([...analysis.docIds, ...FALLBACK_INTERVIEW_DOCS]).slice(0, 6);
  const tasks: PlanTask[] = [
    makeProjectTask("resume-intro", "自我介绍 · 30 秒与 2 分钟两个版本", "/doc/09", "简历定点", 30),
    makeProjectTask("resume-project", "项目主线 · 选一个最能代表你的项目讲清背景与目标", "/doc/08", "简历定点", 30),
    makeProjectTask("resume-depth", "项目追问 · 技术选型、难点、指标、失败方案各准备一层", "/qa/08", "简历定点", 30),
  ];
  for (const doc of analysis.matched.slice(0, 4)) {
    for (const docId of uniqueDocs(doc.docs).slice(0, 2)) {
      if (QA_MAP.has(docId)) {
        tasks.push(makeDocTask(`resume-${docId}-qa-${doc.label}`, docId, "qa", 20, "技术问答", "简历命中"));
      }
    }
  }
  for (const docId of focus) {
    if (QA_MAP.has(docId)) tasks.push(makeDocTask(`resume-${docId}-qa`, docId, "qa", 20, "技术问答"));
    if (bankCountFor(docId) > 0) tasks.push(makeDocTask(`resume-${docId}-quiz`, docId, "quiz", 20, "笔试题"));
  }
  tasks.push(makeProjectTask("resume-mock", "限时模拟面试 · 5 问连答并录音复盘", "/qa", "模拟面试", 40));
  tasks.push(makeDocTask("resume-code", "13", "quiz", 30, "笔试题", "限时手写"));
  const weak = analysis.missingCore.filter((doc) => !focus.includes(doc.id)).slice(0, 3);
  for (const doc of weak) {
    tasks.push(makeDocTask(`resume-${doc.id}-read`, doc.id, "read", 25, "补短板", "补短板精读"));
  }
  return tasks;
}

function buildJdTasks(roadmap: Roadmap, goal: LearningPlanState["goal"]): PlanTask[] {
  const analysis = analyzeJd(goal.jdText ?? "");
  const focus = uniqueDocs(analysis.docIds).slice(0, 8);
  const tasks: PlanTask[] = [];
  for (const docId of focus) {
    const task = makeDocTask(`jd-${docId}-read`, docId, "read", 30, "JD 命中技术");
    const links: Array<{ label: string; href: string }> = [];
    if (QA_MAP.has(docId)) links.push({ label: "面试问答", href: `/qa/${docId}` });
    if (bankCountFor(docId) > 0) links.push({ label: "配套练题", href: `/quiz?doc=${docId}` });
    task.links = links;
    tasks.push(task);
  }
  const gap = analysis.missingCore.filter((doc) => !focus.includes(doc.id)).slice(0, 3);
  for (const doc of gap) {
    tasks.push(makeDocTask(`jd-${doc.id}-gap`, doc.id, "read", 25, "岗位缺口", "缺口精读"));
  }
  tasks.push(makeProjectTask("jd-project", "JD 项目追问 · 对照岗位要求讲项目", "/qa/08", "项目追问", 30));
  tasks.push(makeProjectTask("jd-mock", "全真演练 · 目标岗位问答 + 笔试卷", "/quiz", "全真演练", 40));
  tasks.push(makeProjectTask("jd-gap-retro", "缺口复盘 · 列出还需要补的 3 件事", `/roadmap/${roadmap.id}`, "岗位缺口", 20));
  return tasks;
}

function buildProjectTasks(roadmap: Roadmap): PlanTask[] {
  const tasks: PlanTask[] = [];
  const pushDoc = (
    docId: string,
    module: string,
    types: Array<"read" | "qa" | "quiz">,
  ) => {
    for (const type of types) {
      if (type === "read") tasks.push(makeDocTask(`project-${docId}-read`, docId, "read", 30, module));
      if (type === "qa" && QA_MAP.has(docId)) tasks.push(makeDocTask(`project-${docId}-qa`, docId, "qa", 20, module));
      if (type === "quiz" && bankCountFor(docId) > 0) tasks.push(makeDocTask(`project-${docId}-quiz`, docId, "quiz", 20, module));
    }
  };
  pushDoc("08", "项目拆解", ["read"]);
  tasks.push(makeProjectTask("project-map", "画出一张项目架构图与数据流图", "/doc/08", "项目拆解", 30));
  pushDoc("12", "调试专项", ["read", "qa", "quiz"]);
  pushDoc("13", "代码题", ["read", "qa", "quiz"]);
  pushDoc("19", "系统设计", ["read", "qa"]);
  tasks.push(makeProjectTask("project-design", "给自己的项目补一页系统设计：状态、缓存、降级", "/doc/19", "系统设计", 30));
  pushDoc("09", "复盘与表达", ["read"]);
  tasks.push(makeProjectTask("project-retro", "项目复盘 · 难点、取舍、指标、失败方案", `/roadmap/${roadmap.id}`, "复盘与表达", 30));
  return tasks;
}

function weeklyModules(tasks: PlanTask[], days: number, daily: boolean): PlanModule[] {
  const groups = new Map<number, PlanTask[]>();
  for (const task of tasks) {
    const week = Math.floor(task.dayIndex / 7) + 1;
    const item = groups.get(week) ?? [];
    item.push(task);
    groups.set(week, item);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, weekTasks]) => {
      const stages = [...new Set(weekTasks.map((task) => task.stageTitle).filter(Boolean))];
      const start = (week - 1) * 7;
      const end = Math.min(days - 1, week * 7 - 1);
      return {
        id: `week-${week}`,
        title: daily ? `第 ${week} 周 · 每日一练` : `第 ${week} 周`,
        description: stages.length > 0
          ? `推进 ${stages.slice(0, 2).join(" / ")}${stages.length > 2 ? " 等" : ""}，覆盖第 ${start + 1}–${end + 1} 天。`
          : daily
            ? "每天一个最小任务，按周检查是否真的在推进。"
            : "本周推进与周产出。",
        tasks: weekTasks,
        total: weekTasks.length,
        done: 0,
        minutes: weekTasks.reduce((sum, task) => sum + task.minutes, 0),
      };
    });
}

function stageModules(tasks: PlanTask[]): PlanModule[] {
  const groups = new Map<string, PlanTask[]>();
  for (const task of tasks) {
    const item = groups.get(task.module) ?? [];
    item.push(task);
    groups.set(task.module, item);
  }
  return [...groups.entries()].map(([title, moduleTasks]) => {
    const stage = moduleTasks.find((task) => task.stageTitle)?.stageTitle;
    const description = title.startsWith("基础 · ")
      ? title.includes("阶段复盘")
        ? "用自己的话讲清前面学过的核心概念，留下复盘证据。"
        : "只做核心概念精读和基础题，不安排问答与项目。"
      : MODULE_DESCRIPTIONS[title] ?? (stage ? `围绕 ${stage} 逐点完成精读、自测和练题。` : "按当前计划生成的任务模块。");
    return {
      id: moduleTasks[0]?.moduleId ?? moduleId(title),
      title,
      description,
      tasks: moduleTasks,
      total: moduleTasks.length,
      done: 0,
      minutes: moduleTasks.reduce((sum, task) => sum + task.minutes, 0),
    };
  });
}

export function buildPlan(planState: LearningPlanState, roadmap: Roadmap): BuiltPlan {
  const { goal, progress } = planState;
  const included = new Set(goal.includedStageIds.length > 0 ? goal.includedStageIds : roadmap.stages.map((stage) => stage.id));
  const excluded = new Set(progress.excludedTaskIds);
  const completed = new Set(progress.completedTaskIds);
  let generated =
    goal.templateId === "interview"
      ? buildInterviewTasks(goal)
      : goal.templateId === "jd"
        ? buildJdTasks(roadmap, goal)
        : goal.templateId === "project"
          ? buildProjectTasks(roadmap)
          : goal.templateId === "foundation"
            ? buildFoundationTasks(roadmap, goal, included)
            : buildStageTasks(roadmap, goal, included, {
                includeQa: true,
                onlyCore: goal.templateId === "daily",
              });

  if (goal.templateId === "daily") {
    generated = generated.slice(0, Math.max(1, goal.days));
  }

  let filtered = generated.filter((task) => !excluded.has(task.id));
  const total = Math.max(1, filtered.length);
  filtered.forEach((task, index) => {
    task.dayIndex = Math.min(goal.days - 1, Math.floor((index * Math.max(1, goal.days)) / total));
  });

  const custom: PlanTask[] = progress.customTasks
    .filter((task) => !excluded.has(task.id))
    .map((task) => {
      const fallback = filtered.find((item) => item.dayIndex === task.dayIndex);
      const module = task.module ?? fallback?.module ?? "自定义任务";
      return {
        id: task.id,
        dayIndex: Math.min(goal.days - 1, Math.max(0, task.dayIndex)),
        title: task.title,
        type: "custom",
        href: null,
        module,
        moduleId: fallback?.moduleId ?? moduleId(module),
        minutes: Math.max(10, Math.round(goal.dailyMinutes / 2)),
        source: "custom",
      };
    });
  const allTasks = [...filtered, ...custom].sort(
    (a, b) => a.dayIndex - b.dayIndex || (a.source === "custom" ? 1 : 0) - (b.source === "custom" ? 1 : 0),
  );

  let modules: PlanModule[];
  if (goal.templateId === "ten-week" || goal.templateId === "daily") {
    for (const task of allTasks) {
      const week = Math.floor(task.dayIndex / 7) + 1;
      task.module = goal.templateId === "daily" ? `第 ${week} 周 · 每日一练` : `第 ${week} 周`;
      task.moduleId = `week-${week}`;
    }
    modules = weeklyModules(allTasks, goal.days, goal.templateId === "daily");
  } else {
    modules = stageModules(allTasks);
  }
  for (const module of modules) {
    module.done = module.tasks.filter((task) => completed.has(task.id)).length;
  }

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
  const tasksPerDay = Math.max(1, allTasks.length / Math.max(1, goal.days));
  const warning =
    allTasks.length > goal.days * 8
      ? "任务量较大，建议增加天数或减少阶段。"
      : tasksPerDay * 30 > goal.dailyMinutes * 1.4
        ? "按当前任务量，每天可能需要超过设定时长；可减少阶段或增加天数。"
        : null;

  return {
    days,
    modules,
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
