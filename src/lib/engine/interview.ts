import type { InterviewBank, LevelId, Track } from "@/lib/content/schema";
import { LEVELS } from "@/lib/content/schema";
import type {
  InterviewFeedback,
  InterviewKeyPoint,
  InterviewMode,
  InterviewPlanSnapshot,
  InterviewQuestionSnapshot,
  InterviewState,
  InterviewSummary,
  InterviewTurn,
} from "@/lib/types";
import { aliasMatches, coreSkillIds, extractSkills, normalizeText } from "./profile";
import { clamp } from "@/lib/utils";

const PROJECT_POINTS: InterviewKeyPoint[] = [
  {
    label: "业务目标与使用场景",
    aliases: ["业务目标", "解决", "场景", "用户", "需求", "痛点", "规模"],
  },
  {
    label: "个人职责边界",
    aliases: ["我负责", "负责", "我主导", "我设计", "我实现", "职责", "主导", "落地"],
  },
  {
    label: "关键技术决策",
    aliases: ["技术决策", "选型", "架构", "方案", "设计", "重构", "为什么用"],
  },
  {
    label: "取舍与代价",
    aliases: ["取舍", "权衡", "代价", "trade-off", "tradeoff", "成本", "牺牲", "限制"],
  },
  {
    label: "结果与量化指标",
    aliases: ["结果", "指标", "提升", "降低", "增长", "优化", "毫秒", "%", "万"],
  },
];

const SCALE_FOLLOW_UP = {
  prompt: "如果这个项目的用户量或流量增长十倍，你会先改哪里？怎么验证改动有效，失败了怎么回滚？",
  modelAnswer:
    "我会先用监控拆解瓶颈出现在链路哪一段，区分数据库、缓存、接口计算还是下游依赖。优先做可回滚的改动，比如加索引、减少重复查询、引入缓存或限流，并用 P95 延迟、错误率、资源利用率验证效果。灰度发布、设置回滚阈值，避免一次改动同时引入多个变量。",
  keyPoints: [
    { label: "定位瓶颈", aliases: ["监控", "指标", "瓶颈", "链路", "P95", "火焰图"] },
    { label: "扩展或优化方案", aliases: ["索引", "缓存", "限流", "异步", "扩容", "分片"] },
    { label: "指标验证", aliases: ["延迟", "错误率", "吞吐", "验证", "对比", "资源"] },
    { label: "灰度与回滚", aliases: ["灰度", "回滚", "降级", "开关", "风险"] },
  ],
};

type Probe = {
  prompt: string;
  modelAnswer: string;
  keyPoints: InterviewKeyPoint[];
};

const SKILL_PROBES: Record<string, Probe> = {
  "react-fundamentals": {
    prompt: "你如何组织这个前端项目的状态与数据流？哪些状态放在组件内，哪些要提升或缓存？",
    modelAnswer:
      "我会区分本地交互状态、跨组件共享状态和服务端状态。局部状态留在组件内；需要跨页面共享的用单一数据源；服务端数据交给请求缓存并在失效时刷新。通过拆分组件和稳定引用控制重渲染范围，避免把一切都塞进全局 store。",
    keyPoints: [
      { label: "状态分类", aliases: ["本地状态", "服务端状态", "共享状态", "分类"] },
      { label: "单一数据源", aliases: ["单一数据源", "提升", "store", "context"] },
      { label: "缓存与失效", aliases: ["缓存", "失效", "重新请求", "stale"] },
      { label: "重渲染边界", aliases: ["重渲染", "拆分", "memo", "引用"] },
    ],
  },
  "state-data-flow": {
    prompt: "这个项目里一次数据更新会经过哪些层？你如何保证 UI 与后端数据不会互相打架？",
    modelAnswer:
      "我会明确服务端是事实源，UI 只持有派生状态。写入时做乐观更新但保留回滚路径，请求带版本或更新时间解决并发覆盖。列表与详情共用缓存键，失效时按依赖刷新；关键操作以服务端确认为准。",
    keyPoints: [
      { label: "事实源与派生", aliases: ["事实源", "派生", "服务端为准", "单一来源"] },
      { label: "乐观更新与回滚", aliases: ["乐观更新", "回滚", "失败", "补偿"] },
      { label: "并发与版本", aliases: ["版本", "并发", "覆盖", "更新时间"] },
      { label: "缓存失效", aliases: ["缓存", "失效", "刷新", "依赖"] },
    ],
  },
  "node-runtime": {
    prompt: "如果这个接口出现重复提交或下游抖动，你会怎么设计幂等、超时和重试？",
    modelAnswer:
      "首先用业务幂等键和唯一约束保证重复请求只生效一次。对下游设置独立的超时预算和有限次数的指数退避重试，只对可安全重试的错误重试。再加熔断、降级与限流防止雪崩，并记录失败原因和重试次数便于定位。",
    keyPoints: [
      { label: "幂等键与唯一约束", aliases: ["幂等", "唯一约束", "idempotency", "去重"] },
      { label: "超时预算", aliases: ["超时", "budget", "deadline", "时间预算"] },
      { label: "有限重试", aliases: ["重试", "退避", "指数退避", "次数"] },
      { label: "熔断降级", aliases: ["熔断", "降级", "限流", "雪崩"] },
    ],
  },
  "sql-database": {
    prompt: "这个项目里最慢的查询是什么？你如何通过索引、事务和一致性做取舍？",
    modelAnswer:
      "我会先看执行计划，确认是全表扫描、回表过多还是排序临时表。针对性建立联合索引并遵守最左前缀，避免在索引列上做函数运算。写多读少的场景控制索引数量；事务尽量短，隔离级别按业务一致性要求选择，不用长事务阻塞热点行。",
    keyPoints: [
      { label: "执行计划定位", aliases: ["执行计划", "explain", "全表扫描", "回表"] },
      { label: "联合索引", aliases: ["联合索引", "最左前缀", "覆盖索引", "索引"] },
      { label: "事务边界", aliases: ["事务", "短事务", "隔离级别", "锁"] },
      { label: "读写取舍", aliases: ["写多读少", "一致性", "代价", "取舍"] },
    ],
  },
  coroutines: {
    prompt: "页面退出或任务超时时，你的异步任务如何取消？异常会传播到哪里？",
    modelAnswer:
      "我会把异步任务绑定到页面或 ViewModel 的生命周期作用域，让结构化并发负责取消子任务。挂起函数在取消点响应取消，阻塞调用用可取消的封装。异常通过 SupervisorJob 或协程异常处理器隔离，避免一个子任务失败拖垮整个作用域；UI 只消费明确的错误状态。",
    keyPoints: [
      { label: "生命周期作用域", aliases: ["生命周期", "scope", "viewModelScope", "结构化并发"] },
      { label: "协作式取消", aliases: ["取消", "cancel", "取消点", "isActive"] },
      { label: "异常隔离", aliases: ["SupervisorJob", "异常", "handler", "隔离"] },
      { label: "错误状态", aliases: ["错误状态", "UI", "重试", "包装"] },
    ],
  },
  "compose-ui": {
    prompt: "这个列表页如何控制重组范围？状态提升到什么层级比较合适？",
    modelAnswer:
      "我会让状态尽量靠近消费它的位置，可复用组件用状态提升暴露回调。列表项使用稳定 key，传入稳定类型或 lambda 避免每次重组；高频变化的状态下沉，避免整页重组。用布局检查器和重组计数验证，而不是凭感觉优化。",
    keyPoints: [
      { label: "状态提升层级", aliases: ["状态提升", "hoisting", "消费", "就近"] },
      { label: "稳定 key", aliases: ["key", "稳定", "identity", "列表"] },
      { label: "重组范围", aliases: ["重组", "recomposition", "下沉", "lambda"] },
      { label: "测量验证", aliases: ["布局检查器", "计数", "测量", "profile"] },
    ],
  },
  "android-lifecycle": {
    prompt: "配置变化或进程被回收后，这个页面哪些状态必须恢复？你会放在哪里？",
    modelAnswer:
      "我会区分临时 UI 状态、可重建的页面数据和必须持久化的业务数据。输入内容、滚动位置等用 SavedStateHandle 或 rememberSaveable 恢复；可重新请求的数据放 ViewModel；关键草稿落本地存储。避免把大对象塞进 saved state，也避免把一次性事件当状态重放。",
    keyPoints: [
      { label: "状态分类", aliases: ["临时", "可重建", "持久化", "分类"] },
      { label: "SavedState 恢复", aliases: ["SavedStateHandle", "rememberSaveable", "恢复", "进程"] },
      { label: "ViewModel 作用", aliases: ["ViewModel", "重新请求", "页面数据"] },
      { label: "大对象与事件", aliases: ["大对象", "事件", "重放", "bundle"] },
    ],
  },
  "auth-security": {
    prompt: "如果让你攻击自己的登录与权限设计，你会从哪些入口入手？怎么防？",
    modelAnswer:
      "我会先试越权：改资源 ID 读别人的数据、绕过前端直接调接口、重放旧会话。防护上，所有资源查询强制带 user_id 并做归属校验；会话令牌随机、存哈希、HttpOnly，退出立即撤销；写接口校验同源防 CSRF；登录错误不区分账号是否存在，并做限流。",
    keyPoints: [
      { label: "越权与归属校验", aliases: ["越权", "user_id", "归属", "资源 ID", "IDOR"] },
      { label: "会话安全", aliases: ["会话", "HttpOnly", "哈希", "撤销", "过期"] },
      { label: "CSRF 防护", aliases: ["CSRF", "同源", "SameSite", "Origin"] },
      { label: "枚举与限流", aliases: ["枚举", "限流", "暴力破解", "登录失败"] },
    ],
  },
  performance: {
    prompt: "你用什么指标证明这次性能优化有效？如何排除测量误差和偶然因素？",
    modelAnswer:
      "我会先定义可复现的用户场景和基线，比如冷启动耗时、首帧时间或滑动帧率，使用同一设备和构建类型多轮采样，看 P50/P95 而不是单次最好值。改动只引入一个变量，对比发布前后相同路径，并观察线上真实用户的错误率和卡顿率，避免本地样本偏差。",
    keyPoints: [
      { label: "定义基线与场景", aliases: ["基线", "场景", "复现", "冷启动", "帧率"] },
      { label: "分位指标", aliases: ["P95", "P50", "分位", "采样"] },
      { label: "控制变量", aliases: ["变量", "同一设备", "构建类型", "对比"] },
      { label: "线上真实验证", aliases: ["线上", "真实用户", "错误率", "卡顿"] },
    ],
  },
  "http-api": {
    prompt: "这个接口如何设计错误语义与重试边界？客户端应该看到什么，不该看到什么？",
    modelAnswer:
      "我会用稳定的错误码和明确的状态码表达可重试与不可重试，错误响应带可读消息但不暴露堆栈或内部字段。写接口通过幂等键支持安全重试，读接口定义缓存语义。客户端根据错误类型决定重试、提示或跳转，而不是所有失败都弹同一个提示。",
    keyPoints: [
      { label: "错误码语义", aliases: ["错误码", "状态码", "可重试", "语义"] },
      { label: "不暴露内部信息", aliases: ["堆栈", "内部", "敏感", "消息"] },
      { label: "幂等与重试", aliases: ["幂等", "重试", "安全"] },
      { label: "客户端策略", aliases: ["客户端", "提示", "跳转", "处理"] },
    ],
  },
};

const GENERIC_PROBE: Probe = {
  prompt: "这个项目的技术选型中，你排除了哪些方案？当时最担心什么风险？",
  modelAnswer:
    "我会先给出被排除的方案和排除理由，再说明最终方案如何覆盖主要风险。例如从团队熟悉度、交付周期、运维成本和扩展性做权衡，选择当前阶段收益最大的方案，同时保留后续替换边界，并用监控验证风险是否真的发生。",
  keyPoints: [
    { label: "备选方案", aliases: ["备选", "排除", "另一个方案", "对比"] },
    { label: "决策依据", aliases: ["团队", "成本", "周期", "扩展性", "熟悉度"] },
    { label: "风险应对", aliases: ["风险", "监控", "兜底", "边界"] },
  ],
};

function hashJitter(value: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export function extractProjectFragments(resumeText: string): string[] {
  const lines = resumeText
    .split(/\r?\n|[。；]/)
    .map((line) => line.replace(/^[\s\-•·*]+/, "").trim())
    .filter((line) => line.length >= 18);
  const projectLines = lines.filter((line) =>
    /(项目|系统|平台|App|应用|小程序|负责|主导|重构|性能|架构|落地)/i.test(line),
  );
  const pool = projectLines.length > 0 ? projectLines : lines;
  const unique = [...new Set(pool)];
  return unique.slice(0, 2).map((line) => (line.length > 160 ? `${line.slice(0, 157)}…` : line));
}

function probesForSkills(skillIds: string[]): Probe {
  for (const skillId of skillIds) {
    const probe = SKILL_PROBES[skillId];
    if (probe) return probe;
  }
  return GENERIC_PROBE;
}

export function buildProjectQuestion(input: {
  fragment: string;
  index: number;
  track: Track;
  level: LevelId;
  resumeSkillIds: string[];
}): InterviewQuestionSnapshot {
  const { fragment, index, track, level, resumeSkillIds } = input;
  const detected = extractSkills(track.skills, fragment).map((hit) => hit.skillId);
  const skills = [...new Set([...detected, ...resumeSkillIds])].slice(0, 3);
  const probe = probesForSkills(skills);
  return {
    id: `project-${index + 1}`,
    kind: "project",
    level,
    skills,
    prompt: `你在简历中提到「${fragment}」。请用 1–2 分钟介绍：它解决什么业务问题、你负责哪一部分、你做过的一个关键技术决策，以及这个决策的代价。`,
    keyPoints: PROJECT_POINTS,
    modelAnswer: `参考表达结构：这个项目要解决的是……（业务目标与规模）。我主要负责……（边界，不用“参与了”）。最关键的技术决策是……，因为……（约束），代价是……（取舍）。上线后……（可量化结果）。如果重做一次，我会……（复盘）。请替换为你的真实事实，不要背模板。`,
    commonMistakes: [
      "只报技术栈，不讲业务目标和你的职责边界",
      "把团队成果说成个人成果，无法回答细节追问",
      "没有取舍与量化结果，听起来像教程项目",
    ],
    projectRef: fragment,
    followUps: [probe],
  };
}

function pickKnowledgeQuestions(
  bank: InterviewBank,
  level: LevelId,
  preferredSkills: string[],
  count: number,
  seed: number,
): InterviewQuestionSnapshot[] {
  const pool = bank.questions.filter((question) => question.level === level);
  const remaining = [...pool];
  const picked: InterviewQuestionSnapshot[] = [];
  const pickedSkills = new Set<string>();

  while (picked.length < count && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    remaining.forEach((question, index) => {
      const preferred = question.skills.filter((skill) => preferredSkills.includes(skill)).length;
      const overlap = question.skills.filter((skill) => pickedSkills.has(skill)).length;
      const score = preferred * 10 - overlap * 6 + hashJitter(question.id, seed) * 2;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const [question] = remaining.splice(bestIndex, 1);
    question.skills.forEach((skill) => pickedSkills.add(skill));
    picked.push({ ...question, kind: "knowledge" });
  }
  return picked;
}

export function buildInterviewPlan(input: {
  track: Track;
  bank: InterviewBank;
  level: LevelId;
  mode: InterviewMode;
  resumeText: string;
  jdText: string;
  company: string;
  seed: number;
  now: string;
}): InterviewPlanSnapshot {
  const { track, bank, level, mode, resumeText, jdText, company, seed, now } = input;
  const fragments = extractProjectFragments(resumeText);
  const projectCount =
    mode === "resume" ? Math.min(2, fragments.length) : mode === "jd" && fragments.length > 0 ? 1 : 0;
  const knowledgeCount = 5 - projectCount;
  const resumeHits = extractSkills(track.skills, resumeText);
  const jdHits = extractSkills(track.skills, jdText);
  const preferredSkills =
    mode === "jd" && jdHits.length > 0
      ? jdHits.map((hit) => hit.skillId)
      : resumeHits.length > 0
        ? resumeHits.map((hit) => hit.skillId)
        : coreSkillIds(track, level);
  const resumeSkillIds = resumeHits.map((hit) => hit.skillId).slice(0, 6);

  const projectQuestions = fragments
    .slice(0, projectCount)
    .map((fragment, index) =>
      buildProjectQuestion({ fragment, index, track, level, resumeSkillIds }),
    );
  const knowledgeQuestions = pickKnowledgeQuestions(
    bank,
    level,
    preferredSkills,
    knowledgeCount,
    seed,
  );

  return {
    version: 1,
    trackId: track.id,
    level,
    mode,
    company,
    createdAt: now,
    mainQuestions: [...projectQuestions, ...knowledgeQuestions].slice(0, 5),
    resumeText,
    jdText,
  };
}

export function evaluateInterviewAnswer(
  question: Pick<InterviewQuestionSnapshot, "keyPoints" | "modelAnswer" | "skills">,
  answer: string,
): InterviewFeedback {
  const normalized = normalizeText(answer);
  const trimmed = answer.trim();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const point of question.keyPoints) {
    const hit = point.aliases.some((alias) => aliasMatches(normalized, alias));
    if (hit) matched.push(point.label);
    else missing.push(point.label);
  }
  const coverage = question.keyPoints.length ? matched.length / question.keyPoints.length : 0;
  const completeness = clamp(trimmed.length / 140, 0, 1);
  const structureHits = ["因为", "所以", "首先", "其次", "取舍", "权衡", "指标", "结果", "代价", "原因"].filter(
    (word) => normalized.includes(word),
  ).length;
  const structure = clamp(structureHits / 2, 0, 1);
  let score = Math.round(coverage * 70 + completeness * 20 + structure * 10);
  if (trimmed.length < 20) score = Math.min(score, 20);
  if (trimmed.length < 10) score = Math.min(score, 5);
  score = clamp(score, 0, 100);

  let advice: string;
  if (score >= 80) {
    advice = "要点覆盖完整，也有机制与取舍。下一步准备可量化结果和反例，防止追问时露怯。";
  } else if (score >= 60) {
    advice = `方向正确，但还缺「${missing.slice(0, 2).join("、") || "具体证据"}」。用「结论 → 机制 → 取舍 → 结果」补全。`;
  } else if (score >= 40) {
    advice = "回答停在概念层，缺少原因、代价和项目证据。先把每个要点各补一句具体做法。";
  } else {
    advice = "覆盖不足。先给结论，再分别说明机制、取舍和结果；不会的部分明确说边界，不要泛泛而谈。";
  }

  return {
    score,
    matched,
    missing,
    hint: missing[0]
      ? `试着从「${missing[0]}」切入，把机制、取舍和你项目里的证据讲清楚。`
      : "所有要点都有覆盖，用一个具体数字或反例让回答更可信。",
    modelAnswer: question.modelAnswer,
    advice,
    skills: question.skills,
  };
}

export function getInterviewState(
  plan: InterviewPlanSnapshot,
  turns: InterviewTurn[],
): InterviewState {
  const mainCount = plan.mainQuestions.length;
  let answeredCount = 0;
  const followUpDone = new Set(
    turns.filter((turn) => turn.kind === "followup" && turn.parentId).map((turn) => turn.parentId),
  );

  for (const main of plan.mainQuestions) {
    const questionTurns = turns
      .filter(
        (turn) =>
          turn.questionId === main.id && (turn.kind === "main" || turn.kind === "retry"),
      )
      .sort((a, b) => a.seq - b.seq);
    if (questionTurns.length === 0) {
      return {
        pending: { question: main, parentId: null, attempt: "first", hint: null },
        answeredCount,
        mainCount,
        complete: false,
      };
    }
    answeredCount += 1;
    const last = questionTurns[questionTurns.length - 1];
    const hasRetry = questionTurns.some((turn) => turn.kind === "retry");
    if (last.kind === "main" && last.score < 50 && !hasRetry) {
      return {
        pending: {
          question: main,
          parentId: main.id,
          attempt: "retry",
          hint: last.feedback.hint,
        },
        answeredCount,
        mainCount,
        complete: false,
      };
    }

    const bestScore = Math.max(...questionTurns.map((turn) => turn.score));
    const followUp = main.followUps?.[0];
    if (followUp && bestScore >= 70 && !followUpDone.has(main.id)) {
      const followUpQuestion: InterviewQuestionSnapshot = {
        id: `${main.id}::followup-0`,
        kind: "followup",
        level: main.level,
        skills: main.skills,
        prompt: followUp.prompt,
        keyPoints: followUp.keyPoints,
        modelAnswer: followUp.modelAnswer,
        commonMistakes: [],
        projectRef: main.projectRef,
      };
      return {
        pending: {
          question: followUpQuestion,
          parentId: main.id,
          attempt: "followup",
          hint: null,
        },
        answeredCount,
        mainCount,
        complete: false,
      };
    }
  }

  return { pending: null, answeredCount, mainCount, complete: answeredCount === mainCount };
}

export function buildInterviewSummary(input: {
  plan: InterviewPlanSnapshot;
  turns: InterviewTurn[];
  track: Track;
  now: string;
}): InterviewSummary {
  const { plan, turns, track, now } = input;
  const skillScores = new Map<string, { sum: number; count: number }>();
  const scores: number[] = [];

  for (const main of plan.mainQuestions) {
    const questionTurns = turns.filter(
      (turn) => turn.questionId === main.id && (turn.kind === "main" || turn.kind === "retry"),
    );
    if (questionTurns.length === 0) continue;
    const best = Math.max(...questionTurns.map((turn) => turn.score));
    scores.push(best);
    for (const skill of main.skills) {
      const current = skillScores.get(skill) ?? { sum: 0, count: 0 };
      current.sum += best;
      current.count += 1;
      skillScores.set(skill, current);
    }
  }

  const aggregates = [...skillScores.entries()].map(([skillId, value]) => ({
    skillId,
    name: track.skills.find((skill) => skill.id === skillId)?.name ?? skillId,
    score: Math.round(value.sum / value.count),
  }));
  const ranked = [...aggregates].sort((a, b) => b.score - a.score);
  const strengths = ranked.filter((item) => item.score >= 65).slice(0, 3);
  const gaps = [...aggregates].filter((item) => item.score < 70).sort((a, b) => a.score - b.score).slice(0, 3);
  const targetRank = LEVELS.indexOf(plan.level);
  const gapIds = new Set(gaps.map((gap) => gap.skillId));
  const recommendedAtomIds = gaps.length
    ? track.atoms
        .filter((atom) => atom.skills.some((skill) => gapIds.has(skill)))
        .sort((a, b) => {
          const aChapter = track.chapters.find((chapter) => chapter.id === a.chapterId);
          const bChapter = track.chapters.find((chapter) => chapter.id === b.chapterId);
          const aRank = aChapter ? LEVELS.indexOf(aChapter.level) : 0;
          const bRank = bChapter ? LEVELS.indexOf(bChapter.level) : 0;
          return Math.abs(targetRank - aRank) - Math.abs(targetRank - bRank);
        })
        .slice(0, 4)
        .map((atom) => atom.id)
    : [];

  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const incomplete = scores.length < plan.mainQuestions.length;
  let verdict: string;
  if (incomplete) {
    verdict = `本次只完成 ${scores.length}/${plan.mainQuestions.length} 题，均分只代表已回答部分，不能当作完整面试结论。建议先答完全部主问题，再看整体表现。`;
  } else if (average >= 80) {
    verdict = "表达完整，有机制也有取舍，接近技术面通过水平。建议继续打磨项目指标与反例。";
  } else if (average >= 60) {
    verdict = "方向正确，但部分要点没有展开。按推荐知识点补一轮，再用同类问题练一次。";
  } else if (average >= 40) {
    verdict = "能说出概念，但缺少原因、代价和项目证据。先背要点，再做章节练习巩固。";
  } else {
    verdict = "答案覆盖不足。建议先完成推荐微课与章节练习，再进行一次模拟面试。";
  }

  return {
    average,
    mainCount: plan.mainQuestions.length,
    answeredCount: scores.length,
    strengths,
    gaps,
    verdict,
    recommendedAtomIds,
    createdAt: now,
  };
}
