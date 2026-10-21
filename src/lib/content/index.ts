import mobileCurriculum from "../../../data/curriculum/mobile.json";
import fullstackCurriculum from "../../../data/curriculum/fullstack.json";
import mobileInterviews from "../../../data/interviews/mobile.json";
import fullstackInterviews from "../../../data/interviews/fullstack.json";
import {
  interviewBankSchema,
  trackSchema,
  type Atom,
  type Chapter,
  type CodeChallenge,
  type InterviewBank,
  type LevelId,
  type Question,
  type Question as QuestionType,
  type Track,
  type TrackId,
} from "./schema";

const tracks: Track[] = [
  trackSchema.parse(mobileCurriculum),
  trackSchema.parse(fullstackCurriculum),
];

const banks: Record<TrackId, InterviewBank> = {
  mobile: interviewBankSchema.parse(mobileInterviews),
  fullstack: interviewBankSchema.parse(fullstackInterviews),
};

export function getTracks(): Track[] {
  return tracks;
}

export function getTrack(trackId: string): Track | null {
  return tracks.find((track) => track.id === trackId) ?? null;
}

export function requireTrack(trackId: string): Track {
  const track = getTrack(trackId);
  if (!track) throw new Error(`未知方向：${trackId}`);
  return track;
}

export function getTrackBySlug(trackId: string): Track | null {
  return getTrack(trackId);
}

export function getLevelChapters(track: Track, level: LevelId): Chapter[] {
  return track.chapters
    .filter((chapter) => chapter.level === level)
    .sort((a, b) => a.order - b.order);
}

export function getChapterById(track: Track, chapterId: string): Chapter | null {
  return track.chapters.find((chapter) => chapter.id === chapterId) ?? null;
}

export function getAtomById(track: Track, atomId: string): Atom | null {
  return track.atoms.find((atom) => atom.id === atomId) ?? null;
}

export function getChaptersForAtom(track: Track, atomId: string): Chapter | null {
  return track.chapters.find((chapter) => chapter.atomIds.includes(atomId)) ?? null;
}

export function getChapterAtoms(track: Track, chapter: Chapter): Atom[] {
  return chapter.atomIds
    .map((atomId) => getAtomById(track, atomId))
    .filter((atom): atom is Atom => atom !== null);
}

export function getChapterQuestions(track: Track, chapter: Chapter): Question[] {
  const map = new Map(track.questions.map((question) => [question.id, question]));
  return chapter.questionIds
    .map((questionId) => map.get(questionId))
    .filter((question): question is QuestionType => question !== undefined);
}

export function getChapterChallenge(track: Track, chapter: Chapter): CodeChallenge | null {
  return (
    track.codeChallenges.find((challenge) => chapter.codeChallengeIds.includes(challenge.id)) ??
    null
  );
}

export function findQuestion(questionId: string): {
  track: Track;
  chapter: Chapter;
  question: Question;
} | null {
  for (const track of tracks) {
    const question = track.questions.find((item) => item.id === questionId);
    if (!question) continue;
    const chapter = track.chapters.find((item) => item.id === question.chapterId);
    if (!chapter) continue;
    return { track, chapter, question };
  }
  return null;
}

export function findChallenge(challengeId: string): {
  track: Track;
  chapter: Chapter;
  challenge: CodeChallenge;
} | null {
  for (const track of tracks) {
    const challenge = track.codeChallenges.find((item) => item.id === challengeId);
    if (!challenge) continue;
    const chapter = track.chapters.find((item) => item.id === challenge.chapterId);
    if (!chapter) continue;
    return { track, chapter, challenge };
  }
  return null;
}

export function findAtom(atomId: string): {
  track: Track;
  chapter: Chapter;
  atom: Atom;
} | null {
  for (const track of tracks) {
    const atom = track.atoms.find((item) => item.id === atomId);
    if (!atom) continue;
    const chapter = track.chapters.find((item) => item.id === atom.chapterId);
    if (!chapter) continue;
    return { track, chapter, atom };
  }
  return null;
}

export function findChapterAnyTrack(chapterId: string): {
  track: Track;
  chapter: Chapter;
} | null {
  for (const track of tracks) {
    const chapter = track.chapters.find((item) => item.id === chapterId);
    if (chapter) return { track, chapter };
  }
  return null;
}

export function getInterviewBank(trackId: TrackId): InterviewBank {
  return banks[trackId];
}

export function getSkillName(track: Track, skillId: string): string {
  return track.skills.find((skill) => skill.id === skillId)?.name ?? skillId;
}

export function getTrackStats(track: Track): {
  chapters: number;
  atoms: number;
  questions: number;
  challenges: number;
} {
  return {
    chapters: track.chapters.length,
    atoms: track.atoms.length,
    questions: track.questions.length,
    challenges: track.codeChallenges.length,
  };
}

export function getLevelLabel(track: Track, level: LevelId): string {
  return track.levels.find((item) => item.id === level)?.name ?? level;
}

export function toPublicQuestion(question: Question): {
  id: string;
  prompt: string;
  options: string[];
  skills: string[];
  level: LevelId;
} {
  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    skills: question.skills,
    level: question.level,
  };
}
