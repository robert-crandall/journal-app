import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { preferencesApi } from '$lib/api';

// Simplified theme options for Atlassian-style design
export const availableThemes = [
	{ name: 'Light', value: 'light' },
	{ name: 'Dark', value: 'dark' },
	{ name: 'Auto', value: 'auto' }
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
			
			// Handle Tailwind dark mode classes
			if (theme === 'dark') {
				html.classList.add('dark');
			} else if (theme === 'light') {
				html.classList.remove('dark');
			} else if (theme === 'auto') {
				// Use system preference for auto mode
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				if (prefersDark) {
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
