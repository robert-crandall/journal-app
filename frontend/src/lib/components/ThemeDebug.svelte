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

<div
	class="border-base-300 bg-base-100 fixed right-4 bottom-4 z-50 rounded-lg border p-4 text-xs shadow-lg"
>
	<h3 class="text-base-content mb-2 font-bold">Theme Debug</h3>
	<div class="text-base-content/70 space-y-1">
		<div>Store Theme: {currentTheme}</div>
		<div>HTML data-theme: {htmlDataTheme}</div>
		<div>HTML classes: {htmlClass || 'none'}</div>
	</div>

	<!-- Color test squares -->
	<div class="mt-3 grid grid-cols-4 gap-1">
		<div class="bg-primary h-4 w-4" title="primary"></div>
		<div class="bg-secondary h-4 w-4" title="secondary"></div>
		<div class="bg-accent h-4 w-4" title="accent"></div>
		<div class="bg-base-100 border-base-300 h-4 w-4 border" title="base-100"></div>
		<div class="bg-base-200 h-4 w-4" title="base-200"></div>
		<div class="bg-base-300 h-4 w-4" title="base-300"></div>
		<div class="bg-info h-4 w-4" title="info"></div>
		<div class="bg-success h-4 w-4" title="success"></div>
		<div class="bg-warning h-4 w-4" title="warning"></div>
		<div class="bg-error h-4 w-4" title="error"></div>
	</div>

	<!-- Theme toggle buttons for testing -->
	<div class="mt-3 flex flex-wrap gap-1">
		<button class="btn btn-xs" onclick={() => theme.setTheme('light', true)}> Light </button>
		<button class="btn btn-xs" onclick={() => theme.setTheme('dark', true)}> Dark </button>
		<button class="btn btn-xs" onclick={() => theme.setTheme('auto', true)}> Auto </button>
		<button class="btn btn-xs" onclick={() => theme.setTheme('cupcake', true)}> Cupcake </button>
		<button class="btn btn-xs" onclick={() => theme.setTheme('dracula', true)}> Dracula </button>
		<button class="btn btn-xs" onclick={() => theme.setTheme('synthwave', true)}> Synthwave </button>
	</div>
</div>
