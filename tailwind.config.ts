import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#141c2f",
        mist: "#eff3ff",
        harbor: "#7cc8c2",
        leaf: "#8ee29f",
        amber: "#f4c06a",
        coral: "#ef7d7a",
        rose: "#f3b9d1",
      },
      boxShadow: {
        panel: "0 30px 80px rgba(13, 25, 49, 0.16)",
        glow: "0 0 0 1px rgba(255,255,255,0.18), 0 20px 60px rgba(124, 200, 194, 0.24)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), transparent 32%), radial-gradient(circle at 80% 0%, rgba(244,192,106,0.2), transparent 26%), radial-gradient(circle at 50% 100%, rgba(124,200,194,0.28), transparent 34%)",
      },
    },
  },
  plugins: [],
};

export default config;
