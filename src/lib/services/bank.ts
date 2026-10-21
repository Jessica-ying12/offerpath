import { randomUUID } from "node:crypto";
import { getDb, type Db } from "@/lib/db/client";
import { recordBankAttempt, recordExamAttempt } from "@/lib/db/mastery";
import { logActivity } from "@/lib/db/activities";
import {
  findQuestion,
  getChapterChallenge,
  getChapterQuestions,
  getTracks,
  toPublicQuestion,
} from "@/lib/content";
import { LEVELS, LEVEL_LABEL, type LevelId, type TrackId } from "@/lib/content/schema";
import type { QuizDetail, QuizResult } from "@/lib/types";
import { AppError } from "@/lib/errors";

export type BankFilters = {
  trackId?: TrackId;
  level?: LevelId;
  skillId?: string;
  difficulty?: 1 | 2 | 3;
};

export type BankQuestionView = ReturnType<typeof toPublicQuestion> & {
  trackId: TrackId;
  trackName: string;
  chapterId: string;
  chapterTitle: string;
  difficulty?: number;
  kind?: string;
};

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function selectBankQuestions(
  filters: BankFilters,
  limit = 10,
  seed = 0,
): BankQuestionView[] {
  const pool: BankQuestionView[] = [];
  for (const track of getTracks()) {
    for (const chapter of track.chapters) {
      for (const question of getChapterQuestions(track, chapter)) {
        if (filters.trackId && track.id !== filters.trackId) continue;
        if (filters.level && question.level !== filters.level) continue;
        if (filters.skillId && !question.skills.includes(filters.skillId)) continue;
        if (filters.difficulty && question.difficulty !== filters.difficulty) continue;
        pool.push({
          ...toPublicQuestion(question),
          trackId: track.id,
          trackName: track.shortName,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
        });
      }
    }
  }
  return [...pool]
    .sort((a, b) => hash(`${a.id}:${seed}`) - hash(`${b.id}:${seed}`))
    .slice(0, Math.min(30, Math.max(1, limit)));
}

export function getBankFacets() {
  const tracks = getTracks();
  const byTrack = new Map<TrackId, number>();
  const byLevel = new Map<LevelId, number>();
  const bySkill = new Map<string, number>();
  let total = 0;
  for (const track of tracks) {
    for (const question of track.questions) {
      total += 1;
      byTrack.set(track.id, (byTrack.get(track.id) ?? 0) + 1);
      byLevel.set(question.level, (byLevel.get(question.level) ?? 0) + 1);
      for (const skill of question.skills) bySkill.set(skill, (bySkill.get(skill) ?? 0) + 1);
    }
  }
  return {
    total,
    byTrack: [...byTrack.entries()].map(([trackId, count]) => ({
      trackId,
      count,
      name: tracks.find((track) => track.id === trackId)?.shortName ?? trackId,
    })),
    byLevel: LEVELS.map((level) => ({
      level,
      count: byLevel.get(level) ?? 0,
      label: LEVEL_LABEL[level],
    })),
    bySkill: [...bySkill.entries()].map(([skillId, count]) => ({ skillId, count })),
  };
}

function gradeAnswers(
  answers: Array<{ questionId: string; selectedIndex: number }>,
  allowed: Set<string>,
): { details: QuizDetail[]; correct: number } {
  if (answers.length === 0) throw new AppError("至少需要作答一道题");
  const seen = new Set<string>();
  const details: QuizDetail[] = [];
  for (const answer of answers) {
    if (seen.has(answer.questionId)) throw new AppError("题目重复提交");
    seen.add(answer.questionId);
    if (!allowed.has(answer.questionId)) throw new AppError("题目不属于本次范围");
    if (!Number.isInteger(answer.selectedIndex) || answer.selectedIndex < 0 || answer.selectedIndex > 3) {
      throw new AppError("选项不合法");
    }
    const found = findQuestion(answer.questionId);
    if (!found) throw new AppError("题目不存在");
    details.push({
      questionId: answer.questionId,
      prompt: found.question.prompt,
      selectedIndex: answer.selectedIndex,
      correctIndex: found.question.answerIndex,
      correct: answer.selectedIndex === found.question.answerIndex,
      explanation: found.question.explanation,
      skills: found.question.skills,
    });
  }
  return { details, correct: details.filter((detail) => detail.correct).length };
}

export function submitBankQuiz(
  userId: string,
  input: {
    answers: Array<{ questionId: string; selectedIndex: number }>;
    scope: Record<string, unknown>;
    durationSeconds: number;
  },
  db: Db = getDb(),
): QuizResult {
  const allowed = new Set<string>();
  for (const track of getTracks()) for (const question of track.questions) allowed.add(question.id);
  const { details, correct } = gradeAnswers(input.answers, allowed);
  const attemptId = randomUUID();
  const now = new Date().toISOString();
  const trackId = findQuestion(input.answers[0].questionId)?.track.id ?? "fullstack";
  const run = db.transaction(() => {
    recordBankAttempt(db, {
      id: attemptId,
      userId,
      scope: input.scope,
      score: correct,
      total: details.length,
      durationSeconds: input.durationSeconds,
      details,
      createdAt: now,
    });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "bank_practiced",
      title: `题库练习 ${correct}/${details.length}`,
      meta: {
        href: "/bank",
        trackId,
        scope: input.scope,
        score: correct,
        total: details.length,
      },
      createdAt: now,
    });
  });
  run();
  return { attemptId, score: correct, correct, total: details.length, details };
}

export function getExamQuestions(
  trackId: TrackId,
  level: LevelId,
  limit = 20,
): {
  questions: BankQuestionView[];
  challenge: { id: string; title: string; language: string } | null;
  trackName: string;
} {
  const track = getTracks().find((item) => item.id === trackId);
  if (!track) throw new AppError("课程不存在", 404);
  const candidates: BankQuestionView[] = [];
  for (const chapter of track.chapters) {
    if (chapter.level !== level) continue;
    for (const question of getChapterQuestions(track, chapter)) {
      candidates.push({
        ...toPublicQuestion(question),
        trackId: track.id,
        trackName: track.shortName,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
      });
    }
  }
  const seed = new Date().toISOString().slice(0, 10);
  const questions = [...candidates]
    .sort((a, b) => hash(`${a.id}:${seed}`) - hash(`${b.id}:${seed}`))
    .slice(0, Math.min(30, limit));
  const chapter = track.chapters.find((item) => item.level === level);
  const challenge = chapter ? getChapterChallenge(track, chapter) : null;
  return {
    questions,
    challenge: challenge
      ? { id: challenge.id, title: challenge.title, language: challenge.language }
      : null,
    trackName: track.shortName,
  };
}

export function submitExam(
  userId: string,
  input: {
    trackId: TrackId;
    level: LevelId;
    answers: Array<{ questionId: string; selectedIndex: number }>;
    durationSeconds: number;
  },
  db: Db = getDb(),
): QuizResult {
  const track = getTracks().find((item) => item.id === input.trackId);
  if (!track) throw new AppError("课程不存在", 404);
  const allowed = new Set<string>();
  for (const chapter of track.chapters) {
    if (chapter.level !== input.level) continue;
    for (const question of getChapterQuestions(track, chapter)) allowed.add(question.id);
  }
  if (input.answers.length < 5) throw new AppError("模拟笔试至少需要提交 5 道题");
  const { details, correct } = gradeAnswers(input.answers, allowed);
  const attemptId = randomUUID();
  const now = new Date().toISOString();
  const run = db.transaction(() => {
    recordExamAttempt(db, {
      id: attemptId,
      userId,
      trackId: input.trackId,
      level: input.level,
      score: correct,
      total: details.length,
      durationSeconds: input.durationSeconds,
      details,
      createdAt: now,
    });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "exam_completed",
      title: `模拟笔试 ${track.shortName} · ${LEVEL_LABEL[input.level]} ${correct}/${details.length}`,
      meta: {
        href: "/exam",
        trackId: input.trackId,
        level: input.level,
        score: correct,
        total: details.length,
      },
      createdAt: now,
    });
  });
  run();
  return { attemptId, score: correct, correct, total: details.length, details };
}
