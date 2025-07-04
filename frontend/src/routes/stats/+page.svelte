<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { statsApi, type CharacterStatWithProgress, type PredefinedStat } from '$lib/api/stats';
	import { Plus, TrendingUp, Star, BarChart3, Zap, Trophy } from 'lucide-svelte';

	// Reactive state for stats data
	let userStats: CharacterStatWithProgress[] = $state([]);
	let predefinedStats: PredefinedStat[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load data on component mount
	onMount(async () => {
		// Wait for auth to be initialized, then check token
		if (!$authStore.initialized) {
			const unsubscribe = authStore.subscribe((authState) => {
				if (authState.initialized) {
					unsubscribe();
					loadStatsData(); // Call the data loading function
				}
			});
			return;
		}

		// If auth is already initialized, load data
		await loadStatsData();
	});

	// Separate function to load stats data
	async function loadStatsData() {
		if (!$authStore.token) {
			goto('/login');
			return;
		}

		try {
			loading = true;
			error = null;
			
			// Load both user stats and predefined stats in parallel
			const [userStatsData, predefinedStatsData] = await Promise.all([
				statsApi.getUserStats(),
				statsApi.getPredefinedStats()
			]);

			userStats = userStatsData;
			predefinedStats = predefinedStatsData;
		} catch (err) {
			console.error('Failed to load stats:', err);
			error = err instanceof Error ? err.message : 'Failed to load stats';
		} finally {
			loading = false;
		}
	}

	// Helper functions
	function getStatIcon(statName: string) {
		const name = statName.toLowerCase();
		if (name.includes('strength')) return BarChart3;
		if (name.includes('wisdom')) return Star;
		if (name.includes('creativity')) return Zap;
		if (name.includes('fatherhood') || name.includes('adventure')) return Trophy;
		return TrendingUp;
	}

	function calculateProgress(stat: CharacterStatWithProgress): number {
		const totalXpForLevel = Math.pow(stat.currentLevel, 2) * 100;
		const currentLevelXp = stat.totalXp - (stat.currentLevel > 1 ? Math.pow(stat.currentLevel - 1, 2) * 100 : 0);
		const xpNeededForLevel = Math.pow(stat.currentLevel + 1, 2) * 100 - totalXpForLevel;
		return Math.floor((currentLevelXp / xpNeededForLevel) * 100);
	}

	// Navigation functions
	function createCustomStat() {
		goto('/stats/create');
	}

	function editStat(statId: string) {
		goto(`/stats/${statId}/edit`);
	}

	function viewStatDetails(statId: string) {
		goto(`/stats/${statId}`);
	}
</script>

<svelte:head>
	<title>Character Stats - Gamified Life</title>
	<meta name="description" content="Manage your character's stats and track your personal development progress" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Page Header -->
	<div class="bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-primary/20">
		<div class="max-w-7xl mx-auto px-4 py-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-4xl font-bold text-primary mb-2">Stats Dashboard</h1>
					<p class="text-base-content/70 text-lg">Track your progress and level up your abilities</p>
				</div>
				<div class="flex gap-3">
					<button
						onclick={createCustomStat}
						class="btn btn-primary btn-lg gap-2 transition-all duration-200 hover:scale-105 shadow-lg"
					>
						<Plus size={20} />
						Create Custom Stat
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-7xl mx-auto px-4 py-8">
		{#if loading}
			<!-- Loading State -->
			<div class="flex items-center justify-center py-20">
				<div class="text-center space-y-4">
					<span class="loading loading-spinner loading-lg text-primary"></span>
					<p class="text-base-content/60">Loading your stats...</p>
				</div>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="alert alert-error max-w-md mx-auto">
				<div class="flex items-center gap-3">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span>{error}</span>
				</div>
			</div>
		{:else}
			<!-- Stats Grid Layout -->
			<div class="grid lg:grid-cols-4 gap-8">
				<!-- Main Stats Content (3/4 width) -->
				<div class="lg:col-span-3 space-y-8">
					<!-- Current Stats Section -->
					{#if userStats.length > 0}
						<section>
							<h2 class="text-2xl font-semibold text-primary border-b border-primary/20 pb-2 mb-6">
								Your Stats
							</h2>
							<div class="grid md:grid-cols-2 gap-6">
				{#each userStats as stat}
				  <button 
					class="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02] text-left w-full"
					onclick={() => viewStatDetails(stat.id)}
				  >
										<div class="card-body p-6">
											<div class="flex items-start justify-between mb-4">
												<div class="flex items-center gap-3">
													<div class="avatar placeholder">
														<div class="bg-primary text-primary-content rounded-full w-12">
															<svelte:component this={getStatIcon(stat.name)} size={24} />
														</div>
													</div>
													<div>
														<h3 class="font-bold text-lg">{stat.name}</h3>
														<p class="text-base-content/60 text-sm">Level {stat.currentLevel}</p>
													</div>
												</div>
												<div class="text-right">
													<div class="text-2xl font-bold text-primary">{stat.totalXp}</div>
													<div class="text-xs text-base-content/60">XP</div>
												</div>
											</div>

											<p class="text-sm text-base-content/80 mb-4">{stat.description}</p>

											<!-- Progress Bar -->
											<div class="space-y-2">
												<div class="flex justify-between text-xs">
													<span>Progress to Level {stat.currentLevel + 1}</span>
													<span>{stat.xpToNextLevel} XP needed</span>
												</div>
												<div class="w-full bg-base-300 rounded-full h-3">
													<div 
														class="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
														style="width: {calculateProgress(stat)}%"
													></div>
												</div>
											</div>

											<!-- Level Up Button -->
											{#if stat.canLevelUp}
												<div class="mt-4">
													<div 
														class="btn btn-accent btn-sm w-full gap-2 cursor-pointer"
														onclick={(e) => {
															e.stopPropagation();
															goto(`/stats/${stat.id}/level-up`);
														}}
														role="button"
														tabindex="0"
														onkeydown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																e.stopPropagation();
																goto(`/stats/${stat.id}/level-up`);
															}
														}}
													>
														<Trophy size={16} />
														Level Up Available!
													</div>
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</section>
					{:else}
						<!-- Empty State for User Stats -->
						<section>
							<div class="card bg-base-100 shadow-xl border border-base-300">
								<div class="card-body text-center py-12">
									<div class="avatar placeholder mb-6">
										<div class="bg-base-300 text-base-content rounded-full w-20">
											<TrendingUp size={40} />
										</div>
									</div>
									<h3 class="text-xl font-semibold mb-2">No Stats Yet</h3>
									<p class="text-base-content/60 mb-6">
										Start your journey by creating a custom stat or choosing from our predefined options.
									</p>
									<button onclick={createCustomStat} class="btn btn-primary btn-lg gap-2">
										<Plus size={20} />
										Create Your First Stat
									</button>
								</div>
							</div>
						</section>
					{/if}

					<!-- Predefined Stats Section -->
					{#if predefinedStats.length > 0}
						<section>
							<h2 class="text-2xl font-semibold text-primary border-b border-primary/20 pb-2 mb-6">
								Recommended Stats
							</h2>
							<p class="text-base-content/70 mb-6">
								These are carefully designed stats that work well for personal development. Click to add them to your character.
							</p>
							<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
								{#each predefinedStats as predefinedStat}
									<div class="card bg-gradient-to-br from-secondary/5 to-accent/5 border border-secondary/20 hover:shadow-lg transition-all duration-200">
										<div class="card-body p-4">
											<div class="flex items-center gap-3 mb-3">													<div class="avatar placeholder">
														<div class="bg-secondary text-secondary-content rounded-full w-10">
															<svelte:component this={getStatIcon(predefinedStat.name)} size={20} />
														</div>
													</div>
												<h4 class="font-semibold">{predefinedStat.name}</h4>
											</div>
											
											<p class="text-sm text-base-content/70 mb-3">{predefinedStat.description}</p>
											
											<div class="space-y-1 mb-4">
												<div class="text-xs font-medium text-base-content/60">Example Activities:</div>
												{#each predefinedStat.exampleActivities.slice(0, 2) as activity}
													<div class="text-xs text-base-content/50">
														• {activity.description} ({activity.suggestedXp} XP)
													</div>
												{/each}
											</div>
											
											<button 
												class="btn btn-secondary btn-sm w-full"
												onclick={() => goto(`/stats/create?preset=${encodeURIComponent(predefinedStat.name)}`)}
											>
												Add to Character
											</button>
										</div>
									</div>
								{/each}
							</div>
						</section>
					{/if}
				</div>

				<!-- Sidebar (1/4 width) -->
				<div class="lg:col-span-1">
					<div class="sticky top-8 space-y-6">
						<!-- Quick Stats Card -->
						<div class="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
							<div class="card-body p-6">
								<h3 class="font-semibold text-primary mb-4">Quick Stats</h3>
								<div class="space-y-3">
									<div class="flex justify-between">
										<span class="text-sm">Active Stats:</span>
										<span class="font-medium">{userStats.length}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-sm">Total XP:</span>
										<span class="font-medium">{userStats.reduce((sum, stat) => sum + stat.totalXp, 0)}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-sm">Ready to Level:</span>
										<span class="font-medium text-accent">{userStats.filter(stat => stat.canLevelUp).length}</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Tips Card -->
						<div class="card bg-base-100 shadow-xl border border-base-300">
							<div class="card-body p-6">
								<h3 class="font-semibold mb-4">💡 Tips</h3>
								<div class="space-y-3 text-sm">
									<p class="text-base-content/70">
										Click on a stat card to view detailed progress and XP history.
									</p>
									<p class="text-base-content/70">
										Stats automatically track XP from completed tasks and journal entries.
									</p>
									<p class="text-base-content/70">
										Level up manually when you feel you've genuinely improved in that area.
									</p>
								</div>
							</div>
						</div>

						<!-- Actions Card -->
						<div class="card bg-base-100 shadow-xl border border-base-300">
							<div class="card-body p-6">
								<h3 class="font-semibold mb-4">Quick Actions</h3>
								<div class="space-y-2">
									<button onclick={createCustomStat} class="btn btn-outline btn-sm w-full gap-2">
										<Plus size={16} />
										Create Custom Stat
									</button>
									<button onclick={() => goto('/stats/history')} class="btn btn-outline btn-sm w-full gap-2">
										<BarChart3 size={16} />
										View XP History
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
