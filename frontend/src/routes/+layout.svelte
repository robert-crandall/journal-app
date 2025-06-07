<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

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
		<header class="bg-base-100 shadow-md border-b border-base-300">
			<nav class="container mx-auto px-4 py-3 flex items-center justify-between">
				<!-- Mobile: Hamburger on left -->
				<div class="dropdown md:hidden">
					<button class="btn btn-ghost btn-square" aria-label="Open menu">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path>
						</svg>
					</button>
					<div class="dropdown-content mt-3 z-50 card card-compact w-64 p-2 shadow-xl bg-base-100 border border-base-300">
						<div class="card-body">
							<div class="space-y-2">
								<a href="/dashboard" class="btn btn-ghost justify-start gap-3 text-sm {$page.route.id === '/dashboard' ? 'btn-active' : ''}">
									🏠 Dashboard
								</a>
								<a href="/tasks" class="btn btn-ghost justify-start gap-3 text-sm {$page.route.id === '/tasks' ? 'btn-active' : ''}">
									✅ Tasks
								</a>
								<a href="/journals" class="btn btn-ghost justify-start gap-3 text-sm {$page.route.id === '/journals' ? 'btn-active' : ''}">
									📖 Journal
								</a>
								<a href="/stats" class="btn btn-ghost justify-start gap-3 text-sm {$page.route.id === '/stats' ? 'btn-active' : ''}">
									📊 Progress
								</a>
								<div class="divider my-1"></div>
								<a href="/focuses" class="btn btn-ghost btn-sm justify-start gap-3 {$page.route.id === '/focuses' ? 'btn-active' : ''}">
									🎯 Focuses
								</a>
								<a href="/family" class="btn btn-ghost btn-sm justify-start gap-3 {$page.route.id === '/family' ? 'btn-active' : ''}">
									👨‍👩‍👧‍👦 Family
								</a>
								<a href="/potions" class="btn btn-ghost btn-sm justify-start gap-3 {$page.route.id === '/potions' ? 'btn-active' : ''}">
									🧪 Potions
								</a>
							</div>
						</div>
					</div>
				</div>

				<!-- Brand -->
				<a href="/dashboard" class="text-lg font-semibold text-primary">Life Quest</a>

				<!-- Menu (hidden on mobile) -->
				<ul class="hidden md:flex space-x-6 text-sm font-medium">
					<li><a href="/dashboard" class="hover:text-primary {$page.route.id === '/dashboard' ? 'text-primary font-semibold' : ''}">Dashboard</a></li>
					<li><a href="/tasks" class="hover:text-primary {$page.route.id === '/tasks' ? 'text-primary font-semibold' : ''}">Tasks</a></li>
					<li><a href="/journals" class="hover:text-primary {$page.route.id === '/journals' ? 'text-primary font-semibold' : ''}">Journal</a></li>
					<li><a href="/stats" class="hover:text-primary {$page.route.id === '/stats' ? 'text-primary font-semibold' : ''}">Progress</a></li>
					<li class="dropdown dropdown-hover">
						<button class="hover:text-primary text-sm font-medium" aria-label="More tools">More</button>
						<div class="dropdown-content top-full mt-2 z-50 card card-compact w-48 p-2 shadow-xl bg-base-100 border border-base-300">
							<div class="card-body space-y-1">
								<a href="/focuses" class="btn btn-ghost btn-sm justify-start gap-2 text-xs {$page.route.id === '/focuses' ? 'btn-active' : ''}">
									🎯 Focuses
								</a>
								<a href="/family" class="btn btn-ghost btn-sm justify-start gap-2 text-xs {$page.route.id === '/family' ? 'btn-active' : ''}">
									👨‍👩‍👧‍👦 Family
								</a>
								<a href="/potions" class="btn btn-ghost btn-sm justify-start gap-2 text-xs {$page.route.id === '/potions' ? 'btn-active' : ''}">
									🧪 Potions
								</a>
							</div>
						</div>
					</li>
				</ul>

				<!-- User Menu -->
				<div class="dropdown dropdown-end">
					<button class="btn btn-ghost btn-circle avatar" aria-label="User menu">
						<div class="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold text-sm">
							{$auth.user?.name?.charAt(0).toUpperCase()}
						</div>
					</button>
					<ul class="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300">
						<li class="menu-title">
							<span class="text-sm font-semibold">{$auth.user?.name}</span>
						</li>
						<div class="divider my-1"></div>
						<li><a href="/settings" class="text-sm">⚙️ Settings</a></li>
						<li><button onclick={handleLogout} class="text-error text-sm">🚪 Logout</button></li>
					</ul>
				</div>
			</nav>

			<!-- Mobile menu (controlled by toggle state) -->
			<!-- This will be handled by the dropdown above -->
		</header>
		
		{@render children()}
	{:else}
		{@render children()}
	{/if}
</div>
