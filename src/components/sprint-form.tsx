"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ScanSearch, ShieldCheck } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import type { LevelId, TrackId } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const URGENCY = [
  { value: 3 as const, label: "3 天", copy: "只保留最高频" },
  { value: 7 as const, label: "7 天", copy: "缺口 + 项目表达" },
  { value: 14 as const, label: "14 天", copy: "补基础再冲刺" },
];

export function SprintForm({
  initialTrack,
  initialLevel,
  initialCompany,
  initialResume,
  initialJd,
}: {
  initialTrack: TrackId;
  initialLevel: LevelId;
  initialCompany: string;
  initialResume: string;
  initialJd: string;
}) {
  const router = useRouter();
  const [track, setTrack] = useState<TrackId>(initialTrack);
  const [level, setLevel] = useState<LevelId>(initialLevel);
  const [urgency, setUrgency] = useState<3 | 7 | 14>(7);
  const [company, setCompany] = useState(initialCompany);
  const [resume, setResume] = useState(initialResume);
  const [jd, setJd] = useState(initialJd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => resume.trim().length >= 30 || jd.trim().length >= 30, [resume, jd]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError("简历或 JD 至少填写一项（不少于 30 字），才能做针对性匹配");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/plans/sprint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trackId: track,
          level,
          urgencyDays: urgency,
          company,
          resumeText: resume,
          jdText: jd,
        }),
      });
      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id) {
        setError(data.error ?? "生成失败，请稍后重试");
        return;
      }
      router.push(`/sprint/${data.id}`);
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
          <span className="text-[12px] font-medium text-muted">方向</span>
          <span className="font-mono text-[9px] text-muted/40">TRACK</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "mobile" as const, label: "移动端开发", hint: "Android / Kotlin / 跨端" },
            { id: "fullstack" as const, label: "全栈开发", hint: "React / Node / 数据库" },
            { id: "backend-java" as const, label: "Java 后端", hint: "Java / Spring / MySQL / Redis" },
            { id: "database-mysql" as const, label: "MySQL 数据库", hint: "建模 / 索引 / 事务 / 高可用" },
            { id: "cs-ai-foundations" as const, label: "CS / AI 前沿", hint: "HTTP / OS / LLM 工程" },
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
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-muted">目标等级</span>
          <span className="font-mono text-[9px] text-muted/40">LEVEL</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "junior" as const, label: "初级", hint: "基础与使用" },
            { id: "middle" as const, label: "中级", hint: "机制与取舍" },
            { id: "senior" as const, label: "高级", hint: "架构与治理" },
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
          <span className="text-[12px] font-medium text-muted">准备周期</span>
          <span className="font-mono text-[9px] text-muted/40">URGENCY</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {URGENCY.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setUrgency(item.value)}
              aria-pressed={urgency === item.value}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition",
                urgency === item.value
                  ? "border-lime/40 bg-lime/[0.055]"
                  : "border-white/[0.08] bg-white/[0.015] hover:border-white/15",
              )}
            >
              <span className={cn("block font-mono text-[14px]", urgency === item.value ? "text-lime" : "text-paper/70")}>
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
        placeholder="例如：字节跳动 / 一家你感兴趣的公司"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        maxLength={80}
      />

      <Textarea
        label="你的简历"
        name="resume"
        placeholder="粘贴简历文本：项目、技术栈、你负责的部分。至少 30 字。"
        value={resume}
        onChange={(event) => setResume(event.target.value)}
        rows={6}
        maxLength={20000}
        hint={`${resume.length}/20000`}
      />

      <Textarea
        label="目标岗位 JD"
        name="jd"
        placeholder="粘贴岗位描述与任职要求。与简历一起提供时，匹配会更准。"
        value={jd}
        onChange={(event) => setJd(event.target.value)}
        rows={6}
        maxLength={20000}
        hint={`${jd.length}/20000`}
      />

      {error ? (
        <div role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.06] px-3.5 py-2.5 text-[12px] text-coral">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={loading || !canSubmit}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
          {loading ? "正在提取技能与缺口…" : "生成专属急冲计划"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
        <p className="flex items-start gap-1.5 text-[10px] leading-5 text-muted/50">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
          基于技能词典的可解释匹配，不调用外部大模型；简历仅保存在本实例并只对你可见。
        </p>
      </div>
    </form>
  );
}
