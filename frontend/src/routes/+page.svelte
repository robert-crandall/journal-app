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

<div class="flex min-h-screen items-center justify-center">
	<span class="loading loading-spinner loading-lg"></span>
</div>
