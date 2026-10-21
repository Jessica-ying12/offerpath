import { describe, expect, it } from "vitest";
import { getInterviewBank, getTracks } from "@/lib/content";
import {
  buildInterviewPlan,
  buildInterviewSummary,
  evaluateInterviewAnswer,
  getInterviewState,
} from "@/lib/engine/interview";
import type { InterviewTurn } from "@/lib/types";

const track = getTracks().find((item) => item.id === "fullstack")!;
const bank = getInterviewBank(track.id)!;
const resume = `全栈工程师，负责订单履约平台。
项目：使用 React + TypeScript + Node.js + PostgreSQL 重构订单后台，接口 P95 从 420ms 降到 180ms，支撑日均 10 万单。`;
const now = "2026-10-21T00:00:00.000Z";

function feedback(score: number) {
  return {
    score,
    matched: [],
    missing: score < 50 ? ["机制"] : [],
    hint: "补上机制与取舍",
    modelAnswer: "参考答案",
    advice: "建议",
    skills: ["typescript"],
  };
}

function turn(input: {
  seq: number;
  questionId: string;
  score: number;
  kind: InterviewTurn["kind"];
  parentId?: string | null;
}): InterviewTurn {
  return {
    id: `turn-${input.seq}`,
    sessionId: "session",
    seq: input.seq,
    questionId: input.questionId,
    parentId: input.parentId ?? null,
    kind: input.kind,
    questionText: "问题",
    answer: "回答",
    score: input.score,
    feedback: feedback(input.score),
    createdAt: now,
  };
}

describe("interview plan building", () => {
  it("builds five knowledge questions for a position interview", () => {
    const plan = buildInterviewPlan({
      track,
      bank,
      level: "middle",
      mode: "position",
      resumeText: "",
      jdText: "",
      company: "",
      seed: 7,
      now,
    });
    expect(plan.mainQuestions).toHaveLength(5);
    expect(plan.mainQuestions.every((question) => question.kind === "knowledge")).toBe(true);
    expect(new Set(plan.mainQuestions.map((question) => question.id)).size).toBe(5);
  });

  it("starts with project questions when a resume is provided", () => {
    const plan = buildInterviewPlan({
      track,
      bank,
      level: "middle",
      mode: "resume",
      resumeText: resume,
      jdText: "",
      company: "示例",
      seed: 3,
      now,
    });
    expect(plan.mainQuestions).toHaveLength(5);
    expect(plan.mainQuestions.filter((question) => question.kind === "project").length).toBeGreaterThanOrEqual(1);
    expect(plan.mainQuestions[0].prompt).toContain("简历");
    const project = plan.mainQuestions.find((question) => question.kind === "project");
    expect(project?.keyPoints.length).toBeGreaterThanOrEqual(3);
    expect(project?.followUps?.length).toBeGreaterThanOrEqual(1);
  });
});

describe("answer evaluation", () => {
  const question = bank.questions.find((item) => item.level === "middle")!;

  it("matches key points and produces referenced feedback", () => {
    const answer = question.keyPoints
      .slice(0, 3)
      .map((point) => point.aliases[0])
      .join("，") + "。因为要看机制与取舍，所以用指标验证结果。";
    const result = evaluateInterviewAnswer(question, answer);
    expect(result.score).toBeGreaterThan(30);
    expect(result.matched.length).toBeGreaterThanOrEqual(3);
    expect(result.matched.length + result.missing.length).toBe(question.keyPoints.length);
    expect(result.hint.length).toBeGreaterThan(0);
    expect(result.modelAnswer).toBe(question.modelAnswer);
  });

  it("scores an empty or trivial answer low", () => {
    expect(evaluateInterviewAnswer(question, "").score).toBeLessThanOrEqual(10);
    expect(evaluateInterviewAnswer(question, "不知道").score).toBeLessThanOrEqual(20);
  });
});

describe("adaptive interview state", () => {
  const plan = buildInterviewPlan({
    track,
    bank,
    level: "middle",
    mode: "position",
    resumeText: "",
    jdText: "",
    company: "",
    seed: 11,
    now,
  });
  const first = plan.mainQuestions[0].id;
  const second = plan.mainQuestions[1].id;

  it("requires a retry after a low first answer", () => {
    const state = getInterviewState(plan, [turn({ seq: 1, questionId: first, score: 30, kind: "main" })]);
    expect(state.pending?.attempt).toBe("retry");
    expect(state.pending?.question.id).toBe(first);
    expect(state.pending?.hint).toContain("机制");
  });

  it("moves on after a low retry without asking a follow-up", () => {
    const state = getInterviewState(plan, [
      turn({ seq: 1, questionId: first, score: 30, kind: "main" }),
      turn({ seq: 2, questionId: first, score: 35, kind: "retry", parentId: first }),
    ]);
    expect(state.pending?.question.id).toBe(second);
    expect(state.pending?.attempt).toBe("first");
  });

  it("inserts a follow-up after a strong retry, then continues", () => {
    const afterRetry = getInterviewState(plan, [
      turn({ seq: 1, questionId: first, score: 30, kind: "main" }),
      turn({ seq: 2, questionId: first, score: 85, kind: "retry", parentId: first }),
    ]);
    expect(afterRetry.pending?.attempt).toBe("followup");
    expect(afterRetry.pending?.question.id).toBe(`${first}::followup-0`);

    const afterFollowUp = getInterviewState(plan, [
      turn({ seq: 1, questionId: first, score: 30, kind: "main" }),
      turn({ seq: 2, questionId: first, score: 85, kind: "retry", parentId: first }),
      turn({
        seq: 3,
        questionId: `${first}::followup-0`,
        score: 70,
        kind: "followup",
        parentId: first,
      }),
    ]);
    expect(afterFollowUp.pending?.question.id).toBe(second);
  });

  it("completes after all five main questions", () => {
    const turns = plan.mainQuestions.map((question, index) =>
      turn({ seq: index + 1, questionId: question.id, score: 55, kind: "main" }),
    );
    const state = getInterviewState(plan, turns);
    expect(state.complete).toBe(true);
    expect(state.pending).toBeNull();
    expect(state.answeredCount).toBe(5);

    const summary = buildInterviewSummary({ plan, turns, track, now });
    expect(summary.average).toBe(55);
    expect(summary.answeredCount).toBe(5);
    expect(summary.verdict.length).toBeGreaterThan(10);
    expect(summary.recommendedAtomIds.length).toBeLessThanOrEqual(4);
    expect(summary.gaps.length).toBeGreaterThan(0);
    expect(summary.strengths).toHaveLength(0);
  });

  it("does not invent gaps when every answer is strong, and marks an early end as incomplete", () => {
    const strongTurns = plan.mainQuestions.slice(0, 2).map((question, index) =>
      turn({ seq: index + 1, questionId: question.id, score: 90, kind: "main" }),
    );
    const summary = buildInterviewSummary({ plan, turns: strongTurns, track, now });
    expect(summary.answeredCount).toBe(2);
    expect(summary.gaps).toHaveLength(0);
    expect(summary.recommendedAtomIds).toHaveLength(0);
    expect(summary.verdict).toContain("只完成 2/5");
  });
});
