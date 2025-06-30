<script lang="ts">
	import { authStore, type User } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let user: User | null = null;
	let token: string | null = null;
	let loading = false;

	// Subscribe to auth store
	authStore.subscribe((state) => {
		user = state.user;
		token = state.token;
		loading = state.loading;
	});

	// Handle logout
	function handleLogout() {
		authStore.clearAuth();
		goto('/');
	}
</script>

<svelte:head>
	<title>Home | Auth Template</title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
	<!-- Navigation -->
	<div class="navbar bg-base-100 border-base-200 border-b">
		<div class="navbar-start">
			<a href="/" class="btn btn-ghost text-xl">Auth Template</a>
		</div>
		<div class="navbar-end">
			{#if user}
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-ghost">
						{user.name}
					</div>
					<ul class="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow">
						<li>
							<button class="btn btn-ghost w-full justify-start" on:click={handleLogout}
								>Log out</button
							>
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
		{#if user}
			<div class="hero bg-base-200 rounded-lg">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h1 class="text-5xl font-bold">Welcome back!</h1>
						<p class="py-6">Hello, {user.name}! You are successfully logged in.</p>
						<div class="stats shadow">
							<div class="stat">
								<div class="stat-title">Logged in as</div>
								<div class="stat-value text-primary">{user.name}</div>
								<div class="stat-desc">{user.email}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="hero bg-base-200 rounded-lg">
				<div class="hero-content text-center">
					<div class="max-w-md">
						<h1 class="text-5xl font-bold">Welcome to Auth Template</h1>
						<p class="py-6">
							A SvelteKit application with user authentication powered by Hono backend.
						</p>
						<div class="flex justify-center gap-4">
							<a href="/register" class="btn btn-primary">Get Started</a>
							<a href="/login" class="btn btn-outline">Login</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
