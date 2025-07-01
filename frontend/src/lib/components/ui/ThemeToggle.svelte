<script lang="ts">
	import { themeStore, type Theme } from '$lib/stores/theme';
	import { Sun, Moon, Monitor } from 'lucide-svelte';

	// Get theme icon based on current theme
	function getThemeIcon(theme: Theme) {
		switch (theme) {
			case 'light':
				return Sun;
			case 'dark':
				return Moon;
			case 'system':
				return Monitor;
		}
	}

	// Get theme label for accessibility
	function getThemeLabel(theme: Theme) {
		switch (theme) {
			case 'light':
				return 'Light mode';
			case 'dark':
				return 'Dark mode';
			case 'system':
				return 'System preference';
		}
	}

	// Handle theme toggle
	function handleToggle() {
		themeStore.toggleTheme();
	}

	// Get current theme reactively using store subscription
	$: currentTheme = $themeStore;
	$: CurrentIcon = getThemeIcon(currentTheme);
	$: label = getThemeLabel(currentTheme);
</script>

<button
	type="button"
	onclick={handleToggle}
	class="btn btn-ghost btn-circle theme-toggle"
	aria-label={`Current theme: ${label}. Click to cycle themes.`}
	title={label}
>
	<CurrentIcon size={20} class="theme-icon transition-all duration-300 ease-in-out" />
</button>

<style>
	/* Theme toggle animation styles */
	.theme-toggle {
		position: relative;
		transition: all 0.3s ease-in-out;
	}

	.theme-toggle:hover {
		transform: scale(1.05);
	}

	.theme-toggle:active {
		transform: scale(0.95);
	}

	/* Icon animation */
	:global(.theme-icon) {
		transition:
			transform 0.3s ease-in-out,
			opacity 0.2s ease-in-out;
	}

	.theme-toggle:hover :global(.theme-icon) {
		transform: rotate(15deg);
	}

	/* Smooth theme transition */
	:global(html) {
		transition:
			background-color 0.3s ease-in-out,
			color 0.3s ease-in-out;
	}

	:global(html *) {
		transition:
			background-color 0.3s ease-in-out,
			border-color 0.3s ease-in-out,
			color 0.3s ease-in-out;
	}

	/* Disable transitions on theme change to prevent flash */
	:global(html.theme-transitioning *) {
		transition: none !important;
	}
</style>
