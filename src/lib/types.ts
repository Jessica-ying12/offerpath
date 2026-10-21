import type { LevelId, TrackId } from "@/lib/content/schema";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type Profile = {
  userId: string;
  trackId: TrackId;
  level: LevelId;
  targetRole: string;
  targetCompany: string;
  resumeText: string;
  jdText: string;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType =
  | "account_created"
  | "profile_updated"
  | "lesson_completed"
  | "quiz_submitted"
  | "mistake_resolved"
  | "code_submitted"
  | "plan_created"
  | "interview_started"
  | "interview_completed"
  | "solution_viewed"
  | "review_completed"
  | "bank_practiced"
  | "exam_completed";

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type QuizSourceType = "chapter" | "mistake";

export type QuizDetail = {
  questionId: string;
  prompt: string;
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
  skills: string[];
};

export type QuizResult = {
  attemptId: string;
  score: number;
  total: number;
  correct: number;
  details: QuizDetail[];
};

export type SkillAnalysis = {
  resumeSkills: string[];
  jdSkills: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  gapSkills: string[];
  extraSkills: string[];
  coverage: number;
  summary: string;
  evidence: Array<{
    skillId: string;
    name: string;
    sources: Array<"resume" | "jd">;
    hits: string[];
  }>;
};

export type PlanTaskType = "atom" | "practice" | "code" | "interview";

export type PlanTask = {
  id: string;
  type: PlanTaskType;
  refId: string;
  title: string;
  minutes: number;
  skills: string[];
};

export type PlanDay = {
  day: number;
  label: string;
  focus: string;
  tasks: PlanTask[];
};

export type SprintPlan = {
  version: 1;
  kind: "sprint";
  trackId: TrackId;
  level: LevelId;
  title: string;
  company: string;
  createdAt: string;
  days: PlanDay[];
  analysis: SkillAnalysis;
  selectedAtomIds: string[];
  chapterIds: string[];
  challengeIds: string[];
  interview: {
    mode: "resume" | "jd" | "position";
    focusSkills: string[];
    resumeText: string;
    jdText: string;
  };
};

export type CareerPhase = {
  id: string;
  title: string;
  weeks: number;
  objective: string;
  level: LevelId;
  atomIds: string[];
  chapterIds: string[];
  challengeIds: string[];
  interviewFocus: string[];
  checkpoint: string;
};

export type CareerSkillCoverage = {
  skillId: string;
  name: string;
  covered: boolean;
  phaseIds: string[];
};

export type CareerPlan = {
  version: 1;
  kind: "career";
  trackId: TrackId;
  level: LevelId;
  title: string;
  horizonWeeks: number;
  createdAt: string;
  analysis: SkillAnalysis;
  phases: CareerPhase[];
  skillCoverage: CareerSkillCoverage[];
};

export type PlanRecord = {
  id: string;
  userId: string;
  kind: "sprint" | "career";
  trackId: TrackId;
  level: LevelId;
  title: string;
  input: Record<string, unknown>;
  plan: SprintPlan | CareerPlan;
  createdAt: string;
};

export type InterviewMode = "resume" | "jd" | "position";

export type InterviewKeyPoint = {
  label: string;
  aliases: string[];
};

export type InterviewQuestionSnapshot = {
  id: string;
  kind: "knowledge" | "project" | "followup";
  level: LevelId;
  skills: string[];
  prompt: string;
  keyPoints: InterviewKeyPoint[];
  modelAnswer: string;
  commonMistakes: string[];
  projectRef?: string;
  followUps?: Array<{
    prompt: string;
    modelAnswer: string;
    keyPoints: InterviewKeyPoint[];
  }>;
};

export type InterviewPlanSnapshot = {
  version: 1;
  trackId: TrackId;
  level: LevelId;
  mode: InterviewMode;
  company: string;
  createdAt: string;
  mainQuestions: InterviewQuestionSnapshot[];
  resumeText: string;
  jdText: string;
};

export type InterviewFeedback = {
  score: number;
  matched: string[];
  missing: string[];
  hint: string;
  modelAnswer: string;
  advice: string;
  skills: string[];
};

export type InterviewTurn = {
  id: string;
  sessionId: string;
  seq: number;
  questionId: string;
  parentId: string | null;
  kind: "main" | "retry" | "followup";
  questionText: string;
  answer: string;
  score: number;
  feedback: InterviewFeedback;
  createdAt: string;
};

export type InterviewSummary = {
  average: number;
  mainCount: number;
  answeredCount: number;
  strengths: Array<{ skillId: string; name: string; score: number }>;
  gaps: Array<{ skillId: string; name: string; score: number }>;
  verdict: string;
  recommendedAtomIds: string[];
  createdAt: string;
};

export type InterviewSessionRecord = {
  id: string;
  userId: string;
  trackId: TrackId;
  level: LevelId;
  mode: InterviewMode;
  status: "active" | "completed";
  plan: InterviewPlanSnapshot;
  summary: InterviewSummary | null;
  createdAt: string;
  endedAt: string | null;
};

export type PendingInterviewQuestion = {
  question: InterviewQuestionSnapshot;
  parentId: string | null;
  attempt: "first" | "retry" | "followup";
  hint: string | null;
};

export type InterviewState = {
  pending: PendingInterviewQuestion | null;
  answeredCount: number;
  mainCount: number;
  complete: boolean;
};

export type PlanTaskView = {
  task: PlanTask;
  done: boolean;
  href: string;
  meta: string;
};

export type PlanProgress = {
  total: number;
  done: number;
  tasks: Map<string, PlanTaskView>;
};

export type MistakeRecord = {
  questionId: string;
  trackId: TrackId;
  wrongCount: number;
  lastWrongAt: string;
  resolvedAt: string | null;
};

export type OverviewStats = {
  lessonsCompleted: number;
  quizAttempts: number;
  accuracy: number;
  openMistakes: number;
  interviewsCompleted: number;
  streakDays: number;
};

export type MasteryStage = 1 | 2 | 3 | 4 | 5;

export type MasteryRecord = {
  userId: string;
  chapterId: string;
  trackId: TrackId;
  stage: MasteryStage;
  reviewCount: number;
  nextReviewAt: string | null;
  lastReviewAt: string | null;
  updatedAt: string;
};

export type ReviewAttemptRecord = {
  id: string;
  chapterId: string;
  trackId: TrackId;
  level: LevelId;
  score: number;
  total: number;
  createdAt: string;
};

export type BankAttemptRecord = {
  id: string;
  scope: Record<string, unknown>;
  score: number;
  total: number;
  durationSeconds: number;
  createdAt: string;
};

export type ExamAttemptRecord = {
  id: string;
  trackId: TrackId;
  level: LevelId;
  score: number;
  total: number;
  durationSeconds: number;
  createdAt: string;
};
