import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import {
  getBankCount,
  getInterviewBank,
  getTechnologyCatalog,
  getTracks,
} from "@/lib/content";
import {
  COURSE_EXPECTATIONS,
  LEVELS,
  TRACK_IDS,
  validateInterviewBank,
  validateTrack,
} from "@/lib/content/schema";

describe("curriculum content contract", () => {
  it("loads five courses with directions and official chapter references", () => {
    const tracks = getTracks();
    expect(tracks.map((track) => track.id)).toEqual([...TRACK_IDS]);
    expect(tracks).toHaveLength(5);
    for (const track of tracks) {
      expect(track.direction).toBeTruthy();
      expect(track.roles.length).toBeGreaterThan(0);
      const expectation = COURSE_EXPECTATIONS[track.id];
      expect(track.chapters).toHaveLength(expectation.chapters);
      expect(track.atoms).toHaveLength(expectation.atoms);
      expect(track.codeChallenges).toHaveLength(expectation.challenges);
      for (const level of LEVELS) {
        expect(track.chapters.filter((chapter) => chapter.level === level)).toHaveLength(
          expectation.chaptersPerLevel,
        );
      }
      for (const chapter of track.chapters) {
        expect(chapter.references.length).toBeGreaterThanOrEqual(1);
        expect(chapter.questionIds.length).toBeGreaterThanOrEqual(
          expectation.questionIdsPerChapterMin,
        );
        expect(chapter.atomIds).toHaveLength(3);
        expect(chapter.codeChallengeIds).toHaveLength(1);
        for (const reference of chapter.references) {
          expect(reference.url).toMatch(/^https?:\/\//);
        }
      }
      expect(validateTrack(track)).toEqual([]);
    }
  });

  it("has at least 210 original multiple-choice questions, with no duplicate IDs", () => {
    const tracks = getTracks();
    const totals = getBankCount();
    expect(totals.questions).toBeGreaterThanOrEqual(210);
    expect(totals.chapters).toBeGreaterThanOrEqual(21);
    const ids = tracks.flatMap((track) => track.questions.map((question) => question.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const track of tracks) {
      for (const question of track.questions) {
        expect(question.options).toHaveLength(4);
        expect(question.answerIndex).toBeGreaterThanOrEqual(0);
        expect(question.answerIndex).toBeLessThan(4);
        expect(question.explanation.length).toBeGreaterThan(19);
      }
    }
  });

  it("keeps references, answers, levels and skill tags consistent", () => {
    for (const track of getTracks()) {
      const chapterIds = new Set(track.chapters.map((chapter) => chapter.id));
      for (const atom of track.atoms) {
        expect(chapterIds.has(atom.chapterId)).toBe(true);
        expect(atom.keyPoints.length).toBeGreaterThanOrEqual(3);
        if (atom.explanation) expect(atom.explanation.length).toBeGreaterThan(19);
      }
      for (const question of track.questions) {
        const chapter = track.chapters.find((item) => item.id === question.chapterId);
        expect(chapter?.level).toBe(question.level);
      }
    }
  });

  it("executes every JavaScript challenge solution against its tests", () => {
    for (const track of getTracks()) {
      for (const challenge of track.codeChallenges) {
        if (challenge.language !== "javascript") continue;
        expect(challenge.functionName).toBeTruthy();
        expect(challenge.tests?.length ?? 0).toBeGreaterThanOrEqual(2);
        const fn = new Function(
          `${challenge.solutionCode}\nreturn ${challenge.functionName};`,
        )() as (...args: unknown[]) => unknown;
        for (const test of challenge.tests ?? []) {
          assert.deepStrictEqual(
            fn(...test.args),
            test.expected,
            `${challenge.id} / ${test.name}`,
          );
        }
      }
    }
  });

  it("ships SQL self-review tasks for the database course and executable JS elsewhere", () => {
    const database = getTracks().find((track) => track.id === "database-mysql")!;
    expect(database.codeChallenges.every((challenge) => challenge.language === "sql")).toBe(true);
    const backend = getTracks().find((track) => track.id === "backend-java")!;
    expect(backend.codeChallenges.every((challenge) => challenge.language === "javascript")).toBe(true);
  });

  it("builds a real technology catalog with chapter/question coverage", () => {
    const catalog = getTechnologyCatalog();
    expect(catalog.length).toBeGreaterThan(20);
    for (const tech of catalog) {
      expect(tech.chapterCount).toBeGreaterThan(0);
      expect(tech.tracks.length).toBeGreaterThan(0);
    }
    const java = catalog.find((item) => item.skill.id === "java-core");
    const mysql = catalog.find((item) => item.skill.id === "mysql");
    expect(java?.chapterCount).toBeGreaterThan(0);
    expect(mysql?.chapterCount).toBeGreaterThan(0);
  });
});

describe("interview banks", () => {
  it("has backend interview content in addition to the original two courses", () => {
    for (const trackId of ["mobile", "fullstack", "backend-java"] as const) {
      const track = getTracks().find((item) => item.id === trackId)!;
      const bank = getInterviewBank(trackId);
      expect(bank).not.toBeNull();
      expect(bank!.questions).toHaveLength(15);
      expect(validateInterviewBank(bank!, new Set(track.skills.map((skill) => skill.id)))).toEqual([]);
      for (const level of LEVELS) {
        expect(bank!.questions.filter((question) => question.level === level)).toHaveLength(5);
      }
      for (const question of bank!.questions) {
        expect(question.keyPoints.length).toBeGreaterThanOrEqual(3);
        expect(question.followUps.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("marks database and foundations as practice-only until their interview banks exist", () => {
    expect(getInterviewBank("database-mysql")).toBeNull();
    expect(getInterviewBank("cs-ai-foundations")).toBeNull();
  });
});
