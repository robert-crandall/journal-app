<script lang="ts">
	import { onMount } from 'svelte';
	import { BarChart3, Plus, TrendingUp, Award, BookOpen, ArrowUpDown } from 'lucide-svelte';
	import type { CharacterStat } from '$lib/types';
	import { formatXp } from '$lib/utils/xp';
	
	let stats = $state<CharacterStat[]>([]);
	let loading = $state(true);
	let error = $state('');
	let sortBy = $state<'level' | 'xp' | 'name' | 'recent'>('level');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	
	// Computed property for sorted stats
	$derived sortedStats = [...stats].sort((a, b) => {
		let comparison = 0;
		
		switch (sortBy) {
			case 'level':
				comparison = b.level - a.level;
				break;
			case 'xp':
				comparison = b.currentXp - a.currentXp;
				break;
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'recent':
				const dateA = new Date(a.updatedAt).getTime();
				const dateB = new Date(b.updatedAt).getTime();
				comparison = dateB - dateA;
				break;
		}
		
		return sortDirection === 'asc' ? -comparison : comparison;
	});
	
	onMount(async () => {
		await loadStats();
	});
	
	async function loadStats() {
		try {
			loading = true;
			error = '';
			const response = await fetch('/api/stats');
			
			if (response.ok) {
				const data = await response.json();
				stats = data.stats || [];
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load character stats';
			}
		} catch (err) {
			console.error('Error loading character stats:', err);
			error = 'An error occurred while loading character stats';
		} finally {
			loading = false;
		}
	}
	
	function toggleSort(newSortBy: typeof sortBy) {
		if (sortBy === newSortBy) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = newSortBy;
			// Default directions for different sort types
			if (newSortBy === 'name') {
				sortDirection = 'asc';
			} else {
				sortDirection = 'desc';
			}
		}
	}
	
	function getSortIcon(columnName: typeof sortBy) {
		return sortBy === columnName ? 
			(sortDirection === 'asc' ? '↑' : '↓') : '';
	}
	
	function getBarWidth(xp: number) {
		const maxXp = stats.length > 0 ? Math.max(...stats.map(s => s.currentXp)) : 100;
		const percentage = maxXp > 0 ? (xp / maxXp) * 100 : 0;
		return Math.max(5, percentage) + '%';
	}
</script>

<svelte:head>
	<title>Character Stats - Journal App</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Character Stats</h1>
			<p class="text-base-content/70 mt-1">Track your personal growth attributes</p>
		</div>
		<div class="flex gap-2">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-outline gap-2">
					<ArrowUpDown size={16} />
					Sort by {sortBy}
				</div>
				<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
					<li><a on:click={() => toggleSort('level')}>Level {getSortIcon('level')}</a></li>
					<li><a on:click={() => toggleSort('xp')}>Total XP {getSortIcon('xp')}</a></li>
					<li><a on:click={() => toggleSort('name')}>Name {getSortIcon('name')}</a></li>
					<li><a on:click={() => toggleSort('recent')}>Recently Updated {getSortIcon('recent')}</a></li>
				</ul>
			</div>
			<a href="/stats/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				New Stat
			</a>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadStats}>Retry</button>
		</div>
	{/if}

	<!-- Stats List -->
	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if stats.length === 0}
		<div class="text-center py-16">
			<BarChart3 size={64} class="mx-auto text-base-content/30 mb-4" />
			<h2 class="text-xl font-semibold mb-2">No character stats yet</h2>
			<p class="text-base-content/70 mb-6">Create stats to track your personal attributes and growth</p>
			<a href="/stats/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				Create First Stat
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#each sortedStats as stat (stat.id)}
				<div class="card bg-base-100 border border-base-300 hover:border-base-400 transition-colors h-full">
					<div class="card-body">
						<a href="/stats/{stat.id}" class="hover:underline">
							<h3 class="font-semibold text-lg flex items-center gap-2">
								<Award size={20} />
								{stat.name}
							</h3>
						</a>
						
						{#if stat.description}
							<p class="text-base-content/70 text-sm line-clamp-2">{stat.description}</p>
						{/if}
						
						<div class="mt-3 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="badge badge-lg badge-primary">Level {stat.level}</div>
								</div>
								<div class="flex items-center gap-2">
									<BookOpen size={16} class="text-base-content/60" />
									<span class="text-xs text-base-content/60">
										Updated {new Date(stat.updatedAt).toLocaleDateString()}
									</span>
								</div>
							</div>
							
							<div class="flex items-center space-x-2">
								<div class="text-xl font-mono font-semibold">{formatXp(stat.currentXp)}</div>
								<div class="text-sm text-base-content/60 flex items-center gap-1">
									XP
									<span class="text-xs">({formatXp(stat.xpToNextLevel)} to next level)</span>
								</div>
							</div>
							
							<div class="w-full bg-base-200 h-2 rounded-full overflow-hidden">
								<div 
									class="bg-primary h-full" 
									style={`width: ${getBarWidth(stat.currentXp)};`}>
								</div>
							</div>
							
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span>Level Progress</span>
									<span>{Math.round(stat.progress * 100)}%</span>
								</div>
								<progress class="progress progress-primary w-full" value={stat.progress * 100} max="100"></progress>
							</div>
						</div>
						
						<div class="card-actions justify-end mt-2">
							<a href="/stats/{stat.id}" class="btn btn-sm btn-primary">
								View Details
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
