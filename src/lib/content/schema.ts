import { z } from "zod";

export const LEVELS = ["junior", "middle", "senior"] as const;
export const TRACK_IDS = ["mobile", "fullstack"] as const;

export type LevelId = (typeof LEVELS)[number];
export type TrackId = (typeof TRACK_IDS)[number];

export const LEVEL_LABEL: Record<LevelId, string> = {
  junior: "初级",
  middle: "中级",
  senior: "高级",
};

export const levelSchema = z.enum(LEVELS);
export const trackIdSchema = z.enum(TRACK_IDS);

const skillSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  aliases: z.array(z.string().min(1)).min(1),
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
  questionIds: z.array(z.string()).length(5),
  codeChallengeIds: z.array(z.string()).length(1),
});

const atomSchema = z.object({
  id: z.string().min(3),
  chapterId: z.string().min(3),
  title: z.string().min(2),
  summary: z.string().min(10),
  minutes: z.number().int().min(2).max(15),
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
  skills: z.array(z.string().min(2)).min(1).max(3),
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
    language: z.enum(["javascript", "kotlin"]),
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
  tagline: z.string().min(6),
  description: z.string().min(20),
  landingPoints: z.array(z.string().min(4)).min(2).max(4),
  levels: z.array(levelInfoSchema).length(3),
  skills: z.array(skillSchema).min(8),
  chapters: z.array(chapterSchema).length(9),
  atoms: z.array(atomSchema).length(27),
  questions: z.array(questionSchema).length(45),
  codeChallenges: z.array(codeChallengeSchema).length(9),
});

export type Track = z.infer<typeof trackSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Atom = z.infer<typeof atomSchema>;
export type Question = z.infer<typeof questionSchema>;
export type CodeChallenge = z.infer<typeof codeChallengeSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type LevelInfo = z.infer<typeof levelInfoSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;

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
  questions: z.array(interviewQuestionSchema).length(15),
});

export type InterviewBank = z.infer<typeof interviewBankSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type KeyPoint = z.infer<typeof keyPointSchema>;

/** 深度校验：所有 ID 引用、章节结构、跨文件约束。 */
export function validateTrack(track: Track): string[] {
  const problems: string[] = [];
  const chapterIds = new Set(track.chapters.map((c) => c.id));
  const atomIds = new Set(track.atoms.map((a) => a.id));
  const questionIds = new Set(track.questions.map((q) => q.id));
  const challengeIds = new Set(track.codeChallenges.map((c) => c.id));
  const skillIds = new Set(track.skills.map((s) => s.id));

  if (new Set(track.chapters.map((c) => c.id)).size !== 9) problems.push("章节 ID 重复");
  if (new Set(track.atoms.map((a) => a.id)).size !== 27) problems.push("知识点 ID 重复");
  if (new Set(track.questions.map((q) => q.id)).size !== 45) problems.push("题目 ID 重复");
  if (new Set(track.codeChallenges.map((c) => c.id)).size !== 9) problems.push("代码题 ID 重复");

  for (const level of LEVELS) {
    const levelChapters = track.chapters.filter((c) => c.level === level);
    if (levelChapters.length !== 3) problems.push(`${level} 应有 3 个章节，实际 ${levelChapters.length}`);
  }

  for (const chapter of track.chapters) {
    if (new Set(chapter.atomIds).size !== 3) problems.push(`${chapter.id} 知识点重复`);
    if (chapter.atomIds.some((id) => !atomIds.has(id))) problems.push(`${chapter.id} 引用了不存在的知识点`);
    if (chapter.questionIds.some((id) => !questionIds.has(id))) problems.push(`${chapter.id} 引用了不存在的题目`);
    if (chapter.codeChallengeIds.some((id) => !challengeIds.has(id))) problems.push(`${chapter.id} 引用了不存在的代码题`);
  }

  for (const atom of track.atoms) {
    if (!chapterIds.has(atom.chapterId)) problems.push(`${atom.id} 的章节不存在`);
    if (atom.skills.some((s) => !skillIds.has(s))) problems.push(`${atom.id} 引用了不存在的技能`);
  }

  for (const question of track.questions) {
    const chapter = track.chapters.find((c) => c.id === question.chapterId);
    if (!chapter) problems.push(`${question.id} 的章节不存在`);
    else if (chapter.level !== question.level) problems.push(`${question.id} 的等级与章节不一致`);
    if (!chapter?.questionIds.includes(question.id)) problems.push(`${question.id} 未挂载到章节练习题`);
    if (question.skills.some((s) => !skillIds.has(s))) problems.push(`${question.id} 引用了不存在的技能`);
    if (new Set(question.options).size !== 4) problems.push(`${question.id} 选项存在重复`);
  }

  for (const challenge of track.codeChallenges) {
    const chapter = track.chapters.find((c) => c.id === challenge.chapterId);
    if (!chapter) problems.push(`${challenge.id} 的章节不存在`);
    else if (chapter.level !== challenge.level) problems.push(`${challenge.id} 的等级与章节不一致`);
    if (!chapter?.codeChallengeIds.includes(challenge.id)) problems.push(`${challenge.id} 未挂载到章节`);
    if (challenge.skills.some((s) => !skillIds.has(s))) problems.push(`${challenge.id} 引用了不存在的技能`);
    if (track.id === "mobile" && challenge.language !== "kotlin") problems.push("移动端代码题必须为 Kotlin");
    if (track.id === "fullstack" && challenge.language !== "javascript") problems.push("全栈代码题必须为 JavaScript");
  }

  const allQuestionIds = track.questions.map((q) => q.id);
  if (new Set(allQuestionIds).size !== 45) problems.push("存在重复题目 ID");

  return problems;
}

export function validateInterviewBank(bank: InterviewBank, skillIds: Set<string>): string[] {
  const problems: string[] = [];
  if (new Set(bank.questions.map((q) => q.id)).size !== 15) problems.push("面试题 ID 重复");
  for (const level of LEVELS) {
    const count = bank.questions.filter((q) => q.level === level).length;
    if (count !== 5) problems.push(`${level} 面试题应有 5 道，实际 ${count}`);
  }
  for (const question of bank.questions) {
    if (question.skills.some((s) => !skillIds.has(s))) problems.push(`${question.id} 引用了不存在的技能`);
    if (new Set(question.keyPoints.map((k) => k.label)).size !== question.keyPoints.length) {
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
