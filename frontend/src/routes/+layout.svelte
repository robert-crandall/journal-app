<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { themeStore } from '$lib/stores/theme';
	import { browser } from '$app/environment';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
	import { User, Settings, LogOut } from 'lucide-svelte';

	let { children } = $props();

	// Initialize stores on mount
	onMount(() => {
		if (browser) {
			// Initialize theme system
			themeStore.initialize();
			
			// Initialize auth store
			const token = localStorage.getItem('token');
			if (token) {
				// TODO: Validate token with backend and get user info
				// For now, just mark as initialized
				authStore.setInitialized(true);
			} else {
				authStore.setInitialized(true);
			}
		}
	});

	// Subscribe to auth state reactively using Svelte 5 runes
	const authState = $derived($authStore);
	const isAuthenticated = $derived(authState.user && authState.token);
	
	// Handle logout
	async function handleLogout() {
		authStore.clearAuth();
	}
</script>

<!-- App-wide layout -->
<div class="min-h-screen bg-base-100 text-base-content">
	<!-- Navigation bar (only show when authenticated) -->
	{#if isAuthenticated}
		<div class="navbar bg-base-100 border-base-200 border-b sticky top-0 z-50">
			<div class="navbar-start">
				<a href="/" class="btn btn-ghost text-xl font-bold">
					D&D Life
				</a>
			</div>
			
			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal px-1">
					<li><a href="/tasks" class="btn btn-ghost">Tasks</a></li>
					<li><a href="/character" class="btn btn-ghost">Character</a></li>
					<li><a href="/journal" class="btn btn-ghost">Journal</a></li>
					<li><a href="/quests" class="btn btn-ghost">Quests</a></li>
					<li><a href="/family" class="btn btn-ghost">Family</a></li>
				</ul>
			</div>
			
			<div class="navbar-end gap-2">
				<!-- Theme toggle -->
				<ThemeToggle />
				
				{#if authState.user}
					<!-- User menu dropdown -->
					<div class="dropdown dropdown-end">
						<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
							<User size={20} />
						</div>
						<ul class="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow-lg border border-base-300">
							<li class="menu-title">
								<span>{authState.user.name}</span>
							</li>
							<li><a href="/settings"><Settings size={16} /> Settings</a></li>
							<li>
								<button onclick={handleLogout} class="text-error">
									<LogOut size={16} /> Log out
								</button>
							</li>
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Minimal header for unauthenticated pages -->
		<div class="navbar bg-base-100 border-base-200 border-b">
			<div class="navbar-start">
				<a href="/" class="btn btn-ghost text-xl font-bold">
					D&D Life
				</a>
			</div>
			
			<div class="navbar-end gap-2">
				<a href="/login" class="btn btn-primary">Login</a>
				<a href="/register" class="btn btn-outline">Register</a>
				<ThemeToggle />
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>
