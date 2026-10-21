import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Brand } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";

const PROOF = [
  "90 个知识点精讲，学完立刻做题",
  "简历 + JD 生成可解释的急冲清单",
  "面试答错有引导，答好继续追问",
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_65%)]" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full bg-lime/[0.06] blur-[100px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1320px] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden flex-col justify-between border-r border-white/[0.06] p-10 lg:flex xl:p-14">
          <div>
            <Brand />
            <div className="mt-24 max-w-lg">
              <div className="eyebrow mb-5 text-lime/80">THE TRAINING LOOP</div>
              <h2 className="text-balance text-[42px] font-semibold leading-[1.15] tracking-[-0.04em] text-paper">
                求职不是读完一本书，
                <br />
                是练会<span className="text-lime">一组动作</span>。
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-muted">
                小颗粒学习、章节练习、错题回炉、模拟面试追问，最后全部记录成你自己的证据。
              </p>
              <ul className="mt-10 space-y-4">
                {PROOF.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] leading-6 text-paper/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime/12 text-lime">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted/50">
              MOBILE · FULLSTACK · JUNIOR → SENIOR
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] text-muted transition hover:text-paper"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回首页
            </Link>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between px-5 py-5 lg:hidden">
            <Brand />
            <Link href="/" className="text-[12px] text-muted">
              返回首页
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-5 pb-14 pt-4 sm:px-8">
            <div className="w-full max-w-[420px]">{children}</div>
          </div>
          <div className="hidden px-10 pb-8 lg:block">
            <p className="eyebrow text-muted/40">BUILD THE SIGNAL. NOT THE ANXIETY.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
