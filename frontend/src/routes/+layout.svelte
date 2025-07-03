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

<div class="flex min-h-screen flex-col bg-base-100 text-base-content font-sans antialiased">
	<Navigation />
	<div class="container mx-auto px-4 py-8">
		{@render children()}
	</div>
</div>

<style>
	:global(body) {
		background-color: inherit;
		color: inherit;
		min-height: 100vh;
		transition: background-color 0.3s, color 0.3s;
		font-family: inherit;
	}
	:global(button), :global(a) {
		transition: color 0.2s, background-color 0.2s;
	}
	:global(h1), :global(h2), :global(h3), :global(h4), :global(h5), :global(h6) {
		line-height: 1.2;
		font-weight: 700;
		color: inherit;
	}
	/* DaisyUI classes are now used directly in markup for .card, .card-title, .btn-primary, .btn-secondary */
	:global(p) {
		color: inherit;
		line-height: 1.6;
	}
</style>
