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

<div class="bg-base-200 flex min-h-screen flex-col antialiased">
	<Navigation />
	{@render children()}
</div>

<style>
	:global(button, a) {
		transition: all 0.2s ease;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		line-height: 1.2;
	}
</style>
