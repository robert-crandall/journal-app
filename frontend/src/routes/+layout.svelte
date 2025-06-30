<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { browser } from '$app/environment';

	let { children } = $props();

	// Initialize auth store on mount
	onMount(() => {
		if (browser) {
			const token = localStorage.getItem('token');
			if (token) {
				// TODO: Validate token with backend and get user info
				// For now, just mark as initialized
				authStore.setInitialized(true);
			} else {
				authStore.setInitialized(true);
			}
		}
	});
</script>

{@render children()}
