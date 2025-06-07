<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	
	onMount(() => {
		const unsubscribe = auth.subscribe((state) => {
			if (!state.loading) {
				if (state.user) {
					goto('/dashboard');
				} else {
					goto('/login');
				}
			}
		});
		
		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Life Quest - Personal Growth RPG</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen bg-theme-bg">
	<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
</div>
