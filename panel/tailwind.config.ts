import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070a12",
          900: "#0a0e1a",
          800: "#0f1424",
          700: "#141a2e",
          600: "#1b2239",
          500: "#252d48",
        },
        hairline: "#1a2138",
        accent: {
          50: "#ecfdf5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          glow: "#34d39933",
        },
        amber: {
          400: "#fbbf24",
        },
        text: {
          primary: "#f4f1e8",
          secondary: "#a0a6b8",
          muted: "#5f667d",
          dim: "#3d4258",
        },
      },
      fontFamily: {
        display: ["'Instrument Serif'", "serif"],
        sans: ["'Geist'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": "0.6875rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
