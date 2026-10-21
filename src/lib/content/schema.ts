import { z } from "zod";

export const LEVELS = ["junior", "middle", "senior"] as const;
export const TRACK_IDS = [
  "mobile",
  "fullstack",
  "backend-java",
  "database-mysql",
  "cs-ai-foundations",
] as const;
export const DIRECTIONS = ["mobile", "fullstack", "backend", "database", "foundations"] as const;
export const SKILL_CATEGORIES = [
  "language",
  "mobile",
  "frontend",
  "backend",
  "database",
  "cs",
  "ai",
  "tool",
] as const;

export type LevelId = (typeof LEVELS)[number];
export type TrackId = (typeof TRACK_IDS)[number];
export type DirectionId = (typeof DIRECTIONS)[number];
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const LEVEL_LABEL: Record<LevelId, string> = {
  junior: "初级",
  middle: "中级",
  senior: "高级",
};

export const DIRECTION_LABEL: Record<DirectionId, string> = {
  mobile: "移动端开发",
  fullstack: "全栈开发",
  backend: "后端开发",
  database: "数据库",
  foundations: "计算机基础与前沿",
};

export const CATEGORY_LABEL: Record<SkillCategory, string> = {
  language: "编程语言",
  mobile: "移动端",
  frontend: "前端",
  backend: "后端",
  database: "数据库",
  cs: "计算机基础",
  ai: "AI / 前沿",
  tool: "工程工具",
};

export const levelSchema = z.enum(LEVELS);
export const trackIdSchema = z.enum(TRACK_IDS);
export const directionSchema = z.enum(DIRECTIONS);
export const skillCategorySchema = z.enum(SKILL_CATEGORIES);

const referenceSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  publisher: z.string().min(2),
  note: z.string().max(200).optional(),
});

const skillSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  aliases: z.array(z.string().min(1)).min(1),
  category: skillCategorySchema.optional(),
});

const levelInfoSchema = z.object({
  id: levelSchema,
  name: z.string().min(2),
  summary: z.string().min(10),
  focus: z.array(z.string().min(2)).min(2).max(6),
});

const chapterSchema = z.object({
  id: z.string().min(3),
  trackId: trackIdSchema,
  level: levelSchema,
  order: z.number().int().min(1).max(3),
  title: z.string().min(3),
  summary: z.string().min(10),
  atomIds: z.array(z.string()).length(3),
  questionIds: z.array(z.string()).min(5).max(12),
  codeChallengeIds: z.array(z.string()).length(1),
  references: z.array(referenceSchema).min(1).max(5),
});

const teachingStepSchema = z.object({
  title: z.string().min(2),
  detail: z.string().min(6),
});

const atomSchema = z.object({
  id: z.string().min(3),
  chapterId: z.string().min(3),
  title: z.string().min(2),
  summary: z.string().min(10),
  minutes: z.number().int().min(2).max(20),
  objective: z.string().min(6).optional(),
  explanation: z.string().min(20).optional(),
  teachingSteps: z.array(teachingStepSchema).min(2).max(5).optional(),
  keyPoints: z.array(z.string().min(4)).min(3).max(5),
  example: z
    .object({
      language: z.string().min(2),
      caption: z.string().min(2),
      code: z.string().min(10),
    })
    .optional(),
  pitfalls: z.array(z.string().min(4)).min(1).max(3),
  interviewTip: z.string().min(6),
  skills: z.array(z.string().min(2)).min(1).max(4),
});

const questionSchema = z.object({
  id: z.string().min(3),
  trackId: trackIdSchema,
  chapterId: z.string().min(3),
  level: levelSchema,
  skills: z.array(z.string()).min(1).max(3),
  prompt: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(20),
  difficulty: z.number().int().min(1).max(3).optional(),
  kind: z.enum(["concept", "code", "scenario"]).optional(),
  sourceRefs: z.array(z.string().url()).max(3).optional(),
});

const testCaseSchema = z.object({
  name: z.string().min(2),
  args: z.array(z.unknown()),
  expected: z.unknown(),
});

const codeChallengeSchema = z
  .object({
    id: z.string().min(3),
    trackId: trackIdSchema,
    chapterId: z.string().min(3),
    level: levelSchema,
    language: z.enum(["javascript", "kotlin", "sql"]),
    functionName: z.string().min(2).optional(),
    title: z.string().min(3),
    prompt: z.string().min(15),
    requirements: z.array(z.string().min(4)).min(2).max(5),
    starterCode: z.string().min(10),
    solutionCode: z.string().min(10),
    rubric: z.array(z.string().min(4)).min(2).max(5),
    tests: z.array(testCaseSchema).min(2).max(6).optional(),
    skills: z.array(z.string()).min(1).max(3),
  })
  .superRefine((challenge, ctx) => {
    if (challenge.language === "javascript") {
      if (!challenge.functionName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "JS 代码题必须提供 functionName" });
      }
      if (!challenge.tests || challenge.tests.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "JS 代码题必须提供至少 2 个测试用例" });
      }
    }
  });

export const trackSchema = z.object({
  id: trackIdSchema,
  name: z.string().min(2),
  shortName: z.string().min(2),
  direction: directionSchema,
  roles: z.array(z.string().min(2)).min(1).max(5),
  tagline: z.string().min(6),
  description: z.string().min(20),
  landingPoints: z.array(z.string().min(4)).min(2).max(4),
  levels: z.array(levelInfoSchema).length(3),
  skills: z.array(skillSchema).min(5),
  chapters: z.array(chapterSchema).min(3).max(9),
  atoms: z.array(atomSchema).min(9).max(27),
  questions: z.array(questionSchema).min(18).max(120),
  codeChallenges: z.array(codeChallengeSchema).min(3).max(9),
});

export type Track = z.infer<typeof trackSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Atom = z.infer<typeof atomSchema>;
export type Question = z.infer<typeof questionSchema>;
export type CodeChallenge = z.infer<typeof codeChallengeSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type LevelInfo = z.infer<typeof levelInfoSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type TeachingStep = z.infer<typeof teachingStepSchema>;

const keyPointSchema = z.object({
  label: z.string().min(4),
  aliases: z.array(z.string().min(1)).min(1).max(6),
});

const followUpSchema = z.object({
  prompt: z.string().min(10),
  modelAnswer: z.string().min(20),
  keyPoints: z.array(keyPointSchema).min(2).max(5),
});

const interviewQuestionSchema = z.object({
  id: z.string().min(3),
  level: levelSchema,
  skills: z.array(z.string()).min(1).max(3),
  kind: z.literal("knowledge"),
  prompt: z.string().min(10),
  modelAnswer: z.string().min(30),
  keyPoints: z.array(keyPointSchema).min(3).max(5),
  followUps: z.array(followUpSchema).min(1).max(2),
  commonMistakes: z.array(z.string().min(4)).min(1).max(3),
});

export const interviewBankSchema = z.object({
  trackId: trackIdSchema,
  questions: z.array(interviewQuestionSchema).min(6).max(30),
});

export type InterviewBank = z.infer<typeof interviewBankSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type KeyPoint = z.infer<typeof keyPointSchema>;

export type CourseExpectation = {
  chapters: number;
  chaptersPerLevel: number;
  questionIdsPerChapterMin: number;
  questionsTotalMin: number;
  atoms: number;
  challenges: number;
  hasInterviewBank: boolean;
};

export const COURSE_EXPECTATIONS: Record<TrackId, CourseExpectation> = {
  mobile: {
    chapters: 9,
    chaptersPerLevel: 3,
    questionIdsPerChapterMin: 5,
    questionsTotalMin: 45,
    atoms: 27,
    challenges: 9,
    hasInterviewBank: true,
  },
  fullstack: {
    chapters: 9,
    chaptersPerLevel: 3,
    questionIdsPerChapterMin: 5,
    questionsTotalMin: 45,
    atoms: 27,
    challenges: 9,
    hasInterviewBank: true,
  },
  "backend-java": {
    chapters: 6,
    chaptersPerLevel: 2,
    questionIdsPerChapterMin: 6,
    questionsTotalMin: 36,
    atoms: 18,
    challenges: 6,
    hasInterviewBank: true,
  },
  "database-mysql": {
    chapters: 3,
    chaptersPerLevel: 1,
    questionIdsPerChapterMin: 6,
    questionsTotalMin: 18,
    atoms: 9,
    challenges: 3,
    hasInterviewBank: false,
  },
  "cs-ai-foundations": {
    chapters: 3,
    chaptersPerLevel: 1,
    questionIdsPerChapterMin: 5,
    questionsTotalMin: 15,
    atoms: 9,
    challenges: 3,
    hasInterviewBank: false,
  },
};

const JS_CHALLENGE_TRACKS = new Set<TrackId>([
  "fullstack",
  "backend-java",
  "cs-ai-foundations",
]);

/** 深度校验：所有 ID 引用、章节结构、课程规格与跨文件约束。 */
export function validateTrack(track: Track): string[] {
  const problems: string[] = [];
  const expectation = COURSE_EXPECTATIONS[track.id];
  const chapterIds = new Set(track.chapters.map((chapter) => chapter.id));
  const atomIds = new Set(track.atoms.map((atom) => atom.id));
  const questionIds = new Set(track.questions.map((question) => question.id));
  const challengeIds = new Set(track.codeChallenges.map((challenge) => challenge.id));
  const skillIds = new Set(track.skills.map((skill) => skill.id));

  if (new Set(track.chapters.map((chapter) => chapter.id)).size !== track.chapters.length) problems.push("章节 ID 重复");
  if (new Set(track.atoms.map((atom) => atom.id)).size !== track.atoms.length) problems.push("知识点 ID 重复");
  if (new Set(track.questions.map((question) => question.id)).size !== track.questions.length) problems.push("题目 ID 重复");
  if (new Set(track.codeChallenges.map((challenge) => challenge.id)).size !== track.codeChallenges.length) problems.push("代码题 ID 重复");
  if (!expectation) problems.push(`未知课程规格：${track.id}`);

  if (track.chapters.length !== expectation.chapters) {
    problems.push(`${track.id} 应有 ${expectation.chapters} 个章节，实际 ${track.chapters.length}`);
  }
  if (track.atoms.length !== expectation.atoms) problems.push(`${track.id} 知识点数量不符`);
  if (track.questions.length < expectation.questionsTotalMin) problems.push(`${track.id} 题目少于 ${expectation.questionsTotalMin}`);
  if (track.codeChallenges.length !== expectation.challenges) problems.push(`${track.id} 代码题数量不符`);

  for (const level of LEVELS) {
    const levelChapters = track.chapters.filter((chapter) => chapter.level === level);
    if (levelChapters.length !== expectation.chaptersPerLevel) {
      problems.push(`${level} 应有 ${expectation.chaptersPerLevel} 个章节，实际 ${levelChapters.length}`);
    }
  }

  for (const chapter of track.chapters) {
    if (new Set(chapter.atomIds).size !== 3) problems.push(`${chapter.id} 知识点重复`);
    if (chapter.atomIds.some((id) => !atomIds.has(id))) problems.push(`${chapter.id} 引用了不存在的知识点`);
    if (chapter.questionIds.length < expectation.questionIdsPerChapterMin) {
      problems.push(`${chapter.id} 题目少于 ${expectation.questionIdsPerChapterMin}`);
    }
    if (chapter.questionIds.some((id) => !questionIds.has(id))) problems.push(`${chapter.id} 引用了不存在的题目`);
    if (chapter.codeChallengeIds.some((id) => !challengeIds.has(id))) problems.push(`${chapter.id} 引用了不存在的代码题`);
    if (!chapter.references.length) problems.push(`${chapter.id} 缺少参考来源`);
  }

  for (const challenge of track.codeChallenges) {
    if (track.id === "mobile" && challenge.language !== "kotlin") problems.push("移动端代码题必须为 Kotlin");
    if (JS_CHALLENGE_TRACKS.has(track.id) && challenge.language !== "javascript") {
      problems.push(`${track.id} 代码题必须为 JavaScript`);
    }
    if (track.id === "database-mysql" && challenge.language !== "sql") {
      problems.push("数据库课程代码题必须为 SQL");
    }
  }

  for (const atom of track.atoms) {
    if (!chapterIds.has(atom.chapterId)) problems.push(`${atom.id} 的章节不存在`);
    if (atom.skills.some((skill) => !skillIds.has(skill))) problems.push(`${atom.id} 引用了不存在的技能`);
    if (atom.teachingSteps && atom.teachingSteps.length > 5) problems.push(`${atom.id} 教学步骤过多`);
  }

  for (const question of track.questions) {
    const chapter = track.chapters.find((item) => item.id === question.chapterId);
    if (!chapter) problems.push(`${question.id} 的章节不存在`);
    else if (chapter.level !== question.level) problems.push(`${question.id} 的等级与章节不一致`);
    if (!chapter?.questionIds.includes(question.id)) problems.push(`${question.id} 未挂载到章节练习题`);
    if (question.skills.some((skill) => !skillIds.has(skill))) problems.push(`${question.id} 引用了不存在的技能`);
    if (new Set(question.options).size !== 4) problems.push(`${question.id} 选项存在重复`);
  }

  for (const challenge of track.codeChallenges) {
    const chapter = track.chapters.find((item) => item.id === challenge.chapterId);
    if (!chapter) problems.push(`${challenge.id} 的章节不存在`);
    else if (chapter.level !== challenge.level) problems.push(`${challenge.id} 的等级与章节不一致`);
    if (!chapter?.codeChallengeIds.includes(challenge.id)) problems.push(`${challenge.id} 未挂载到章节`);
    if (challenge.skills.some((skill) => !skillIds.has(skill))) problems.push(`${challenge.id} 引用了不存在的技能`);
  }

  return problems;
}

export function validateInterviewBank(bank: InterviewBank, skillIds: Set<string>): string[] {
  const problems: string[] = [];
  if (new Set(bank.questions.map((question) => question.id)).size !== bank.questions.length) {
    problems.push("面试题 ID 重复");
  }
  for (const level of LEVELS) {
    const count = bank.questions.filter((question) => question.level === level).length;
    if (count < 1 || count > 5) problems.push(`${level} 面试题数量应为 1–5，实际 ${count}`);
  }
  for (const question of bank.questions) {
    if (question.skills.some((skill) => !skillIds.has(skill))) problems.push(`${question.id} 引用了不存在的技能`);
    if (new Set(question.keyPoints.map((keyPoint) => keyPoint.label)).size !== question.keyPoints.length) {
      problems.push(`${question.id} 要点重复`);
    }
  }
  return problems;
}

export function qualityWarnings(track: Track): string[] {
  const warnings: string[] = [];
  for (const atom of track.atoms) {
    if (atom.keyPoints.some((point) => point.length > 80)) warnings.push(`${atom.id} 存在超过 80 字的要点`);
    if (atom.summary.length > 120) warnings.push(`${atom.id} 摘要偏长`);
  }
  for (const question of track.questions) {
    if (question.explanation.length > 220) warnings.push(`${question.id} 解析偏长`);
  }
  return warnings;
}
