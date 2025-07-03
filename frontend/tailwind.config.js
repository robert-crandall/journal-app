/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,ts,svelte}'],
	theme: {
		extend: {
			colors: {
				// These fallbacks ensure compatibility with older Tailwind versions
				// while we transition to the @theme approach
				brand: {
					50: 'var(--color-brand-50, #f0f9ff)',
					100: 'var(--color-brand-100, #e0f2fe)',
					200: 'var(--color-brand-200, #bae6fd)',
					300: 'var(--color-brand-300, #7dd3fc)',
					400: 'var(--color-brand-400, #38bdf8)',
					500: 'var(--color-brand-500, #0ea5e9)',
					600: 'var(--color-brand-600, #0284c7)',
					700: 'var(--color-brand-700, #0369a1)',
					800: 'var(--color-brand-800, #075985)',
					900: 'var(--color-brand-900, #0c4a6e)'
				},
				secondary: {
					500: 'var(--color-secondary-500, #8b5cf6)'
				},
				accent: {
					500: 'var(--color-accent-500, #10b981)'
				}
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				DEFAULT: 'var(--radius)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				full: 'var(--radius-full)'
			},
			boxShadow: {
				sm: 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)'
			},
			fontFamily: {
				sans: ['var(--font-sans)']
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms')
		// Add other plugins here
	]
};
