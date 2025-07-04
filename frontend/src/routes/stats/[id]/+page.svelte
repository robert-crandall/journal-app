<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { statsApi } from '$lib/api/stats.js';
	import { 
		Trophy, 
		TrendingUp, 
		Calendar, 
		Zap, 
		Edit, 
		Trash2, 
		BarChart3,
		Award,
		Target,
		Activity
	} from 'lucide-svelte';
	
	import type { CharacterStatXpGrant, CharacterStatWithProgress } from '$lib/api/stats';

	// State
	let stat = $state<CharacterStatWithProgress | null>(null);
	let xpHistory = $state<CharacterStatXpGrant[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showDeleteModal = $state(false);
	let deleting = $state(false);

	// Derived values
	const statId = $derived($page.params.id);
	const progressPercentage = $derived(() => {
		if (!stat) return 0;
		const currentLevelXp = stat.currentLevel * 100; // Assuming 100 XP per level
		const nextLevelXp = (stat.currentLevel + 1) * 100;
		const progressInLevel = stat.totalXp - currentLevelXp;
		const levelXpRequired = nextLevelXp - currentLevelXp;
		return Math.min((progressInLevel / levelXpRequired) * 100, 100);
	});

	// Functions
	async function loadStat() {
		// Wait for auth to be initialized
		if (!$authStore.initialized) {
			// Set up a one-time subscription to wait for auth initialization
			const unsubscribe = authStore.subscribe((authState) => {
				if (authState.initialized) {
					unsubscribe();
					loadStat(); // Retry after auth is initialized
				}
			});
			return;
		}

		if (!$authStore.token || !statId) return;
		
		try {
			loading = true;
			error = null;
			
			const [statResponse, historyResponse] = await Promise.all([
				statsApi.getStat(statId),
				statsApi.getXpHistory(statId)
			]);
			
			stat = statResponse;
			xpHistory = historyResponse;
		} catch (err) {
			console.error('Error loading stat:', err);
			error = 'Failed to load stat details';
		} finally {
			loading = false;
		}
	}

	async function deleteStat() {
		if (!stat || !$authStore.token) return;
		
		try {
			deleting = true;
			await statsApi.deleteStat(stat.id);
			goto('/stats');
		} catch (err) {
			console.error('Error deleting stat:', err);
			error = 'Failed to delete stat';
		} finally {
			deleting = false;
			showDeleteModal = false;
		}
	}

	function editStat() {
		if (stat) {
			goto(`/stats/${stat.id}/edit`);
		}
	}

	function grantXp() {
		if (stat) {
			goto(`/stats/${stat.id}/grant-xp`);
		}
	}

	function levelUp() {
		if (stat) {
			goto(`/stats/${stat.id}/level-up`);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Lifecycle
	onMount(() => {
		loadStat();
	});
</script>

<!-- Page Header -->
<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Breadcrumb -->
	<div class="breadcrumbs text-sm mb-6">
		<ul>
			<li><a href="/stats" class="text-primary hover:text-primary-focus">Stats</a></li>
			<li class="text-base-content/60">{stat?.name || 'Loading...'}</li>
		</ul>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<span class="loading loading-spinner loading-lg text-primary"></span>
				<p class="mt-4 text-base-content/60">Loading stat details...</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="card bg-error text-error-content shadow-xl">
			<div class="card-body text-center">
				<h2 class="card-title justify-center">
					<TrendingUp size={24} />
					Error Loading Stat
				</h2>
				<p>{error}</p>
				<div class="card-actions justify-center">
					<button onclick={loadStat} class="btn btn-neutral">Try Again</button>
					<a href="/stats" class="btn btn-outline">Back to Stats</a>
				</div>
			</div>
		</div>
	{:else if stat}
		<!-- Main Content -->
		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Stat Overview - Spans 2 columns on large screens -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Stat Header Card -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
							<div class="flex-1">
								<div class="flex items-center gap-4 mb-4">
									<div class="avatar placeholder">
										<div class="bg-primary text-primary-content rounded-full w-16">
											<BarChart3 size={32} />
										</div>
									</div>
									<div>
										<h1 class="text-3xl font-bold text-primary">{stat.name}</h1>
										<p class="text-lg text-base-content/60">Level {stat.currentLevel}</p>
									</div>
								</div>
								<p class="text-base-content/80 mb-6">{stat.description}</p>
								
								<!-- XP Progress -->
								<div class="space-y-3">
									<div class="flex justify-between items-center">
										<span class="font-semibold">Progress to Level {stat.currentLevel + 1}</span>
										<span class="text-2xl font-bold text-primary">{stat.totalXp} XP</span>
									</div>
									<div class="w-full bg-base-300 rounded-full h-4">
										<div 
											class="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
											style="width: {progressPercentage()}%"
										>
											{#if progressPercentage() > 20}
												<span class="text-xs text-primary-content font-semibold">
													{Math.round(progressPercentage())}%
												</span>
											{/if}
										</div>
									</div>
									<div class="flex justify-between text-sm text-base-content/60">
										<span>Current Level: {stat.currentLevel}</span>
										<span>{stat.xpToNextLevel} XP needed for next level</span>
									</div>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex flex-col gap-2 min-w-[200px]">
								<button onclick={grantXp} class="btn btn-primary gap-2">
									<Zap size={16} />
									Grant XP
								</button>
								
								{#if stat.canLevelUp}
									<button onclick={levelUp} class="btn btn-accent gap-2">
										<Trophy size={16} />
										Level Up!
									</button>
								{/if}
								
								<button onclick={editStat} class="btn btn-outline gap-2">
									<Edit size={16} />
									Edit Stat
								</button>
								
								<button 
									onclick={() => showDeleteModal = true} 
									class="btn btn-outline btn-error gap-2"
								>
									<Trash2 size={16} />
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Example Activities -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h2 class="card-title text-xl border-b border-base-300 pb-2 mb-4">
							<Target size={20} />
							Example Activities
						</h2>
						<div class="grid md:grid-cols-2 gap-4">
							{#each stat.exampleActivities as activity}
								<div class="p-4 bg-base-200 rounded-lg">
									<div class="flex justify-between items-start gap-3">
										<p class="text-sm flex-1">{activity.description}</p>
										<div class="badge badge-primary gap-1">
											<Zap size={12} />
											{activity.suggestedXp} XP
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- XP History -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h2 class="card-title text-xl border-b border-base-300 pb-2 mb-4">
							<Activity size={20} />
							Recent XP History
						</h2>
						
						{#if xpHistory.length > 0}
							<div class="space-y-3">
								{#each xpHistory.slice(0, 10) as entry}
									<div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
										<div class="flex-1">
											<p class="font-medium">{entry.reason || 'XP Grant'}</p>
											<p class="text-sm text-base-content/60">
												{formatDate(entry.createdAt)}
											</p>
										</div>
										<div class="badge badge-success gap-1">
											<Award size={12} />
											+{entry.xpAmount} XP
										</div>
									</div>
								{/each}
								
								{#if xpHistory.length > 10}
									<div class="text-center pt-4">
										<button class="btn btn-outline btn-sm">
											View All History ({xpHistory.length} entries)
										</button>
									</div>
								{/if}
							</div>
						{:else}
							<div class="text-center py-8">
								<div class="avatar placeholder mb-4">
									<div class="bg-base-300 text-base-content rounded-full w-16">
										<Activity size={32} />
									</div>
								</div>
								<p class="text-base-content/60">No XP history yet. Start earning XP to see your progress!</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Sidebar - Stats Summary -->
			<div class="space-y-6">
				<!-- Quick Stats -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h3 class="card-title text-lg border-b border-base-300 pb-2 mb-4">
							<BarChart3 size={18} />
							Quick Stats
						</h3>
						<div class="space-y-4">
							<div class="stat py-2">
								<div class="stat-title text-xs">Current Level</div>
								<div class="stat-value text-2xl text-primary">{stat.currentLevel}</div>
							</div>
							<div class="stat py-2">
								<div class="stat-title text-xs">Total XP</div>
								<div class="stat-value text-2xl text-secondary">{stat.totalXp}</div>
							</div>
							<div class="stat py-2">
								<div class="stat-title text-xs">XP to Next Level</div>
								<div class="stat-value text-2xl text-accent">{stat.xpToNextLevel}</div>
							</div>
							<div class="stat py-2">
								<div class="stat-title text-xs">Created</div>
								<div class="stat-desc text-sm">{formatDate(stat.createdAt)}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Level Progression -->
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<h3 class="card-title text-lg border-b border-base-300 pb-2 mb-4">
							<Trophy size={18} />
							Level Progression
						</h3>
						<div class="space-y-2">
							{#each Array(Math.min(stat.currentLevel + 3, 10)) as _, i}
								{@const level = i + 1}
								{@const isCurrentLevel = level === stat.currentLevel}
								{@const isCompleted = level < stat.currentLevel}
								{@const isNext = level === stat.currentLevel + 1}
								
								<div class="flex items-center gap-3 p-2 rounded-lg {isCurrentLevel ? 'bg-primary/10' : ''}">
									<div class="flex items-center justify-center w-8 h-8 rounded-full 
										{isCompleted ? 'bg-success text-success-content' : 
										 isCurrentLevel ? 'bg-primary text-primary-content' : 
										 isNext ? 'bg-warning text-warning-content' : 'bg-base-300'}">
										{#if isCompleted}
											<Trophy size={14} />
										{:else}
											<span class="text-xs font-bold">{level}</span>
										{/if}
									</div>
									<div class="flex-1">
										<div class="text-sm font-medium">
											Level {level}
											{#if isCurrentLevel}
												<span class="badge badge-primary badge-xs ml-2">Current</span>
											{:else if isNext}
												<span class="badge badge-warning badge-xs ml-2">Next</span>
											{/if}
										</div>
										<div class="text-xs text-base-content/60">
											{level * 100} XP required
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg flex items-center gap-2">
				<Trash2 size={20} class="text-error" />
				Delete Stat
			</h3>
			<p class="py-4">
				Are you sure you want to delete "<strong>{stat?.name}</strong>"? 
				This action cannot be undone and will permanently remove all XP history.
			</p>
			<div class="modal-action">
				<button 
					onclick={() => showDeleteModal = false}
					class="btn btn-outline"
					disabled={deleting}
				>
					Cancel
				</button>
				<button 
					onclick={deleteStat}
					class="btn btn-error gap-2"
					disabled={deleting}
				>
					{#if deleting}
						<span class="loading loading-spinner loading-sm"></span>
					{:else}
						<Trash2 size={16} />
					{/if}
					Delete Permanently
				</button>
			</div>
		</div>
		<button 
			class="modal-backdrop" 
			onclick={() => showDeleteModal = false}
			aria-label="Close modal"
		></button>
	</div>
{/if}
