import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_QA, DOCS, QA_MAP } from "./content";
import { initialQaProgress, isDue, nextQaProgress } from "./srs";
import type {
  ActivityItem,
  AppState,
  DocProgress,
  LearningGoal,
  LocalProfile,
  PlanCustomTask,
  QaProgress,
  QuizAttempt,
  RoleId,
} from "./types";

const STORAGE_KEY = "offerpath-deep-v1";
const PROFILE_STORE_KEY = "offerpath-profiles-v1";
const PROFILE_STATE_PREFIX = "offerpath-deep-v1:";

const DEFAULT_STATE: AppState = {
  version: 1,
  theme: "light",
  fontSize: 17.5,
  lineHeight: 1.9,
  role: "mobile",
  jd: "",
  docs: {},
  qa: {},
  checklists: {},
  notes: {},
  quizAttempts: [],
  quizMistakes: {},
  activity: [],
  plan: null,
};

function normalizeState(parsed: Partial<AppState>): AppState {
  return {
    ...DEFAULT_STATE,
    ...parsed,
    docs: parsed.docs ?? {},
    qa: parsed.qa ?? {},
    checklists: parsed.checklists ?? {},
    notes: parsed.notes ?? {},
    quizAttempts: parsed.quizAttempts ?? [],
    quizMistakes: parsed.quizMistakes ?? {},
    activity: parsed.activity ?? [],
  };
}

function profileStateKey(profileId: string): string {
  return `${PROFILE_STATE_PREFIX}${profileId}`;
}

function loadStateFor(profileId: string): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw =
      window.localStorage.getItem(profileStateKey(profileId)) ??
      (profileId === "default" ? window.localStorage.getItem(STORAGE_KEY) : null);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== 1) return DEFAULT_STATE;
    return normalizeState(parsed);
  } catch {
    return DEFAULT_STATE;
  }
}

function createProfileId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadProfiles(): { profiles: LocalProfile[]; activeId: string } {
  if (typeof window === "undefined") {
    return {
      profiles: [{ id: "default", name: "学习者", createdAt: new Date().toISOString() }],
      activeId: "default",
    };
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { profiles?: LocalProfile[]; activeId?: string };
      const profiles = (parsed.profiles ?? []).filter((profile) => profile.id && profile.name);
      if (profiles.length > 0) {
        const activeId = profiles.some((profile) => profile.id === parsed.activeId)
          ? parsed.activeId!
          : profiles[0].id;
        return { profiles, activeId };
      }
    }
  } catch {
    // Fall through to legacy migration.
  }
  const legacy = window.localStorage.getItem(STORAGE_KEY);
  const profile: LocalProfile = {
    id: "default",
    name: "学习者",
    createdAt: new Date().toISOString(),
  };
  if (legacy) window.localStorage.setItem(profileStateKey(profile.id), legacy);
  const result = { profiles: [profile], activeId: profile.id };
  window.localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(result));
  return result;
}

function activityId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pushActivity(
  activity: ActivityItem[],
  item: Omit<ActivityItem, "id" | "at">,
): ActivityItem[] {
  return [
    { ...item, id: activityId(), at: new Date().toISOString() },
    ...activity,
  ].slice(0, 120);
}

type Store = {
  state: AppState;
  dueQa: number;
  masteredQa: number;
  completedDocs: number;
  streak: number;
  profiles: LocalProfile[];
  activeProfile: LocalProfile;
  setTheme: (theme: "light" | "dark") => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setRole: (role: RoleId) => void;
  setJd: (jd: string) => void;
  switchProfile: (profileId: string) => void;
  createProfile: (name: string) => void;
  renameProfile: (profileId: string, name: string) => void;
  deleteProfile: (profileId: string) => void;
  updateDocProgress: (docId: string, percent: number, heading: string | null) => void;
  markDocComplete: (docId: string) => void;
  toggleChecklist: (key: string, checked: boolean) => void;
  saveNote: (docId: string, note: string) => void;
  reviewQa: (qaId: string, good: boolean) => QaProgress;
  savePlan: (goal: Omit<LearningGoal, "createdAt" | "updatedAt">, resetProgress?: boolean) => void;
  togglePlanTask: (taskId: string) => void;
  excludePlanTask: (taskId: string) => void;
  addCustomPlanTask: (dayIndex: number, title: string, module?: string) => void;
  removeCustomPlanTask: (taskId: string) => void;
  clearPlan: () => void;
  recordQuiz: (
    attempt: Omit<QuizAttempt, "id" | "at">,
    wrongIds: string[],
    correctIds: string[],
  ) => void;
  exportState: () => string;
  importState: (json: string) => void;
  resetState: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => {
    const profileStore = loadProfiles();
    return { ...profileStore, state: loadStateFor(profileStore.activeId) };
  }, []);
  const [profiles, setProfiles] = useState<LocalProfile[]>(initial.profiles);
  const [activeProfileId, setActiveProfileId] = useState(initial.activeId);
  const [state, setState] = useState<AppState>(initial.state);

  useEffect(() => {
    window.localStorage.setItem(profileStateKey(activeProfileId), JSON.stringify(state));
  }, [state, activeProfileId]);

  useEffect(() => {
    window.localStorage.setItem(
      PROFILE_STORE_KEY,
      JSON.stringify({ profiles, activeId: activeProfileId }),
    );
  }, [profiles, activeProfileId]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
    document.documentElement.style.setProperty("--reading-size", `${state.fontSize}px`);
    document.documentElement.style.setProperty("--reading-leading", String(state.lineHeight));
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", state.theme === "dark" ? "#111512" : "#f6f3ea");
  }, [state.theme, state.fontSize, state.lineHeight]);

  const setTheme = useCallback((theme: "light" | "dark") => {
    setState((current) => ({ ...current, theme }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setState((current) => ({ ...current, fontSize: Math.min(22, Math.max(15, fontSize)) }));
  }, []);

  const setLineHeight = useCallback((lineHeight: number) => {
    setState((current) => ({ ...current, lineHeight: Math.min(2.2, Math.max(1.5, lineHeight)) }));
  }, []);

  const setRole = useCallback((role: RoleId) => {
    setState((current) => ({ ...current, role }));
  }, []);

  const setJd = useCallback((jd: string) => {
    setState((current) => ({ ...current, jd }));
  }, []);

  const switchProfile = useCallback(
    (profileId: string) => {
      if (profileId === activeProfileId) return;
      if (!profiles.some((profile) => profile.id === profileId)) return;
      setState(loadStateFor(profileId));
      setActiveProfileId(profileId);
    },
    [activeProfileId, profiles],
  );

  const createProfile = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) return;
    const profile: LocalProfile = {
      id: createProfileId(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    setProfiles((current) => [...current, profile]);
    setState(DEFAULT_STATE);
    setActiveProfileId(profile.id);
  }, []);

  const renameProfile = useCallback((profileId: string, name: string) => {
    const trimmed = name.trim().slice(0, 24);
    if (!trimmed) return;
    setProfiles((current) =>
      current.map((profile) => (profile.id === profileId ? { ...profile, name: trimmed } : profile)),
    );
  }, []);

  const deleteProfile = useCallback(
    (profileId: string) => {
      if (profiles.length <= 1) return;
      const remaining = profiles.filter((profile) => profile.id !== profileId);
      if (remaining.length === 0) return;
      window.localStorage.removeItem(profileStateKey(profileId));
      setProfiles(remaining);
      if (profileId === activeProfileId) {
        const next = remaining[0];
        setState(loadStateFor(next.id));
        setActiveProfileId(next.id);
      }
    },
    [activeProfileId, profiles],
  );

  const updateDocProgress = useCallback((docId: string, percent: number, heading: string | null) => {
    setState((current) => {
      const previous = current.docs[docId];
      const next: DocProgress = {
        completed: previous?.completed ?? false,
        completedAt: previous?.completedAt ?? null,
        percent: Math.max(previous?.percent ?? 0, Math.round(percent)),
        lastHeading: heading ?? previous?.lastHeading ?? null,
        lastReadAt: new Date().toISOString(),
      };
      if (
        previous &&
        previous.percent === next.percent &&
        previous.lastHeading === next.lastHeading &&
        Date.now() - new Date(previous.lastReadAt ?? 0).getTime() < 15_000
      ) {
        return current;
      }
      return { ...current, docs: { ...current.docs, [docId]: next } };
    });
  }, []);

  const markDocComplete = useCallback((docId: string) => {
    setState((current) => {
      const doc = DOCS.find((item) => item.id === docId);
      const previous = current.docs[docId];
      const now = new Date().toISOString();
      return {
        ...current,
        docs: {
          ...current.docs,
          [docId]: {
            completed: true,
            completedAt: previous?.completedAt ?? now,
            percent: 100,
            lastHeading: previous?.lastHeading ?? null,
            lastReadAt: now,
          },
        },
        activity: pushActivity(current.activity, {
          type: "complete",
          label: `完成精读 · ${doc?.title ?? docId}`,
          href: `/doc/${docId}`,
        }),
      };
    });
  }, []);

  const toggleChecklist = useCallback((key: string, checked: boolean) => {
    setState((current) => ({
      ...current,
      checklists: { ...current.checklists, [key]: checked },
    }));
  }, []);

  const saveNote = useCallback((docId: string, note: string) => {
    setState((current) => ({
      ...current,
      notes: { ...current.notes, [docId]: note },
      activity: note.trim()
        ? pushActivity(current.activity, {
            type: "note",
            label: `更新笔记 · ${DOCS.find((doc) => doc.id === docId)?.title ?? docId}`,
            href: `/doc/${docId}`,
          })
        : current.activity,
    }));
  }, []);

  const reviewQa = useCallback(
    (qaId: string, good: boolean) => {
      const current = state.qa[qaId] ?? initialQaProgress();
      const next = nextQaProgress(current, good);
      setState((previous) => {
        const item = ALL_QA.find((question) => question.id === qaId);
        return {
          ...previous,
          qa: { ...previous.qa, [qaId]: next },
          activity: pushActivity(previous.activity, {
            type: "qa",
            label: `${good ? "答上来" : "需再练"} · ${item?.bankTitle ?? qaId} Q${item?.number ?? ""}`,
            href: `/qa/${item?.docId ?? ""}`,
          }),
        };
      });
      return next;
    },
    [state.qa],
  );

  const savePlan = useCallback(
    (goal: Omit<LearningGoal, "createdAt" | "updatedAt">, resetProgress = true) => {
      const now = new Date().toISOString();
      setState((current) => ({
        ...current,
        plan: {
          goal: {
            ...goal,
            createdAt: current.plan?.goal.createdAt ?? now,
            updatedAt: now,
          },
          progress:
            !resetProgress && current.plan
              ? current.plan.progress
              : { completedTaskIds: [], excludedTaskIds: [], customTasks: [] },
        },
      }));
    },
    [],
  );

  const togglePlanTask = useCallback((taskId: string) => {
    setState((current) => {
      if (!current.plan) return current;
      const completed = current.plan.progress.completedTaskIds;
      const has = completed.includes(taskId);
      return {
        ...current,
        plan: {
          ...current.plan,
          progress: {
            ...current.plan.progress,
            completedTaskIds: has
              ? completed.filter((id) => id !== taskId)
              : [...completed, taskId],
          },
        },
      };
    });
  }, []);

  const excludePlanTask = useCallback((taskId: string) => {
    setState((current) => {
      if (!current.plan) return current;
      const progress = current.plan.progress;
      return {
        ...current,
        plan: {
          ...current.plan,
          progress: {
            ...progress,
            excludedTaskIds: [...new Set([...progress.excludedTaskIds, taskId])],
            completedTaskIds: progress.completedTaskIds.filter((id) => id !== taskId),
            customTasks: progress.customTasks.filter((task) => task.id !== taskId),
          },
        },
      };
    });
  }, []);

  const addCustomPlanTask = useCallback((dayIndex: number, title: string, module?: string) => {
    const clean = title.trim().slice(0, 80);
    if (!clean) return;
    setState((current) => {
      if (!current.plan) return current;
      const task: PlanCustomTask = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dayIndex: Math.max(0, Math.floor(dayIndex)),
        title: clean,
        module,
        createdAt: new Date().toISOString(),
      };
      return {
        ...current,
        plan: {
          ...current.plan,
          progress: {
            ...current.plan.progress,
            customTasks: [...current.plan.progress.customTasks, task],
          },
        },
      };
    });
  }, []);

  const removeCustomPlanTask = useCallback((taskId: string) => {
    setState((current) => {
      if (!current.plan) return current;
      return {
        ...current,
        plan: {
          ...current.plan,
          progress: {
            ...current.plan.progress,
            customTasks: current.plan.progress.customTasks.filter((task) => task.id !== taskId),
            completedTaskIds: current.plan.progress.completedTaskIds.filter((id) => id !== taskId),
          },
        },
      };
    });
  }, []);

  const clearPlan = useCallback(() => {
    setState((current) => ({ ...current, plan: null }));
  }, []);

  const recordQuiz = useCallback(
    (attempt: Omit<QuizAttempt, "id" | "at">, wrongIds: string[], correctIds: string[]) => {
      setState((current) => {
        const mistakes = { ...current.quizMistakes };
        for (const id of wrongIds) {
          const previous = mistakes[id];
          mistakes[id] = {
            wrongCount: (previous?.wrongCount ?? 0) + 1,
            lastWrongAt: new Date().toISOString(),
          };
        }
        for (const id of correctIds) delete mistakes[id];
        return {
          ...current,
          quizAttempts: [
            { ...attempt, id: activityId(), at: new Date().toISOString() },
            ...current.quizAttempts,
          ].slice(0, 60),
          quizMistakes: mistakes,
          activity: pushActivity(current.activity, {
            type: "quiz",
            label: `题库练习 ${attempt.score}/${attempt.total} · ${attempt.courseName}`,
            href: "/quiz",
          }),
        };
      });
    },
    [],
  );

  const exportState = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importState = useCallback((json: string) => {
    const parsed = JSON.parse(json) as Partial<AppState>;
    if (parsed.version !== 1) throw new Error("备份版本不兼容");
    setState(normalizeState(parsed));
  }, []);

  const resetState = useCallback(() => {
    window.localStorage.removeItem(profileStateKey(activeProfileId));
    setState(DEFAULT_STATE);
  }, [activeProfileId]);

  const derived = useMemo(() => {
    let dueQa = 0;
    let masteredQa = 0;
    for (const question of ALL_QA) {
      const progress = state.qa[question.id];
      if (progress?.status === "mastered") masteredQa += 1;
      else if (isDue(progress)) dueQa += 1;
    }
    const completedDocs = DOCS.filter((doc) => state.docs[doc.id]?.completed).length;
    const activeDays = new Set(
      state.activity.map((item) => new Date(item.at).toISOString().slice(0, 10)),
    );
    let streak = 0;
    const cursor = new Date();
    for (let index = 0; index < 365; index += 1) {
      const key = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate() - index,
      )
        .toISOString()
        .slice(0, 10);
      if (activeDays.has(key)) streak += 1;
      else if (index > 0) break;
    }
    return { dueQa, masteredQa, completedDocs, streak };
  }, [state.qa, state.docs, state.activity]);

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const value: Store = {
    state,
    ...derived,
    profiles,
    activeProfile,
    switchProfile,
    createProfile,
    renameProfile,
    deleteProfile,
    setTheme,
    setFontSize,
    setLineHeight,
    setRole,
    setJd,
    updateDocProgress,
    markDocComplete,
    toggleChecklist,
    saveNote,
    reviewQa,
    savePlan,
    togglePlanTask,
    excludePlanTask,
    addCustomPlanTask,
    removeCustomPlanTask,
    clearPlan,
    recordQuiz,
    exportState,
    importState,
    resetState,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore 必须在 StoreProvider 内使用");
  return value;
}

export function getQaBankProgress(
  state: AppState,
  docId: string,
): { total: number; mastered: number; due: number; learning: number } {
  const bank = QA_MAP.get(docId);
  if (!bank) return { total: 0, mastered: 0, due: 0, learning: 0 };
  let mastered = 0;
  let due = 0;
  let learning = 0;
  for (const item of bank.items) {
    const progress = state.qa[item.id];
    if (progress?.status === "mastered") mastered += 1;
    else {
      if (progress) learning += 1;
      if (isDue(progress)) due += 1;
    }
  }
  return { total: bank.items.length, mastered, due, learning };
}
