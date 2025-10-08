/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        text: "#1F2937",
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
