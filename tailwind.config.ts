import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        card2: "var(--card2)",
        border: "var(--border)",
        green: {
          DEFAULT: "var(--green)",
          dim: "var(--green-dim)",
        },
        amber: "var(--amber)",
        red: "var(--red)",
        blue: "var(--blue)",
        text: "var(--text)",
        muted: "var(--muted)",
        sub: "var(--sub)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "1200px",
        content: "720px",
      },
    },
  },
  plugins: [],
};
export default config;
