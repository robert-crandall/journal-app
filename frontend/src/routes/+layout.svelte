<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ThemePicker from '$lib/components/ThemePicker.svelte';

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

<div class="min-h-screen bg-base-200">
	{#if $auth.loading}
		<div class="flex items-center justify-center min-h-screen">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if !$auth.user && !isAuthPage}
		<div class="hero min-h-screen bg-base-200">
			<!-- Theme picker for non-authenticated users -->
			<div class="absolute top-4 right-4 z-10">
				<ThemePicker />
			</div>
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Life Quest</h1>
					<p class="py-6">
						Transform your personal growth journey with RPG-style mechanics and AI-powered insights.
					</p>
					<div class="space-x-4">
						<a href="/login" class="btn btn-primary">Login</a>
						<a href="/register" class="btn btn-outline">Sign Up</a>
					</div>
				</div>
			</div>
		</div>
	{:else if $auth.user && !isAuthPage && !isHomePage}
		<!-- Navigation for authenticated users on app pages -->
		<div class="navbar bg-base-100 shadow-lg">
			<div class="navbar-start">
				<div class="dropdown">
					<button class="btn btn-ghost lg:hidden" aria-label="Toggle navigation menu">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path>
						</svg>
					</button>
					<ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
						<li><a href="/dashboard">Dashboard</a></li>
						<li><a href="/tasks">Tasks</a></li>
						<li><a href="/focuses">Focuses</a></li>
						<li><a href="/stats">Stats</a></li>
						<li><a href="/journals">Journal</a></li>
						<li><a href="/family">Family</a></li>
						<li><a href="/potions">Potions</a></li>
					</ul>
				</div>
				<a href="/dashboard" class="btn btn-ghost text-xl">🧭 Life Quest</a>
			</div>
			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal px-1">
					<li><a href="/dashboard" class:btn-active={$page.route.id === '/dashboard'}>Dashboard</a></li>
					<li><a href="/tasks" class:btn-active={$page.route.id === '/tasks'}>Tasks</a></li>
					<li><a href="/focuses" class:btn-active={$page.route.id === '/focuses'}>Focuses</a></li>
					<li><a href="/stats" class:btn-active={$page.route.id === '/stats'}>Stats</a></li>
					<li><a href="/journals" class:btn-active={$page.route.id === '/journals'}>Journal</a></li>
					<li><a href="/family" class:btn-active={$page.route.id === '/family'}>Family</a></li>
					<li><a href="/potions" class:btn-active={$page.route.id === '/potions'}>Potions</a></li>
				</ul>
			</div>
			<div class="navbar-end">
				<ThemePicker />
				<div class="dropdown dropdown-end">
					<button class="btn btn-ghost btn-circle avatar">
						<div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
							{$auth.user?.name?.charAt(0).toUpperCase()}
						</div>
					</button>
					<ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
						<li class="menu-title">
							<span>{$auth.user?.name}</span>
						</li>
						<li><button onclick={handleLogout}>Logout</button></li>
					</ul>
				</div>
			</div>
		</div>
		
		{@render children()}
	{:else}
		{@render children()}
	{/if}
</div>
