<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, type User } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';
	import { Button, Card } from '$lib/components/ui';
	import { Sword, BookOpen, Target, Users } from 'lucide-svelte';
	import { browser } from '$app/environment';

	// Use reactive declarations for auth state
	let isAuthenticated = false;
	let user: User | null = null;
	let authInitialized = false;

	// Subscribe to auth changes
	authStore.subscribe((state) => {
		isAuthenticated = state.initialized && state.user !== null && state.token !== null;
		user = state.user;
		authInitialized = state.initialized;
	});

	// Initialize auth on mount
	onMount(() => {
		if (browser) {
			// Ensure auth is initialized
			if (!authInitialized) {
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

<div class="bg-base-100 min-h-screen">
	<!-- Main content -->
	<div class="container mx-auto px-4 py-8">
		{#if isAuthenticated && user}
			<!-- Welcome Hero Section -->
			<div class="hero from-primary/10 to-secondary/10 mb-8 rounded-2xl bg-gradient-to-br">
				<div class="hero-content py-12 text-center">
					<div class="max-w-2xl">
						<h1 class="mb-4 text-5xl font-bold">
							Welcome back, <span class="text-primary">Adventurer</span>!
						</h1>
						<p class="mb-6 text-lg opacity-80">
							Hello, {user.name}! Ready to continue your D&D life journey?
						</p>

						<!-- User Stats -->
						<div class="stats bg-base-100/80 shadow-lg backdrop-blur-sm">
							<div class="stat">
								<div class="stat-figure text-primary">
									<Sword size={32} />
								</div>
								<div class="stat-title">Character</div>
								<div class="stat-value text-primary">{user.name}</div>
								<div class="stat-desc">{user.email}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Feature Cards Grid -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
				<Card class="group transition-all duration-300 hover:shadow-xl">
					<div class="flex items-start gap-4 p-6">
						<div
							class="bg-primary/10 text-primary rounded-lg p-3 transition-transform group-hover:scale-110"
						>
							<Target size={24} />
						</div>
						<div class="flex-1">
							<h3 class="mb-2 text-xl font-bold">Daily Quests</h3>
							<p class="text-base-content/70 mb-4">
								Complete daily tasks and challenges to level up your character and earn rewards.
							</p>
							<Button href="/tasks" variant="primary" size="sm">View Tasks</Button>
						</div>
					</div>
				</Card>

				<Card class="group transition-all duration-300 hover:shadow-xl">
					<div class="flex items-start gap-4 p-6">
						<div
							class="bg-secondary/10 text-secondary rounded-lg p-3 transition-transform group-hover:scale-110"
						>
							<BookOpen size={24} />
						</div>
						<div class="flex-1">
							<h3 class="mb-2 text-xl font-bold">Adventure Journal</h3>
							<p class="text-base-content/70 mb-4">
								Reflect on your daily adventures and track your personal growth journey.
							</p>
							<Button href="/journal" variant="secondary" size="sm">Start Writing</Button>
						</div>
					</div>
				</Card>

				<Card class="group transition-all duration-300 hover:shadow-xl">
					<div class="flex items-start gap-4 p-6">
						<div
							class="bg-accent/10 text-accent rounded-lg p-3 transition-transform group-hover:scale-110"
						>
							<Sword size={24} />
						</div>
						<div class="flex-1">
							<h3 class="mb-2 text-xl font-bold">Character Progress</h3>
							<p class="text-base-content/70 mb-4">
								Level up your character, unlock new abilities, and track your stats.
							</p>
							<Button href="/character" variant="outline" size="sm">View Character</Button>
						</div>
					</div>
				</Card>

				<Card class="group transition-all duration-300 hover:shadow-xl">
					<div class="flex items-start gap-4 p-6">
						<div
							class="bg-info/10 text-info rounded-lg p-3 transition-transform group-hover:scale-110"
						>
							<Users size={24} />
						</div>
						<div class="flex-1">
							<h3 class="mb-2 text-xl font-bold">Family Party</h3>
							<p class="text-base-content/70 mb-4">
								Connect with family members and embark on shared adventures together.
							</p>
							<Button href="/family" variant="outline" size="sm">View Family</Button>
						</div>
					</div>
				</Card>
			</div>

			<!-- Quick Actions -->
			<div class="mt-8 text-center">
				<h2 class="mb-4 text-2xl font-bold">Quick Actions</h2>
				<div class="flex flex-wrap justify-center gap-4">
					<Button href="/quests" variant="primary" size="lg">View Active Quests</Button>
					<Button href="/settings" variant="outline" size="lg">Account Settings</Button>
				</div>
			</div>
		{:else}
			<!-- Landing page for unauthenticated users -->
			<div class="hero from-primary/10 to-secondary/10 rounded-2xl bg-gradient-to-br">
				<div class="hero-content py-16 text-center">
					<div class="max-w-2xl">
						<div class="mb-6 text-6xl">⚔️</div>
						<h1 class="mb-6 text-6xl font-bold">
							Welcome to <span class="text-primary">D&D Life</span>
						</h1>
						<p class="mb-8 text-xl opacity-80">
							Transform your daily life into an epic D&D adventure. Complete quests, level up your
							character, and track your real-world progress in this gamified life management system.
						</p>
						<div class="flex flex-col justify-center gap-4 sm:flex-row">
							<Button href="/register" variant="primary" size="lg">🎲 Start Your Adventure</Button>
							<Button href="/login" variant="outline" size="lg">⚔️ Login to Continue</Button>
						</div>
					</div>
				</div>
			</div>

			<!-- Features Preview -->
			<div class="mt-12">
				<h2 class="mb-8 text-center text-3xl font-bold">Adventure Features</h2>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<Card>
						<div class="p-6 text-center">
							<div class="mb-4 text-4xl">🎯</div>
							<h3 class="mb-2 text-xl font-bold">Daily Quests</h3>
							<p class="text-base-content/70">
								Turn your daily tasks into exciting quests with XP rewards and character
								progression.
							</p>
						</div>
					</Card>

					<Card>
						<div class="p-6 text-center">
							<div class="mb-4 text-4xl">📖</div>
							<h3 class="mb-2 text-xl font-bold">Adventure Journal</h3>
							<p class="text-base-content/70">
								Reflect on your journey with guided journal prompts and track your personal growth.
							</p>
						</div>
					</Card>

					<Card>
						<div class="p-6 text-center">
							<div class="mb-4 text-4xl">👥</div>
							<h3 class="mb-2 text-xl font-bold">Family Party</h3>
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
