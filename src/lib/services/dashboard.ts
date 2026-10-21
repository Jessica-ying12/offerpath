import { getDb, type Db } from "@/lib/db/client";
import { listActivities, listActivityDays } from "@/lib/db/activities";
import {
  countCompletedAtoms,
  countOpenMistakes,
  getChapterCompletion,
  getCompletedAtomIds,
  getLastCompletedAtom,
  getQuizStats,
} from "@/lib/db/learning";
import { listPlans } from "@/lib/db/plans";
import { listInterviewSessions } from "@/lib/db/interviews";
import { getProfile } from "@/lib/db/users";
import { getTracks, requireTrack } from "@/lib/content";
import type { LevelId } from "@/lib/content/schema";
import type { OverviewStats, User } from "@/lib/types";
import { percent } from "@/lib/utils";
import {
  getInterviewList,
  getInterviewCount,
} from "./interviews";
import {
  getSprintPlanView,
  getCareerPlanView,
  listPlanCards,
} from "./plans";
import { getReviewPageData, getTrackPageData } from "./learning";
import { getMasteryOverview, getMasteryProgressSummary } from "./mastery";

function computeStreak(days: string[], now = new Date()): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const today = new Date(now);
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  let cursor = set.has(todayKey) ? today : set.has(yesterdayKey) ? yesterday : null;
  if (!cursor) return 0;
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

function baseStats(userId: string, db: Db): OverviewStats {
  const quiz = getQuizStats(db, userId);
  return {
    lessonsCompleted: countCompletedAtoms(db, userId),
    quizAttempts: quiz.attempts,
    accuracy: quiz.total > 0 ? Math.round((quiz.correct / quiz.total) * 100) : 0,
    openMistakes: countOpenMistakes(db, userId),
    interviewsCompleted: getInterviewCount(userId, db),
    streakDays: computeStreak(listActivityDays(db, userId)),
  };
}

export function getDashboardData(user: User, db: Db = getDb()) {
  const profile = getProfile(db, user.id);
  const trackId = profile?.trackId ?? "fullstack";
  const track = requireTrack(trackId);
  const level: LevelId = profile?.level ?? "junior";
  const completed = getCompletedAtomIds(db, user.id, track.id);
  const chapterCompletion = getChapterCompletion(db, user.id, track.id);
  const stats = baseStats(user.id, db);
  const mastery = getMasteryOverview(user.id, db);
  const review = getReviewPageData(user.id, db);
  const recentActivities = listActivities(db, user.id, 8);
  const interviews = getInterviewList(user.id, db).slice(0, 3);
  const sprint = listPlans(db, user.id, "sprint", 1)[0];
  const career = listPlans(db, user.id, "career", 1)[0];
  const sprintView = sprint ? getSprintPlanView(user.id, sprint.id, db) : null;
  const careerView = career ? getCareerPlanView(user.id, career.id, db) : null;

  const trackPage = getTrackPageData(user.id, track.id, level, db);
  const continueHref = trackPage.nextHref ?? `/learn/${track.id}`;

  const todayFocus: Array<{
    title: string;
    subtitle: string;
    href: string;
    minutes?: number;
  }> = [];
  if (mastery.due > 0) {
    todayFocus.push({
      title: "完成到期复习",
      subtitle: `${mastery.due} 个章节等待间隔复习`,
      href: "/review",
      minutes: 12,
    });
  }
  if (sprintView) {
    for (const task of sprintView.progress.tasks.values()) {
      if (task.done) continue;
      if (todayFocus.length >= 3) break;
      todayFocus.push({
        title: task.task.title,
        subtitle: `${sprintView.title} · ${task.meta}`,
        href: task.href,
        minutes: task.task.minutes,
      });
    }
  }
  if (todayFocus.length === 0) {
    todayFocus.push({
      title: "继续系统学习",
      subtitle: `${track.shortName} · ${level} 路径`,
      href: continueHref,
    });
    todayFocus.push({
      title: "复习错题",
      subtitle: stats.openMistakes > 0 ? `${stats.openMistakes} 道待解决` : "保持正确率",
      href: "/practice/review",
    });
    todayFocus.push({
      title: "来一场模拟面试",
      subtitle: "项目深挖 + 知识追问",
      href: "/interview",
    });
  }

  const lastCompleted = getLastCompletedAtom(db, user.id, track.id);
  const lastChapter = lastCompleted
    ? track.chapters.find((chapter) => chapter.id === lastCompleted.chapterId) ?? null
    : null;

  return {
    profile,
    track,
    level,
    stats,
    mastery,
    review,
    recentActivities,
    interviews,
    sprintView,
    careerView,
    continueHref,
    todayFocus,
    lastChapter,
    completedAtoms: completed.size,
    chapterCompletion,
    totalAtoms: track.atoms.length,
    progressPercent: percent(completed.size, track.atoms.length),
  };
}

export function getRecordsData(user: User, db: Db = getDb()) {
  const activities = listActivities(db, user.id, 150);
  const stats = baseStats(user.id, db);
  const mastery = getMasteryOverview(user.id, db);
  const review = getReviewPageData(user.id, db);
  const interviews = getInterviewList(user.id, db);
  const sprintCards = listPlanCards(user.id, "sprint", db);
  const careerCards = listPlanCards(user.id, "career", db);
  return {
    activities,
    stats,
    review,
    interviews,
    plans: [...sprintCards, ...careerCards],
  };
}

export function getLearnHubData(user: User, db: Db = getDb()) {
  const profile = getProfile(db, user.id);
  const tracks = getTracks().map((track) => {
    const completed = getCompletedAtomIds(db, user.id, track.id).size;
    return {
      track,
      completed,
      total: track.atoms.length,
      percent: percent(completed, track.atoms.length),
    };
  });
  const last = profile ? getLastCompletedAtom(db, user.id, profile.trackId) : null;
  return { profile, tracks, last };
}
