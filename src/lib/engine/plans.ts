import type { Chapter, LevelId, Track } from "@/lib/content/schema";
import { LEVEL_LABEL, LEVELS } from "@/lib/content/schema";
import type {
  CareerPhase,
  CareerPlan,
  CareerSkillCoverage,
  PlanDay,
  PlanTask,
  SprintPlan,
} from "@/lib/types";
import { analyseProfile } from "./profile";

export type SprintInput = {
  track: Track;
  level: LevelId;
  urgencyDays: 3 | 7 | 14;
  company: string;
  resumeText: string;
  jdText: string;
  now: string;
};

export type CareerInput = {
  track: Track;
  level: LevelId;
  horizonWeeks: 4 | 8 | 12;
  company: string;
  resumeText: string;
  jdText: string;
  now: string;
};

const CHAPTERS_BY_URGENCY: Record<SprintInput["urgencyDays"], number> = {
  3: 3,
  7: 4,
  14: 6,
};

const CODE_TASKS_BY_URGENCY: Record<SprintInput["urgencyDays"], number> = {
  3: 1,
  7: 2,
  14: 3,
};

function skillNames(track: Track, ids: string[]): string[] {
  return ids.map((id) => track.skills.find((skill) => skill.id === id)?.name ?? id);
}

function chapterSkillIds(track: Track, chapter: Chapter): string[] {
  const ids = new Set<string>();
  for (const atomId of chapter.atomIds) {
    const atom = track.atoms.find((item) => item.id === atomId);
    atom?.skills.forEach((skill) => ids.add(skill));
  }
  return [...ids];
}

function chapterScore(
  track: Track,
  chapter: Chapter,
  gapSkills: string[],
  requiredSkills: string[],
  targetLevel: LevelId,
): number {
  const skills = chapterSkillIds(track, chapter);
  const targetRank = LEVELS.indexOf(targetLevel);
  const rank = LEVELS.indexOf(chapter.level);
  let score = 0;
  score += skills.filter((skill) => gapSkills.includes(skill)).length * 100;
  score += skills.filter((skill) => requiredSkills.includes(skill)).length * 25;
  score += rank === targetRank ? 40 : Math.max(0, 32 - (targetRank - rank) * 16);
  score -= Math.max(0, rank - targetRank) * 200;
  return score;
}

function atomTask(track: Track, atomId: string): PlanTask | null {
  const atom = track.atoms.find((item) => item.id === atomId);
  if (!atom) return null;
  return {
    id: `atom-${atom.id}`,
    type: "atom",
    refId: atom.id,
    title: atom.title,
    minutes: atom.minutes,
    skills: atom.skills,
  };
}

function distributeTasks(
  tasks: PlanTask[],
  days: number,
  level: LevelId,
  track: Track,
): PlanDay[] {
  const perDay = Math.max(1, Math.ceil(tasks.length / days));
  const result: PlanDay[] = [];
  let cursor = 0;
  for (let index = 0; index < days; index += 1) {
    const dayTasks = tasks.slice(cursor, cursor + perDay);
    cursor += perDay;
    const first = dayTasks[0];
    const focusSkills = first ? skillNames(track, first.skills) : [];
    result.push({
      day: index + 1,
      label: `DAY ${String(index + 1).padStart(2, "0")}`,
      focus:
        focusSkills.length > 0
          ? `${focusSkills.slice(0, 2).join(" / ")}`
          : `${LEVEL_LABEL[level]}复盘与模拟`,
      tasks: dayTasks,
    });
  }
  if (cursor < tasks.length) {
    result[result.length - 1].tasks.push(...tasks.slice(cursor));
  }
  return result.filter((day) => day.tasks.length > 0);
}

export function buildSprintPlan(input: SprintInput): SprintPlan {
  const { track, level, urgencyDays, company, resumeText, jdText, now } = input;
  const analysis = analyseProfile({ track, level, resumeText, jdText });
  const chapterCount = CHAPTERS_BY_URGENCY[urgencyDays];
  const targetRank = LEVELS.indexOf(level);
  const candidates = track.chapters
    .filter((chapter) => LEVELS.indexOf(chapter.level) <= targetRank)
    .map((chapter) => ({
      chapter,
      score: chapterScore(track, chapter, analysis.gapSkills, analysis.requiredSkills, level),
    }))
    .sort((a, b) => b.score - a.score || a.chapter.level.localeCompare(b.chapter.level) || a.chapter.order - b.chapter.order)
    .slice(0, chapterCount)
    .map((item) => item.chapter);

  const challengeCount = CODE_TASKS_BY_URGENCY[urgencyDays];
  const challengeChapterIds = candidates.slice(0, challengeCount).map((chapter) => chapter.id);
  const tasks: PlanTask[] = [];
  for (const chapter of candidates) {
    const chapterAtoms = chapter.atomIds
      .map((atomId) => atomTask(track, atomId))
      .filter((task): task is PlanTask => task !== null);
    tasks.push(...chapterAtoms);
    tasks.push({
      id: `practice-${chapter.id}`,
      type: "practice",
      refId: chapter.id,
      title: `${chapter.title} · 章节练习`,
      minutes: 15,
      skills: chapterSkillIds(track, chapter),
    });
    if (challengeChapterIds.includes(chapter.id)) {
      const challenge = track.codeChallenges.find((item) => item.chapterId === chapter.id);
      if (challenge) {
        tasks.push({
          id: `code-${challenge.id}`,
          type: "code",
          refId: challenge.id,
          title: `${challenge.title} · 代码题`,
          minutes: 20,
          skills: challenge.skills,
        });
      }
    }
  }
  tasks.push({
    id: "interview-sprint",
    type: "interview",
    refId: "interview",
    title: "完成一次模拟面试并复盘",
    minutes: 30,
    skills: analysis.gapSkills.slice(0, 3),
  });

  const days = distributeTasks(tasks, urgencyDays, level, track);
  const companyLabel = company.trim();
  return {
    version: 1,
    kind: "sprint",
    trackId: track.id,
    level,
    title: `${companyLabel ? `${companyLabel} · ` : ""}${track.shortName} ${LEVEL_LABEL[level]}急冲计划`,
    company: companyLabel,
    createdAt: now,
    days,
    analysis,
    selectedAtomIds: candidates.flatMap((chapter) => chapter.atomIds),
    chapterIds: candidates.map((chapter) => chapter.id),
    challengeIds: track.codeChallenges
      .filter((challenge) => challengeChapterIds.includes(challenge.chapterId))
      .map((challenge) => challenge.id),
    interview: {
      mode: jdText.trim() ? "jd" : resumeText.trim() ? "resume" : "position",
      focusSkills: analysis.gapSkills.length ? analysis.gapSkills : analysis.requiredSkills,
      resumeText,
      jdText,
    },
  };
}

function allocateWeeks(horizonWeeks: number, contentPhaseCount: number): number[] {
  if (contentPhaseCount === 0) return [];
  const contentWeeks = Math.max(
    contentPhaseCount,
    Math.floor(horizonWeeks * 0.75),
  );
  const base = Math.max(1, Math.floor(contentWeeks / contentPhaseCount));
  const weeks = Array.from({ length: contentPhaseCount }, () => base);
  let used = base * contentPhaseCount;
  let cursor = 0;
  while (used < contentWeeks) {
    weeks[cursor % contentPhaseCount] += 1;
    used += 1;
    cursor += 1;
  }
  return weeks;
}

export function buildCareerPlan(input: CareerInput): CareerPlan {
  const { track, level, horizonWeeks, company, resumeText, jdText, now } = input;
  const analysis = analyseProfile({ track, level, resumeText, jdText });
  const targetRank = LEVELS.indexOf(level);
  const phaseLevels = LEVELS.slice(0, targetRank + 1);
  const weeks = allocateWeeks(horizonWeeks, phaseLevels.length);

  const phases: CareerPhase[] = phaseLevels.map((phaseLevel, index) => {
    const chapters = track.chapters.filter((chapter) => chapter.level === phaseLevel);
    const phaseSkills = [...new Set(chapters.flatMap((chapter) => chapterSkillIds(track, chapter)))];
    const gapNames = skillNames(
      track,
      phaseSkills.filter((skill) => analysis.gapSkills.includes(skill)),
    );
    const objective =
      phaseLevel === level
        ? `对齐${LEVEL_LABEL[level]}岗位核心能力：${skillNames(track, phaseSkills).slice(0, 4).join("、")}。`
        : `补齐${LEVEL_LABEL[phaseLevel]}基础，避免在${LEVEL_LABEL[level]}问题里露怯。${gapNames.length ? ` 重点：${gapNames.slice(0, 3).join("、")}。` : ""}`;
    return {
      id: `phase-${phaseLevel}`,
      title: `${LEVEL_LABEL[phaseLevel]} · ${phaseLevel === level ? "目标能力" : "能力地基"}`,
      weeks: weeks[index] ?? 1,
      objective,
      level: phaseLevel,
      atomIds: chapters.flatMap((chapter) => chapter.atomIds),
      chapterIds: chapters.map((chapter) => chapter.id),
      challengeIds: track.codeChallenges
        .filter((challenge) => chapters.some((chapter) => chapter.id === challenge.chapterId))
        .map((challenge) => challenge.id),
      interviewFocus: gapNames.slice(0, 4),
      checkpoint: `完成 9 节微课与 3 次章节练习，章节正确率 ≥ 60%${
        phaseLevel === level ? "，并完成一次同等级模拟面试" : ""
      }。`,
    };
  });

  const contentWeeks = phases.reduce((sum, phase) => sum + phase.weeks, 0);
  const sprintWeeks = Math.max(1, horizonWeeks - contentWeeks);
  phases.push({
    id: "phase-sprint",
    title: "面试冲刺 · 把会做的讲清楚",
    weeks: sprintWeeks,
    objective:
      analysis.gapSkills.length > 0
        ? `围绕缺口技能做表达训练：${skillNames(track, analysis.gapSkills).slice(0, 4).join("、")}。`
        : "围绕简历项目做深挖训练，补足指标、取舍与追问。",
    level,
    atomIds: [],
    chapterIds: [],
    challengeIds: [],
    interviewFocus: analysis.gapSkills.length > 0 ? analysis.gapSkills : analysis.requiredSkills,
    checkpoint: "完成 2 次模拟面试，平均分 ≥ 60，并把遗漏要点补进笔记。",
  });

  const phaseSkillMap = new Map<string, string[]>();
  for (const phase of phases) {
    const skills = new Set<string>();
    for (const atomId of phase.atomIds) {
      const atom = track.atoms.find((item) => item.id === atomId);
      atom?.skills.forEach((skill) => skills.add(skill));
    }
    if (phase.id === "phase-sprint") {
      phase.interviewFocus.forEach((skill) => skills.add(skill));
    }
    for (const skill of skills) {
      const list = phaseSkillMap.get(skill) ?? [];
      list.push(phase.id);
      phaseSkillMap.set(skill, list);
    }
  }

  const skillCoverage: CareerSkillCoverage[] = analysis.requiredSkills.map((skillId) => ({
    skillId,
    name: track.skills.find((skill) => skill.id === skillId)?.name ?? skillId,
    covered: analysis.matchedSkills.includes(skillId),
    phaseIds: phaseSkillMap.get(skillId) ?? [],
  }));

  const companyLabel = company.trim();
  return {
    version: 1,
    kind: "career",
    trackId: track.id,
    level,
    title: `${companyLabel ? `${companyLabel} · ` : ""}${track.shortName} ${LEVEL_LABEL[level]} · ${horizonWeeks} 周路线`,
    horizonWeeks,
    createdAt: now,
    analysis,
    phases,
    skillCoverage,
  };
}
