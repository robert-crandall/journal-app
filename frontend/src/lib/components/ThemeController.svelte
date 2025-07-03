<script lang="ts">
	import { onMount } from 'svelte';

	let currentTheme = 'system';

	onMount(() => {
		// Get saved theme from localStorage or default to system
		const savedTheme = localStorage.getItem('theme') || 'system';
		currentTheme = savedTheme;

		if (savedTheme === 'system') {
			// Remove data-theme to let CSS prefers-color-scheme work
			document.documentElement.removeAttribute('data-theme');

			// Listen for system theme changes
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.addEventListener('change', handleSystemThemeChange);

			return () => {
				mediaQuery.removeEventListener('change', handleSystemThemeChange);
			};
		} else {
			document.documentElement.setAttribute('data-theme', savedTheme);
		}
	});

	function handleSystemThemeChange() {
		if (currentTheme === 'system') {
			// Force a re-render to update the icon
			currentTheme = currentTheme;
		}
	}

	function setTheme(theme: string) {
		currentTheme = theme;

		if (theme === 'system') {
			// Remove the data-theme attribute to let system preference take over
			document.documentElement.removeAttribute('data-theme');
			localStorage.setItem('theme', 'system');
		} else {
			document.documentElement.setAttribute('data-theme', theme);
			localStorage.setItem('theme', theme);
		}
	}

	function getSystemTheme() {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function getCurrentDisplayTheme() {
		if (currentTheme === 'system') {
			return getSystemTheme();
		}
		return currentTheme;
	}
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
		{#if getCurrentDisplayTheme() === 'light'}
			<!-- Sun icon for light mode -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="5" />
				<line x1="12" y1="1" x2="12" y2="3" />
				<line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" />
				<line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
			</svg>
		{:else}
			<!-- Moon icon for dark mode -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
			</svg>
		{/if}
	</div>
	<ul
		class="dropdown-content menu bg-base-100 rounded-box border-base-200 z-40 w-52 border p-2 shadow"
	>
		<li>
			<button
				class="justify-between"
				class:font-bold={currentTheme === 'light'}
				on:click={() => setTheme('light')}
			>
				<span>Light</span>
				{#if currentTheme === 'light'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
			</button>
		</li>
		<li>
			<button
				class="justify-between"
				class:font-bold={currentTheme === 'dark'}
				on:click={() => setTheme('dark')}
			>
				<span>Dark</span>
				{#if currentTheme === 'dark'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
			</button>
		</li>
		<li>
			<button
				class="justify-between"
				class:font-bold={currentTheme === 'system'}
				on:click={() => setTheme('system')}
			>
				<span>System</span>
				{#if currentTheme === 'system'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
			</button>
		</li>
	</ul>
</div>
