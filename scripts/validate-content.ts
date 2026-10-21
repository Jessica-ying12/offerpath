import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  interviewBankSchema,
  qualityWarnings,
  trackSchema,
  validateInterviewBank,
  validateTrack,
  TRACK_IDS,
} from "../src/lib/content/schema";

const root = process.cwd();
let failed = false;

for (const trackId of TRACK_IDS) {
  const trackPath = join(root, "data", "curriculum", `${trackId}.json`);
  const bankPath = join(root, "data", "interviews", `${trackId}.json`);
  try {
    const track = trackSchema.parse(JSON.parse(readFileSync(trackPath, "utf8")));
    const problems = validateTrack(track);
    if (track.id !== trackId) problems.push(`文件 ${trackId} 内部 trackId 不一致`);
    if (problems.length) {
      failed = true;
      console.error(`\n✗ ${trackId} 内容校验失败:`);
      for (const problem of problems) console.error("  -", problem);
    } else {
      console.log(`✓ ${trackId}：${track.atoms.length} 个知识点 / ${track.questions.length} 道题 / ${track.codeChallenges.length} 道代码题`);
    }
    for (const warning of qualityWarnings(track)) console.warn("  ! 质量提醒:", warning);

    const bank = interviewBankSchema.parse(JSON.parse(readFileSync(bankPath, "utf8")));
    const bankProblems = validateInterviewBank(bank, new Set(track.skills.map((s) => s.id)));
    if (bankProblems.length) {
      failed = true;
      console.error(`✗ ${trackId} 面试题校验失败:`);
      for (const problem of bankProblems) console.error("  -", problem);
    } else {
      console.log(`✓ ${trackId} 面试题：${bank.questions.length} 道`);
    }
  } catch (error) {
    failed = true;
    console.error(`✗ ${trackId} 解析失败:`, error instanceof Error ? error.message : error);
  }
}

if (failed) process.exit(1);
console.log("\n全部内容校验通过。");
