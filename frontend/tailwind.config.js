/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,ts,svelte}'],
	theme: {
		extend: {}
	},
	plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms'), require('daisyui')]
};
