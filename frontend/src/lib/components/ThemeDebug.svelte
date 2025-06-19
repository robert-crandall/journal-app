<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let currentTheme = '';
	let htmlDataTheme = '';
	let htmlClass = '';

	onMount(() => {
		// Subscribe to theme changes
		const unsubscribe = theme.subscribe((t) => {
			currentTheme = t;
		});

		// Check DOM attributes
		const checkDOM = () => {
			htmlDataTheme = document.documentElement.getAttribute('data-theme') || 'none';
			htmlClass = document.documentElement.className;
		};

		checkDOM();

		// Check every second for updates
		const interval = setInterval(checkDOM, 1000);

		return () => {
			unsubscribe();
			clearInterval(interval);
		};
	});
</script>

<div class="fixed bottom-4 right-4 z-50 rounded-lg border border-base-300 bg-base-100 p-4 text-xs shadow-lg">
	<h3 class="mb-2 font-bold text-base-content">Theme Debug</h3>
	<div class="space-y-1 text-base-content/70">
		<div>Store Theme: {currentTheme}</div>
		<div>HTML data-theme: {htmlDataTheme}</div>
		<div>HTML classes: {htmlClass || 'none'}</div>
	</div>
	
	<!-- Color test squares -->
	<div class="mt-3 grid grid-cols-4 gap-1">
		<div class="h-4 w-4 bg-primary" title="primary"></div>
		<div class="h-4 w-4 bg-secondary" title="secondary"></div>
		<div class="h-4 w-4 bg-accent" title="accent"></div>
		<div class="h-4 w-4 bg-base-100 border border-base-300" title="base-100"></div>
		<div class="h-4 w-4 bg-base-200" title="base-200"></div>
		<div class="h-4 w-4 bg-base-300" title="base-300"></div>
		<div class="h-4 w-4 bg-info" title="info"></div>
		<div class="h-4 w-4 bg-success" title="success"></div>
		<div class="h-4 w-4 bg-warning" title="warning"></div>
		<div class="h-4 w-4 bg-error" title="error"></div>
	</div>

	<!-- Theme toggle buttons for testing -->
	<div class="mt-3 flex gap-1">
		<button 
			class="btn btn-xs" 
			onclick={() => theme.setTheme('light', true)}
		>
			Light
		</button>
		<button 
			class="btn btn-xs" 
			onclick={() => theme.setTheme('dark', true)}
		>
			Dark
		</button>
		<button 
			class="btn btn-xs" 
			onclick={() => theme.setTheme('auto', true)}
		>
			Auto
		</button>
	</div>
</div>
