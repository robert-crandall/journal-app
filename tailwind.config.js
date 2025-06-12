/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#6366f1", // indigo-500
          secondary: "#8b5cf6", // violet-500
          accent: "#f59e0b", // amber-500
          neutral: "#27272a", // zinc-800
          "base-100": "#f8fafc", // slate-50
          "base-200": "#f1f5f9", // slate-100
          "base-300": "#e2e8f0", // slate-200
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#818cf8", // indigo-400
          secondary: "#a78bfa", // violet-400
          accent: "#fbbf24", // amber-400
          "base-100": "#1e293b", // slate-800
          "base-200": "#0f172a", // slate-900
          "base-300": "#020617", // slate-950
        }
      }
    ],
    darkTheme: "dark",
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif']
      },
    },
  },
  plugins: [require('daisyui')],
}
