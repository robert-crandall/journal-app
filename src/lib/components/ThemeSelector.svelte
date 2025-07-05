<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'light' | 'dark' | 'auto';
	let currentTheme = $state<Theme>('auto');

	function setTheme(theme: Theme) {
		currentTheme = theme;
		localStorage.setItem('theme', theme);
		applyTheme();
	}

	function applyTheme() {
		const html = document.documentElement;

		if (currentTheme === 'auto') {
			// Use system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
		} else {
			html.setAttribute('data-theme', currentTheme);
		}
	}

	onMount(() => {
		// Load saved theme or default to auto
		const savedTheme = localStorage.getItem('theme') as Theme;
		if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
			currentTheme = savedTheme;
		}

		applyTheme();

		// Listen for system theme changes when in auto mode
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleSystemThemeChange = () => {
			if (currentTheme === 'auto') {
				applyTheme();
			}
		};

		mediaQuery.addEventListener('change', handleSystemThemeChange);

		return () => {
			mediaQuery.removeEventListener('change', handleSystemThemeChange);
		};
	});
</script>

<div class="dropdown dropdown-end">
	<div
		tabindex="0"
		role="button"
		class="btn btn-ghost btn-circle"
		data-testid="theme-selector-button"
	>
		{#if currentTheme === 'light'}
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		{:else if currentTheme === 'dark'}
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20.354 15.354A9 9 0 718.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
				/>
			</svg>
		{:else}
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
		{/if}
	</div>
	<ul
		class="dropdown-content menu bg-base-100 rounded-box z-[2] w-32 p-2 shadow"
		data-testid="theme-selector-dropdown"
	>
		<li>
			<button onclick={() => setTheme('light')} class:active={currentTheme === 'light'}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
				Light
			</button>
		</li>
		<li>
			<button onclick={() => setTheme('dark')} class:active={currentTheme === 'dark'}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20.354 15.354A9 9 0 718.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
				Dark
			</button>
		</li>
		<li>
			<button onclick={() => setTheme('auto')} class:active={currentTheme === 'auto'}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				Auto
			</button>
		</li>
	</ul>
</div>
