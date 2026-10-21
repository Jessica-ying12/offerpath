import { randomUUID } from "node:crypto";
import { getDb, type Db } from "@/lib/db/client";
import {
  getMastery,
  listBankAttempts,
  listExamAttempts,
  listMastery,
  listReviewAttempts,
  recordReviewAttempt,
  saveMastery,
} from "@/lib/db/mastery";
import { logActivity } from "@/lib/db/activities";
import { getCompletedAtomIds, getQuizStats, listMistakes } from "@/lib/db/learning";
import {
  findChapterAnyTrack,
  findQuestion,
  getChapterQuestions,
  getSkillName,
  getTracks,
} from "@/lib/content";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type {
  MasteryRecord,
  MasteryStage,
  QuizDetail,
} from "@/lib/types";
import { AppError } from "@/lib/errors";
import { clamp } from "@/lib/utils";

export const MASTERY_LABEL: Record<MasteryStage, string> = {
  1: "学习中",
  2: "待复习",
  3: "复习中",
  4: "巩固中",
  5: "已掌握",
};


export const MASTERY_PASS_RATIO = 0.8;

export type MasteryView = MasteryRecord & {
  label: string;
  due: boolean;
  chapterTitle: string;
  trackId: TrackId;
  trackName: string;
  level: LevelId;
  questionCount: number;
};

export type MasteryOverview = {
  totalTracked: number;
  learning: number;
  due: number;
  mastered: number;
  byStage: Record<MasteryStage, number>;
  items: MasteryView[];
};

export type ReviewGrade = {
  score: number;
  total: number;
  passed: boolean;
  stage: MasteryStage;
  label: string;
  reviewCount: number;
  nextReviewAt: string | null;
  details: QuizDetail[];
};

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function dateKey(value: string): string {
  return value.slice(0, 10);
}

function matchRatio(score: number, total: number): number {
  return total > 0 ? score / total : 0;
}

export function scheduleChapterPractice(
  userId: string,
  chapterId: string,
  trackId: TrackId,
  score: number,
  total: number,
  db: Db = getDb(),
  now = new Date(),
): MasteryRecord {
  const current = getMastery(db, userId, chapterId);
  if (current?.stage === 5) return current;
  const found = findChapterAnyTrack(chapterId);
  const completed = getCompletedAtomIds(db, userId, trackId);
  const learned = found ? found.chapter.atomIds.every((atomId) => completed.has(atomId)) : false;
  const passed = learned && matchRatio(score, total) >= 0.6;
  const stage: MasteryStage = passed
    ? current && current.stage >= 2
      ? current.stage
      : 2
    : current && current.stage >= 2
      ? current.stage
      : 1;
  const record: MasteryRecord = {
    userId,
    chapterId,
    trackId,
    stage,
    reviewCount: current?.reviewCount ?? 0,
    nextReviewAt: passed ? addDays(now, 1) : stage >= 2 ? addDays(now, 1) : null,
    lastReviewAt: current?.lastReviewAt ?? null,
    updatedAt: now.toISOString(),
  };
  saveMastery(db, record);
  return record;
}

export function getMasteryViews(userId: string, db: Db = getDb(), now = new Date()): MasteryView[] {
  const records = listMastery(db, userId);
  const views: MasteryView[] = [];
  for (const record of records) {
    const found = findChapterAnyTrack(record.chapterId);
    if (!found) continue;
    const questions = getChapterQuestions(found.track, found.chapter);
    views.push({
      ...record,
      label: MASTERY_LABEL[record.stage],
      due: record.stage < 5 && record.nextReviewAt !== null && record.nextReviewAt <= now.toISOString(),
      chapterTitle: found.chapter.title,
      trackName: found.track.shortName,
      trackId: found.track.id,
      level: found.chapter.level,
      questionCount: questions.length,
    });
  }
  return views.sort((a, b) => (a.nextReviewAt ?? "").localeCompare(b.nextReviewAt ?? ""));
}

export function getMasteryOverview(userId: string, db: Db = getDb(), now = new Date()): MasteryOverview {
  const items = getMasteryViews(userId, db, now);
  const byStage: Record<MasteryStage, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const item of items) byStage[item.stage] += 1;
  return {
    totalTracked: items.length,
    learning: items.filter((item) => item.stage < 2).length,
    due: items.filter((item) => item.due).length,
    mastered: byStage[5],
    byStage,
    items,
  };
}

export function getChapterMasteryMap(userId: string, trackId: TrackId, db: Db = getDb()) {
  const map = new Map<string, MasteryRecord>();
  for (const record of listMastery(db, userId, trackId)) map.set(record.chapterId, record);
  return map;
}

export function getReviewPageData(userId: string, db: Db = getDb(), now = new Date()) {
  const overview = getMasteryOverview(userId, db, now);
  const today = now.toISOString();
  const inSevenDays = addDays(now, 7);
  const due = overview.items.filter((item) => item.due);
  const upcoming = overview.items.filter(
    (item) =>
      item.stage < 5 &&
      item.nextReviewAt !== null &&
      item.nextReviewAt > today &&
      item.nextReviewAt <= inSevenDays,
  );
  return {
    due,
    upcoming,
    mastered: overview.items.filter((item) => item.stage === 5),
    overview,
    todayKey: dateKey(today),
  };
}

export function getReviewQuestionsForChapter(chapterId: string, userId?: string) {
  const found = findChapterAnyTrack(chapterId);
  if (!found) throw new AppError("章节不存在", 404);
  const questions = getChapterQuestions(found.track, found.chapter);
  if (questions.length === 0) throw new AppError("该章节暂无复习题", 404);
  const seed = userId ? [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0) : 0;
  const start = seed % questions.length;
  const rotated = [...questions.slice(start), ...questions.slice(0, start)];
  return {
    track: found.track,
    chapter: found.chapter,
    questions: rotated.slice(0, Math.min(5, rotated.length)),
  };
}

export function submitReview(
  userId: string,
  input: { chapterId: string; answers: Array<{ questionId: string; selectedIndex: number }> },
  db: Db = getDb(),
  now = new Date(),
): ReviewGrade {
  const found = findChapterAnyTrack(input.chapterId);
  if (!found) throw new AppError("章节不存在", 404);
  const current = getMastery(db, userId, found.chapter.id);
  if (!current || current.stage < 2 || current.stage >= 5) {
    throw new AppError("该章节尚未进入可复习状态，请先通过章节练习", 409);
  }
  if (input.answers.length < 3) throw new AppError("复习至少需要作答 3 道题");

  const questions = getChapterQuestions(found.track, found.chapter);
  const allowed = new Map(questions.map((question) => [question.id, question]));
  const detailMap = new Map<string, QuizDetail>();
  for (const answer of input.answers) {
    const question = allowed.get(answer.questionId);
    if (!question) throw new AppError("复习题不属于该章节", 400);
    if (!Number.isInteger(answer.selectedIndex) || answer.selectedIndex < 0 || answer.selectedIndex > 3) {
      throw new AppError("选项不合法", 400);
    }
    detailMap.set(question.id, {
      questionId: question.id,
      prompt: question.prompt,
      selectedIndex: answer.selectedIndex,
      correctIndex: question.answerIndex,
      correct: answer.selectedIndex === question.answerIndex,
      explanation: question.explanation,
      skills: question.skills,
    });
  }
  const details = [...detailMap.values()];
  const score = details.filter((detail) => detail.correct).length;
  const total = details.length;
  const passed = matchRatio(score, total) >= MASTERY_PASS_RATIO;
  const reviewCount = current.reviewCount + (passed ? 1 : 0);
  const stage: MasteryStage = passed
    ? (Math.min(5, 2 + reviewCount) as MasteryStage)
    : current.stage;
  const nextDays = passed ? (reviewCount >= 3 ? 0 : reviewCount === 1 ? 3 : 7) : 1;
  const nextReviewAt = stage >= 5 ? null : addDays(now, nextDays);
  const nowIso = now.toISOString();
  const nextRecord: MasteryRecord = {
    ...current,
    stage,
    reviewCount,
    nextReviewAt,
    lastReviewAt: nowIso,
    updatedAt: nowIso,
  };

  const run = db.transaction(() => {
    recordReviewAttempt(db, {
      id: randomUUID(),
      userId,
      chapterId: found.chapter.id,
      trackId: found.track.id,
      level: found.chapter.level,
      score,
      total,
      details,
      createdAt: nowIso,
    });
    saveMastery(db, nextRecord);
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "review_completed",
      title: `${found.chapter.title} · 周期复习 ${score}/${total} · ${MASTERY_LABEL[stage]}`,
      meta: {
        href: "/review",
        trackId: found.track.id,
        chapterId: found.chapter.id,
        passed,
        score,
        total,
        stage,
      },
      createdAt: nowIso,
    });
  });
  run();

  return {
    score,
    total,
    passed,
    stage,
    label: MASTERY_LABEL[stage],
    reviewCount,
    nextReviewAt,
    details,
  };
}

export type ReportsData = {
  overview: MasteryOverview;
  quizStats: ReturnType<typeof getQuizStats>;
  reviewAttempts: ReturnType<typeof listReviewAttempts>;
  bankAttempts: ReturnType<typeof listBankAttempts>;
  examAttempts: ReturnType<typeof listExamAttempts>;
  openMistakes: ReturnType<typeof listMistakes>;
  weakSkills: Array<{ skillId: string; name: string; wrongCount: number }>;
  nextReviews: MasteryView[];
};

export function getReportsData(userId: string, db: Db = getDb(), now = new Date()): ReportsData {
  const overview = getMasteryOverview(userId, db, now);
  const stages = getMasteryViews(userId, db, now);
  const wrongSkills = new Map<string, { name: string; wrongCount: number }>();
  for (const mistake of listMistakes(db, userId, { openOnly: true })) {
    const found = findQuestion(mistake.questionId);
    if (!found) continue;
    const skillId = found.question.skills[0];
    if (!skillId) continue;
    const current = wrongSkills.get(skillId) ?? {
      name: getSkillName(found.track, skillId),
      wrongCount: 0,
    };
    current.wrongCount += mistake.wrongCount;
    wrongSkills.set(skillId, current);
  }
  const weakSkills = [...wrongSkills.entries()]
    .map(([skillId, value]) => ({ skillId, ...value }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);
  return {
    overview,
    quizStats: getQuizStats(db, userId),
    reviewAttempts: listReviewAttempts(db, userId, 8),
    bankAttempts: listBankAttempts(db, userId, 5),
    examAttempts: listExamAttempts(db, userId, 5),
    openMistakes: listMistakes(db, userId, { openOnly: true }),
    weakSkills,
    nextReviews: stages
      .filter((item) => item.stage < 5 && item.nextReviewAt !== null)
      .slice(0, 6),
  };
}

export function getMasteryProgressSummary(userId: string, db: Db = getDb()) {
  const overview = getMasteryOverview(userId, db);
  const totalChapters = getTracks().reduce((sum, track) => sum + track.chapters.length, 0);
  return {
    ...overview,
    totalChapters,
    masteredPercent: clamp(
      totalChapters > 0 ? Math.round((overview.mastered / totalChapters) * 100) : 0,
      0,
      100,
    ),
  };
}
