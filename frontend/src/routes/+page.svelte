<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';
	import { Button, Card } from '$lib/components/ui';
	import { Sword, BookOpen, Target, Users } from 'lucide-svelte';
	import { browser } from '$app/environment';

	// Use reactive declarations for auth state
	let auth = authStore;
	let isAuthenticated = false;
	let user = null;

	// Subscribe to auth changes
	authStore.subscribe((state) => {
		isAuthenticated = state.initialized && state.user !== null && state.token !== null;
		user = state.user;
	});

	// Initialize auth on mount
	onMount(() => {
		if (browser) {
			// Ensure auth is initialized
			if (!auth.initialized) {
				authStore.setInitialized(true);
			}
		}
	});

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

<div class="min-h-screen bg-base-100">
	<!-- Main content -->
	<div class="container mx-auto px-4 py-8">
		{#if isAuthenticated && user}
			<!-- Welcome Hero Section -->
			<div class="hero bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl mb-8">
				<div class="hero-content text-center py-12">
					<div class="max-w-2xl">
						<h1 class="text-5xl font-bold mb-4">
							Welcome back, <span class="text-primary">Adventurer</span>!
						</h1>
						<p class="text-lg opacity-80 mb-6">
							Hello, {user.name}! Ready to continue your D&D life journey?
						</p>
						
						<!-- User Stats -->
						<div class="stats shadow-lg bg-base-100/80 backdrop-blur-sm">
							<div class="stat">
								<div class="stat-figure text-primary">
									<Sword size={32} />
								</div>
								<div class="stat-title">Character</div>							<div class="stat-value text-primary">{user.name}</div>
							<div class="stat-desc">{user.email}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Feature Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
				<Card class="group hover:shadow-xl transition-all duration-300">
					<div class="flex items-start gap-4 p-6">
						<div class="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
							<Target size={24} />
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-2">Daily Quests</h3>
							<p class="text-base-content/70 mb-4">
								Complete daily tasks and challenges to level up your character and earn rewards.
							</p>
							<Button href="/tasks" variant="primary" size="sm">
								View Tasks
							</Button>
						</div>
					</div>
				</Card>

				<Card class="group hover:shadow-xl transition-all duration-300">
					<div class="flex items-start gap-4 p-6">
						<div class="p-3 rounded-lg bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
							<BookOpen size={24} />
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-2">Adventure Journal</h3>
							<p class="text-base-content/70 mb-4">
								Reflect on your daily adventures and track your personal growth journey.
							</p>
							<Button href="/journal" variant="secondary" size="sm">
								Start Writing
							</Button>
						</div>
					</div>
				</Card>

				<Card class="group hover:shadow-xl transition-all duration-300">
					<div class="flex items-start gap-4 p-6">
						<div class="p-3 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
							<Sword size={24} />
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-2">Character Progress</h3>
							<p class="text-base-content/70 mb-4">
								Level up your character, unlock new abilities, and track your stats.
							</p>
							<Button href="/character" variant="outline" size="sm">
								View Character
							</Button>
						</div>
					</div>
				</Card>

				<Card class="group hover:shadow-xl transition-all duration-300">
					<div class="flex items-start gap-4 p-6">
						<div class="p-3 rounded-lg bg-info/10 text-info group-hover:scale-110 transition-transform">
							<Users size={24} />
						</div>
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-2">Family Party</h3>
							<p class="text-base-content/70 mb-4">
								Connect with family members and embark on shared adventures together.
							</p>
							<Button href="/family" variant="outline" size="sm">
								View Family
							</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Quick Actions -->
			<div class="mt-8 text-center">
				<h2 class="text-2xl font-bold mb-4">Quick Actions</h2>
				<div class="flex flex-wrap justify-center gap-4">
					<Button href="/quests" variant="primary" size="lg">
						View Active Quests
					</Button>
					<Button href="/settings" variant="outline" size="lg">
						Account Settings
					</Button>
				</div>
			</div>
		{:else}
			<!-- Landing page for unauthenticated users -->
			<div class="hero bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl">
				<div class="hero-content text-center py-16">
					<div class="max-w-2xl">
						<div class="text-6xl mb-6">⚔️</div>
						<h1 class="text-6xl font-bold mb-6">
							Welcome to <span class="text-primary">D&D Life</span>
						</h1>
						<p class="text-xl opacity-80 mb-8">
							Transform your daily life into an epic D&D adventure. Complete quests, level up your character, and track your real-world progress in this gamified life management system.
						</p>
						<div class="flex flex-col sm:flex-row justify-center gap-4">
							<Button href="/register" variant="primary" size="lg">
								🎲 Start Your Adventure
							</Button>
							<Button href="/login" variant="outline" size="lg">
								⚔️ Login to Continue
							</Button>
						</div>
					</div>
				</div>
			</div>

			<!-- Features Preview -->
			<div class="mt-12">
				<h2 class="text-3xl font-bold text-center mb-8">Adventure Features</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card>
						<div class="text-center p-6">
							<div class="text-4xl mb-4">🎯</div>
							<h3 class="text-xl font-bold mb-2">Daily Quests</h3>
							<p class="text-base-content/70">
								Turn your daily tasks into exciting quests with XP rewards and character progression.
							</p>
						</div>
					</Card>

					<Card>
						<div class="text-center p-6">
							<div class="text-4xl mb-4">📖</div>
							<h3 class="text-xl font-bold mb-2">Adventure Journal</h3>
							<p class="text-base-content/70">
								Reflect on your journey with guided journal prompts and track your personal growth.
							</p>
						</div>
					</Card>

					<Card>
						<div class="text-center p-6">
							<div class="text-4xl mb-4">👥</div>
							<h3 class="text-xl font-bold mb-2">Family Party</h3>
							<p class="text-base-content/70">
								Create a party with family members and share adventures together.
							</p>
						</div>
					</Card>
				</div>
			</div>
		{/if}
	</div>
</div>
