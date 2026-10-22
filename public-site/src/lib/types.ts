export type RoleId = "mobile" | "rn" | "mini" | "web" | "flutter";

export type LocalProfile = {
  id: string;
  name: string;
  createdAt: string;
};

export type DocHeading = {
  depth: 2 | 3;
  text: string;
  slug: string;
};

export type DocMeta = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  layer: string;
  category: string;
  week: string;
  priority: "P0" | "P1" | "P2";
  tags: string[];
  roles: RoleId[];
  minutes: number;
  chars: number;
  headings: DocHeading[];
  markdown: string;
  qaId: string | null;
};

export type QaItem = {
  id: string;
  number: number;
  question: string;
  direct: string;
  followUps: Array<{ question: string; answer: string }>;
  trap: string;
};

export type QaBank = {
  docId: string;
  title: string;
  intro: string;
  items: QaItem[];
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  skills: string[];
  level: string;
  chapterId: string;
  courseId: string;
  courseName: string;
  chapterTitle: string;
};

export type DocProgress = {
  completed: boolean;
  percent: number;
  lastHeading: string | null;
  lastReadAt: string | null;
  completedAt: string | null;
};

export type QaProgress = {
  reviewCount: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  status: "new" | "learning" | "mastered";
};

export type ActivityItem = {
  id: string;
  type: "read" | "complete" | "qa" | "quiz" | "note";
  label: string;
  at: string;
  href?: string;
};

export type QuizAttempt = {
  id: string;
  at: string;
  courseName: string;
  level: string;
  score: number;
  total: number;
};

export type AppState = {
  version: 1;
  theme: "light" | "dark";
  fontSize: number;
  lineHeight: number;
  role: RoleId;
  jd: string;
  docs: Record<string, DocProgress>;
  qa: Record<string, QaProgress>;
  checklists: Record<string, boolean>;
  notes: Record<string, string>;
  quizAttempts: QuizAttempt[];
  quizMistakes: Record<string, { wrongCount: number; lastWrongAt: string }>;
  activity: ActivityItem[];
};
