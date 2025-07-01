<script lang="ts">
	import { onMount } from 'svelte';
	import { authGuard, AuthGuard } from '$lib/utils/auth-guard';
	import { authStore } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';

	let isAuthenticated = false;
	let user = null;

	// Subscribe to auth state changes
	$: {
		const auth = authGuard;
		isAuthenticated = auth.isAuthenticated;
		user = auth.user;
	}

	// Handle logout
	async function handleLogout() {
		try {
			// Call logout API
			await apiClient.logout();
		} catch (err) {
			// Even if API fails, clear local auth
			console.warn('Logout API failed, but clearing local auth:', err);
		} finally {
			// Always clear local auth state
			authStore.clearAuth();
		}
	}
</script>

<svelte:head>
	<title>Dashboard | D&D Life Gamification</title>
	<meta name="description" content="Your D&D life adventure dashboard" />
</svelte:head>

<div class="bg-base-100 min-h-screen">
	<!-- Navigation -->
	<div class="navbar bg-base-100 border-base-200 border-b">
		<div class="navbar-start">
			<a href="/" class="btn btn-ghost text-xl">D&D Life</a>
		</div>
		<div class="navbar-end">
			{#if isAuthenticated && user}
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-ghost">
						{user.name}
					</div>
					<ul class="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow">
						<li>
							<button class="btn btn-ghost w-full justify-start" onclick={handleLogout}>
								Log out
							</button>
						</li>
					</ul>
				</div>
			{:else}
				<a href="/login" class="btn btn-primary mr-2">Login</a>
				<a href="/register" class="btn btn-ghost">Register</a>
			{/if}
		</div>
	</div>

	<!-- Main content -->
	<div class="container mx-auto px-4 py-8">
		{#if isAuthenticated && user}
			<div class="hero bg-base-200 rounded-lg">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h1 class="text-5xl font-bold">Welcome back, Adventurer!</h1>
						<p class="py-6">Hello, {user.name}! Ready to continue your D&D life journey?</p>
						<div class="stats shadow">
							<div class="stat">
								<div class="stat-title">Character</div>
								<div class="stat-value text-primary">{user.name}</div>
								<div class="stat-desc">{user.email}</div>
							</div>
						</div>
						<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="card bg-base-100 shadow-lg">
								<div class="card-body">
									<h2 class="card-title">Tasks</h2>
									<p>Complete daily quests and level up!</p>
									<div class="card-actions justify-end">
										<button class="btn btn-primary btn-sm">View Tasks</button>
									</div>
								</div>
							</div>
							<div class="card bg-base-100 shadow-lg">
								<div class="card-body">
									<h2 class="card-title">Journal</h2>
									<p>Reflect on your adventures</p>
									<div class="card-actions justify-end">
										<button class="btn btn-primary btn-sm">Start Writing</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Fallback for unauthenticated users (shouldn't normally be shown due to auth guard) -->
			<div class="hero bg-base-200 rounded-lg">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h1 class="text-5xl font-bold">Welcome to D&D Life</h1>
						<p class="py-6">
							Transform your daily life into an epic D&D adventure. Complete quests, level up your character, and track your real-world progress.
						</p>
						<div class="flex justify-center gap-4">
							<a href="/register" class="btn btn-primary">Start Your Adventure</a>
							<a href="/login" class="btn btn-outline">Login</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
