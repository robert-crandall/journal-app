<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, type User } from '$lib/stores/auth';
	import { apiClient } from '$lib/api/client';
	import { Button, Card } from '$lib/components/ui';
	import { Sword, BookOpen, Target, Users } from 'lucide-svelte';
	import { browser } from '$app/environment';
	
	// Import dashboard components
	import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
	import TaskSummary from '$lib/components/dashboard/TaskSummary.svelte';
	import CharacterStats from '$lib/components/dashboard/CharacterStats.svelte';
	import ActiveQuests from '$lib/components/dashboard/ActiveQuests.svelte';
	import JournalPrompt from '$lib/components/dashboard/JournalPrompt.svelte';

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
				<div class="hero-content py-8 text-center">
					<div class="max-w-2xl">
						<h1 class="mb-4 text-4xl font-bold">
							Welcome back, <span class="text-primary">{user.name}</span>!
						</h1>
						<p class="mb-6 text-lg opacity-80">
							Ready to continue your D&D life journey?
						</p>
					</div>
				</div>
			</div>

			<!-- Dashboard Layout with Components -->
			<DashboardLayout>
				{#snippet mainContent()}
					<TaskSummary />
				{/snippet}
				
				{#snippet secondaryContent()}
					<CharacterStats />
				{/snippet}
				
				{#snippet tertiaryContent()}
					<ActiveQuests />
				{/snippet}
				
				{#snippet quaternaryContent()}
					<JournalPrompt />
				{/snippet}
			</DashboardLayout>

			<!-- Quick Actions -->
			<div class="mt-8 text-center">
				<h2 class="mb-4 text-2xl font-bold">Quick Actions</h2>
				<div class="flex flex-wrap justify-center gap-4">
					<Button href="/quests" variant="primary" size="lg">View All Quests</Button>
					<Button href="/tasks" variant="outline" size="lg">Manage Tasks</Button>
					<Button href="/character" variant="outline" size="lg">Character Details</Button>
					<Button href="/journal" variant="outline" size="lg">Full Journal</Button>
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
