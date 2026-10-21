import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsDir = path.join(root, "content", "docs");
const qaDir = path.join(root, "content", "qa");
const docs = fs.readdirSync(docsDir).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();
const qa = fs.readdirSync(qaDir).filter((file) => /^\d{2}-.*\.md$/.test(file)).sort();
const errors = [];

if (docs.length !== 21) errors.push(`精读文档应为 21 篇，实际 ${docs.length}`);
if (qa.length !== 21) errors.push(`问答分册应为 21 份，实际 ${qa.length}`);

let questions = 0;
let followUps = 0;
let traps = 0;
const forbidden = ["彭莹", "Sylvia", "Gissele", "ExploreX", "LivHome", "LIVPET", "com.explorex"];
for (const file of docs) {
  const text = fs.readFileSync(path.join(docsDir, file), "utf8");
  if (!/^#\s+\S+/m.test(text)) errors.push(`${file} 缺少一级标题`);
  for (const marker of forbidden) {
    if (text.includes(marker)) errors.push(`${file} 含有个人/公司信息：${marker}`);
  }
}
for (const file of qa) {
  const text = fs.readFileSync(path.join(qaDir, file), "utf8");
  const count = (text.match(/^##\s+Q\d+\./gm) ?? []).length;
  questions += count;
  followUps += (text.match(/^\*\*追问\s+\d+/gm) ?? []).length;
  traps += (text.match(/^\*\*陷阱\/加分/gm) ?? []).length;
  if (count === 0) errors.push(`${file} 没有解析到 Q&A`);
  for (const marker of forbidden) {
    if (text.includes(marker)) errors.push(`${file} 含有个人/公司信息：${marker}`);
  }
}
if (questions !== 380) errors.push(`面试问答应为 380 道，实际 ${questions}`);
if (traps < 379) errors.push(`陷阱/加分条目异常：${traps}`);

console.log(`精读：${docs.length} 篇`);
console.log(`问答：${qa.length} 份 / ${questions} 道 / ${followUps} 层追问 / ${traps} 个陷阱提示`);
if (errors.length > 0) {
  console.error("\n校验失败：");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("内容校验通过，未包含简历定制个人数据。");
