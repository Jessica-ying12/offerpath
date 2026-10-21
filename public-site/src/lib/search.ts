import { ALL_QA, DOCS } from "./content";

export type SearchHit = {
  id: string;
  kind: "doc" | "qa";
  docId: string;
  title: string;
  heading?: string;
  snippet: string;
  score: number;
  href: string;
};

type IndexedSection = {
  id: string;
  kind: "doc" | "qa";
  docId: string;
  title: string;
  heading?: string;
  text: string;
  href: string;
};

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*\n?/g, " "))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIndex(): IndexedSection[] {
  const sections: IndexedSection[] = [];
  for (const doc of DOCS) {
    const lines = doc.markdown.split("\n");
    let title = doc.title;
    let heading: string | undefined;
    let buffer: string[] = [];
    let inFence = false;
    const flush = () => {
      const text = stripMarkdown(buffer.join("\n"));
      if (text.length > 20) {
        sections.push({
          id: `${doc.id}-${heading ?? "lead"}`,
          kind: "doc",
          docId: doc.id,
          title,
          heading,
          text: text.slice(0, 12_000),
          href: `/doc/${doc.id}`,
        });
      }
      buffer = [];
    };
    for (const line of lines) {
      if (/^\s*```/.test(line)) inFence = !inFence;
      if (!inFence && /^##\s+/.test(line)) {
        flush();
        heading = line.replace(/^##\s+/, "").replace(/[*_`]/g, "").trim();
        buffer.push(line);
        continue;
      }
      buffer.push(line);
    }
    flush();
  }
  for (const item of ALL_QA) {
    sections.push({
      id: `qa-${item.id}`,
      kind: "qa",
      docId: item.docId,
      title: `${item.docId} · 面试自测`,
      heading: `Q${item.number}. ${item.question}`,
      text: stripMarkdown(
        `${item.question}\n${item.direct}\n${item.followUps
          .map((follow) => `${follow.question} ${follow.answer}`)
          .join("\n")}`,
      ).slice(0, 6000),
      href: `/qa/${item.docId}?q=${item.id}`,
    });
  }
  return sections;
}

const INDEX = buildIndex();

function makeSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index < 0) return text.slice(0, 120);
  const start = Math.max(0, index - 45);
  const end = Math.min(text.length, index + query.length + 85);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export function search(query: string, limit = 24): SearchHit[] {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];
  for (const section of INDEX) {
    const title = section.title.toLowerCase();
    const heading = (section.heading ?? "").toLowerCase();
    const body = section.text.toLowerCase();
    let score = 0;
    let matched = 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 12;
      if (heading.includes(token)) score += 9;
      const count = body.split(token).length - 1;
      if (count > 0) {
        matched += 1;
        score += Math.min(8, count);
      }
    }
    if (matched === 0 && !tokens.some((token) => title.includes(token) || heading.includes(token))) {
      continue;
    }
    if (matched < Math.ceil(tokens.length / 2)) continue;
    hits.push({
      id: section.id,
      kind: section.kind,
      docId: section.docId,
      title: section.title,
      heading: section.heading,
      snippet: makeSnippet(section.text, trimmed),
      score,
      href: section.href,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const SEARCH_SIZE = INDEX.length;
