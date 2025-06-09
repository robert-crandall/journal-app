<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.js';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
	
	// Redirect if already authenticated
	onMount(() => {
		if ($auth.isAuthenticated) {
			goto('/');
		}
	});
	
	// Watch for authentication changes
	$effect(() => {
		if ($auth.isAuthenticated) {
			goto('/');
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
	<!-- Header -->
	<header class="navbar bg-base-100/80 backdrop-blur-sm border-b border-base-200">
		<div class="navbar-start">
			<a href="/" class="btn btn-ghost text-xl font-semibold">
				📝 Journal
			</a>
		</div>
		<div class="navbar-end">
			<ThemeToggle />
		</div>
	</header>

	<!-- Main content -->
	<main class="container mx-auto px-4 py-8">
		<div class="max-w-md mx-auto">
			{@render children()}
		</div>
	</main>
</div>
