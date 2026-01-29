/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    "from-pink-400",
    "to-fuchsia-500",
    "from-violet-400",
    "to-purple-500",
    "from-lime-400",
    "to-emerald-500",
    "from-cyan-500",
    "to-sky-600",
    "from-amber-400",
    "to-orange-500",
    "from-slate-500",
    "to-slate-700",
    "from-teal-400",
    "to-teal-600",
    "from-lime-500",
    "to-green-600",
    "from-sky-400",
    "to-blue-500",
    "from-rose-400",
    "to-pink-500",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        text: "var(--color-text)",
        primary: "#0066CC",
        primaryLight: "#338FE6",
        success: "#28A745",
        successLight: "#5BC37D",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.05)",
        glowPrimary: "0 0 8px rgba(0,102,204,0.4)",
        glowSuccess: "0 0 8px rgba(40,167,69,0.4)",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%":     { "background-position": "100% 50%" },
        },
      },
      animation: {
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
    },
  },
  plugins: [],
};
