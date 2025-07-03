<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Theme state
	let theme = 'light';

	onMount(() => {
		if (browser) {
			// Check for system preference on initial load
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				theme = 'dark';
				document.documentElement.setAttribute('data-theme', 'dark');
			}

			// Check for stored preference
			const storedTheme = localStorage.getItem('theme');
			if (storedTheme) {
				theme = storedTheme;
				document.documentElement.setAttribute('data-theme', theme);
			}
		}
	});

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		if (browser) {
			localStorage.setItem('theme', theme);
		}
	}
</script>

<button
	aria-label="Toggle theme"
	class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-white transition-colors hover:bg-indigo-500/30"
	on:click={toggleTheme}
>
	{#if theme === 'light'}
		<!-- Moon icon for dark mode -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="lucide lucide-moon"
		>
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	{:else}
		<!-- Sun icon for light mode -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="lucide lucide-sun"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	{/if}
</button>
