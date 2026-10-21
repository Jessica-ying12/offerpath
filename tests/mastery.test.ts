import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "@/lib/db/client";
import { registerUser } from "@/lib/services/account";
import { completeAtomForUser, submitQuizForUser } from "@/lib/services/learning";
import {
  MASTERY_LABEL,
  getChapterMasteryMap,
  getMasteryOverview,
  getMasteryViews,
  getReportsData,
  getReviewPageData,
  getReviewQuestionsForChapter,
  submitReview,
} from "@/lib/services/mastery";
import {
  getBankFacets,
  getExamQuestions,
  selectBankQuestions,
  submitBankQuiz,
  submitExam,
} from "@/lib/services/bank";
import { getChapterQuestions, getTracks } from "@/lib/content";
import { AppError } from "@/lib/errors";
import type { User } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
const backend = getTracks().find((track) => track.id === "backend-java")!;
const chapter = backend.chapters.find((item) => item.id === "be-j1-java")!;
const questions = getChapterQuestions(backend, chapter);

let db: Db;
let dbPath: string;
let user: User;
let other: User;

beforeAll(() => {
  dbPath = path.join(os.tmpdir(), `offerpath-mastery-${randomUUID()}.db`);
  db = openDatabase(dbPath);
  user = registerUser({ name: "复习甲", email: `m-${randomUUID()}@test.dev`, password: "Password123" }, db);
  other = registerUser({ name: "复习乙", email: `n-${randomUUID()}@test.dev`, password: "Password123" }, db);
});

afterAll(() => {
  db.close();
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(`${dbPath}${suffix}`, { force: true });
  }
});

function answers(correctCount: number) {
  return questions.slice(0, 5).map((question, index) => {
    const selectedIndex =
      index < correctCount ? question.answerIndex : (question.answerIndex + 1) % 4;
    return { questionId: question.id, selectedIndex };
  });
}

function passChapterQuiz(target: User = user) {
  for (const atomId of chapter.atomIds) completeAtomForUser(target.id, atomId, db);
  return submitQuizForUser(
    target.id,
    {
      sourceType: "chapter",
      sourceId: chapter.id,
      durationSeconds: 100,
      answers: questions.map((question) => ({
        questionId: question.id,
        selectedIndex: question.answerIndex,
      })),
    },
    db,
  );
}

describe("chapter mastery requires learning plus practice", () => {
  it("does not promote a chapter before its atoms are complete", () => {
    const late = registerUser(
      { name: "未学完", email: `late-${randomUUID()}@test.dev`, password: "Password123" },
      db,
    );
    submitQuizForUser(
      late.id,
      {
        sourceType: "chapter",
        sourceId: chapter.id,
        durationSeconds: 80,
        answers: questions.map((question) => ({
          questionId: question.id,
          selectedIndex: question.answerIndex,
        })),
      },
      db,
    );
    const map = getChapterMasteryMap(late.id, backend.id, db);
    expect(map.get(chapter.id)?.stage).toBe(1);
    expect(map.get(chapter.id)?.nextReviewAt).toBeNull();
  });

  it("promotes a learned chapter to D+1 review after passing practice", () => {
    const result = passChapterQuiz();
    expect(result.correct).toBe(questions.length);
    const map = getChapterMasteryMap(user.id, backend.id, db);
    const record = map.get(chapter.id);
    expect(record?.stage).toBe(2);
    expect(record?.reviewCount).toBe(0);
    expect(record?.nextReviewAt).not.toBeNull();
    expect(getMasteryViews(user.id, db)[0].due).toBe(false);
    expect(getMasteryViews(user.id, db, new Date(Date.now() + 2 * DAY))[0].due).toBe(true);
  });

  it("only awards mastery after three passed spaced reviews", () => {
    const base = Date.now() + 2 * DAY;
    const first = submitReview(
      user.id,
      { chapterId: chapter.id, answers: answers(5) },
      db,
      new Date(base),
    );
    expect(first.passed).toBe(true);
    expect(first.stage).toBe(3);
    expect(first.label).toBe(MASTERY_LABEL[3]);
    expect(first.reviewCount).toBe(1);
    expect(first.nextReviewAt).toBe(new Date(base + 3 * DAY).toISOString());

    const failed = submitReview(
      user.id,
      { chapterId: chapter.id, answers: answers(3) },
      db,
      new Date(base + 4 * DAY),
    );
    expect(failed.passed).toBe(false);
    expect(failed.stage).toBe(3);
    expect(failed.reviewCount).toBe(1);
    expect(failed.nextReviewAt).toBe(new Date(base + 5 * DAY).toISOString());

    const second = submitReview(
      user.id,
      { chapterId: chapter.id, answers: answers(4) },
      db,
      new Date(base + 6 * DAY),
    );
    expect(second.score).toBe(4);
    expect(second.stage).toBe(4);
    expect(second.nextReviewAt).toBe(new Date(base + 13 * DAY).toISOString());

    const third = submitReview(
      user.id,
      { chapterId: chapter.id, answers: answers(5) },
      db,
      new Date(base + 14 * DAY),
    );
    expect(third.stage).toBe(5);
    expect(third.reviewCount).toBe(3);
    expect(third.nextReviewAt).toBeNull();

    const overview = getMasteryOverview(user.id, db);
    expect(overview.mastered).toBe(1);
    expect(overview.due).toBe(0);
    expect(getReviewPageData(user.id, db).mastered).toHaveLength(1);
    expect(getMasteryViews(user.id, db)[0].label).toBe("已掌握");
  });

  it("rejects reviews for a chapter that never passed practice", () => {
    expect(() =>
      submitReview(other.id, { chapterId: chapter.id, answers: answers(5) }, db),
    ).toThrow(AppError);
  });

  it("is fully isolated between users", () => {
    expect(getMasteryViews(other.id, db)).toHaveLength(0);
    const reports = getReportsData(other.id, db);
    expect(reports.overview.totalTracked).toBe(0);
    expect(reports.reviewAttempts).toHaveLength(0);
  });
});

describe("filtered bank and written exam", () => {
  it("filters the 210-question bank by course, level and technology", () => {
    const facets = getBankFacets();
    expect(facets.total).toBe(210);
    expect(facets.byTrack.find((item) => item.trackId === "backend-java")?.count).toBe(48);

    const selected = selectBankQuestions({ trackId: "backend-java", level: "junior" }, 10, 7);
    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((item) => item.id)).size).toBe(10);
    for (const item of selected) {
      expect(item.trackId).toBe("backend-java");
      expect(item.level).toBe("junior");
    }

    const skillId = questions[0].skills[0];
    const bySkill = selectBankQuestions({ skillId }, 5, 1);
    expect(bySkill.length).toBeGreaterThan(0);
    for (const item of bySkill) expect(item.skills).toContain(skillId);

    expect(selectBankQuestions({ trackId: "backend-java" }, 100, 1)).toHaveLength(30);
  });

  it("records bank practice without changing chapter mastery", () => {
    const picked = questions.slice(0, 3);
    const result = submitBankQuiz(
      other.id,
      {
        scope: { trackId: "backend-java", level: "junior" },
        durationSeconds: 70,
        answers: picked.map((question, index) => ({
          questionId: question.id,
          selectedIndex: index === 0 ? question.answerIndex : (question.answerIndex + 1) % 4,
        })),
      },
      db,
    );
    expect(result.score).toBe(1);
    expect(result.total).toBe(3);
    expect(result.details.filter((detail) => !detail.correct)).toHaveLength(2);
    expect(getChapterMasteryMap(other.id, backend.id, db).size).toBe(0);
    expect(getReviewPageData(other.id, db).due).toHaveLength(0);

    const reports = getReportsData(other.id, db);
    expect(reports.bankAttempts).toHaveLength(1);
    expect(reports.bankAttempts[0].scope.trackId).toBe("backend-java");

    expect(() =>
      submitBankQuiz(
        other.id,
        {
          scope: {},
          durationSeconds: 10,
          answers: [
            { questionId: picked[0].id, selectedIndex: picked[0].answerIndex },
            { questionId: picked[0].id, selectedIndex: picked[0].answerIndex },
          ],
        },
        db,
      ),
    ).toThrow(AppError);
  });

  it("builds a level-scoped exam, records it, and rejects foreign questions", () => {
    const exam = getExamQuestions("backend-java", "junior");
    expect(exam.questions.length).toBe(16);
    expect(exam.challenge).not.toBeNull();
    expect(exam.trackName).toBe("Java 后端");
    for (const item of exam.questions) expect(item.level).toBe("junior");

    const submitted = submitExam(
      other.id,
      {
        trackId: "backend-java",
        level: "junior",
        durationSeconds: 300,
        answers: exam.questions.slice(0, 5).map((item) => {
          const source = backend.questions.find((question) => question.id === item.id)!;
          return { questionId: item.id, selectedIndex: source.answerIndex };
        }),
      },
      db,
    );
    expect(submitted.score).toBe(5);
    expect(submitted.total).toBe(5);
    expect(getReportsData(other.id, db).examAttempts[0]).toMatchObject({
      trackId: "backend-java",
      level: "junior",
      score: 5,
    });

    const middle = backend.chapters.find((item) => item.level === "middle")!;
    const foreign = getChapterQuestions(backend, middle)[0];
    expect(() =>
      submitExam(
        other.id,
        {
          trackId: "backend-java",
          level: "junior",
          durationSeconds: 60,
          answers: [
            { questionId: foreign.id, selectedIndex: foreign.answerIndex },
            ...exam.questions.slice(0, 4).map((item) => ({
              questionId: item.id,
              selectedIndex: 0,
            })),
          ],
        },
        db,
      ),
    ).toThrow(AppError);

    expect(() =>
      submitExam(
        other.id,
        { trackId: "backend-java", level: "junior", durationSeconds: 60, answers: [] },
        db,
      ),
    ).toThrow(AppError);
  });

  it("rotates review questions and validates their chapter", () => {
    const review = getReviewQuestionsForChapter(chapter.id, user.id);
    expect(review.questions).toHaveLength(5);
    for (const question of review.questions) expect(question.chapterId).toBe(chapter.id);
    expect(() => getReviewQuestionsForChapter("missing-chapter")).toThrow(AppError);
  });
});
