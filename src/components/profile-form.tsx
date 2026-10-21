"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProfileForm({ profile, name }: { profile: Profile; name: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name,
    trackId: profile.trackId,
    level: profile.level,
    targetRole: profile.targetRole,
    targetCompany: profile.targetCompany,
    resumeText: profile.resumeText,
    jdText: profile.jdText,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("昵称至少 2 个字符");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败，请稍后重试");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form method="post" onSubmit={submit} className="space-y-7">
      <section>
        <div className="eyebrow mb-4 text-lime/70">01 / IDENTITY</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="昵称"
            name="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            maxLength={40}
          />
          <Input
            label="目标岗位"
            name="targetRole"
            placeholder="例如：全栈开发工程师"
            value={form.targetRole}
            onChange={(event) => update("targetRole", event.target.value)}
            maxLength={80}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-medium text-muted">当前方向</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "mobile" as TrackId, label: "移动端" },
                { id: "fullstack" as TrackId, label: "全栈" },
                { id: "backend-java" as TrackId, label: "Java 后端" },
                { id: "database-mysql" as TrackId, label: "MySQL" },
                { id: "cs-ai-foundations" as TrackId, label: "CS / AI" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update("trackId", item.id)}
                  aria-pressed={form.trackId === item.id}
                  className={cn(
                    "rounded-lg border py-2.5 text-[12px] transition",
                    form.trackId === item.id
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
            <p className="mb-2 text-[12px] font-medium text-muted">目标等级</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "junior" as LevelId, label: "初级" },
                { id: "middle" as LevelId, label: "中级" },
                { id: "senior" as LevelId, label: "高级" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update("level", item.id)}
                  aria-pressed={form.level === item.id}
                  className={cn(
                    "rounded-lg border py-2.5 text-[12px] transition",
                    form.level === item.id
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

        <div className="mt-4">
          <Input
            label="目标公司"
            name="targetCompany"
            placeholder="例如：你正在准备的公司"
            value={form.targetCompany}
            onChange={(event) => update("targetCompany", event.target.value)}
            maxLength={80}
          />
        </div>
      </section>

      <div className="h-px bg-white/[0.06]" />

      <section>
        <div className="eyebrow mb-4 text-lime/70">02 / MATERIALS</div>
        <div className="space-y-4">
          <Textarea
            label="默认简历"
            name="resume"
            placeholder="保存后，急冲计划与模拟面试会自动带入；也可在单次生成时临时修改。"
            value={form.resumeText}
            onChange={(event) => update("resumeText", event.target.value)}
            rows={8}
            maxLength={20000}
            hint={`${form.resumeText.length}/20000`}
          />
          <Textarea
            label="默认目标 JD"
            name="jd"
            placeholder="粘贴你重点准备的岗位 JD，计划与面试会优先覆盖这些技能。"
            value={form.jdText}
            onChange={(event) => update("jdText", event.target.value)}
            rows={6}
            maxLength={20000}
            hint={`${form.jdText.length}/20000`}
          />
        </div>
        <p className="mt-2 text-[10px] leading-5 text-muted/45">
          简历与 JD 仅存储在本地实例，按账号隔离，不会发送给任何外部服务。
        </p>
      </section>

      {error ? (
        <div role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.06] px-3.5 py-2.5 text-[12px] text-coral">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="flex items-center gap-2 rounded-xl border border-mint/20 bg-mint/[0.04] px-3.5 py-2.5 text-[12px] text-mint">
          <CheckCircle2 className="h-4 w-4" />
          已保存。计划与面试会使用最新资料。
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
        <p className="text-[10px] text-muted/40">保存不会重置任何学习进度。</p>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "保存中…" : "保存资料"}
        </Button>
      </div>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      退出登录
    </Button>
  );
}
