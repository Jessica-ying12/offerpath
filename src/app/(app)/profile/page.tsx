import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import {
  Badge,
  buttonClass,
  PageHeader,
  Panel,
  SectionLabel,
} from "@/components/ui/primitives";
import { LogoutButton, ProfileForm } from "@/components/profile-form";
import { requireProfile, requireUser } from "@/lib/auth";
import { LEVEL_LABEL } from "@/lib/content/schema";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "个人设置" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const profile = await requireProfile(user);
  const initial = user.name.trim().slice(0, 1).toUpperCase();

  return (
    <div>
      <PageHeader
        eyebrow="PROFILE / SOURCE OF TRUTH"
        title="你的目标与材料。"
        description="方向和等级会影响题目难度与组题范围；简历与 JD 会被急冲计划和模拟面试复用。保存不会重置学习进度。"
        actions={
          <Link href="/dashboard" className={buttonClass("secondary", "sm")}>
            返回总览
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-lime/25 bg-lime/[0.08] font-mono text-lg text-lime">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-paper">{user.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge tone="lime">{profile.trackId === "mobile" ? "移动端" : "全栈"}</Badge>
              <Badge tone="outline">{LEVEL_LABEL[profile.level]}</Badge>
              {profile.onboarded ? <Badge tone="mint">已设定目标</Badge> : <Badge tone="amber">待设定</Badge>}
            </div>
            <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">加入时间</span>
                <span className="text-paper/70">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">目标岗位</span>
                <span className="max-w-[140px] truncate text-paper/70">{profile.targetRole || "未填写"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">默认简历</span>
                <span className="text-paper/70">{profile.resumeText ? "已保存" : "未填写"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">默认 JD</span>
                <span className="text-paper/70">{profile.jdText ? "已保存" : "未填写"}</span>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mint" />
              <p className="text-[12px] font-medium text-paper">数据边界</p>
            </div>
            <p className="mt-2 text-[10px] leading-5 text-muted/60">
              账号、简历、记录存储在当前实例的 SQLite 数据库中，按用户隔离。没有外部 AI 调用，也不会上传第三方。
            </p>
            <div className="mt-3 flex items-start gap-1.5 border-t border-white/[0.06] pt-3 text-[9px] leading-4 text-muted/35">
              <LockKeyhole className="mt-0.5 h-2.5 w-2.5 shrink-0" />
              当前为 MVP，未提供找回密码与多设备数据合并。
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted" />
              <p className="text-[12px] font-medium text-paper">账号</p>
            </div>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </Panel>

          <div className="px-1 text-[10px] leading-5 text-muted/40">
            想重新选方向？在上方表单修改后保存即可，历史学习记录会保留。
          </div>
        </aside>

        <Panel className="p-5 sm:p-7">
          <SectionLabel>EDIT PROFILE</SectionLabel>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-paper">目标与求职材料</h2>
          <p className="mt-1.5 text-[12px] leading-6 text-muted">
            等级应当选「现在能扛住 + 一点挑战」，不是最高级。材料越具体，计划和追问越贴近真实。
          </p>
          <div className="mt-6">
            <ProfileForm profile={profile} name={user.name} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
