"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MessagesSquare, ShieldCheck } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type { InterviewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: Array<{ id: InterviewMode; label: string; copy: string; need: string }> = [
  { id: "resume", label: "简历深挖", copy: "从项目细节开问，再问知识", need: "需要简历" },
  { id: "jd", label: "JD 定向", copy: "围绕目标岗位要求组题", need: "需要 JD" },
  { id: "position", label: "岗位通用", copy: "按方向和等级抽知识题", need: "无需文本" },
];

export function InterviewForm({
  initialTrack,
  initialLevel,
  initialMode,
  initialCompany,
  initialResume,
  initialJd,
}: {
  initialTrack: TrackId;
  initialLevel: LevelId;
  initialMode: InterviewMode;
  initialCompany: string;
  initialResume: string;
  initialJd: string;
}) {
  const router = useRouter();
  const [track, setTrack] = useState<TrackId>(initialTrack);
  const [level, setLevel] = useState<LevelId>(initialLevel);
  const [mode, setMode] = useState<InterviewMode>(initialMode);
  const [company, setCompany] = useState(initialCompany);
  const [resume, setResume] = useState(initialResume);
  const [jd, setJd] = useState(initialJd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "resume" && resume.trim().length < 20) {
      setError("基于简历面试需要填写简历（至少 20 字）");
      return;
    }
    if (mode === "jd" && jd.trim().length < 20) {
      setError("基于 JD 面试需要填写岗位 JD（至少 20 字）");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trackId: track, level, mode, company, resumeText: resume, jdText: jd }),
      });
      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "创建面试失败，请稍后重试");
        return;
      }
      router.push(`/interview/${data.id}`);
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
          <span className="text-[12px] font-medium text-muted">面试方式</span>
          <span className="font-mono text-[9px] text-muted/40">MODE</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              aria-pressed={mode === item.id}
              className={cn(
                "rounded-xl border p-3.5 text-left transition",
                mode === item.id
                  ? "border-lime/40 bg-lime/[0.055]"
                  : "border-white/[0.08] bg-white/[0.015] hover:border-white/15",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-[13px] font-medium", mode === item.id ? "text-paper" : "text-paper/70")}>
                  {item.label}
                </span>
                <span className="font-mono text-[8px] text-muted/40">{item.need}</span>
              </div>
              <span className="mt-1.5 block text-[10px] leading-5 text-muted/60">{item.copy}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">方向</span>
            <span className="font-mono text-[9px] text-muted/40">TRACK</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "mobile" as const, label: "移动端" },
              { id: "fullstack" as const, label: "全栈" },
              { id: "backend-java" as const, label: "Java 后端" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id)}
                aria-pressed={track === item.id}
                className={cn(
                  "rounded-lg border py-2.5 text-[12px] transition",
                  track === item.id
                    ? "border-lime/40 bg-lime/[0.055] text-paper"
                    : "border-white/[0.08] text-muted hover:border-white/15",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">等级</span>
            <span className="font-mono text-[9px] text-muted/40">LEVEL</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "junior" as const, label: "初级" },
              { id: "middle" as const, label: "中级" },
              { id: "senior" as const, label: "高级" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id)}
                aria-pressed={level === item.id}
                className={cn(
                  "rounded-lg border py-2.5 text-[12px] transition",
                  level === item.id
                    ? "border-lime/40 bg-lime/[0.055] text-paper"
                    : "border-white/[0.08] text-muted hover:border-white/15",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Input
        label="目标公司（可选）"
        name="company"
        placeholder="例如：你正在准备的公司"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        maxLength={80}
      />

      <Textarea
        label={mode === "resume" ? "简历（必需）" : "简历（JD 面时用于项目追问，可选）"}
        name="resume"
        placeholder="粘贴简历中的项目、技术栈、职责与结果。项目描述越具体，追问越贴近真实。"
        value={resume}
        onChange={(event) => setResume(event.target.value)}
        rows={6}
        maxLength={20000}
        hint={`${resume.length}/20000`}
      />

      <Textarea
        label={mode === "jd" ? "岗位 JD（必需）" : "岗位 JD（可选）"}
        name="jd"
        placeholder="粘贴目标岗位的职责与要求，知识题会优先覆盖这些技能。"
        value={jd}
        onChange={(event) => setJd(event.target.value)}
        rows={5}
        maxLength={20000}
        hint={`${jd.length}/20000`}
      />

      {error ? (
        <div role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.06] px-3.5 py-2.5 text-[12px] text-coral">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
          {loading ? "面试官正在准备问题…" : "进入模拟面试"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
        <p className="flex items-start gap-1.5 text-[10px] leading-5 text-muted/50">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
          规则引擎组题与评估，展示命中/遗漏要点；不调用外部大模型。
        </p>
      </div>
    </form>
  );
}
