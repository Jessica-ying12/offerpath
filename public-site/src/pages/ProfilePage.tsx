import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Download, Trash2, UserPlus, Users } from "lucide-react";
import { ROLES } from "../lib/content";
import { useStore } from "../lib/store";
import { EmptyState, PageContainer, PageHeader } from "../components/ui";

export function ProfilePage() {
  const {
    activeProfile,
    profiles,
    state,
    setRole,
    renameProfile,
    createProfile,
    switchProfile,
    deleteProfile,
    completedDocs,
    masteredQa,
    dueQa,
  } = useStore();
  const [name, setName] = useState(activeProfile.name);
  const [newName, setNewName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(activeProfile.name);
    setSaved(false);
  }, [activeProfile.id, activeProfile.name]);

  const saveName = () => {
    if (!name.trim() || name.trim() === activeProfile.name) return;
    renameProfile(activeProfile.id, name);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <PageContainer className="max-w-4xl">
      <div className="mb-4 flex items-center gap-2 text-[10.5px] text-muted">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> 总览
        </Link>
        <span className="text-line/30">/</span>
        <span>用户与数据</span>
      </div>
      <PageHeader
        eyebrow="LOCAL PROFILES · PER-USER DATA"
        title="用户与数据"
        description="这是本机多用户：每个用户拥有独立的阅读进度、笔记、问答掌握度和题库记录。不需要登录，但不会跨设备自动同步。"
        actions={<Link to="/progress" className="btn-ghost"><Download className="h-3.5 w-3.5" /> 备份与设置</Link>}
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/12 font-display text-[20px] font-bold text-accent">
                {activeProfile.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink">当前用户</p>
                <p className="text-[10px] text-muted">数据只保存在这个浏览器</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} className="input" />
              <button onClick={saveName} disabled={!name.trim() || name.trim() === activeProfile.name} className="btn-primary shrink-0">
                {saved ? <Check className="h-3.5 w-3.5" /> : null}
                {saved ? "已保存" : "保存名字"}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line/10 pt-4 text-center">
              <div>
                <p className="font-display text-[20px] font-bold text-ink">{completedDocs}</p>
                <p className="text-[9px] text-muted">精读完成</p>
              </div>
              <div>
                <p className="font-display text-[20px] font-bold text-ink">{masteredQa}</p>
                <p className="text-[9px] text-muted">问答掌握</p>
              </div>
              <div>
                <p className="font-display text-[20px] font-bold text-coral">{dueQa}</p>
                <p className="text-[9px] text-muted">待复习</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow mb-1">TARGET ROLE</p>
                <h2 className="text-[14px] font-semibold text-ink">这个用户的目标岗位</h2>
              </div>
              <Link to="/plan" className="text-[10px] text-accent">按 JD 定制 →</Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLES.map((role) => {
                const selected = state.role === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setRole(role.id)}
                    className={`rounded-xl border p-3 text-left transition ${selected ? "border-accent/40 bg-accent/[0.055]" : "border-line/10 hover:border-accent/25"}`}
                  >
                    <span className={`text-[11px] font-semibold ${selected ? "text-accent" : "text-ink"}`}>{role.label}</span>
                    <span className="mt-0.5 block text-[9px] leading-4 text-muted">{role.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="text-[14px] font-semibold text-ink">全部本机用户</h2>
            </div>
            <div className="space-y-1.5">
              {profiles.map((profile) => (
                <div key={profile.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${profile.id === activeProfile.id ? "border-accent/25 bg-accent/[0.04]" : "border-line/10"}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raised font-mono text-[10px] text-muted">{profile.name.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-medium text-ink">{profile.name}</p>
                    <p className="text-[8.5px] text-muted">创建于 {new Date(profile.createdAt).toLocaleDateString("zh-CN")}</p>
                  </div>
                  {profile.id === activeProfile.id ? (
                    <span className="chip border-accent/20 text-accent">当前</span>
                  ) : (
                    <button onClick={() => switchProfile(profile.id)} className="btn-quiet text-[9.5px]">切换</button>
                  )}
                  <button
                    disabled={profiles.length <= 1}
                    onClick={() => {
                      if (window.confirm(`删除本机用户「${profile.name}」及其数据？不可恢复。`)) deleteProfile(profile.id);
                    }}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-coral/10 hover:text-coral disabled:opacity-30"
                    aria-label={`删除 ${profile.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 border-t border-line/10 pt-3">
              <input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={24} placeholder="新用户名字，例如：面试冲刺" className="input py-2 text-[11px]" />
              <button
                onClick={() => {
                  if (!newName.trim()) return;
                  createProfile(newName);
                  setNewName("");
                }}
                disabled={!newName.trim()}
                className="btn-primary shrink-0 py-2 text-[11px]"
              >
                <UserPlus className="h-3.5 w-3.5" /> 新建
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line/10 bg-raised/30 p-4">
            <p className="eyebrow mb-2">数据边界</p>
            <p className="text-[10.5px] leading-5 text-muted">
              本机用户解决同一浏览器下的数据隔离，不等于云端账号。清理浏览器数据会丢失记录；请在学习进度页导出 JSON。
            </p>
            <Link to="/progress" className="mt-2 inline-flex items-center gap-1 text-[10px] text-accent">
              导出 / 导入 <Download className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-2xl border border-line/10 bg-surface p-4">
            <p className="eyebrow mb-2">为什么不是登录？</p>
            <p className="text-[10.5px] leading-5 text-muted">
              公开站是静态站点，先保证打开速度和隐私；完整训练版提供账号、SQLite 记录与后端。
            </p>
          </div>
          {profiles.length === 1 ? (
            <EmptyState title="再建一个用户试试" description="例如「面试冲刺」和「日常学习」分开记录。" />
          ) : null}
        </aside>
      </div>
    </PageContainer>
  );
}
