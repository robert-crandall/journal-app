/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0eaff',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        journal: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
        },
        experiment: {
          active: '#22c55e',
          complete: '#a855f7',
        },
        stat: {
          strength: '#ef4444',
          intelligence: '#3b82f6',
          wisdom: '#f59e0b',
        },
      },
      screens: {
        'xs': '475px',
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1400px',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          primary: '#3b82f6',
          'primary-focus': '#2563eb',
          'primary-content': '#ffffff',
          secondary: '#6366f1',
          'secondary-focus': '#4f46e5',
          'secondary-content': '#ffffff',
          accent: '#22c55e',
          'accent-focus': '#16a34a',
          'accent-content': '#ffffff',
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          primary: '#3b82f6',
          'primary-focus': '#2563eb',
          'primary-content': '#ffffff',
          secondary: '#6366f1',
          'secondary-focus': '#4f46e5',
          'secondary-content': '#ffffff',
          accent: '#22c55e',
          'accent-focus': '#16a34a',
          'accent-content': '#ffffff',
        },
      },
      'dracula',
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: true,
    themeRoot: ':root',
  },
}
