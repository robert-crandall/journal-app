<script lang="ts">
	import { onMount } from 'svelte';
	import { Award, Plus, Loader2 } from 'lucide-svelte';
	import type { CharacterStat } from '$lib/types';
	
	export let selectedStats: { id: string; name: string; xpAmount: number }[] = [];
	
	let availableStats: CharacterStat[] = [];
	let loading = true;
	let error = '';
	
	// For adding new stat
	let showNewStatForm = false;
	let newStatName = '';
	let newStatDescription = '';
	let addingNewStat = false;
	
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
				availableStats = data.stats || [];
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
	
	function toggleStat(stat: CharacterStat) {
		const existingIndex = selectedStats.findIndex(s => s.id === stat.id);
		
		if (existingIndex >= 0) {
			// Remove from selection
			selectedStats = [...selectedStats.slice(0, existingIndex), ...selectedStats.slice(existingIndex + 1)];
		} else {
			// Add to selection with default XP amount
			selectedStats = [...selectedStats, { id: stat.id, name: stat.name, xpAmount: 5 }];
		}
	}
	
	function updateXpAmount(statId: string, amount: number) {
		const statIndex = selectedStats.findIndex(s => s.id === statId);
		if (statIndex >= 0) {
			const updatedStat = { ...selectedStats[statIndex], xpAmount: amount };
			selectedStats = [
				...selectedStats.slice(0, statIndex),
				updatedStat,
				...selectedStats.slice(statIndex + 1)
			];
		}
	}
	
	function isSelected(statId: string) {
		return selectedStats.some(s => s.id === statId);
	}
	
	async function createNewStat() {
		if (!newStatName) return;
		
		try {
			addingNewStat = true;
			const response = await fetch('/api/stats', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: newStatName,
					description: newStatDescription
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				availableStats = [...availableStats, data.stat];
				
				// Automatically select the newly created stat
				selectedStats = [...selectedStats, { 
					id: data.stat.id, 
					name: data.stat.name, 
					xpAmount: 5 
				}];
				
				// Reset the form
				newStatName = '';
				newStatDescription = '';
				showNewStatForm = false;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to create stat';
			}
		} catch (err) {
			console.error('Error creating stat:', err);
			error = 'An error occurred while creating the stat';
		} finally {
			addingNewStat = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="font-medium text-base flex items-center gap-2">
			<Award size={18} /> Character Stats
		</h3>
		<button 
			class="btn btn-sm btn-ghost"
			on:click={() => showNewStatForm = !showNewStatForm}
		>
			{#if showNewStatForm}
				Cancel
			{:else}
				<Plus size={16} /> New Stat
			{/if}
		</button>
	</div>
	
	{#if error}
		<div class="alert alert-error text-sm">
			<span>{error}</span>
			<button class="btn btn-xs" on:click={loadStats}>Retry</button>
		</div>
	{/if}
	
	{#if showNewStatForm}
		<div class="card bg-base-200 p-4 border border-base-300">
			<h4 class="font-medium mb-3">Create New Stat</h4>
			<div class="space-y-3">
				<div class="form-control">
					<input
						type="text"
						class="input input-bordered input-sm"
						placeholder="Name"
						bind:value={newStatName}
					/>
				</div>
				<div class="form-control">
					<textarea
						class="textarea textarea-bordered textarea-sm"
						placeholder="Description (optional)"
						rows="2"
						bind:value={newStatDescription}
					></textarea>
				</div>
				<div class="flex justify-end">
					<button 
						class="btn btn-sm btn-primary" 
						on:click={createNewStat}
						disabled={!newStatName || addingNewStat}
					>
						{#if addingNewStat}
							<Loader2 size={16} class="animate-spin" />
						{:else}
							Create & Select
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
	
	{#if loading}
		<div class="flex justify-center py-4">
			<span class="loading loading-spinner"></span>
		</div>
	{:else if availableStats.length === 0}
		<div class="text-center py-4 text-base-content/60">
			<p>No character stats found</p>
			<button 
				class="btn btn-sm btn-primary mt-2"
				on:click={() => showNewStatForm = true}
			>
				Create Your First Stat
			</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each availableStats as stat (stat.id)}
				<div 
					class="flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer hover:bg-base-200"
					class:bg-base-200={isSelected(stat.id)} 
					class:border-primary={isSelected(stat.id)}
					class:border-base-300={!isSelected(stat.id)}
					on:click={() => toggleStat(stat)}
					on:keydown={(e) => e.key === 'Enter' && toggleStat(stat)}
					tabindex="0"
					role="checkbox"
					aria-checked={isSelected(stat.id)}
				>
					<div class="flex items-center gap-2">
						<input 
							type="checkbox" 
							class="checkbox checkbox-primary checkbox-sm"
							checked={isSelected(stat.id)}
							on:change={() => toggleStat(stat)}
						/>
						<div>
							<div class="font-medium">{stat.name}</div>
							{#if stat.description}
								<div class="text-xs text-base-content/60 line-clamp-1">{stat.description}</div>
							{/if}
						</div>
					</div>
					
					{#if isSelected(stat.id)}
						<div class="flex items-center gap-2">
							<span class="text-xs">XP:</span>
							<input 
								type="number" 
								class="input input-bordered input-xs w-16 text-center"
								value={selectedStats.find(s => s.id === stat.id)?.xpAmount || 5}
								on:change={(e) => updateXpAmount(stat.id, parseInt(e.target.value) || 5)}
								min="1"
								max="100"
								on:click={(e) => e.stopPropagation()}
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	
	{#if selectedStats.length > 0}
		<div class="flex justify-between items-center pt-2 text-sm">
			<div>Selected: {selectedStats.length} stat{selectedStats.length !== 1 ? 's' : ''}</div>
			<div>
				Total XP: {selectedStats.reduce((sum, stat) => sum + stat.xpAmount, 0)}
			</div>
		</div>
	{/if}
</div>
