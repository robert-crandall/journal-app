<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Save, InfoCircle, Plus, Trash } from 'lucide-svelte';
	import type { ExperimentTaskWithCompletions, Experiment } from '$lib/types';
	import type { CharacterStat } from '$lib/types';
	
	let task = $state<ExperimentTaskWithCompletions | null>(null);
	let title = $state('');
	let description = $state('');
	let selectedExperimentId = $state('');
	let targetCompletions = $state(1);
	let experiments = $state<Experiment[]>([]);
	let stats = $state<CharacterStat[]>([]);
	let statRewards = $state<{statId: string, xp: number}[]>([]);
	
	let loading = $state(true);
	let updating = $state(false);
	let error = $state('');
	let success = $state('');
	
	onMount(async () => {
		await Promise.all([loadTask(), loadExperiments(), loadStats()]);
	});
	
	async function loadTask() {
		try {
			loading = true;
			error = '';
			const taskId = $page.params.id;
			
			const response = await fetch(`/api/tasks/${taskId}`);
			
			if (response.ok) {
				const data = await response.json();
				task = data.task;
				
				// Populate form fields
				title = task.title;
				description = task.description || '';
				selectedExperimentId = task.experimentId;
				targetCompletions = task.targetCompletions;
				
				// Process xpRewards object into array
				statRewards = Object.entries(task.xpRewards || {}).map(([statId, xp]) => ({
					statId,
					xp: xp as number
				}));
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load task';
			}
		} catch (err) {
			console.error('Error loading task:', err);
			error = 'An error occurred while loading the task';
		} finally {
			loading = false;
		}
	}
	
	async function loadExperiments() {
		try {
			const response = await fetch('/api/experiments');
			
			if (response.ok) {
				const data = await response.json();
				experiments = data.experiments || [];
			}
		} catch (err) {
			console.error('Error loading experiments:', err);
		}
	}
	
	async function loadStats() {
		try {
			const response = await fetch('/api/stats');
			
			if (response.ok) {
				const data = await response.json();
				stats = data.stats || [];
			}
		} catch (err) {
			console.error('Error loading stats:', err);
		}
	}
	
	function addStatReward() {
		if (stats.length > 0) {
			const availableStats = stats.filter(stat => 
				!statRewards.some(reward => reward.statId === stat.id)
			);
			
			if (availableStats.length > 0) {
				statRewards = [...statRewards, {
					statId: availableStats[0].id,
					xp: 5
				}];
			}
		}
	}
	
	function removeStatReward(index: number) {
		statRewards = statRewards.filter((_, i) => i !== index);
	}
	
	function getStatName(statId: string) {
		return stats.find(s => s.id === statId)?.name || 'Unknown';
	}
	
	async function updateTask() {
		if (!task) return;
		
		if (!title.trim()) {
			error = 'Task title is required';
			return;
		}
		
		if (!selectedExperimentId) {
			error = 'Please select an experiment';
			return;
		}
		
		updating = true;
		error = '';
		success = '';
		
		try {
			// Convert statRewards array to object format
			const xpRewards = statRewards.reduce((obj, reward) => {
				obj[reward.statId] = reward.xp;
				return obj;
			}, {} as Record<string, number>);
			
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title,
					description,
					targetCompletions,
					xpRewards
				})
			});
			
			if (response.ok) {
				success = 'Task updated successfully!';
				setTimeout(() => {
					goto(`/tasks/${task.id}`);
				}, 1000);
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to update task';
			}
		} catch (err) {
			console.error('Error updating task:', err);
			error = 'An error occurred while updating the task';
		} finally {
			updating = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Task - Journal App</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div>
		<div class="flex items-center gap-3">
			{#if task}
				<a href="/tasks/{task.id}" class="btn btn-ghost btn-sm">
					<ArrowLeft size={16} />
					Back to Task
				</a>
			{:else}
				<a href="/tasks" class="btn btn-ghost btn-sm">
					<ArrowLeft size={16} />
					Back to Tasks
				</a>
			{/if}
		</div>
		<h1 class="text-2xl font-bold mt-2">Edit Task</h1>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error && !task}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadTask}>Retry</button>
		</div>
	{:else if task}
		<!-- Task Form -->
		<div class="card bg-base-100 border border-base-300">
			<div class="card-body">
				{#if error}
					<div class="alert alert-error mb-4">
						<span>{error}</span>
					</div>
				{/if}
				
				{#if success}
					<div class="alert alert-success mb-4">
						<span>{success}</span>
					</div>
				{/if}
				
				<form on:submit|preventDefault={updateTask} class="space-y-4">
					<!-- Experiment Selection (disabled as it can't be changed) -->
					<div class="form-control">
						<label for="experiment" class="label">
							<span class="label-text">Experiment</span>
						</label>
						<select 
							id="experiment" 
							class="select select-bordered w-full" 
							bind:value={selectedExperimentId}
							disabled
						>
							{#each experiments as experiment}
								<option value={experiment.id}>{experiment.title}</option>
							{/each}
						</select>
						<label class="label">
							<span class="label-text-alt text-base-content/60">Experiment cannot be changed after creation</span>
						</label>
					</div>
					
					<!-- Task Title -->
					<div class="form-control">
						<label for="title" class="label">
							<span class="label-text">Task Title</span>
						</label>
						<input 
							type="text" 
							id="title" 
							class="input input-bordered w-full" 
							placeholder="Enter task title" 
							bind:value={title}
							required
						/>
					</div>
					
					<!-- Task Description -->
					<div class="form-control">
						<label for="description" class="label">
							<span class="label-text">Description (Optional)</span>
						</label>
						<textarea 
							id="description" 
							class="textarea textarea-bordered h-24" 
							placeholder="Enter task description" 
							bind:value={description}
						></textarea>
					</div>
					
					<!-- Target Completions -->
					<div class="form-control">
						<label for="completions" class="label">
							<span class="label-text">Target Completions</span>
							<span class="label-text-alt flex items-center gap-1">
								<InfoCircle size={14} />
								How many times this task should be completed
							</span>
						</label>
						<input 
							type="number" 
							id="completions" 
							class="input input-bordered w-full" 
							min="1" 
							max="100" 
							bind:value={targetCompletions}
						/>
					</div>
					
					<!-- XP Rewards -->
					<div class="form-control">
						<label class="label">
							<span class="label-text">XP Rewards (Optional)</span>
						</label>
						
						{#if statRewards.length > 0}
							<div class="space-y-3 mb-3">
								{#each statRewards as reward, index}
									<div class="flex items-center gap-2">
										<div class="flex-1">
											<select 
												class="select select-bordered select-sm w-full" 
												bind:value={reward.statId}
											>
												{#each stats as stat}
													<option value={stat.id} disabled={statRewards.some((r, i) => i !== index && r.statId === stat.id)}>
														{stat.name}
													</option>
												{/each}
											</select>
										</div>
										<div class="flex-none w-24">
											<input 
												type="number" 
												class="input input-bordered input-sm w-full" 
												min="1" 
												max="100" 
												bind:value={reward.xp}
											/>
										</div>
										<button 
											type="button"
											class="btn btn-sm btn-error btn-square"
											on:click={() => removeStatReward(index)}
										>
											<Trash size={16} />
										</button>
									</div>
								{/each}
							</div>
						{/if}
						
						<button 
							type="button" 
							class="btn btn-sm btn-outline" 
							on:click={addStatReward}
							disabled={statRewards.length >= stats.length}
						>
							<Plus size={16} />
							Add XP Reward
						</button>
					</div>
					
					<!-- Submit Button -->
					<div class="mt-6">
						<button 
							type="submit" 
							class="btn btn-primary w-full"
							disabled={updating || !title || !selectedExperimentId}
						>
							{#if updating}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								<Save size={18} />
							{/if}
							Update Task
						</button>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<div class="alert alert-error">
			<span>Task not found</span>
			<a href="/tasks" class="btn btn-sm">Back to Tasks</a>
		</div>
	{/if}
</div>
