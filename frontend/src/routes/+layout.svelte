<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Navigation from '$lib/components/Navigation.svelte';

	let { children } = $props();

	onMount(() => {
		auth.init();
		
		// Watch for auth state changes and reinitialize theme
		const unsubscribe = auth.subscribe(async (authState) => {
			if (!authState.loading) {
				const isAuthenticated = authState.user !== null;
				await theme.init(isAuthenticated);
			}
		});

		return unsubscribe;
	});
	
	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}
	
	// Check if current route is auth page
	const isAuthPage = $derived($page.route.id === '/login' || $page.route.id === '/register');
	const isHomePage = $derived($page.route.id === '/');
</script>

<svelte:head>
	<title>Life Quest</title>
	<meta name="description" content="Personal growth powered by GPT and role-playing mechanics" />
</svelte:head>

<div class="min-h-screen bg-theme-secondary">
	{#if $auth.loading}
		<div class="flex items-center justify-center min-h-screen">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
		</div>
	{:else if !$auth.user && !isAuthPage}
		<div class="min-h-screen bg-theme-secondary flex items-center justify-center">
			<div class="text-center max-w-md px-4">
				<h1 class="text-5xl font-bold text-theme mb-6">Life Quest</h1>
				<p class="text-lg text-theme-muted mb-8">
					Transform your personal growth journey with RPG-style mechanics and AI-powered insights.
				</p>
				<div class="space-x-4">
					<a 
						href="/login" 
						class="inline-flex items-center px-6 py-3 bg-theme-primary text-white font-medium rounded-md hover:bg-theme-primary-dark transition-colors"
					>
						Login
					</a>
					<a 
						href="/register" 
						class="inline-flex items-center px-6 py-3 border border-theme-primary text-theme-primary font-medium rounded-md hover:bg-theme-primary hover:text-white transition-colors"
					>
						Sign Up
					</a>
				</div>
			</div>
		</div>
	{:else if $auth.user && !isAuthPage && !isHomePage}
		<Navigation onLogout={handleLogout} />
		<main class="bg-theme-secondary min-h-screen">
			{@render children()}
		</main>
	{:else}
		<main class="bg-theme-secondary min-h-screen">
			{@render children()}
		</main>
	{/if}
</div>
