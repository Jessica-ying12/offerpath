import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "@/lib/db/client";
import { getInterviewTurns } from "@/lib/db/interviews";
import { authenticateUser, registerUser, updateProfile } from "@/lib/services/account";
import {
  completeAtomForUser,
  getChallengeSolution,
  getCodePageData,
  getPracticePageData,
  getReviewPageData,
  getTrackPageData,
  submitCodeForUser,
  submitQuizForUser,
} from "@/lib/services/learning";
import {
  createCareerPlanForUser,
  createSprintPlanForUser,
  getCareerPlanView,
  getSprintPlanView,
} from "@/lib/services/plans";
import {
  createInterviewForUser,
  endInterviewForUser,
  getInterviewPageData,
  submitInterviewTurn,
} from "@/lib/services/interviews";
import { getTracks, getChapterQuestions, getInterviewBank } from "@/lib/content";
import { AppError } from "@/lib/errors";
import type { User } from "@/lib/types";

const fullstack = getTracks().find((track) => track.id === "fullstack")!;
const mobile = getTracks().find((track) => track.id === "mobile")!;
const resume = `全栈工程师，4 年经验。
项目：订单履约平台（React + TypeScript + Node.js + PostgreSQL）
- 负责订单列表与详情，使用 React Query 管理服务端状态，接口 P95 从 420ms 降到 180ms。
- 设计幂等下单与超时重试，修复重复支付；为热点商品增加 Redis 缓存，QPS 提升 3 倍。
- 使用 Vitest 写测试，GitHub Actions 流水线发布。`;
const jd = `全栈开发工程师（中级）
要求熟悉 React、TypeScript、Node.js；熟悉 PostgreSQL 索引与事务；
了解 Redis、Docker、CI/CD；有性能优化与线上故障排查经验。`;

let db: Db;
let dbPath: string;
let userA: User;
let userB: User;

beforeAll(() => {
  dbPath = path.join(os.tmpdir(), `offerpath-test-${randomUUID()}.db`);
  db = openDatabase(dbPath);
  userA = registerUser({ name: "测试甲", email: `a-${randomUUID()}@test.dev`, password: "Password123" }, db);
  userB = registerUser({ name: "测试乙", email: `b-${randomUUID()}@test.dev`, password: "Password123" }, db);
  updateProfile(
    userA.id,
    { trackId: "fullstack", level: "middle", resumeText: resume, jdText: jd, onboarded: true },
    db,
  );
  updateProfile(userB.id, { trackId: "mobile", level: "junior", onboarded: true }, db);
});

afterAll(() => {
  db.close();
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(`${dbPath}${suffix}`, { force: true });
  }
});

describe("account and isolation", () => {
  it("authenticates with a hashed password and rejects wrong credentials", () => {
    const email = userA.email;
    expect(authenticateUser({ email, password: "Password123" }, db)?.id).toBe(userA.id);
    expect(authenticateUser({ email, password: "wrong-password" }, db)).toBeNull();
  });

  it("does not leak plans or mistakes across users", () => {
    expect(getReviewPageData(userB.id, db).items).toHaveLength(0);
    expect(getTrackPageData(userB.id, mobile.id, "junior", db).chapters.length).toBe(3);
  });
});

describe("learning and practice records", () => {
  it("records lesson completion idempotently", () => {
    const atom = mobile.atoms[0];
    const first = completeAtomForUser(userB.id, atom.id, db);
    const second = completeAtomForUser(userB.id, atom.id, db);
    expect(first.newlyCompleted).toBe(true);
    expect(second.newlyCompleted).toBe(false);
    const trackData = getTrackPageData(userB.id, mobile.id, "junior", db);
    const all = trackData.chapters.flatMap((chapter) => chapter.atoms);
    expect(all.find((item) => item.id === atom.id)?.completed).toBe(true);
    expect(trackData.overall.completed).toBe(1);
  });

  it("grades a chapter, records mistakes, then resolves them on redo", () => {
    const chapter = fullstack.chapters[0];
    const questions = getChapterQuestions(fullstack, chapter);
    expect(questions).toHaveLength(5);

    const allCorrect = submitQuizForUser(
      userA.id,
      {
        sourceType: "chapter",
        sourceId: chapter.id,
        durationSeconds: 90,
        answers: questions.map((question) => ({
          questionId: question.id,
          selectedIndex: question.answerIndex,
        })),
      },
      db,
    );
    expect(allCorrect.correct).toBe(5);
    expect(allCorrect.resolvedMistakes).toBe(0);

    const allWrong = submitQuizForUser(
      userA.id,
      {
        sourceType: "chapter",
        sourceId: chapter.id,
        durationSeconds: 80,
        answers: questions.map((question) => ({
          questionId: question.id,
          selectedIndex: (question.answerIndex + 1) % 4,
        })),
      },
      db,
    );
    expect(allWrong.correct).toBe(0);
    const review = getReviewPageData(userA.id, db);
    expect(review.items).toHaveLength(5);
    expect(getReviewPageData(userB.id, db).items).toHaveLength(0);

    const redoQuestions = getReviewPageData(userA.id, db).questions;
    const redo = submitQuizForUser(
      userA.id,
      {
        sourceType: "mistake",
        sourceId: "review",
        durationSeconds: 60,
        answers: redoQuestions.map((question) => {
          const original = questions.find((item) => item.id === question.id)!;
          return { questionId: question.id, selectedIndex: original.answerIndex };
        }),
      },
      db,
    );
    expect(redo.correct).toBe(redo.total);
    expect(redo.resolvedMistakes).toBe(5);
    expect(getReviewPageData(userA.id, db).items).toHaveLength(0);
  });

  it("requires all chapter questions to be answered", () => {
    const chapter = fullstack.chapters[1];
    const questions = getChapterQuestions(fullstack, chapter);
    expect(() =>
      submitQuizForUser(
        userA.id,
        {
          sourceType: "chapter",
          sourceId: chapter.id,
          durationSeconds: 10,
          answers: [{ questionId: questions[0].id, selectedIndex: questions[0].answerIndex }],
        },
        db,
      ),
    ).toThrow(AppError);
  });
});

describe("plans", () => {
  it("creates a tailored sprint plan and isolates it by user", () => {
    const { id } = createSprintPlanForUser(
      userA.id,
      { trackId: "fullstack", level: "middle", urgencyDays: 7, company: "测试公司", resumeText: resume, jdText: jd },
      db,
    );
    const view = getSprintPlanView(userA.id, id, db);
    expect(view.days).toHaveLength(7);
    expect(view.progress.total).toBeGreaterThan(5);
    expect(view.plan.analysis.jdSkills.length).toBeGreaterThan(0);
    expect(() => getSprintPlanView(userB.id, id, db)).toThrow(AppError);
  });

  it("creates a career roadmap with phase tasks", () => {
    const { id } = createCareerPlanForUser(
      userA.id,
      { trackId: "fullstack", level: "middle", horizonWeeks: 8, company: "测试公司", jdText: jd },
      db,
    );
    const view = getCareerPlanView(userA.id, id, db);
    expect(view.phases).toHaveLength(3);
    expect(view.total).toBeGreaterThan(0);
    expect(view.plan.phases.reduce((sum, phase) => sum + phase.weeks, 0)).toBe(8);
    expect(() => getCareerPlanView(userB.id, id, db)).toThrow(AppError);
  });
});

describe("code challenge access", () => {
  it("requires an attempt before revealing a JavaScript reference solution", () => {
    const challenge = fullstack.codeChallenges.find((item) => item.language === "javascript")!;
    const tests = challenge.tests ?? [];
    expect(() => getChallengeSolution(userA.id, challenge.id, db)).toThrow(AppError);
    const attempt = submitCodeForUser(
      userA.id,
      { challengeId: challenge.id, code: challenge.solutionCode, passed: 0, total: tests.length },
      db,
    );
    expect(attempt.completed).toBe(false);
    const solution = getChallengeSolution(userA.id, challenge.id, db);
    expect(solution.solutionCode).toBe(challenge.solutionCode);
    expect(() => getChallengeSolution(userB.id, challenge.id, db)).toThrow(AppError);
    expect(getCodePageData(userA.id, challenge.id, db).latestAttempt?.total).toBe(tests.length);
    const practice = getPracticePageData(userA.id, challenge.chapterId, db);
    expect(practice.questions.length).toBe(5);
  });
});

describe("adaptive interview end-to-end", () => {
  it("runs a full session with follow-ups and produces a stored report", () => {
    const { id } = createInterviewForUser(
      userA.id,
      { trackId: "fullstack", level: "middle", mode: "position", company: "测试公司" },
      db,
    );
    for (let index = 0; index < 20; index += 1) {
      const page = getInterviewPageData(userA.id, id, db);
      if (page.session.status === "completed") break;
      const pending = page.state.pending;
      expect(pending).not.toBeNull();
      if (!pending) break;
      const answer = `${pending.question.keyPoints
        .map((point) => point.aliases[0])
        .join("，")}。因为要先定位边界和取舍，所以用指标验证结果，代价是维护成本更高。`;
      const result = submitInterviewTurn(
        userA.id,
        id,
        { questionId: pending.question.id, answer },
        db,
      );
      if (result.completed) break;
    }
    const page = getInterviewPageData(userA.id, id, db);
    expect(page.session.status).toBe("completed");
    expect(page.summary).not.toBeNull();
    expect(page.summary?.answeredCount).toBeGreaterThanOrEqual(5);
    expect(page.summary?.average).toBeGreaterThan(0);
    expect(getInterviewTurns(db, id).length).toBeGreaterThanOrEqual(5);
    expect(() => getInterviewPageData(userB.id, id, db)).toThrow(AppError);
  });

  it("can end early and persists the partial report", () => {
    const { id } = createInterviewForUser(
      userA.id,
      { trackId: "mobile", level: "junior", mode: "position" },
      db,
    );
    const page = getInterviewPageData(userA.id, id, db);
    const pending = page.state.pending!;
    const bank = getInterviewBank("mobile");
    const bankQuestion = bank.questions.find((question) => question.id === pending.question.id);
    expect(bankQuestion).toBeDefined();
    submitInterviewTurn(
      userA.id,
      id,
      {
        questionId: pending.question.id,
        answer: `${pending.question.keyPoints.map((point) => point.aliases[0]).join("，")}。因为要说明机制，所以用具体指标验证。`,
      },
      db,
    );
    const summary = endInterviewForUser(userA.id, id, db);
    expect(summary.answeredCount).toBeGreaterThanOrEqual(1);
    const ended = getInterviewPageData(userA.id, id, db);
    expect(ended.session.status).toBe("completed");
    expect(ended.summary?.average).toBe(summary.average);
  });
});
