import { randomUUID } from "node:crypto";
import { getDb, type Db } from "@/lib/db/client";
import {
  applyQuizOutcomes,
  completeAtom,
  getAttemptedChapterIds,
  getChapterCompletion,
  getCompletedAtomIds,
  getLastCompletedAtom,
  getLatestChapterAttempt,
  getLatestCodeAttempt,
  getPassedChallengeIds,
  hasCodeAttempt,
  listMistakes,
  recordCodeAttempt,
  recordQuizAttempt,
} from "@/lib/db/learning";
import { logActivity } from "@/lib/db/activities";
import {
  findChallenge,
  findChapterAnyTrack,
  findQuestion,
  getChapterAtoms,
  getChapterChallenge,
  getChapterQuestions,
  getChaptersForAtom,
  getLevelChapters,
  getTracks,
  requireTrack,
  toPublicQuestion,
} from "@/lib/content";
import { LEVELS, LEVEL_LABEL, type Atom, type Chapter, type LevelId, type Track } from "@/lib/content/schema";
import type { QuizDetail, QuizResult } from "@/lib/types";
import { AppError } from "@/lib/errors";
import { scheduleChapterPractice } from "./mastery";

export type PublicQuestion = ReturnType<typeof toPublicQuestion>;

export type ChapterView = {
  chapter: Chapter;
  atoms: Array<Atom & { completed: boolean }>;
  completedAtoms: number;
  totalAtoms: number;
  practiceAttempt: { score: number; total: number; createdAt: string } | null;
  codePassed: boolean;
  challengeTitle: string | null;
};

export type TrackPageData = {
  track: Track;
  level: LevelId;
  levelInfo: Track["levels"][number];
  chapters: ChapterView[];
  nextHref: string | null;
  levelStats: Array<{ level: LevelId; label: string; completed: number; total: number }>;
  overall: { completed: number; total: number };
};

export function getLearnIndexData(userId: string, db: Db = getDb()) {
  const completedByTrack = new Map<string, Set<string>>();
  return getTracks().map((track) => {
    const completed = getCompletedAtomIds(db, userId, track.id);
    completedByTrack.set(track.id, completed);
    const last = getLastCompletedAtom(db, userId, track.id);
    const lastChapter = last ? track.chapters.find((chapter) => chapter.id === last.chapterId) : null;
    return {
      track,
      completedAtoms: completed.size,
      totalAtoms: track.atoms.length,
      lastChapter: lastChapter ?? null,
    };
  });
}

export function getTrackPageData(
  userId: string,
  trackId: string,
  requestedLevel: LevelId | null,
  db: Db = getDb(),
): TrackPageData {
  const track = requireTrack(trackId);
  const level = requestedLevel ?? "junior";
  const completed = getCompletedAtomIds(db, userId, track.id);
  const chapterCompletion = getChapterCompletion(db, userId, track.id);
  const attempted = getAttemptedChapterIds(db, userId, track.id);
  const passedChallenges = getPassedChallengeIds(db, userId, track.id);

  const chapters: ChapterView[] = getLevelChapters(track, level).map((chapter) => {
    const atoms = getChapterAtoms(track, chapter).map((atom) => ({
      ...atom,
      completed: completed.has(atom.id),
    }));
    const challenge = getChapterChallenge(track, chapter);
    return {
      chapter,
      atoms,
      completedAtoms: chapterCompletion.get(chapter.id) ?? 0,
      totalAtoms: chapter.atomIds.length,
      practiceAttempt: getLatestChapterAttempt(db, userId, chapter.id),
      codePassed: challenge ? passedChallenges.has(challenge.id) : false,
      challengeTitle: challenge?.title ?? null,
    };
  });

  const allLevelChapters = getLevelChapters(track, level);
  const firstChapter = allLevelChapters[0] ?? null;
  const firstIncompleteAtom = allLevelChapters
    .flatMap((chapter) => chapter.atomIds)
    .find((atomId) => !completed.has(atomId));
  const nextHref = firstIncompleteAtom
    ? (() => {
        const chapter = getChaptersForAtom(track, firstIncompleteAtom);
        return chapter ? `/learn/${track.id}/${chapter.id}/${firstIncompleteAtom}` : null;
      })()
    : firstChapter
      ? `/practice/chapter/${firstChapter.id}`
      : null;

  const levelStats = LEVELS.map((item) => {
    const total = track.chapters
      .filter((chapter) => chapter.level === item)
      .reduce((sum, chapter) => sum + chapter.atomIds.length, 0);
    const done = track.atoms.filter((atom) => {
      const chapter = track.chapters.find((candidate) => candidate.id === atom.chapterId);
      return chapter?.level === item && completed.has(atom.id);
    }).length;
    return { level: item, label: LEVEL_LABEL[item], completed: done, total };
  });

  const levelInfo = track.levels.find((item) => item.id === level) ?? track.levels[0];
  const overall = {
    completed: completed.size,
    total: track.atoms.length,
  };
  // 已学进度由知识点完成事实派生，不使用单独状态字段。
  void attempted;
  return { track, level, levelInfo, chapters, nextHref, levelStats, overall };
}

export function getLessonPageData(
  userId: string,
  trackId: string,
  chapterId: string,
  atomId: string,
  db: Db = getDb(),
) {
  const track = requireTrack(trackId);
  const chapter = track.chapters.find((item) => item.id === chapterId);
  if (!chapter) throw new AppError("章节不存在", 404);
  const atom = getChapterAtoms(track, chapter).find((item) => item.id === atomId);
  if (!atom) throw new AppError("知识点不存在", 404);
  const completed = getCompletedAtomIds(db, userId, track.id);
  const atoms = getChapterAtoms(track, chapter);
  const index = atoms.findIndex((item) => item.id === atom.id);
  const completedInChapter = atoms.filter((item) => completed.has(item.id)).length;
  const nextAtom = atoms[index + 1] ?? null;
  const challenge = getChapterChallenge(track, chapter);
  return {
    track,
    chapter,
    atom,
    isCompleted: completed.has(atom.id),
    position: index + 1,
    totalAtoms: atoms.length,
    completedInChapter,
    chapterCompleted: completedInChapter === atoms.length,
    nextHref: nextAtom
      ? `/learn/${track.id}/${chapter.id}/${nextAtom.id}`
      : `/practice/chapter/${chapter.id}`,
    practiceHref: `/practice/chapter/${chapter.id}`,
    practiceAttempt: getLatestChapterAttempt(db, userId, chapter.id),
    previousHref:
      index > 0
        ? `/learn/${track.id}/${chapter.id}/${atoms[index - 1].id}`
        : `/learn/${track.id}?level=${chapter.level}`,
    challengeTitle: challenge?.title ?? null,
    references: chapter.references,
    atoms: atoms.map((item) => ({
      id: item.id,
      title: item.title,
      minutes: item.minutes,
      completed: completed.has(item.id),
    })),
  };
}

export function completeAtomForUser(
  userId: string,
  atomId: string,
  db: Db = getDb(),
): { newlyCompleted: boolean; nextHref: string } {
  const found = getChaptersForAtomById(atomId);
  if (!found) throw new AppError("知识点不存在", 404);
  const { track, chapter, atom } = found;
  const now = new Date().toISOString();
  const newlyCompleted = db.transaction(() => {
    const inserted = completeAtom(db, {
      userId,
      atomId: atom.id,
      chapterId: chapter.id,
      trackId: track.id,
      completedAt: now,
    });
    if (inserted) {
      logActivity(db, {
        id: randomUUID(),
        userId,
        type: "lesson_completed",
        title: `完成知识点：${atom.title}`,
        meta: {
          trackId: track.id,
          chapterId: chapter.id,
          atomId: atom.id,
          href: `/learn/${track.id}/${chapter.id}/${atom.id}`,
        },
        createdAt: now,
      });
    }
    return inserted;
  })();

  const atoms = getChapterAtoms(track, chapter);
  const index = atoms.findIndex((item) => item.id === atom.id);
  const next = atoms[index + 1];
  return {
    newlyCompleted,
    nextHref: next
      ? `/learn/${track.id}/${chapter.id}/${next.id}`
      : `/practice/chapter/${chapter.id}`,
  };
}

function getChaptersForAtomById(atomId: string) {
  for (const track of getTracks()) {
    const atom = track.atoms.find((item) => item.id === atomId);
    if (!atom) continue;
    const chapter = track.chapters.find((item) => item.id === atom.chapterId);
    if (!chapter) continue;
    return { track, chapter, atom };
  }
  return null;
}

export function getPracticePageData(userId: string, chapterId: string, db: Db = getDb()) {
  const found = findChapterAnyTrack(chapterId);
  if (!found) throw new AppError("章节不存在", 404);
  const { track, chapter } = found;
  const questions = getChapterQuestions(track, chapter);
  if (questions.length === 0) throw new AppError("本章暂无练习题", 404);
  const completed = getCompletedAtomIds(db, userId, track.id);
  const challenge = getChapterChallenge(track, chapter);
  return {
    track,
    chapter,
    questions: questions.map(toPublicQuestion),
    completedAtoms: chapter.atomIds.filter((id) => completed.has(id)).length,
    totalAtoms: chapter.atomIds.length,
    practiceAttempt: getLatestChapterAttempt(db, userId, chapter.id),
    challenge: challenge
      ? {
          id: challenge.id,
          title: challenge.title,
          language: challenge.language,
          minutes: 20,
        }
      : null,
  };
}

export type QuizAnswerInput = { questionId: string; selectedIndex: number; durationSeconds?: number };

export function submitQuizForUser(
  userId: string,
  input: {
    sourceType: "chapter" | "mistake";
    sourceId: string;
    answers: QuizAnswerInput[];
    durationSeconds: number;
  },
  db: Db = getDb(),
): QuizResult & { resolvedMistakes: number } {
  if (input.answers.length === 0) throw new AppError("至少需要作答一道题");
  const answerMap = new Map<string, number>();
  for (const answer of input.answers) {
    if (answerMap.has(answer.questionId)) throw new AppError("存在重复作答的题目");
    if (!Number.isInteger(answer.selectedIndex) || answer.selectedIndex < 0 || answer.selectedIndex > 3) {
      throw new AppError("选项不合法");
    }
    answerMap.set(answer.questionId, answer.selectedIndex);
  }

  let questions: ReturnType<typeof getChapterQuestions>;
  let track: Track;
  let chapterTitle: string;
  let level: LevelId;
  let sourceId: string;
  if (input.sourceType === "chapter") {
    const found = findChapterAnyTrack(input.sourceId);
    if (!found) throw new AppError("章节不存在", 404);
    track = found.track;
    chapterTitle = found.chapter.title;
    level = found.chapter.level;
    questions = getChapterQuestions(found.track, found.chapter);
    sourceId = found.chapter.id;
    if (questions.length !== input.answers.length) {
      throw new AppError("请完成全部题目后再提交");
    }
    for (const question of questions) {
      if (!answerMap.has(question.id)) throw new AppError("请完成全部题目后再提交");
    }
  } else {
    const open = listMistakes(db, userId, { openOnly: true });
    const allowed = new Set(open.map((mistake) => mistake.questionId));
    const resolved: Array<{ trackId: Track["id"]; question: NonNullable<ReturnType<typeof findQuestion>> }> = [];
    for (const questionId of answerMap.keys()) {
      if (!allowed.has(questionId)) throw new AppError("错题不存在或已解决", 400);
      const found = findQuestion(questionId);
      if (found) resolved.push({ trackId: found.track.id, question: found });
    }
    if (resolved.length === 0) throw new AppError("没有可重做的错题");
    questions = resolved.map((item) => item.question.question);
    track = resolved[0].question.track;
    chapterTitle = "错题重做";
    level = resolved[0].question.chapter.level;
    sourceId = "review";
  }

  const details: QuizDetail[] = questions.map((question) => {
    const selectedIndex = answerMap.get(question.id);
    if (selectedIndex === undefined) throw new AppError("作答题目不匹配");
    return {
      questionId: question.id,
      prompt: question.prompt,
      selectedIndex,
      correctIndex: question.answerIndex,
      correct: selectedIndex === question.answerIndex,
      explanation: question.explanation,
      skills: question.skills,
    };
  });
  const correct = details.filter((detail) => detail.correct).length;
  const attemptId = randomUUID();
  const now = new Date().toISOString();

  const run = db.transaction(() => {
    recordQuizAttempt(db, {
      id: attemptId,
      userId,
      sourceType: input.sourceType,
      sourceId,
      trackId: track.id,
      level,
      score: correct,
      total: details.length,
      durationSeconds: input.durationSeconds,
      details,
      createdAt: now,
    });

    const questionLookup = new Map(questions.map((question) => [question.id, question]));
    const wrong = details
      .filter((detail) => !detail.correct)
      .map((detail) => ({
        questionId: detail.questionId,
        trackId: questionLookup.get(detail.questionId)?.trackId ?? track.id,
      }));
    const correctAnswers = details
      .filter((detail) => detail.correct)
      .map((detail) => ({ questionId: detail.questionId }));
    const resolvedMistakes = applyQuizOutcomes(db, { userId, wrong, correct: correctAnswers, now });

    if (input.sourceType === "chapter") {
      scheduleChapterPractice(userId, sourceId, track.id, correct, details.length, db, new Date(now));
    }

    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "quiz_submitted",
      title:
        input.sourceType === "mistake"
          ? `错题重做：${correct}/${details.length}`
          : `${track.shortName} · ${chapterTitle}：${correct}/${details.length}`,
      meta: {
        trackId: track.id,
        chapterId: input.sourceType === "chapter" ? sourceId : undefined,
        href:
          input.sourceType === "chapter" ? `/practice/chapter/${sourceId}` : "/practice/review",
        correct,
        total: details.length,
        sourceType: input.sourceType,
      },
      createdAt: now,
    });
    return resolvedMistakes;
  });

  const resolvedMistakes = run();
  return {
    attemptId,
    score: correct,
    correct,
    total: details.length,
    details,
    resolvedMistakes,
  };
}

export function getReviewPageData(userId: string, db: Db = getDb()) {
  const mistakes = listMistakes(db, userId, { openOnly: true });
  const items = mistakes
    .map((mistake) => {
      const found = findQuestion(mistake.questionId);
      if (!found) return null;
      return {
        question: toPublicQuestion(found.question),
        wrongCount: mistake.wrongCount,
        lastWrongAt: mistake.lastWrongAt,
        trackId: found.track.id,
        trackName: found.track.shortName,
        chapterTitle: found.chapter.title,
        chapterId: found.chapter.id,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return {
    items,
    questions: items.map((item) => item.question),
  };
}

export function getCodePageData(userId: string, challengeId: string, db: Db = getDb()) {
  const found = findChallenge(challengeId);
  if (!found) throw new AppError("代码题不存在", 404);
  const { track, chapter, challenge } = found;
  return {
    track,
    chapter,
    challenge: {
      id: challenge.id,
      title: challenge.title,
      prompt: challenge.prompt,
      language: challenge.language,
      functionName: challenge.functionName ?? null,
      requirements: challenge.requirements,
      starterCode: challenge.starterCode,
      tests: (challenge.tests ?? []).map((test) => ({
        name: test.name,
        args: test.args,
        expected: test.expected ?? null,
      })),
      rubric: challenge.rubric,
      level: challenge.level,
    },
    latestAttempt: getLatestCodeAttempt(db, userId, challenge.id),
    hasAttempt: hasCodeAttempt(db, userId, challenge.id),
  };
}

export function submitCodeForUser(
  userId: string,
  input: { challengeId: string; code: string; passed: number; total: number },
  db: Db = getDb(),
) {
  const found = findChallenge(input.challengeId);
  if (!found) throw new AppError("代码题不存在", 404);
  const { track, challenge } = found;
  const code = input.code.trim();
  if (code.length < 10) throw new AppError("代码内容太短，请完成实现后再提交");
  if (code.length > 20_000) throw new AppError("代码内容不能超过 20000 字");

  const expectedTotal = challenge.language === "javascript" ? (challenge.tests?.length ?? 0) : 1;
  if (input.total !== expectedTotal) throw new AppError("测试数量不匹配");
  if (!Number.isInteger(input.passed) || input.passed < 0 || input.passed > input.total) {
    throw new AppError("测试结果不合法");
  }

  const now = new Date().toISOString();
  const attemptId = randomUUID();
  const completed = input.passed === input.total && input.total > 0;
  const run = db.transaction(() => {
    recordCodeAttempt(db, {
      id: attemptId,
      userId,
      challengeId: challenge.id,
      trackId: track.id,
      language: challenge.language,
      code,
      passed: input.passed,
      total: input.total,
      createdAt: now,
    });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "code_submitted",
      title: completed
        ? `代码题通过：${challenge.title}`
        : `代码题提交：${challenge.title}（${input.passed}/${input.total}）`,
      meta: {
        trackId: track.id,
        challengeId: challenge.id,
        href: `/practice/code/${challenge.id}`,
        passed: input.passed,
        total: input.total,
        completed,
      },
      createdAt: now,
    });
  });
  run();
  return { attemptId, passed: input.passed, total: input.total, completed };
}

export function getChallengeSolution(userId: string, challengeId: string, db: Db = getDb()) {
  const found = findChallenge(challengeId);
  if (!found) throw new AppError("代码题不存在", 404);
  if (found.challenge.language === "javascript" && !hasCodeAttempt(db, userId, challengeId)) {
    throw new AppError("先运行一次或保存一次自己的实现，再看参考实现", 403);
  }
  logActivity(db, {
    id: randomUUID(),
    userId,
    type: "solution_viewed",
    title: `查看参考实现：${found.challenge.title}`,
    meta: {
      trackId: found.track.id,
      challengeId,
      href: `/practice/code/${challengeId}`,
    },
    createdAt: new Date().toISOString(),
  });
  return {
    solutionCode: found.challenge.solutionCode,
    solutionLanguage: found.challenge.language,
  };
}
