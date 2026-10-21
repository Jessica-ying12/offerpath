export const APP_NAME = "职跃";
export const APP_NAME_EN = "OFFERPATH";
export const SESSION_COOKIE = "op_session";
export const SESSION_TTL_DAYS = 7;
export const QUIZ_PASS_RATIO = 0.6;
export const MAX_RESUME_LENGTH = 20_000;
export const MAX_JD_LENGTH = 20_000;
export const MAX_ANSWER_LENGTH = 5_000;
export const MIN_ANSWER_LENGTH = 10;
export const DEMO_EMAIL = "demo@offerpath.dev";
export const DEMO_PASSWORD = "Demo123456";

export const APP_NAV = [
  { href: "/dashboard", label: "总览", mobileLabel: "首页" },
  { href: "/learn", label: "系统学习", mobileLabel: "学习" },
  { href: "/sprint", label: "急冲计划", mobileLabel: "冲刺" },
  { href: "/career", label: "职业规划", mobileLabel: "规划" },
  { href: "/interview", label: "模拟面试", mobileLabel: "面试" },
  { href: "/records", label: "学习记录", mobileLabel: "记录" },
] as const;

export const MOBILE_NAV = APP_NAV.filter((item) =>
  ["/dashboard", "/learn", "/sprint", "/interview", "/records"].includes(item.href),
);
