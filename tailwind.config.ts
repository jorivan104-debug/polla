import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        victory: "#F8C400",
        "stadium-dark": "#071B3A",
        "stadium-deep": "#02101F",
        "sport-blue": "#1148C7",
        "passion-red": "#D92727",
        "score-white": "#F5F5F5",
        "dark-gray": "#151515",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
      },
      backgroundImage: {
        "gradient-main":
          "linear-gradient(180deg, #071B3A 0%, #02101F 100%)",
        "gradient-sport":
          "linear-gradient(90deg, #F8C400 0%, #D92727 100%)",
        "gradient-premium":
          "linear-gradient(135deg, #1148C7 0%, #071B3A 100%)",
      },
      borderRadius: {
        btn: "12px",
      },
      transitionTimingFunction: {
        polla: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      animation: {
        "live-pulse": "live-pulse 1.5s ease-in-out infinite",
        "score-flash": "score-flash 0.4s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "fade-in": "fade-in 0.25s ease-out",
        "scale-in": "scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        "live-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.95)" },
        },
        "score-flash": {
          "0%": { color: "#F8C400", transform: "scale(1.15)" },
          "100%": { color: "#F5F5F5", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.7)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
