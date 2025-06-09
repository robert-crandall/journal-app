<script lang="ts">
	import { auth } from '$lib/auth.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect based on auth state
		if (auth.isAuthenticated) {
			goto('/dashboard', { replaceState: true });
		} else {
			goto('/auth/login', { replaceState: true });
		}
	});
</script>

<!-- Root landing page - users will be redirected immediately -->
<div class="flex items-center justify-center min-h-screen">
	<div class="loading loading-spinner loading-lg"></div>
</div>