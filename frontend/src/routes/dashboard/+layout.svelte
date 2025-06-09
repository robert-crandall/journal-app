<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth.js';
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { children } = $props();
	
	// Redirect if not authenticated
	$effect(() => {
		if (!$auth.isLoading && !$auth.isAuthenticated) {
			goto('/auth/login');
		}
	});
	
	async function handleLogout() {
		await auth.logout();
	}

	// Don't render anything until auth is ready and user is authenticated
	const shouldRender = $derived(!$auth.isLoading && $auth.isAuthenticated);
</script>

{#if !shouldRender}
	<div class="min-h-screen flex items-center justify-center bg-base-100">
		<div class="text-center">
			<LoadingSpinner size="lg" />
			<p class="mt-4 text-base-content/70">Loading...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-200">
		<!-- Navigation -->
		<nav class="navbar bg-base-100 shadow-sm border-b border-base-300">
			<div class="navbar-start">
				<div class="dropdown lg:hidden">
					<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
						</svg>
					</div>
					<ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
						<li><a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a></li>
						<li><a href="/journal/new" class:active={$page.url.pathname === '/journal/new'}>New Entry</a></li>
						<li><a href="/journal" class:active={$page.url.pathname === '/journal'}>My Entries</a></li>
					</ul>
				</div>
				<a href="/" class="btn btn-ghost text-xl font-semibold">
					📝 Journal
				</a>
			</div>
			
			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal px-1">
					<li><a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a></li>
					<li><a href="/journal/new" class:active={$page.url.pathname === '/journal/new'}>New Entry</a></li>
					<li><a href="/journal" class:active={$page.url.pathname === '/journal'}>My Entries</a></li>
				</ul>
			</div>
			
			<div class="navbar-end">
				<ThemeToggle />
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
						<div class="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">
							{$auth.user?.name?.charAt(0).toUpperCase() || 'U'}
						</div>
					</div>
					<ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
						<li class="menu-title">
							<span>{$auth.user?.name}</span>
						</li>
						<li><a href="/profile">Profile</a></li>
						<li><button onclick={handleLogout}>Logout</button></li>
					</ul>
				</div>
			</div>
		</nav>

		<!-- Main content -->
		<main class="container mx-auto px-4 py-6">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	.active {
		background-color: hsl(var(--p));
		color: hsl(var(--pc));
	}
</style>
