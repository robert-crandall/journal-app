import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Internal stores
const theme = writable<Theme>('system');
const resolvedTheme = writable<'light' | 'dark'>('light');
const isSystemSupported = writable(false);

// Theme management functions
function updateResolvedTheme() {
	if (!browser) return;

	theme.subscribe((currentTheme) => {
		let newResolvedTheme: 'light' | 'dark' = 'light';

		if (currentTheme === 'system' && window.matchMedia !== undefined) {
			newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
		} else if (currentTheme !== 'system') {
			newResolvedTheme = currentTheme;
		}

		resolvedTheme.set(newResolvedTheme);
		applyTheme(newResolvedTheme);
	})();
}

function applyTheme(theme: 'light' | 'dark') {
	if (!browser) return;

	const html = document.documentElement;

	// Update DaisyUI theme attribute
	html.setAttribute('data-theme', theme);

	// Update class for additional styling if needed
	html.classList.remove('light', 'dark');
	html.classList.add(theme);

	// Update meta theme-color for mobile browsers and PWA
	const themeColorMeta = document.querySelector('meta[name="theme-color"]');
	if (themeColorMeta) {
		const themeColor = theme === 'dark' ? '#1f2937' : '#3b82f6';
		themeColorMeta.setAttribute('content', themeColor);
	}
}

function initializeTheme() {
	if (!browser) return;

	// Check if system preferences are supported
	isSystemSupported.set(window.matchMedia !== undefined);

	// Load saved theme preference, default to 'system'
	const saved = localStorage.getItem('theme') as Theme | null;
	if (saved && ['light', 'dark', 'system'].includes(saved)) {
		theme.set(saved);
	}

	// Update resolved theme based on current theme
	updateResolvedTheme();

	// Listen for system theme changes
	if (window.matchMedia !== undefined) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			updateResolvedTheme();
		};

		mediaQuery.addEventListener('change', handleChange);
	}
}

// Theme store with actions and derived values
export const themeStore = {
	// Subscribe to theme state
	subscribe: theme.subscribe,

	// Derived stores
	resolvedTheme: { subscribe: resolvedTheme.subscribe },
	isSystemSupported: { subscribe: isSystemSupported.subscribe },

	// Derived reactive values
	isDark: derived(resolvedTheme, ($resolvedTheme) => $resolvedTheme === 'dark'),
	isLight: derived(resolvedTheme, ($resolvedTheme) => $resolvedTheme === 'light'),
	isSystem: derived(theme, ($theme) => $theme === 'system'),

	// Actions
	setTheme(newTheme: Theme) {
		theme.set(newTheme);
		if (browser) {
			localStorage.setItem('theme', newTheme);
			updateResolvedTheme();
		}
	},

	toggleTheme() {
		theme.update((currentTheme) => {
			// Cycle through: light -> dark -> system -> light
			if (currentTheme === 'light') {
				const newTheme = 'dark';
				if (browser) localStorage.setItem('theme', newTheme);
				updateResolvedTheme();
				return newTheme;
			} else if (currentTheme === 'dark') {
				const newTheme = 'system';
				if (browser) localStorage.setItem('theme', newTheme);
				updateResolvedTheme();
				return newTheme;
			} else {
				const newTheme = 'light';
				if (browser) localStorage.setItem('theme', newTheme);
				updateResolvedTheme();
				return newTheme;
			}
		});
	},

	// Set theme to light
	setLight() {
		this.setTheme('light');
	},

	// Set theme to dark
	setDark() {
		this.setTheme('dark');
	},

	// Set theme to follow system
	setSystem() {
		this.setTheme('system');
	},

	// Initialize the theme system
	initialize() {
		initializeTheme();
	}
};
