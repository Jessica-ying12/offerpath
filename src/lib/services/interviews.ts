import { randomUUID } from "node:crypto";
import { getDb, type Db } from "@/lib/db/client";
import {
  completeInterviewSession,
  countCompletedInterviews,
  createInterviewSession,
  getInterviewSession,
  getInterviewTurns,
  insertInterviewTurn,
  listInterviewSessions,
} from "@/lib/db/interviews";
import { logActivity } from "@/lib/db/activities";
import { getProfile } from "@/lib/db/users";
import { getInterviewBank, requireTrack } from "@/lib/content";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type {
  InterviewFeedback,
  InterviewMode,
  InterviewSummary,
  InterviewTurn,
} from "@/lib/types";
import { AppError } from "@/lib/errors";
import {
  buildInterviewPlan,
  buildInterviewSummary,
  evaluateInterviewAnswer,
  getInterviewState,
} from "@/lib/engine/interview";
import {
  MAX_ANSWER_LENGTH,
  MAX_JD_LENGTH,
  MAX_RESUME_LENGTH,
  MIN_ANSWER_LENGTH,
} from "@/lib/constants";

export type CreateInterviewInput = {
  trackId: TrackId;
  level: LevelId;
  mode: InterviewMode;
  company?: string;
  resumeText?: string;
  jdText?: string;
};

export function createInterviewForUser(
  userId: string,
  input: CreateInterviewInput,
  db: Db = getDb(),
): { id: string } {
  const track = requireTrack(input.trackId);
  const profile = getProfile(db, userId);
  const resumeText = (input.resumeText ?? "").trim() || profile?.resumeText || "";
  const jdText = (input.jdText ?? "").trim() || profile?.jdText || "";
  if (resumeText.length > MAX_RESUME_LENGTH || jdText.length > MAX_JD_LENGTH) {
    throw new AppError("简历或 JD 超出长度限制");
  }
  if (input.mode === "resume" && resumeText.length < 20) {
    throw new AppError("基于简历面试需要先填写简历内容（至少 20 字）");
  }
  if (input.mode === "jd" && jdText.length < 20) {
    throw new AppError("基于 JD 面试需要先填写岗位 JD（至少 20 字）");
  }

  const bank = getInterviewBank(track.id);
  if (!bank) throw new AppError("该课程暂未开放模拟面试，请选择移动端、全栈或 Java 后端", 422);
  const now = new Date().toISOString();
  const plan = buildInterviewPlan({
    track,
    bank,
    level: input.level,
    mode: input.mode,
    resumeText,
    jdText,
    company: input.company?.trim() ?? "",
    seed: Number.parseInt(randomUUID().slice(0, 8), 16),
    now,
  });
  if (plan.mainQuestions.length === 0) {
    throw new AppError("当前条件无法组题，请补充简历或 JD", 422);
  }
  const id = randomUUID();
  const run = db.transaction(() => {
    createInterviewSession(db, {
      id,
      userId,
      trackId: track.id,
      level: input.level,
      mode: input.mode,
      plan,
      createdAt: now,
    });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "interview_started",
      title: `开始模拟面试：${track.shortName} · ${input.level}`,
      meta: { href: `/interview/${id}`, trackId: track.id, mode: input.mode },
      createdAt: now,
    });
  });
  run();
  return { id };
}

export function getInterviewPageData(userId: string, sessionId: string, db: Db = getDb()) {
  const session = getInterviewSession(db, userId, sessionId);
  if (!session) throw new AppError("面试会话不存在", 404);
  const track = requireTrack(session.trackId);
  const turns = getInterviewTurns(db, session.id);
  const state = getInterviewState(session.plan, turns);
  return {
    session,
    track,
    turns,
    state,
    summary: session.summary,
  };
}

export type SubmitTurnResult = {
  feedback: InterviewFeedback;
  completed: boolean;
  summary: InterviewSummary | null;
};

export function submitInterviewTurn(
  userId: string,
  sessionId: string,
  input: { questionId: string; answer: string },
  db: Db = getDb(),
): SubmitTurnResult {
  const session = getInterviewSession(db, userId, sessionId);
  if (!session) throw new AppError("面试会话不存在", 404);
  if (session.status !== "active") throw new AppError("本场面试已结束", 409);
  const answer = input.answer.trim();
  if (answer.length < MIN_ANSWER_LENGTH) {
    throw new AppError(`回答至少 ${MIN_ANSWER_LENGTH} 个字，面试官需要听到你的判断`);
  }
  if (answer.length > MAX_ANSWER_LENGTH) throw new AppError("回答过长，请控制在 5000 字以内");

  const track = requireTrack(session.trackId);
  const turns = getInterviewTurns(db, session.id);
  const state = getInterviewState(session.plan, turns);
  if (!state.pending) {
    const summary = buildInterviewSummary({
      plan: session.plan,
      turns,
      track,
      now: new Date().toISOString(),
    });
    completeInterviewSession(db, {
      userId,
      id: session.id,
      summary,
      endedAt: new Date().toISOString(),
    });
    return { feedback: emptyFeedback(), completed: true, summary };
  }
  if (state.pending.question.id !== input.questionId) {
    throw new AppError("当前问题已变化，请刷新后再作答", 409);
  }

  const feedback = evaluateInterviewAnswer(state.pending.question, answer);
  const now = new Date().toISOString();
  const turnKind: InterviewTurn["kind"] =
    state.pending.attempt === "first" ? "main" : state.pending.attempt;
  const turn: InterviewTurn = {
    id: randomUUID(),
    sessionId: session.id,
    seq: turns.length > 0 ? Math.max(...turns.map((item) => item.seq)) + 1 : 1,
    questionId: state.pending.question.id,
    parentId: state.pending.parentId,
    kind: turnKind,
    questionText: state.pending.question.prompt,
    answer,
    score: feedback.score,
    feedback,
    createdAt: now,
  };
  const nextTurns = [...turns, turn];
  const nextState = getInterviewState(session.plan, nextTurns);
  const summary = nextState.complete
    ? buildInterviewSummary({ plan: session.plan, turns: nextTurns, track, now })
    : null;

  const run = db.transaction(() => {
    insertInterviewTurn(db, {
      id: turn.id,
      sessionId: turn.sessionId,
      seq: turn.seq,
      questionId: turn.questionId,
      parentId: turn.parentId,
      kind: turn.kind,
      questionText: turn.questionText,
      answer: turn.answer,
      score: turn.score,
      feedback: turn.feedback,
      createdAt: turn.createdAt,
    });
    if (summary) {
      completeInterviewSession(db, {
        userId,
        id: session.id,
        summary,
        endedAt: now,
      });
      logActivity(db, {
        id: randomUUID(),
        userId,
        type: "interview_completed",
        title: `完成模拟面试：${session.plan.mainQuestions.length} 题 · 均分 ${summary.average}`,
        meta: {
          href: `/interview/${session.id}`,
          trackId: session.trackId,
          sessionId: session.id,
          average: summary.average,
        },
        createdAt: now,
      });
    }
  });
  run();

  return { feedback, completed: Boolean(summary), summary };
}

export function endInterviewForUser(
  userId: string,
  sessionId: string,
  db: Db = getDb(),
): InterviewSummary {
  const session = getInterviewSession(db, userId, sessionId);
  if (!session) throw new AppError("面试会话不存在", 404);
  if (session.summary) return session.summary;
  const turns = getInterviewTurns(db, session.id);
  if (turns.length === 0) throw new AppError("至少回答一道题后才能结束面试");
  const track = requireTrack(session.trackId);
  const now = new Date().toISOString();
  const summary = buildInterviewSummary({ plan: session.plan, turns, track, now });
  const run = db.transaction(() => {
    completeInterviewSession(db, { userId, id: session.id, summary, endedAt: now });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "interview_completed",
      title: `结束模拟面试：完成 ${summary.answeredCount}/${summary.mainCount} 题`,
      meta: {
        href: `/interview/${session.id}`,
        trackId: session.trackId,
        sessionId: session.id,
        average: summary.average,
      },
      createdAt: now,
    });
  });
  run();
  return summary;
}

export function getInterviewList(userId: string, db: Db = getDb()) {
  return listInterviewSessions(db, userId, 12).map((session) => {
    const track = requireTrack(session.trackId);
    return {
      ...session,
      trackName: track.shortName,
      mainCount: session.plan.mainQuestions.length,
      title: `${track.shortName} · ${session.mode === "resume" ? "简历面" : session.mode === "jd" ? "JD 面" : "岗位面"}`,
    };
  });
}

export function getInterviewCount(userId: string, db: Db = getDb()): number {
  return countCompletedInterviews(db, userId);
}

function emptyFeedback(): InterviewFeedback {
  return {
    score: 0,
    matched: [],
    missing: [],
    hint: "",
    modelAnswer: "",
    advice: "",
    skills: [],
  };
}
