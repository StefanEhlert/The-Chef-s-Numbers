/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Diese werden später dynamisch aus designTemplates.ts gesetzt
        // Hier definieren wir nur Fallback-Werte
      }
    }
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "corporate",
      "retro",
      {
        custom: {
          "primary": "#3b82f6",
          "secondary": "#10b981",
          "accent": "#f59e0b",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        }
      }
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  }
}

