import type { QaProgress } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

export function nextQaProgress(current: QaProgress, good: boolean, now = new Date()): QaProgress {
  if (current.status === "new") {
    return {
      reviewCount: 0,
      nextReviewAt: addDays(now, 1),
      lastReviewedAt: now.toISOString(),
      status: "learning",
    };
  }
  if (!good) {
    return {
      reviewCount: 0,
      nextReviewAt: addDays(now, 1),
      lastReviewedAt: now.toISOString(),
      status: "learning",
    };
  }
  const reviewCount = current.reviewCount + 1;
  if (reviewCount >= 3) {
    return {
      reviewCount: 3,
      nextReviewAt: null,
      lastReviewedAt: now.toISOString(),
      status: "mastered",
    };
  }
  return {
    reviewCount,
    nextReviewAt: addDays(now, reviewCount === 1 ? 3 : 7),
    lastReviewedAt: now.toISOString(),
    status: "learning",
  };
}

export function initialQaProgress(): QaProgress {
  return {
    reviewCount: 0,
    nextReviewAt: null,
    lastReviewedAt: null,
    status: "new",
  };
}

export function isDue(progress: QaProgress | undefined, now = new Date()): boolean {
  if (!progress) return false;
  if (progress.status === "mastered") return false;
  if (!progress.nextReviewAt) return true;
  return progress.nextReviewAt <= now.toISOString();
}

export function formatDate(iso: string | null): string {
  if (!iso) return "已完成";
  const date = new Date(iso);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function relativeDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((target.getTime() - start.getTime()) / DAY_MS);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  if (diff > 1) return `${diff} 天后`;
  return `${Math.abs(diff)} 天前`;
}
