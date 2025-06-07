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
		<div class="bg-base-100 border-b border-base-300">
			<!-- Mobile Navigation -->
			<div class="navbar lg:hidden">
				<div class="navbar-start">
					<div class="dropdown">
						<button class="btn btn-ghost" aria-label="Toggle navigation menu">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path>
							</svg>
						</button>
						<div class="dropdown-content mt-3 z-50 card card-compact w-64 p-2 shadow-xl bg-base-100">
							<div class="card-body">
								<div class="grid gap-2">
									<a href="/dashboard" class="btn btn-ghost justify-start gap-3 {$page.route.id === '/dashboard' ? 'btn-active' : ''}">
										<span class="text-lg">🏠</span> Dashboard
									</a>
									<a href="/tasks" class="btn btn-ghost justify-start gap-3 {$page.route.id === '/tasks' ? 'btn-active' : ''}">
										<span class="text-lg">✅</span> Tasks
									</a>
									<a href="/journals" class="btn btn-ghost justify-start gap-3 {$page.route.id === '/journals' ? 'btn-active' : ''}">
										<span class="text-lg">📖</span> Journal
									</a>
									<a href="/stats" class="btn btn-ghost justify-start gap-3 {$page.route.id === '/stats' ? 'btn-active' : ''}">
										<span class="text-lg">📊</span> Progress
									</a>
									<div class="divider my-1"></div>
									<a href="/focuses" class="btn btn-ghost btn-sm justify-start gap-3 {$page.route.id === '/focuses' ? 'btn-active' : ''}">
										<span class="text-sm">🎯</span> Focuses
									</a>
									<a href="/family" class="btn btn-ghost btn-sm justify-start gap-3 {$page.route.id === '/family' ? 'btn-active' : ''}">
										<span class="text-sm">👨‍👩‍👧‍👦</span> Family
									</a>
									<a href="/potions" class="btn btn-ghost btn-sm justify-start gap-3 {$page.route.id === '/potions' ? 'btn-active' : ''}">
										<span class="text-sm">🧪</span> Potions
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="navbar-center">
					<a href="/dashboard" class="btn btn-ghost text-xl font-bold">Life Quest</a>
				</div>
				<div class="navbar-end">
					<div class="dropdown dropdown-end">
						<button class="btn btn-ghost btn-circle avatar">
							<div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold">
								{$auth.user?.name?.charAt(0).toUpperCase()}
							</div>
						</button>
						<ul class="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-xl bg-base-100 rounded-box w-52">
							<li class="menu-title">
								<span class="text-sm font-semibold">{$auth.user?.name}</span>
							</li>
							<li><a href="/settings">Settings</a></li>
							<li><button onclick={handleLogout} class="text-error">Logout</button></li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden lg:flex">
				<div class="container mx-auto px-6">
					<div class="navbar">
						<div class="navbar-start">
							<a href="/dashboard" class="btn btn-ghost text-2xl font-bold text-primary">Life Quest</a>
						</div>
						<div class="navbar-center">
							<div class="flex gap-2">
								<!-- Primary Navigation -->
								<a href="/dashboard" class="btn btn-ghost gap-2 {$page.route.id === '/dashboard' ? 'btn-active border-l-4 border-primary' : 'hover:border-l-4 hover:border-primary/30 transition-all'}">
									<span class="text-lg">🏠</span>
									<span class="hidden xl:inline">Dashboard</span>
								</a>
								<a href="/tasks" class="btn btn-ghost gap-2 {$page.route.id === '/tasks' ? 'btn-active border-l-4 border-secondary' : 'hover:border-l-4 hover:border-secondary/30 transition-all'}">
									<span class="text-lg">✅</span>
									<span class="hidden xl:inline">Tasks</span>
								</a>
								<a href="/journals" class="btn btn-ghost gap-2 {$page.route.id === '/journals' ? 'btn-active border-l-4 border-accent' : 'hover:border-l-4 hover:border-accent/30 transition-all'}">
									<span class="text-lg">📖</span>
									<span class="hidden xl:inline">Journal</span>
								</a>
								<a href="/stats" class="btn btn-ghost gap-2 {$page.route.id === '/stats' ? 'btn-active border-l-4 border-info' : 'hover:border-l-4 hover:border-info/30 transition-all'}">
									<span class="text-lg">📊</span>
									<span class="hidden xl:inline">Progress</span>
								</a>
								
								<!-- Secondary Navigation -->
								<div class="divider divider-horizontal mx-1"></div>
								<div class="dropdown dropdown-hover">
									<button class="btn btn-ghost btn-sm gap-1" aria-label="More tools">
										<span class="text-sm">⚡</span>
										<span class="hidden xl:inline text-sm">More</span>
									</button>
									<div class="dropdown-content top-full mt-2 z-50 card card-compact w-48 p-2 shadow-xl bg-base-100">
										<div class="card-body gap-1">
											<a href="/focuses" class="btn btn-ghost btn-sm justify-start gap-2 {$page.route.id === '/focuses' ? 'btn-active' : ''}">
												<span class="text-sm">🎯</span> Focuses
											</a>
											<a href="/family" class="btn btn-ghost btn-sm justify-start gap-2 {$page.route.id === '/family' ? 'btn-active' : ''}">
												<span class="text-sm">👨‍👩‍👧‍👦</span> Family
											</a>
											<a href="/potions" class="btn btn-ghost btn-sm justify-start gap-2 {$page.route.id === '/potions' ? 'btn-active' : ''}">
												<span class="text-sm">🧪</span> Potions
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="navbar-end">
							<div class="dropdown dropdown-end">
								<button class="btn btn-ghost btn-circle avatar hover:scale-105 transition-transform">
									<div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-semibold shadow-lg">
										{$auth.user?.name?.charAt(0).toUpperCase()}
									</div>
								</button>
								<ul class="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300">
									<li class="menu-title">
										<span class="text-sm font-semibold">{$auth.user?.name}</span>
									</li>
									<div class="divider my-1"></div>
									<li><a href="/settings" class="gap-2"><span class="text-sm">⚙️</span> Settings</a></li>
									<li><button onclick={handleLogout} class="text-error gap-2"><span class="text-sm">🚪</span> Logout</button></li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		{@render children()}
	{:else}
		{@render children()}
	{/if}
</div>
