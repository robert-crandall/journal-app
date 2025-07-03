<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { handleProtectedRoute } from '$lib/utils/route-protection';
	import { authStore } from '$lib/stores/auth';

	// Check routes on initial load and when authentication state changes
	$: {
		if ($authStore.initialized) {
			// Run protection logic when auth state initializes or changes
			handleProtectedRoute($page.url.pathname);
		}
	}

	// Re-check when page changes
	$: {
		// Run protection logic when the URL changes
		if ($page && $authStore.initialized) {
			handleProtectedRoute($page.url.pathname);
		}
	}

	// Also check on mount to handle direct navigation
	onMount(() => {
		if ($authStore.initialized) {
			handleProtectedRoute($page.url.pathname);
		}
	});
</script>

<!-- This component has no UI, it's just for route protection logic -->
