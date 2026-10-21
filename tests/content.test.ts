import { describe, expect, it } from "vitest";
import { getInterviewBank, getTracks } from "@/lib/content";
import {
  LEVELS,
  TRACK_IDS,
  interviewBankSchema,
  trackSchema,
  validateInterviewBank,
  validateTrack,
} from "@/lib/content/schema";
import mobileCurriculum from "../data/curriculum/mobile.json";
import fullstackCurriculum from "../data/curriculum/fullstack.json";
import mobileInterviews from "../data/interviews/mobile.json";
import fullstackInterviews from "../data/interviews/fullstack.json";

describe("curriculum content contract", () => {
  it("parses all track files against the schema", () => {
    expect(trackSchema.safeParse(mobileCurriculum).success).toBe(true);
    expect(trackSchema.safeParse(fullstackCurriculum).success).toBe(true);
    expect(interviewBankSchema.safeParse(mobileInterviews).success).toBe(true);
    expect(interviewBankSchema.safeParse(fullstackInterviews).success).toBe(true);
  });

  it("has exactly two launch tracks with 9 chapters / 27 atoms / 45 questions / 9 challenges each", () => {
    const tracks = getTracks();
    expect(tracks.map((track) => track.id)).toEqual([...TRACK_IDS]);
    for (const track of tracks) {
      const chapterLevels = new Set(track.chapters.map((chapter) => chapter.level));
      expect(chapterLevels).toEqual(new Set(LEVELS));
      for (const level of LEVELS) {
        expect(track.chapters.filter((chapter) => chapter.level === level)).toHaveLength(3);
      }
      expect(track.chapters).toHaveLength(9);
      expect(track.atoms).toHaveLength(27);
      expect(track.questions).toHaveLength(45);
      expect(track.codeChallenges).toHaveLength(9);
    }
  });

  it("keeps every reference, answer index and level consistent", () => {
    for (const track of getTracks()) {
      expect(validateTrack(track)).toEqual([]);
      for (const chapter of track.chapters) {
        expect(chapter.atomIds).toHaveLength(3);
        expect(chapter.questionIds).toHaveLength(5);
        expect(chapter.codeChallengeIds).toHaveLength(1);
      }
      for (const question of track.questions) {
        expect(question.options).toHaveLength(4);
        expect(question.answerIndex).toBeGreaterThanOrEqual(0);
        expect(question.answerIndex).toBeLessThan(4);
        expect(question.prompt.length).toBeGreaterThan(9);
        expect(question.explanation.length).toBeGreaterThan(19);
      }
      for (const atom of track.atoms) {
        expect(atom.keyPoints.length).toBeGreaterThanOrEqual(3);
        expect(atom.minutes).toBeLessThanOrEqual(15);
      }
    }
  });

  it("has JavaScript tests for every fullstack challenge and Kotlin rubrics for mobile", () => {
    for (const track of getTracks()) {
      for (const challenge of track.codeChallenges) {
        if (track.id === "fullstack") {
          expect(challenge.language).toBe("javascript");
          expect(challenge.functionName).toBeTruthy();
          expect(challenge.tests?.length ?? 0).toBeGreaterThanOrEqual(2);
          expect(challenge.solutionCode).toContain(challenge.functionName ?? "");
        } else {
          expect(challenge.language).toBe("kotlin");
          expect(challenge.rubric.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe("interview banks", () => {
  it("has 15 questions per track with 5 per level", () => {
    for (const track of getTracks()) {
      const bank = getInterviewBank(track.id);
      expect(bank.questions).toHaveLength(15);
      expect(validateInterviewBank(bank, new Set(track.skills.map((skill) => skill.id)))).toEqual([]);
      for (const level of LEVELS) {
        expect(bank.questions.filter((question) => question.level === level)).toHaveLength(5);
      }
      for (const question of bank.questions) {
        expect(question.keyPoints.length).toBeGreaterThanOrEqual(3);
        expect(question.followUps.length).toBeGreaterThanOrEqual(1);
        for (const point of question.keyPoints) {
          expect(point.aliases.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});
