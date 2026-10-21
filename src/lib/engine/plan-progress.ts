import type { Track } from "@/lib/content/schema";
import type {
  CareerPhase,
  PlanProgress,
  PlanTask,
  PlanTaskView,
  SprintPlan,
} from "@/lib/types";

export type ProgressSets = {
  completedAtoms: Set<string>;
  attemptedChapters: Set<string>;
  passedChallenges: Set<string>;
  interviewCompleted: boolean;
};

function taskHref(task: PlanTask, track: Track, planId: string | null, interviewHref?: string): string {
  switch (task.type) {
    case "atom": {
      const chapter = track.chapters.find((item) => item.atomIds.includes(task.refId));
      return chapter
        ? `/learn/${track.id}/${chapter.id}/${task.refId}`
        : `/learn/${track.id}`;
    }
    case "practice":
      return `/practice/chapter/${task.refId}`;
    case "code":
      return `/practice/code/${task.refId}`;
    case "interview":
      return interviewHref ?? `/interview${planId ? `?planId=${planId}` : ""}`;
  }
}

function taskMeta(task: PlanTask): string {
  switch (task.type) {
    case "atom":
      return `微课 · ${task.minutes} 分钟`;
    case "practice":
      return "章节练习 · 5 题";
    case "code":
      return `代码题 · ${task.minutes} 分钟`;
    case "interview":
      return "模拟面试 · 5 题";
  }
}

export function buildTaskView(
  task: PlanTask,
  track: Track,
  sets: ProgressSets,
  planId: string | null,
  interviewHref?: string,
): PlanTaskView {
  const done =
    task.type === "atom"
      ? sets.completedAtoms.has(task.refId)
      : task.type === "practice"
        ? sets.attemptedChapters.has(task.refId)
        : task.type === "code"
          ? sets.passedChallenges.has(task.refId)
          : sets.interviewCompleted;
  return {
    task,
    done,
    href: taskHref(task, track, planId, interviewHref),
    meta: taskMeta(task),
  };
}

export function buildSprintProgress(
  plan: SprintPlan,
  track: Track,
  sets: ProgressSets,
  planId: string | null,
): PlanProgress {
  const views = new Map<string, PlanTaskView>();
  for (const day of plan.days) {
    for (const task of day.tasks) {
      views.set(task.id, buildTaskView(task, track, sets, planId));
    }
  }
  const tasks = [...views.values()];
  return {
    total: tasks.length,
    done: tasks.filter((item) => item.done).length,
    tasks: views,
  };
}

export function buildPhaseTasks(
  phase: CareerPhase,
  planId: string | null,
  track: Track,
  sets: ProgressSets,
): PlanTaskView[] {
  const tasks: PlanTask[] = [];
  for (const chapterId of phase.chapterIds) {
    const chapter = track.chapters.find((item) => item.id === chapterId);
    if (!chapter) continue;
    for (const atomId of chapter.atomIds) {
      const atom = track.atoms.find((item) => item.id === atomId);
      if (!atom) continue;
      tasks.push({
        id: `career-atom-${phase.id}-${atom.id}`,
        type: "atom",
        refId: atom.id,
        title: atom.title,
        minutes: atom.minutes,
        skills: atom.skills,
      });
    }
    tasks.push({
      id: `career-practice-${phase.id}-${chapter.id}`,
      type: "practice",
      refId: chapter.id,
      title: `${chapter.title} · 章节练习`,
      minutes: 15,
      skills: [],
    });
  }
  for (const challengeId of phase.challengeIds) {
    const challenge = track.codeChallenges.find((item) => item.id === challengeId);
    if (!challenge) continue;
    tasks.push({
      id: `career-code-${phase.id}-${challengeId}`,
      type: "code",
      refId: challengeId,
      title: challenge.title,
      minutes: 20,
      skills: challenge.skills,
    });
  }
  tasks.push({
    id: `career-interview-${phase.id}`,
    type: "interview",
    refId: "interview",
    title: phase.id === "phase-sprint" ? "完成模拟面试并复盘" : "阶段模拟面试",
    minutes: 30,
    skills: phase.interviewFocus,
  });
  return tasks.map((task) =>
    buildTaskView(
      task,
      track,
      sets,
      planId,
      task.type === "interview"
        ? `/interview?trackId=${track.id}&level=${phase.level}`
        : undefined,
    ),
  );
}
