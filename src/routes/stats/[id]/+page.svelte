<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { BarChart3, Edit, Trash2, TrendingUp, Target, Calendar, Book, ArrowUp, Plus, Minus, Award, ChevronUp } from 'lucide-svelte';
	import type { CharacterStatWithProgress } from '$lib/types';
	import { formatXp } from '$lib/utils/xp';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	
	type XpChartData = {
		date: string | Date;
		value: number;
	};
	
	let stat = $state<CharacterStatWithProgress | null>(null);
	let loading = $state(true);
	let error = $state('');
	let editMode = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let saving = $state(false);
	let xpChartData = $state<XpChartData[]>([]);
	
	// XP adjustment state
	let showXpAdjustment = $state(false);
	let xpAmount = $state(5);
	let xpReason = $state('');
	let adjustingXp = $state(false);
	
	// Confirmation modal state
	let deleteConfirmOpen = $state(false);
	let deleting = $state(false);
	
	onMount(async () => {
		await loadStat();
	});
	
	async function loadStat() {
		try {
			loading = true;
			error = '';
			const statId = $page.params.id;
			
			const response = await fetch(`/api/stats/${statId}`);
			
			if (response.ok) {
				const data = await response.json();
				stat = data.stat;
				xpChartData = data.xpChartData || [];
				editName = stat?.name || '';
				editDescription = stat?.description || '';
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load character stat';
			}
		} catch (err) {
			console.error('Error loading character stat:', err);
			error = 'An error occurred while loading the character stat';
		} finally {
			loading = false;
		}
	}
	
	function startEditing() {
		editName = stat?.name || '';
		editDescription = stat?.description || '';
		editMode = true;
	}
	
	async function saveStat() {
		if (!stat) return;
		
		try {
			saving = true;
			error = '';
			const response = await fetch(`/api/stats/${stat.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: editName,
					description: editDescription
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				stat = data.stat;
				editMode = false;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to update character stat';
			}
		} catch (err) {
			console.error('Error updating character stat:', err);
			error = 'An error occurred while updating the character stat';
		} finally {
			saving = false;
		}
	}
	
	async function adjustXp(isPositive: boolean) {
		if (!stat || xpAmount <= 0) return;
		
		try {
			adjustingXp = true;
			error = '';
			const adjustment = isPositive ? xpAmount : -xpAmount;
			
			const response = await fetch(`/api/stats/${stat.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					xpAdjustment: adjustment
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				stat = data.stat;
				
				// Update chart data with new XP point
				if (isPositive) {
					xpChartData = [
						...xpChartData,
						{
							date: new Date(),
							value: stat.currentXp
						}
					];
				} else {
					// For XP reduction, just update the last point
					if (xpChartData.length > 0) {
						const lastIndex = xpChartData.length - 1;
						xpChartData = [
							...xpChartData.slice(0, lastIndex),
							{
								date: new Date(),
								value: stat.currentXp
							}
						];
					}
				}
				
				showXpAdjustment = false;
				xpAmount = 5;
				xpReason = '';
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to adjust XP';
			}
		} catch (err) {
			console.error('Error adjusting XP:', err);
			error = 'An error occurred while adjusting XP';
		} finally {
			adjustingXp = false;
		}
	}
	
	async function deleteStat() {
		if (!stat) return;
		
		try {
			deleting = true;
			error = '';
			const response = await fetch(`/api/stats/${stat.id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				window.location.href = '/stats';
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to delete character stat';
				deleteConfirmOpen = false;
			}
		} catch (err) {
			console.error('Error deleting character stat:', err);
			error = 'An error occurred while deleting the character stat';
			deleteConfirmOpen = false;
		} finally {
			deleting = false;
		}
	}
	
	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	// Calculate time to reach next level at current rate
	function calculateTimeToNextLevel() {
		if (!stat || !stat.journalEntries || stat.journalEntries.length < 2) {
			return null;
		}
		
		// Get the oldest and newest entries to calculate average XP gain per day
		const oldestEntry = new Date(stat.journalEntries[stat.journalEntries.length - 1].createdAt);
		const newestEntry = new Date(stat.journalEntries[0].createdAt);
		const daysDiff = Math.max(1, (newestEntry.getTime() - oldestEntry.getTime()) / (1000 * 60 * 60 * 24));
		
		// Calculate total XP gained over this period
		const totalXpGained = stat.journalEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
		
		// XP per day
		const xpPerDay = totalXpGained / daysDiff;
		
		if (xpPerDay <= 0) return null;
		
		// Days to next level
		const daysToNextLevel = stat.xpToNextLevel / xpPerDay;
		
		return {
			days: Math.ceil(daysToNextLevel),
			date: new Date(Date.now() + (daysToNextLevel * 24 * 60 * 60 * 1000))
		};
	}
	
	$derived timeToNextLevel = calculateTimeToNextLevel();
</script>

<svelte:head>
	<title>{stat ? `${stat.name} - Character Stats` : 'Character Stat Detail'} - Journal App</title>
</svelte:head>

<div class="space-y-6">
	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadStat}>Retry</button>
		</div>
	{:else if stat}
		<!-- Header -->
		<div class="flex items-start justify-between">
			<div>
				{#if !editMode}
					<h1 class="text-3xl font-bold text-base-content flex items-center gap-2">
						<Award size={28} /> {stat.name}
					</h1>
					{#if stat.description}
						<p class="text-base-content/70 mt-1">{stat.description}</p>
					{/if}
				{:else}
					<div class="space-y-4">
						<div class="form-control">
							<input
								type="text"
								class="input input-bordered text-xl font-bold"
								bind:value={editName}
								placeholder="Stat Name"
								required
							/>
						</div>
						<div class="form-control">
							<textarea
								class="textarea textarea-bordered"
								bind:value={editDescription}
								placeholder="Description"
								rows="2"
							></textarea>
						</div>
						<div class="flex gap-2">
							<button class="btn btn-primary btn-sm" on:click={saveStat} disabled={saving}>
								{#if saving}
									<span class="loading loading-spinner loading-sm"></span>
									Saving...
								{:else}
									Save Changes
								{/if}
							</button>
							<button class="btn btn-ghost btn-sm" on:click={() => editMode = false} disabled={saving}>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>
			
			{#if !editMode}
				<div class="flex gap-2">
					<button class="btn btn-ghost btn-sm" on:click={startEditing}>
						<Edit size={16} />
						Edit
					</button>
					<button class="btn btn-ghost btn-sm btn-primary" on:click={() => showXpAdjustment = !showXpAdjustment}>
						{#if showXpAdjustment}
							Hide XP Controls
						{:else}
							Adjust XP
						{/if}
					</button>
					<button class="btn btn-error btn-sm btn-outline" on:click={() => deleteConfirmOpen = true}>
						<Trash2 size={16} />
						Delete
					</button>
				</div>
			{/if}
		</div>
		
		<!-- XP Adjustment Controls -->
		{#if showXpAdjustment}
			<div class="card bg-base-200 p-4 border border-base-300">
				<h3 class="font-semibold mb-3">Manually Adjust XP</h3>
				<div class="space-y-4">
					<div class="form-control">
						<label class="label">
							<span class="label-text">XP Amount</span>
						</label>
						<input 
							type="number" 
							class="input input-bordered w-full max-w-xs" 
							bind:value={xpAmount}
							min="1"
							max="1000"
						/>
						<label class="label">
							<span class="label-text-alt">Enter a value between 1 and 1000</span>
						</label>
					</div>
					
					<div class="form-control">
						<label class="label">
							<span class="label-text">Reason (optional)</span>
						</label>
						<input 
							type="text" 
							class="input input-bordered w-full" 
							bind:value={xpReason}
							placeholder="Why are you adjusting XP? (e.g., 'Completed workout routine')"
						/>
					</div>
					
					<div class="flex items-center gap-2">
						<button 
							class="btn btn-success flex-1" 
							disabled={xpAmount <= 0 || adjustingXp}
							on:click={() => adjustXp(true)}
						>
							<Plus size={16} />
							Add XP
						</button>
						<button 
							class="btn btn-error flex-1" 
							disabled={xpAmount <= 0 || adjustingXp || stat.currentXp < xpAmount}
							on:click={() => adjustXp(false)}
						>
							<Minus size={16} />
							Remove XP
						</button>
					</div>
					
					{#if adjustingXp}
						<div class="text-center py-2">
							<span class="loading loading-spinner loading-sm"></span>
							Adjusting XP...
						</div>
					{/if}
				</div>
			</div>
		{/if}
		
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Stat Card -->
			<div class="card bg-base-100 border border-base-300 lg:col-span-2">
				<div class="card-body">
					<h2 class="card-title">
						<TrendingUp size={18} /> XP Growth
					</h2>
					
					<!-- XP Chart -->
					<div class="mt-4">
						<LineChart data={xpChartData} height={200} />
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
						<div class="bg-base-200 p-3 rounded-lg">
							<div class="text-xs text-base-content/70 mb-1">Current Level</div>
							<div class="text-2xl font-bold">Level {stat.level}</div>
							<div class="text-xs flex items-center gap-1 mt-0.5">
								<ChevronUp size={14} class="text-success" />
								{formatXp(stat.xpToNextLevel)} XP to next level
							</div>
							<div class="mt-2">
								<div class="flex justify-between text-xs mb-0.5">
									<span>Level Progress</span>
									<span>{Math.round(stat.progress * 100)}%</span>
								</div>
								<progress class="progress progress-primary w-full" value={stat.progress * 100} max="100"></progress>
							</div>
						</div>
						
						<div class="bg-base-200 p-3 rounded-lg">
							<div class="text-xs text-base-content/70 mb-1">Total XP</div>
							<div class="text-2xl font-bold">{formatXp(stat.currentXp)}</div>
							<div class="text-xs mt-1">
								Started {formatDate(stat.createdAt)}
							</div>
							<div class="text-xs mt-1.5">
								Last updated {formatDate(stat.updatedAt)}
							</div>
						</div>
						
						<div class="bg-base-200 p-3 rounded-lg">
							<div class="text-xs text-base-content/70 mb-1">Projected Level-Up</div>
							{#if timeToNextLevel}
								<div class="text-lg font-medium">
									{timeToNextLevel.days} {timeToNextLevel.days === 1 ? 'day' : 'days'}
								</div>
								<div class="text-xs mt-1">
									Est. date: {formatDate(timeToNextLevel.date)}
								</div>
							{:else}
								<div class="text-sm italic text-base-content/60">
									Not enough data
								</div>
							{/if}
							<div class="text-xs mt-2">
								<a href="/journal/new" class="link link-primary">Write a journal entry</a> to gain more XP
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Recent Activity -->
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<h2 class="card-title">
						<Book size={18} /> Recent Activity
					</h2>
					
					{#if stat.journalEntries && stat.journalEntries.length > 0}
						<div class="space-y-2 mt-2">
							{#each stat.journalEntries as entry}
								<div class="flex items-center justify-between bg-base-200 rounded-lg p-3">
									<div class="flex flex-col">
										<a href="/journal/{entry.id}" class="hover:underline font-medium">
											{entry.title || 'Untitled Journal Entry'}
										</a>
										<span class="text-xs text-base-content/60">
											{formatDate(entry.createdAt)}
										</span>
									</div>
									<div class="badge badge-primary">+{entry.xpGained} XP</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-8 text-center">
							<div class="text-base-content/60 italic mb-4">
								No journal entries linked to this stat yet.
							</div>
							<a href="/journal/new" class="btn btn-primary btn-sm">
								Write Journal Entry
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
		
		<!-- Delete Confirmation Modal -->
		{#if deleteConfirmOpen}
			<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
				<div class="modal-box">
					<h3 class="font-bold text-lg">Delete Character Stat</h3>
					<p class="py-4">
						Are you sure you want to delete <span class="font-semibold">{stat.name}</span>? This action cannot be undone.
					</p>
					<div class="modal-action">
						<button class="btn btn-ghost" on:click={() => deleteConfirmOpen = false} disabled={deleting}>
							Cancel
						</button>
						<button class="btn btn-error" on:click={deleteStat} disabled={deleting}>
							{#if deleting}
								<span class="loading loading-spinner loading-sm"></span>
								Deleting...
							{:else}
								Delete
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="alert alert-error">
			<span>Character stat not found</span>
		</div>
	{/if}
</div>
