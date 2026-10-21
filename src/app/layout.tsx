import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "职跃 OfferPath · 程序员求职与技能进阶",
    template: "%s · 职跃 OfferPath",
  },
  description:
    "把求职拆成今天能完成的一小步：移动端、全栈、Java 后端、MySQL 与计算机基础/AI 前沿的逐点精讲、题库、周期复习、简历/JD 急冲、自适应模拟面试与学习报告。",
  applicationName: "职跃 OfferPath",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#070b0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
