<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/auth.js';
	import { theme } from '$lib/theme.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { children } = $props();
	
	// Initialize auth and theme on mount
	onMount(async () => {
		// Initialize theme
		theme.init();
		
		// Initialize auth
		await auth.init();
	});
</script>

<!-- Show loading spinner while auth is initializing -->
{#if $auth.isLoading}
	<div class="min-h-screen flex items-center justify-center bg-base-100">
		<div class="text-center">
			<LoadingSpinner size="lg" />
			<p class="mt-4 text-base-content/70">Loading...</p>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
