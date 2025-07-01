/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        // DaisyUI color variables will be available through CSS variables
        primary: 'oklch(var(--p) / <alpha-value>)',
        'primary-content': 'oklch(var(--pc) / <alpha-value>)',
        secondary: 'oklch(var(--s) / <alpha-value>)',
        'secondary-content': 'oklch(var(--sc) / <alpha-value>)',
        accent: 'oklch(var(--a) / <alpha-value>)',
        'accent-content': 'oklch(var(--ac) / <alpha-value>)',
        neutral: 'oklch(var(--n) / <alpha-value>)',
        'neutral-content': 'oklch(var(--nc) / <alpha-value>)',
        'base-100': 'oklch(var(--b1) / <alpha-value>)',
        'base-200': 'oklch(var(--b2) / <alpha-value>)',
        'base-300': 'oklch(var(--b3) / <alpha-value>)',
        'base-content': 'oklch(var(--bc) / <alpha-value>)',
        info: 'oklch(var(--in) / <alpha-value>)',
        'info-content': 'oklch(var(--inc) / <alpha-value>)',
        success: 'oklch(var(--su) / <alpha-value>)',
        'success-content': 'oklch(var(--suc) / <alpha-value>)',
        warning: 'oklch(var(--wa) / <alpha-value>)',
        'warning-content': 'oklch(var(--wac) / <alpha-value>)',
        error: 'oklch(var(--er) / <alpha-value>)',
        'error-content': 'oklch(var(--erc) / <alpha-value>)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'level-up': 'levelUp 0.6s ease-out',
        'xp-gain': 'xpGain 0.4s ease-out',
        'pulse-success': 'pulseSuccess 0.8s ease-out',
      },
      keyframes: {
        levelUp: {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.1) rotate(5deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
        },
        xpGain: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '50%': { transform: 'translateY(-10px) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translateY(-20px) scale(1)', opacity: '0' }
        },
        pulseSuccess: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' }
        }
      },
      screens: {
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
        'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
      }
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        light: {
          'primary': '#3b82f6',
          'primary-content': '#ffffff',
          'secondary': '#8b5cf6',
          'secondary-content': '#ffffff',
          'accent': '#06b6d4',
          'accent-content': '#ffffff',
          'neutral': '#374151',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          'base-content': '#1f2937',
          'info': '#0ea5e9',
          'info-content': '#ffffff',
          'success': '#10b981',
          'success-content': '#ffffff',
          'warning': '#f59e0b',
          'warning-content': '#ffffff',
          'error': '#ef4444',
          'error-content': '#ffffff',
        },
        dark: {
          'primary': '#60a5fa',
          'primary-content': '#1e293b',
          'secondary': '#a78bfa',
          'secondary-content': '#1e293b',
          'accent': '#22d3ee',
          'accent-content': '#1e293b',
          'neutral': '#1f2937',
          'neutral-content': '#f9fafb',
          'base-100': '#111827',
          'base-200': '#1f2937',
          'base-300': '#374151',
          'base-content': '#f9fafb',
          'info': '#38bdf8',
          'info-content': '#1e293b',
          'success': '#34d399',
          'success-content': '#1e293b',
          'warning': '#fbbf24',
          'warning-content': '#1e293b',
          'error': '#f87171',
          'error-content': '#1e293b',
        }
      }
    ],
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
