import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0E17",
        surface: "#121826",
        surfaceborder: "#1F2937",
        muted: "#8B93A7",
        needs: "#60A5FA",
        wants: "#FBBF24",
        savings: "#34D399",
        income: "#34D399",
        over: "#F87171",
        personal: "#38BDF8",
        business: "#A78BFA",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
