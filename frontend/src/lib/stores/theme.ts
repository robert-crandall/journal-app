import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { preferencesApi } from '$lib/api';

// All available DaisyUI themes
export const availableThemes = [
	{ name: 'Auto', value: 'auto' },
	{ name: 'Light', value: 'light' },
	{ name: 'Dark', value: 'dark' },
	{ name: 'Cupcake', value: 'cupcake' },
	{ name: 'Bumblebee', value: 'bumblebee' },
	{ name: 'Emerald', value: 'emerald' },
	{ name: 'Corporate', value: 'corporate' },
	{ name: 'Synthwave', value: 'synthwave' },
	{ name: 'Retro', value: 'retro' },
	{ name: 'Cyberpunk', value: 'cyberpunk' },
	{ name: 'Valentine', value: 'valentine' },
	{ name: 'Halloween', value: 'halloween' },
	{ name: 'Garden', value: 'garden' },
	{ name: 'Forest', value: 'forest' },
	{ name: 'Aqua', value: 'aqua' },
	{ name: 'Lofi', value: 'lofi' },
	{ name: 'Pastel', value: 'pastel' },
	{ name: 'Fantasy', value: 'fantasy' },
	{ name: 'Wireframe', value: 'wireframe' },
	{ name: 'Black', value: 'black' },
	{ name: 'Luxury', value: 'luxury' },
	{ name: 'Dracula', value: 'dracula' },
	{ name: 'CMYK', value: 'cmyk' },
	{ name: 'Autumn', value: 'autumn' },
	{ name: 'Business', value: 'business' },
	{ name: 'Acid', value: 'acid' },
	{ name: 'Lemonade', value: 'lemonade' },
	{ name: 'Night', value: 'night' },
	{ name: 'Coffee', value: 'coffee' },
	{ name: 'Winter', value: 'winter' },
	{ name: 'Dim', value: 'dim' },
	{ name: 'Nord', value: 'nord' },
	{ name: 'Sunset', value: 'sunset' }
] as const;

export type Theme = (typeof availableThemes)[number]['value'];

function createThemeStore() {
	// Get initial theme from localStorage or default to 'auto'
	let initialTheme: Theme = 'auto';

	if (browser) {
		initialTheme = (localStorage.getItem('theme') as Theme) || 'auto';
	}

	const { subscribe, set, update } = writable<Theme>(initialTheme);

	async function syncThemeToBackend(theme: Theme, isAuthenticated?: boolean) {
		if (browser && isAuthenticated) {
			try {
				await preferencesApi.set('theme', theme);
			} catch (error) {
				console.warn('Failed to sync theme to backend:', error);
				// Continue with local storage fallback for offline support
			}
		}
	}

	function applyTheme(theme: Theme) {
		if (browser) {
			// Update localStorage for offline support
			localStorage.setItem('theme', theme);

			const html = document.documentElement;

			// Define which themes are considered dark for Tailwind dark mode
			const darkThemes = [
				'dark',
				'synthwave',
				'halloween',
				'forest',
				'black',
				'luxury',
				'dracula',
				'night',
				'coffee',
				'dim'
			];

			// Handle daisyUI theme switching and Tailwind dark mode classes
			if (theme === 'auto') {
				// Use system preference for auto mode
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				if (prefersDark) {
					html.setAttribute('data-theme', 'dark');
					html.classList.add('dark');
				} else {
					html.setAttribute('data-theme', 'light');
					html.classList.remove('dark');
				}
			} else {
				// Set the specific theme
				html.setAttribute('data-theme', theme);

				// Add/remove dark class based on theme
				if (darkThemes.includes(theme)) {
					html.classList.add('dark');
				} else {
					html.classList.remove('dark');
				}
			}
		}
	}

	// Listen for system theme changes when in auto mode
	let currentTheme: Theme = initialTheme;
	if (browser) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			if (currentTheme === 'auto') {
				applyTheme('auto');
			}
		});
	}

	return {
		subscribe,
		setTheme: async (theme: Theme, isAuthenticated = false) => {
			currentTheme = theme;
			applyTheme(theme);
			set(theme);

			// Sync to backend if user is authenticated
			await syncThemeToBackend(theme, isAuthenticated);
		},
		init: async (isAuthenticated = false) => {
			if (browser) {
				let themeToUse: Theme = 'auto';

				if (isAuthenticated) {
					// Try to get theme from backend first
					try {
						const response = await preferencesApi.getAll();
						const savedTheme = response.preferences?.theme as Theme;

						if (savedTheme && availableThemes.some((t) => t.value === savedTheme)) {
							themeToUse = savedTheme;
						}
					} catch (error) {
						console.warn('Failed to load theme from backend, using local storage:', error);
						// Fall back to local storage
						const localTheme = localStorage.getItem('theme') as Theme;
						if (localTheme && availableThemes.some((t) => t.value === localTheme)) {
							themeToUse = localTheme;
						}
					}
				} else {
					// Use local storage for non-authenticated users
					const savedTheme = localStorage.getItem('theme') as Theme;
					if (savedTheme && availableThemes.some((t) => t.value === savedTheme)) {
						themeToUse = savedTheme;
					}
				}

				currentTheme = themeToUse;
				applyTheme(themeToUse);
				set(themeToUse);
			}
		}
	};
}

export const theme = createThemeStore();
