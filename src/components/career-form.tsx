"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Loader2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import type { LevelId, TrackId } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const HORIZONS = [
  { value: 4 as const, label: "4 周", copy: "紧凑补缺" },
  { value: 8 as const, label: "8 周", copy: "稳扎稳打" },
  { value: 12 as const, label: "12 周", copy: "系统进阶" },
];

const UPCOMING = ["前端开发", "数据开发", "测试开发", "安全工程师"];

export function CareerForm({
  initialTrack,
  initialLevel,
  initialCompany,
  initialJd,
  hasResume,
}: {
  initialTrack: TrackId;
  initialLevel: LevelId;
  initialCompany: string;
  initialJd: string;
  hasResume: boolean;
}) {
  const router = useRouter();
  const [track, setTrack] = useState<TrackId>(initialTrack);
  const [level, setLevel] = useState<LevelId>(initialLevel);
  const [horizon, setHorizon] = useState<4 | 8 | 12>(8);
  const [company, setCompany] = useState(initialCompany);
  const [jd, setJd] = useState(initialJd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/plans/career", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trackId: track,
          level,
          horizonWeeks: horizon,
          company,
          jdText: jd,
        }),
      });
      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "生成失败，请稍后重试");
        return;
      }
      router.push(`/career/${data.id}`);
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form method="post" onSubmit={submit} className="space-y-6">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-muted">目标方向</span>
          <span className="font-mono text-[9px] text-muted/40">TRACK</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "mobile" as const, label: "移动端开发", hint: "Android / Kotlin" },
            { id: "fullstack" as const, label: "全栈开发", hint: "React / Node / SQL" },
            { id: "backend-java" as const, label: "Java 后端", hint: "Java / Spring / MySQL / Redis" },
            { id: "database-mysql" as const, label: "MySQL 数据库", hint: "建模 / 查询 / 高可用" },
            { id: "cs-ai-foundations" as const, label: "CS / AI 前沿", hint: "网络 / OS / LLM 应用" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTrack(item.id)}
              aria-pressed={track === item.id}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                track === item.id
                  ? "border-lime/40 bg-lime/[0.055]"
                  : "border-white/[0.08] bg-white/[0.015] hover:border-white/15",
              )}
            >
              <span className={cn("block text-[13px] font-medium", track === item.id ? "text-paper" : "text-paper/70")}>
                {item.label}
              </span>
              <span className="mt-1 block text-[10px] text-muted/60">{item.hint}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {UPCOMING.map((item) => (
            <span
              key={item}
              className="cursor-not-allowed rounded-full border border-white/[0.05] px-2.5 py-1 text-[10px] text-muted/35"
              title="规划中，暂未开放"
            >
              {item} · 规划中
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-muted">目标等级</span>
          <span className="font-mono text-[9px] text-muted/40">LEVEL</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "junior" as const, label: "初级", hint: "打基础" },
            { id: "middle" as const, label: "中级", hint: "能扛事" },
            { id: "senior" as const, label: "高级", hint: "定方案" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLevel(item.id)}
              aria-pressed={level === item.id}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition",
                level === item.id
                  ? "border-lime/40 bg-lime/[0.055]"
                  : "border-white/[0.08] bg-white/[0.015] hover:border-white/15",
              )}
            >
              <span className={cn("block text-[13px] font-medium", level === item.id ? "text-paper" : "text-paper/70")}>
                {item.label}
              </span>
              <span className="mt-1 block text-[9px] text-muted/60">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-muted">规划周期</span>
          <span className="font-mono text-[9px] text-muted/40">HORIZON</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {HORIZONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setHorizon(item.value)}
              aria-pressed={horizon === item.value}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition",
                horizon === item.value
                  ? "border-lime/40 bg-lime/[0.055]"
                  : "border-white/[0.08] bg-white/[0.015] hover:border-white/15",
              )}
            >
              <span className={cn("block font-mono text-[14px]", horizon === item.value ? "text-lime" : "text-paper/70")}>
                {item.label}
              </span>
              <span className="mt-0.5 block text-[9px] text-muted/60">{item.copy}</span>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="目标公司（可选）"
        name="company"
        placeholder="你感兴趣的公司"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        maxLength={80}
      />

      <Textarea
        label="目标公司 JD（可选，但建议粘贴）"
        name="jd"
        placeholder="粘贴你感兴趣岗位的 JD，路线会优先覆盖这些技能要求。"
        value={jd}
        onChange={(event) => setJd(event.target.value)}
        rows={5}
        maxLength={20000}
        hint={`${jd.length}/20000`}
      />

      {!hasResume ? (
        <div className="rounded-xl border border-amber/20 bg-amber/[0.04] px-3.5 py-2.5 text-[11px] leading-5 text-amber/80">
          你还没有保存简历，路线会按岗位核心技能生成。补充简历后可识别已有技能，避免重复补课。
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.06] px-3.5 py-2.5 text-[12px] text-coral">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
          {loading ? "正在排阶段路线…" : "生成规划路线"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
        <p className="text-[10px] leading-5 text-muted/45">
          生成阶段目标、章节任务与验收标准，进度由真实学习记录推进。
        </p>
      </div>
    </form>
  );
}
