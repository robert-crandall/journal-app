<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { DashboardData, Task, CharacterStat } from '$lib/types';
	import { Plus, BookOpen, Target, TrendingUp, Clock, Award } from 'lucide-svelte';

	// Auth state
	let user = $authStore.user;
	let token = $authStore.token;
	let isAuthenticated = $authStore.initialized && !!$authStore.user;

	// Dashboard state
	let isLoading = true;
	let error = '';
	let dashboardData: DashboardData | null = null;

	// Subscribe to auth changes
	authStore.subscribe(state => {
		user = state.user;
		token = state.token;
		isAuthenticated = state.initialized && !!state.user;
		
		// If user changes, reload dashboard
		if (state.user && dashboardData === null) {
			loadDashboard();
		}
	});

	// Redirect to login if not authenticated
	$: if ($authStore.initialized && !isAuthenticated) {
		goto('/login');
	}		// Load dashboard data
	async function loadDashboard() {
		if (!user) return;

		try {
			isLoading = true;
			error = '';

			const API_BASE = 'http://localhost:3000';

			// Get today's tasks from dashboard endpoint
			const tasksResponse = await fetch(`${API_BASE}/api/dashboard?userId=${user.id}&status=pending&limit=10`);

			if (!tasksResponse.ok) {
				throw new Error('Failed to load tasks');
			}

			const tasksData = await tasksResponse.json();

			// Get character data - first need to get characters for this user
			const charactersResponse = await fetch(`${API_BASE}/api/characters?userId=${user.id}`);
			
			if (!charactersResponse.ok) {
				throw new Error('Failed to load character data');
			}

			const charactersData = await charactersResponse.json();
			
			let characterData = null;
			if (charactersData.characters && charactersData.characters.length > 0) {
				// Get the first character's dashboard
				const characterId = charactersData.characters[0].id;
				const characterResponse = await fetch(`${API_BASE}/api/characters/${characterId}/dashboard?userId=${user.id}`);
				
				if (characterResponse.ok) {
					characterData = await characterResponse.json();
				}
			}

			// Combine data
			dashboardData = {
				user,
				character: characterData?.character || null,
				stats: characterData?.character?.stats || [],
				todaysTasks: tasksData.data?.tasks || [],
				xpProgress: characterData?.overview ? {
					currentLevel: Math.floor(characterData.overview.averageLevel),
					currentXp: characterData.overview.totalXpAcrossAllStats,
					xpToNextLevel: 500, // Calculate based on next level
					totalXp: characterData.overview.totalXpAcrossAllStats
				} : {
					currentLevel: 1,
					currentXp: 0,
					xpToNextLevel: 100,
					totalXp: 0
				},
				journalPrompt: "How are you feeling today? What's on your mind?"
			};

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
			console.error('Dashboard error:', err);
		} finally {
			isLoading = false;
		}
	}

	// Complete a task
	async function completeTask(taskId: string) {
		if (!user) return;

		try {
			const API_BASE = 'http://localhost:3000';
			const response = await fetch(`${API_BASE}/api/tasks/${taskId}/complete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ 
					userId: user.id,
					feedback: '',
					actualXp: 0 // Will be calculated by backend
				})
			});

			if (!response.ok) {
				throw new Error('Failed to complete task');
			}

			// Reload dashboard to reflect changes
			await loadDashboard();
		} catch (err) {
			console.error('Error completing task:', err);
			// Could show a toast notification here
		}
	}

	// Get XP color based on amount
	function getXpColor(xp: number): string {
		if (xp >= 100) return 'text-purple-600 dark:text-purple-400';
		if (xp >= 50) return 'text-blue-600 dark:text-blue-400';
		if (xp >= 25) return 'text-green-600 dark:text-green-400';
		return 'text-gray-600 dark:text-gray-400';
	}

	// Get stat level color
	function getStatLevelColor(level: number): string {
		if (level >= 10) return 'text-purple-600 dark:text-purple-400';
		if (level >= 5) return 'text-blue-600 dark:text-blue-400';
		if (level >= 2) return 'text-green-600 dark:text-green-400';
		return 'text-gray-600 dark:text-gray-400';
	}

	onMount(() => {
		if (isAuthenticated) {
			loadDashboard();
		}
	});
</script>

<svelte:head>
	<title>Dashboard - Life Quest</title>
</svelte:head>

{#if !$authStore.initialized}
	<div class="flex items-center justify-center min-h-96">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
			<p class="text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else if !isAuthenticated}
	<!-- This will trigger redirect to login -->
	<div class="flex items-center justify-center min-h-96">
		<div class="text-center">
			<p class="text-muted-foreground">Redirecting to login...</p>
		</div>
	</div>
{:else if isLoading}
	<div class="flex items-center justify-center min-h-96">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
			<p class="text-muted-foreground">Loading your quest...</p>
		</div>
	</div>
{:else if error}
	<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
		<p class="text-destructive font-medium">Error loading dashboard</p>
		<p class="text-destructive/80 text-sm mt-1">{error}</p>
		<button 
			onclick={loadDashboard}
			class="mt-3 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:bg-destructive/90 transition-colors"
		>
			Try Again
		</button>
	</div>
{:else if dashboardData}
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-foreground mb-2">Your Dashboard</h1>
		<p class="text-muted-foreground">Today's progress at a glance</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<div class="bg-card p-4 rounded-lg border border-border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Today's Tasks</p>
					<p class="text-2xl font-bold text-foreground">{dashboardData.todaysTasks.length}</p>
				</div>
				<Clock class="w-8 h-8 text-primary" />
			</div>
		</div>

		<div class="bg-card p-4 rounded-lg border border-border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Character Level</p>
					<p class="text-2xl font-bold text-foreground">{dashboardData.xpProgress.currentLevel}</p>
				</div>
				<Award class="w-8 h-8 text-accent" />
			</div>
		</div>

		<div class="bg-card p-4 rounded-lg border border-border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Total XP</p>
					<p class="text-2xl font-bold text-foreground">{dashboardData.xpProgress.totalXp}</p>
				</div>
				<TrendingUp class="w-8 h-8 text-primary" />
			</div>
		</div>

		<div class="bg-card p-4 rounded-lg border border-border">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Stats Tracked</p>
					<p class="text-2xl font-bold text-foreground">{dashboardData.stats.length}</p>
				</div>
				<Target class="w-8 h-8 text-accent" />
			</div>
		</div>
	</div>

	<div class="grid lg:grid-cols-2 gap-8">
		<!-- Today's Tasks -->
		<div class="bg-card p-6 rounded-lg border border-border">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-semibold text-foreground">Today's Challenges</h2>
				<a 
					href="/tasks" 
					class="text-primary hover:text-primary/80 text-sm font-medium"
				>
					View All →
				</a>
			</div>

			{#if dashboardData.todaysTasks.length === 0}
				<div class="text-center py-8">
					<Target class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
					<p class="text-muted-foreground mb-4">No tasks for today!</p>
					<a 
						href="/tasks" 
						class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus class="w-4 h-4 mr-2" />
						Add Task
					</a>
				</div>
			{:else}
				<div class="space-y-3">
					{#each dashboardData.todaysTasks.slice(0, 5) as task}
						<div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
							<div class="flex-1">
								<h3 class="font-medium text-foreground">{task.title}</h3>
								{#if task.description}
									<p class="text-sm text-muted-foreground mt-1">{task.description}</p>
								{/if}
								<div class="flex items-center gap-2 mt-2">
									<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
										{task.source}
									</span>
									{#if task.estimatedXp}
										<span class="text-xs {getXpColor(task.estimatedXp)} font-medium">
											+{task.estimatedXp} XP
										</span>
									{/if}
								</div>
							</div>
							<button 
								onclick={() => completeTask(task.id)}
								class="ml-4 px-3 py-1 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm"
							>
								Complete
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Character Stats -->
		<div class="bg-card p-6 rounded-lg border border-border">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-semibold text-foreground">Your Stats</h2>
				<a 
					href="/character" 
					class="text-primary hover:text-primary/80 text-sm font-medium"
				>
					View All →
				</a>
			</div>

			{#if dashboardData.stats.length === 0}
				<div class="text-center py-8">
					<Target class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
					<p class="text-muted-foreground mb-4">No character stats yet!</p>
					<a 
						href="/character" 
						class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create Character
					</a>
				</div>
			{:else}
				<div class="space-y-4">
					{#each dashboardData.stats.slice(0, 3) as stat}
						<div class="p-4 bg-muted/50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-medium text-foreground">{stat.category}</h3>
								<span class="text-sm {getStatLevelColor(stat.currentLevel)} font-medium">
									Level {stat.currentLevel}
								</span>
							</div>
							
							{#if stat.description}
								<p class="text-sm text-muted-foreground mb-3">{stat.description}</p>
							{/if}

							<div class="space-y-2">
								<div class="flex justify-between text-sm">
									<span class="text-muted-foreground">XP</span>
									<span class="text-foreground">{stat.currentXp} / {stat.currentXp + 100}</span>
								</div>
								<div class="w-full bg-muted rounded-full h-2">
									<div 
										class="bg-primary h-2 rounded-full transition-all duration-300"
										style="width: {(stat.currentXp / (stat.currentXp + 100)) * 100}%"
									></div>
								</div>
							</div>

							{#if stat.levelTitle}
								<p class="text-xs text-muted-foreground mt-2 italic">"{stat.levelTitle}"</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Today's Journal -->
	<div class="mt-8 bg-card p-6 rounded-lg border border-border">
		<h2 class="text-xl font-semibold text-foreground mb-4">Today's Journal</h2>
		
		<div class="bg-muted/50 p-4 rounded-lg mb-4">
			<p class="text-foreground mb-3">{dashboardData.journalPrompt}</p>
		</div>

		<a 
			href="/journal" 
			class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
		>
			<BookOpen class="w-4 h-4 mr-2" />
			Write Entry
		</a>
	</div>
{/if}
