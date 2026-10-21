import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge, PageHeader, Panel, SectionLabel } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "内容来源" };

const SOURCE_GROUPS = [
  {
    title: "移动端",
    items: [
      ["Kotlin Documentation", "https://kotlinlang.org/docs/home.html", "JetBrains"],
      ["Kotlin Coroutines Guide", "https://kotlinlang.org/docs/coroutines-guide.html", "JetBrains"],
      ["Android App Architecture", "https://developer.android.com/topic/architecture", "Android Developers"],
      ["Jetpack Compose", "https://developer.android.com/develop/ui/compose/documentation", "Android Developers"],
      ["Room", "https://developer.android.com/training/data-storage/room", "Android Developers"],
      ["Android Performance", "https://developer.android.com/topic/performance", "Android Developers"],
    ],
  },
  {
    title: "Web 全栈",
    items: [
      ["MDN Web Docs", "https://developer.mozilla.org/en-US/docs/Web", "MDN"],
      ["React Learn", "https://react.dev/learn", "React"],
      ["TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html", "Microsoft"],
      ["Node.js Documentation", "https://nodejs.org/docs/latest/api/", "OpenJS Foundation"],
      ["PostgreSQL Documentation", "https://www.postgresql.org/docs/current/", "PostgreSQL"],
      ["OWASP Cheat Sheet Series", "https://cheatsheetseries.owasp.org/", "OWASP"],
    ],
  },
  {
    title: "Java 后端与数据库",
    items: [
      ["Dev.java Learn", "https://dev.java/learn/", "Oracle / Dev.java"],
      ["Java SE API", "https://docs.oracle.com/en/java/javase/21/docs/api/", "Oracle"],
      ["Spring Boot Reference", "https://docs.spring.io/spring-boot/index.html", "Spring"],
      ["MySQL Reference Manual", "https://dev.mysql.com/doc/refman/8.4/en/", "Oracle"],
      ["Redis Documentation", "https://redis.io/docs/latest/", "Redis"],
      ["Google SRE Book", "https://sre.google/sre-book/table-of-contents/", "Google"],
    ],
  },
  {
    title: "计算机基础与前沿",
    items: [
      ["MDN HTTP", "https://developer.mozilla.org/en-US/docs/Web/HTTP", "MDN"],
      ["OSTEP", "https://pages.cs.wisc.edu/~remzi/OSTEP/", "University of Wisconsin"],
      ["MIT Missing Semester", "https://missing.csail.mit.edu/", "MIT"],
      ["OSSU Computer Science", "https://github.com/ossu/computer-science", "OSSU"],
      ["OWASP GenAI LLM Top 10", "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/", "OWASP"],
      ["OpenTelemetry", "https://opentelemetry.io/docs/", "CNCF"],
    ],
  },
  {
    title: "题库调研与练习参考",
    items: [
      ["LeetCode", "https://leetcode.com/", "LeetCode"],
      ["JavaScript.info", "https://javascript.info/", "JavaScript.info"],
      ["SQLBolt", "https://sqlbolt.com/", "SQLBolt"],
      ["pgexercises", "https://pgexercises.com/", "pgexercises"],
      ["roadmap.sh", "https://roadmap.sh/", "roadmap.sh"],
    ],
  },
];

export default async function SourcesPage() {
  await requireUser("/sources");
  const count = SOURCE_GROUPS.reduce((sum, group) => sum + group.items.length, 0);
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-[11px] text-muted">
        <Link href="/library" className="inline-flex items-center gap-1 transition hover:text-paper">
          <ArrowLeft className="h-3 w-3" />
          技术库
        </Link>
        <span>/</span>
        <span className="text-paper/70">内容来源</span>
      </div>
      <PageHeader
        eyebrow="SOURCES / LAST CHECKED 2026-10-21"
        title="讲解可以被核对，题目不是抄来的。"
        description="课程中的概念、机制和 API 语义依据官方文档与公开课程整理；题目和解析为本平台原创编写，不从付费题库整段复制。链接更新时以来源站点当前版本为准。"
        actions={<Badge tone="lime">{count} 个权威入口</Badge>}
      />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-mint/20 bg-mint/[0.035] px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
        <p className="text-[11px] leading-5 text-muted">
          题库仅用于练习，不替代真实项目与官方课程。涉及版本行为（JVM、MySQL、React、Spring）时，优先以对应版本文档为准；发现来源失效可在仓库提交 Issue。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SOURCE_GROUPS.map((group) => (
          <Panel key={group.title} className="p-5">
            <SectionLabel>{group.title}</SectionLabel>
            <div className="mt-3 space-y-2">
              {group.items.map(([title, url, publisher]) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 rounded-lg border border-white/[0.05] px-3 py-2.5 transition hover:border-lime/20 hover:bg-white/[0.02]"
                >
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted/40 group-hover:text-lime" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-paper/80">{title}</span>
                    <span className="mt-0.5 block text-[9px] text-muted/40">{publisher}</span>
                  </span>
                </a>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
