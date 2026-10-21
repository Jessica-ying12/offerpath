import { randomUUID } from "node:crypto";
import { getDb, type Db } from "@/lib/db/client";
import { createPlan, getPlan, listPlans } from "@/lib/db/plans";
import {
  getAttemptedChapterIds,
  getCompletedAtomIds,
  getPassedChallengeIds,
} from "@/lib/db/learning";
import { hasCompletedInterviewSince } from "@/lib/db/interviews";
import { logActivity } from "@/lib/db/activities";
import { getProfile } from "@/lib/db/users";
import { getChapterAtoms, requireTrack } from "@/lib/content";
import type { LevelId, TrackId } from "@/lib/content/schema";
import { AppError } from "@/lib/errors";
import { buildCareerPlan, buildSprintPlan } from "@/lib/engine/plans";
import {
  buildPhaseTasks,
  buildSprintProgress,
  type ProgressSets,
} from "@/lib/engine/plan-progress";
import type {
  CareerPlan,
  PlanProgress,
  PlanTaskView,
  SprintPlan,
} from "@/lib/types";
import { MAX_JD_LENGTH, MAX_RESUME_LENGTH } from "@/lib/constants";

export type SprintInput = {
  trackId: TrackId;
  level: LevelId;
  urgencyDays: 3 | 7 | 14;
  company?: string;
  resumeText?: string;
  jdText?: string;
};

export type CareerInput = {
  trackId: TrackId;
  level: LevelId;
  horizonWeeks: 4 | 8 | 12;
  company?: string;
  jdText?: string;
};

function progressSets(
  userId: string,
  trackId: TrackId,
  since: string,
  db: Db,
): ProgressSets {
  return {
    completedAtoms: getCompletedAtomIds(db, userId, trackId),
    attemptedChapters: getAttemptedChapterIds(db, userId, trackId),
    passedChallenges: getPassedChallengeIds(db, userId, trackId),
    interviewCompleted: hasCompletedInterviewSince(db, userId, { trackId, since }),
  };
}

export function createSprintPlanForUser(
  userId: string,
  input: SprintInput,
  db: Db = getDb(),
): { id: string } {
  const track = requireTrack(input.trackId);
  const profile = getProfile(db, userId);
  const resumeText = (input.resumeText ?? "").trim() || profile?.resumeText || "";
  const jdText = (input.jdText ?? "").trim() || profile?.jdText || "";
  if (resumeText.length > MAX_RESUME_LENGTH || jdText.length > MAX_JD_LENGTH) {
    throw new AppError("简历或 JD 超出长度限制");
  }
  if (resumeText.length < 30 && jdText.length < 30) {
    throw new AppError("请至少填写简历或岗位 JD 中的一项（不少于 30 字），以便生成专属计划");
  }

  const now = new Date().toISOString();
  const plan = buildSprintPlan({
    track,
    level: input.level,
    urgencyDays: input.urgencyDays,
    company: input.company?.trim() ?? "",
    resumeText,
    jdText,
    now,
  });
  const id = randomUUID();
  const run = db.transaction(() => {
    createPlan(db, {
      id,
      userId,
      kind: "sprint",
      trackId: track.id,
      level: input.level,
      title: plan.title,
      input: {
        urgencyDays: input.urgencyDays,
        company: plan.company,
        resumeProvided: resumeText.length > 0,
        jdProvided: jdText.length > 0,
      },
      plan,
      createdAt: now,
    });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "plan_created",
      title: `生成急冲计划：${plan.title}`,
      meta: { href: `/sprint/${id}`, trackId: track.id, kind: "sprint" },
      createdAt: now,
    });
  });
  run();
  return { id };
}

export function createCareerPlanForUser(
  userId: string,
  input: CareerInput,
  db: Db = getDb(),
): { id: string } {
  const track = requireTrack(input.trackId);
  const profile = getProfile(db, userId);
  const resumeText = profile?.resumeText ?? "";
  const jdText = (input.jdText ?? "").trim() || profile?.jdText || "";
  if (jdText.length > MAX_JD_LENGTH) throw new AppError("JD 超出长度限制");

  const now = new Date().toISOString();
  const plan = buildCareerPlan({
    track,
    level: input.level,
    horizonWeeks: input.horizonWeeks,
    company: input.company?.trim() ?? "",
    resumeText,
    jdText,
    now,
  });
  const id = randomUUID();
  const run = db.transaction(() => {
    createPlan(db, {
      id,
      userId,
      kind: "career",
      trackId: track.id,
      level: input.level,
      title: plan.title,
      input: {
        horizonWeeks: input.horizonWeeks,
        company: input.company?.trim() ?? "",
      },
      plan,
      createdAt: now,
    });
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "plan_created",
      title: `生成规划路线：${plan.title}`,
      meta: { href: `/career/${id}`, trackId: track.id, kind: "career" },
      createdAt: now,
    });
  });
  run();
  return { id };
}

export type SprintPlanView = {
  id: string;
  title: string;
  plan: SprintPlan;
  track: ReturnType<typeof requireTrack>;
  progress: PlanProgress;
  days: Array<{
    day: number;
    label: string;
    focus: string;
    tasks: PlanTaskView[];
  }>;
  nextTask: PlanTaskView | null;
  createdAt: string;
};

export function getSprintPlanView(
  userId: string,
  planId: string,
  db: Db = getDb(),
): SprintPlanView {
  const record = getPlan(db, userId, planId);
  if (!record) throw new AppError("计划不存在", 404);
  if (record.kind !== "sprint") throw new AppError("计划类型不匹配", 404);
  const plan = record.plan as SprintPlan;
  const track = requireTrack(record.trackId);
  const sets = progressSets(userId, track.id, record.createdAt, db);
  const progress = buildSprintProgress(plan, track, sets, record.id);
  const days = plan.days.map((day) => ({
    ...day,
    tasks: day.tasks
      .map((task) => progress.tasks.get(task.id))
      .filter((view): view is PlanTaskView => view !== undefined),
  }));
  const nextTask =
    [...progress.tasks.values()].find((view) => !view.done) ?? null;
  return {
    id: record.id,
    title: record.title,
    plan,
    track,
    progress,
    days,
    nextTask,
    createdAt: record.createdAt,
  };
}

export type CareerPlanView = {
  id: string;
  title: string;
  plan: CareerPlan;
  track: ReturnType<typeof requireTrack>;
  phases: Array<{
    id: string;
    title: string;
    weeks: number;
    objective: string;
    checkpoint: string;
    level: LevelId;
    tasks: PlanTaskView[];
    total: number;
    done: number;
    atoms: Array<{
      id: string;
      title: string;
      minutes: number;
      chapterTitle: string;
      href: string;
      completed: boolean;
    }>;
  }>;
  total: number;
  done: number;
  nextTask: PlanTaskView | null;
  createdAt: string;
};

export function getCareerPlanView(
  userId: string,
  planId: string,
  db: Db = getDb(),
): CareerPlanView {
  const record = getPlan(db, userId, planId);
  if (!record) throw new AppError("计划不存在", 404);
  if (record.kind !== "career") throw new AppError("计划类型不匹配", 404);
  const plan = record.plan as CareerPlan;
  const track = requireTrack(record.trackId);
  const sets = progressSets(userId, track.id, record.createdAt, db);
  let total = 0;
  let done = 0;
  const allTasks: PlanTaskView[] = [];
  const phases = plan.phases.map((phase) => {
    const tasks = buildPhaseTasks(phase, record.id, track, sets);
    const phaseDone = tasks.filter((task) => task.done).length;
    total += tasks.length;
    done += phaseDone;
    allTasks.push(...tasks);
    const atoms = phase.chapterIds.flatMap((chapterId) => {
      const chapter = track.chapters.find((item) => item.id === chapterId);
      if (!chapter) return [];
      return getChapterAtoms(track, chapter).map((atom) => ({
        id: atom.id,
        title: atom.title,
        minutes: atom.minutes,
        chapterTitle: chapter.title,
        href: `/learn/${track.id}/${chapter.id}/${atom.id}`,
        completed: sets.completedAtoms.has(atom.id),
      }));
    });
    return {
      ...phase,
      tasks,
      total: tasks.length,
      done: phaseDone,
      atoms,
    };
  });
  return {
    id: record.id,
    title: record.title,
    plan,
    track,
    phases,
    total,
    done,
    nextTask: allTasks.find((task) => !task.done) ?? null,
    createdAt: record.createdAt,
  };
}

export type PlanCard = {
  id: string;
  title: string;
  kind: "sprint" | "career";
  trackName: string;
  level: LevelId;
  createdAt: string;
  total: number;
  done: number;
};

export function listPlanCards(
  userId: string,
  kind: "sprint" | "career",
  db: Db = getDb(),
): PlanCard[] {
  return listPlans(db, userId, kind, 10).map((record) => {
    const track = requireTrack(record.trackId);
    const sets = progressSets(userId, track.id, record.createdAt, db);
    let total = 0;
    let done = 0;
    if (record.plan.kind === "sprint") {
      const progress = buildSprintProgress(record.plan, track, sets, record.id);
      total = progress.total;
      done = progress.done;
    } else {
      for (const phase of record.plan.phases) {
        const tasks = buildPhaseTasks(phase, record.id, track, sets);
        total += tasks.length;
        done += tasks.filter((task) => task.done).length;
      }
    }
    return {
      id: record.id,
      title: record.title,
      kind: record.kind,
      trackName: track.shortName,
      level: record.level,
      createdAt: record.createdAt,
      total,
      done,
    };
  });
}

export function getSprintInterviewPrefill(
  userId: string,
  planId: string,
  db: Db = getDb(),
): {
  trackId: TrackId;
  level: LevelId;
  mode: "resume" | "jd" | "position";
  resumeText: string;
  jdText: string;
  company: string;
} | null {
  const record = getPlan(db, userId, planId);
  if (!record || record.plan.kind !== "sprint") return null;
  const plan = record.plan;
  return {
    trackId: plan.trackId,
    level: plan.level,
    mode: plan.interview.mode,
    resumeText: plan.interview.resumeText,
    jdText: plan.interview.jdText,
    company: plan.company,
  };
}

export function getLatestActivePlan(userId: string, db: Db = getDb()) {
  const sprint = listPlans(db, userId, "sprint", 1)[0];
  const career = listPlans(db, userId, "career", 1)[0];
  return { sprint, career };
}
