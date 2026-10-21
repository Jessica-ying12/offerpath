import mobileCurriculum from "../../../data/curriculum/mobile.json";
import fullstackCurriculum from "../../../data/curriculum/fullstack.json";
import backendCurriculum from "../../../data/curriculum/backend-java.json";
import databaseCurriculum from "../../../data/curriculum/database-mysql.json";
import csAiCurriculum from "../../../data/curriculum/cs-ai-foundations.json";
import mobileInterviews from "../../../data/interviews/mobile.json";
import fullstackInterviews from "../../../data/interviews/fullstack.json";
import backendInterviews from "../../../data/interviews/backend-java.json";
import {
  LEVELS,
  interviewBankSchema,
  trackSchema,
  type Atom,
  type Chapter,
  type CodeChallenge,
  type DirectionId,
  type InterviewBank,
  type LevelId,
  type LevelInfo,
  type Question,
  type Skill,
  type SkillCategory,
  type Track,
  type TrackId,
} from "./schema";

const tracks: Track[] = [
  trackSchema.parse(mobileCurriculum),
  trackSchema.parse(fullstackCurriculum),
  trackSchema.parse(backendCurriculum),
  trackSchema.parse(databaseCurriculum),
  trackSchema.parse(csAiCurriculum),
];

const banks: Partial<Record<TrackId, InterviewBank>> = {
  mobile: interviewBankSchema.parse(mobileInterviews),
  fullstack: interviewBankSchema.parse(fullstackInterviews),
  "backend-java": interviewBankSchema.parse(backendInterviews),
};

const globalSkills = new Map<string, Skill>();
for (const track of tracks) {
  for (const skill of track.skills) {
    const existing = globalSkills.get(skill.id);
    if (!existing) {
      globalSkills.set(skill.id, skill);
    } else {
      globalSkills.set(skill.id, {
        ...existing,
        aliases: [...new Set([...existing.aliases, ...skill.aliases])],
        category: existing.category ?? skill.category,
      });
    }
  }
}

export function getTracks(): Track[] {
  return tracks;
}

export function getTrack(trackId: string): Track | null {
  return tracks.find((track) => track.id === trackId) ?? null;
}

export function requireTrack(trackId: string): Track {
  const track = getTrack(trackId);
  if (!track) throw new Error(`未知课程：${trackId}`);
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
    .filter((question): question is Question => question !== undefined);
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

export function getInterviewBank(trackId: TrackId): InterviewBank | null {
  return banks[trackId] ?? null;
}

export function hasInterviewBank(trackId: TrackId): boolean {
  return Boolean(banks[trackId]);
}

export function getInterviewTracks(): Track[] {
  return tracks.filter((track) => hasInterviewBank(track.id));
}

export function getSkill(skillId: string): Skill | null {
  return globalSkills.get(skillId) ?? null;
}

export function getAllTechSkills(): Skill[] {
  return [...globalSkills.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSkillName(track: Track, skillId: string): string {
  return globalSkills.get(skillId)?.name ?? track.skills.find((skill) => skill.id === skillId)?.name ?? skillId;
}

export function getTrackStats(track: Track): {
  chapters: number;
  atoms: number;
  questions: number;
  challenges: number;
  references: number;
} {
  return {
    chapters: track.chapters.length,
    atoms: track.atoms.length,
    questions: track.questions.length,
    challenges: track.codeChallenges.length,
    references: track.chapters.reduce((sum, chapter) => sum + chapter.references.length, 0),
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
  difficulty?: number;
  kind?: "concept" | "code" | "scenario";
} {
  return {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    skills: question.skills,
    level: question.level,
    difficulty: question.difficulty,
    kind: question.kind,
  };
}

export type DirectionCatalog = {
  id: DirectionId;
  courses: Track[];
};

export function getDirectionCatalog(): DirectionCatalog[] {
  const map = new Map<DirectionId, Track[]>();
  for (const track of tracks) {
    const list = map.get(track.direction) ?? [];
    list.push(track);
    map.set(track.direction, list);
  }
  return [...map.entries()].map(([id, courses]) => ({ id, courses }));
}

export type TechnologyCatalogItem = {
  skill: Skill;
  tracks: Array<{ track: Track; chapterIds: string[]; levels: LevelId[] }>;
  chapterCount: number;
  questionCount: number;
  hasCourseContent: boolean;
};

export function getTechnologyCatalog(): TechnologyCatalogItem[] {
  const items: TechnologyCatalogItem[] = [];
  for (const skill of globalSkills.values()) {
    const trackMap = new Map<string, { track: Track; chapterIds: string[]; levels: LevelId[] }>();
    for (const track of tracks) {
      const chapterIds: string[] = [];
      const levels = new Set<LevelId>();
      for (const chapter of track.chapters) {
        const chapterAtomSkills = chapter.atomIds.flatMap(
          (atomId) => track.atoms.find((atom) => atom.id === atomId)?.skills ?? [],
        );
        const challengeSkills = track.codeChallenges
          .filter((challenge) => chapter.codeChallengeIds.includes(challenge.id))
          .flatMap((challenge) => challenge.skills);
        if ([...chapterAtomSkills, ...challengeSkills].includes(skill.id)) {
          chapterIds.push(chapter.id);
          levels.add(chapter.level);
        }
      }
      if (chapterIds.length > 0) {
        trackMap.set(track.id, { track, chapterIds, levels: [...levels] });
      }
    }
    const chapters = [...trackMap.values()].flatMap((entry) => entry.chapterIds);
    const questions = tracks.flatMap((track) =>
      track.questions.filter(
        (question) =>
          question.skills.includes(skill.id) &&
          chapters.includes(question.chapterId),
      ),
    );
    items.push({
      skill,
      tracks: [...trackMap.values()],
      chapterCount: chapters.length,
      questionCount: questions.length,
      hasCourseContent: chapters.length > 0,
    });
  }
  return items
    .filter((item) => item.hasCourseContent)
    .sort((a, b) => b.chapterCount - a.chapterCount || a.skill.name.localeCompare(b.skill.name));
}

export function getChaptersForSkill(skillId: string): Array<{
  track: Track;
  chapter: Chapter;
  questions: Question[];
  challenge: CodeChallenge | null;
}> {
  const result: Array<{
    track: Track;
    chapter: Chapter;
    questions: Question[];
    challenge: CodeChallenge | null;
  }> = [];
  for (const track of tracks) {
    for (const chapter of track.chapters) {
      const atomSkills = chapter.atomIds.flatMap(
        (atomId) => track.atoms.find((atom) => atom.id === atomId)?.skills ?? [],
      );
      const challenge = getChapterChallenge(track, chapter);
      const challengeSkills = challenge?.skills ?? [];
      if (![...atomSkills, ...challengeSkills].includes(skillId)) continue;
      result.push({
        track,
        chapter,
        questions: getChapterQuestions(track, chapter).filter((question) =>
          question.skills.includes(skillId),
        ),
        challenge,
      });
    }
  }
  return result.sort((a, b) => {
    const levelRank = { junior: 0, middle: 1, senior: 2 };
    return (
      levelRank[a.chapter.level] - levelRank[b.chapter.level] ||
      a.chapter.order - b.chapter.order
    );
  });
}

export function getCourseLevels(): LevelInfo[] {
  return tracks[0]?.levels ?? LEVELS.map((id) => ({
    id,
    name: id,
    summary: "",
    focus: [],
  }));
}

export function getSkillCategory(skillId: string): SkillCategory | "tool" {
  return globalSkills.get(skillId)?.category ?? "tool";
}

export function getBankCount(): { tracks: number; chapters: number; questions: number; challenges: number } {
  return tracks.reduce(
    (acc, track) => ({
      tracks: acc.tracks + 1,
      chapters: acc.chapters + track.chapters.length,
      questions: acc.questions + track.questions.length,
      challenges: acc.challenges + track.codeChallenges.length,
    }),
    { tracks: 0, chapters: 0, questions: 0, challenges: 0 },
  );
}
