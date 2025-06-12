<script lang="ts">
	import { onMount } from 'svelte';
	import { BarChart3, Award, ArrowRight } from 'lucide-svelte';
	import type { CharacterStat } from '$lib/types';
	import StatDisplay from './StatDisplay.svelte';
	
	export let limit = 3;
	
	let stats = $state<CharacterStat[]>([]);
	let loading = $state(true);
	let error = $state('');
	
	onMount(async () => {
		await loadStats();
	});
	
	async function loadStats() {
		try {
			loading = true;
			error = '';
			const response = await fetch(`/api/stats?limit=${limit}`);
			
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
</script>

<div class="card bg-base-100 border border-base-300">
	<div class="card-body">
		<div class="flex items-center justify-between mb-2">
			<h3 class="card-title flex items-center gap-2">
				<Award size={18} />
				Character Stats
			</h3>
			<a href="/stats" class="btn btn-sm btn-ghost">
				View All
				<ArrowRight size={16} />
			</a>
		</div>
		
		{#if error}
			<div class="alert alert-error text-sm">
				<span>{error}</span>
				<button class="btn btn-xs" on:click={loadStats}>Retry</button>
			</div>
		{:else if loading}
			<div class="flex justify-center py-6">
				<span class="loading loading-spinner"></span>
			</div>
		{:else if stats.length === 0}
			<div class="text-center py-6">
				<BarChart3 size={32} class="mx-auto text-base-content/30 mb-2" />
				<p class="text-base-content/70">No character stats yet</p>
				<a href="/stats/new" class="btn btn-primary btn-sm mt-3">Create First Stat</a>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each stats as stat (stat.id)}
					<a href="/stats/{stat.id}" class="p-3 rounded-lg border border-base-200 hover:border-primary transition-colors">
						<StatDisplay 
							name={stat.name}
							level={stat.level}
							currentXp={stat.currentXp}
							progress={stat.progress}
							xpToNextLevel={stat.xpToNextLevel}
						/>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
