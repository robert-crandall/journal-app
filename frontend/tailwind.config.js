/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        // ADHD/INTJ-friendly light theme
        light: {
          'primary': '#4f46e5',
          'primary-focus': '#4338ca',
          'primary-content': '#ffffff',
          'secondary': '#7c3aed',
          'secondary-focus': '#6d28d9',
          'secondary-content': '#ffffff',
          'accent': '#06b6d4',
          'accent-focus': '#0891b2',
          'accent-content': '#ffffff',
          'neutral': '#374151',
          'neutral-focus': '#1f2937',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          'base-content': '#1f2937',
          'info': '#3b82f6',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444'
        }
      },
      {
        // ADHD/INTJ-friendly dark theme
        dark: {
          'primary': '#6366f1',
          'primary-focus': '#4f46e5',
          'primary-content': '#ffffff',
          'secondary': '#8b5cf6',
          'secondary-focus': '#7c3aed',
          'secondary-content': '#ffffff',
          'accent': '#06b6d4',
          'accent-focus': '#0891b2',
          'accent-content': '#ffffff',
          'neutral': '#6b7280',
          'neutral-focus': '#4b5563',
          'neutral-content': '#ffffff',
          'base-100': '#1f2937',
          'base-200': '#111827',
          'base-300': '#0f172a',
          'base-content': '#f9fafb',
          'info': '#3b82f6',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444'
        }
      }
    ],
    base: true,
    styled: true,
    utils: true
  }
};
