import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070B0A",
          900: "#0A100E",
          850: "#0E1513",
          800: "#111A17",
          700: "#17231F",
          600: "#1E2D27",
          500: "#2A3C34",
        },
        paper: "#F1F6F2",
        muted: "#93A69C",
        lime: "#C9F56A",
        mint: "#79E3C1",
        amber: "#FFC46B",
        coral: "#FF8C7A",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
      },
      borderRadius: {
        card: "1.125rem",
      },
      boxShadow: {
        lift: "0 16px 48px -24px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px rgba(201,245,106,0.18), 0 12px 40px -18px rgba(201,245,106,0.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
