<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { browser } from '$app/environment';
	import { initializeAuth } from '$lib/services/auth-service';
	import ProtectedRoutes from '$lib/components/ProtectedRoutes.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	let { children } = $props();

	// Initialize auth store on mount
	onMount(async () => {
		if (browser) {
			try {
				await initializeAuth();
			} catch (error) {
				console.error('Failed to initialize authentication:', error);
				authStore.setInitialized(true);
			}
		}
	});
</script>

<!-- Route protection logic -->
<ProtectedRoutes />

<div class="flex min-h-screen flex-col bg-gray-50 antialiased dark:bg-gray-900">
	<Navigation />
	<div class="container mx-auto px-4 py-8">
		{@render children()}
	</div>
</div>

<style>
	:global(body) {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		min-height: 100vh;
		transition: background-color 0.3s ease, color 0.3s ease;
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}

	:global(button, a) {
		transition: all 0.2s ease;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		line-height: 1.2;
		font-weight: 600;
		color: #1f2937; /* text-gray-800 */
	}
	
	:global(.dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6) {
		color: #f3f4f6; /* text-gray-100 */
	}
	
	:global(.card) {
		@apply bg-white dark:bg-gray-800 rounded shadow-md border-l-4 border-indigo-500;
	}
	
	:global(.card-title) {
		@apply text-lg font-semibold text-gray-800 dark:text-gray-100;
	}
	
	:global(.btn-primary) {
		@apply bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded transition-colors;
	}
	
	:global(.btn-secondary) {
		@apply bg-white hover:bg-gray-50 text-indigo-600 border border-gray-200 font-medium px-4 py-2 rounded transition-colors;
	}
	
	:global(p) {
		@apply text-gray-700 dark:text-gray-300 leading-relaxed;
	}
</style>
