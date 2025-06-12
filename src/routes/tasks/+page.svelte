<script lang="ts">
	import { onMount } from 'svelte';
	import { ListChecks, Plus, Filter, ArrowUpDown, CheckCircle2 } from 'lucide-svelte';
	import type { ExperimentTaskWithCompletions } from '$lib/types';
	
	let tasks = $state<ExperimentTaskWithCompletions[]>([]);
	let loading = $state(true);
	let error = $state('');
	let sortBy = $state<'title' | 'experiment' | 'completions'>('title');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let filterExperiment = $state<string | null>(null);
	let experiments = $state<{id: string, title: string}[]>([]);
	
	// Computed property for filtered and sorted tasks
	$derived filteredAndSortedTasks = [...tasks]
		.filter(task => !filterExperiment || task.experimentId === filterExperiment)
		.sort((a, b) => {
			let comparison = 0;
			
			switch (sortBy) {
				case 'title':
					comparison = a.title.localeCompare(b.title);
					break;
				case 'experiment':
					comparison = a.experiment.title.localeCompare(b.experiment.title);
					break;
				case 'completions':
					comparison = (a.completions?.length || 0) - (b.completions?.length || 0);
					break;
			}
			
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	
	onMount(async () => {
		await Promise.all([loadTasks(), loadExperiments()]);
	});
	
	async function loadTasks() {
		try {
			loading = true;
			error = '';
			const response = await fetch('/api/tasks');
			
			if (response.ok) {
				const data = await response.json();
				tasks = data.tasks || [];
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load tasks';
			}
		} catch (err) {
			console.error('Error loading tasks:', err);
			error = 'An error occurred while loading tasks';
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
	
	function toggleSort(newSortBy: typeof sortBy) {
		if (sortBy === newSortBy) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = newSortBy;
			sortDirection = 'asc';
		}
	}
	
	function getSortIcon(columnName: typeof sortBy) {
		return sortBy === columnName ? 
			(sortDirection === 'asc' ? '↑' : '↓') : '';
	}
	
	function getCompletionPercentage(task: ExperimentTaskWithCompletions) {
		const completed = task.completions?.length || 0;
		const target = task.targetCompletions || 1;
		return Math.min(100, Math.round((completed / target) * 100));
	}
	
	async function completeTask(taskId: string) {
		try {
			const response = await fetch(`/api/tasks/${taskId}/complete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			
			if (response.ok) {
				// Reload tasks to show updated completion count
				await loadTasks();
			} else {
				const errorData = await response.json();
				console.error('Failed to complete task:', errorData);
			}
		} catch (err) {
			console.error('Error completing task:', err);
		}
	}
</script>

<svelte:head>
	<title>Task Management - Journal App</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Tasks</h1>
			<p class="text-base-content/70 mt-1">Manage your experiment tasks</p>
		</div>
		<div class="flex gap-2">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-outline gap-2">
					<Filter size={16} />
					{filterExperiment ? experiments.find(e => e.id === filterExperiment)?.title?.slice(0, 15) + '...' : 'All Experiments'}
				</div>
				<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
					<li><a on:click={() => filterExperiment = null}>All Experiments</a></li>
					{#each experiments as experiment}
						<li><a on:click={() => filterExperiment = experiment.id}>{experiment.title}</a></li>
					{/each}
				</ul>
			</div>
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-outline gap-2">
					<ArrowUpDown size={16} />
					Sort by {sortBy}
				</div>
				<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
					<li><a on:click={() => toggleSort('title')}>Title {getSortIcon('title')}</a></li>
					<li><a on:click={() => toggleSort('experiment')}>Experiment {getSortIcon('experiment')}</a></li>
					<li><a on:click={() => toggleSort('completions')}>Completions {getSortIcon('completions')}</a></li>
				</ul>
			</div>
			<a href="/tasks/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				New Task
			</a>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadTasks}>Retry</button>
		</div>
	{/if}

	<!-- Tasks List -->
	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if tasks.length === 0}
		<div class="text-center py-16">
			<ListChecks size={64} class="mx-auto text-base-content/30 mb-4" />
			<h2 class="text-xl font-semibold mb-2">No tasks yet</h2>
			<p class="text-base-content/70 mb-6">Create tasks to track your experiments and projects</p>
			<a href="/tasks/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				Create First Task
			</a>
		</div>
	{:else if filteredAndSortedTasks.length === 0}
		<div class="alert">
			<span>No tasks match the current filter</span>
			<button class="btn btn-sm" on:click={() => filterExperiment = null}>Show All</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#each filteredAndSortedTasks as task (task.id)}
				<div class="card bg-base-100 border border-base-300 hover:border-base-400 transition-colors h-full">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div>
								<a href="/tasks/{task.id}" class="hover:underline">
									<h3 class="font-semibold text-lg">{task.title}</h3>
								</a>
								<div class="text-sm text-base-content/70">
									<a href="/experiments/{task.experiment.id}" class="hover:underline">
										{task.experiment.title}
									</a>
								</div>
							</div>
							<div class="badge badge-primary">{task.completions?.length || 0}/{task.targetCompletions}</div>
						</div>
						
						{#if task.description}
							<p class="text-base-content/70 text-sm line-clamp-2">{task.description}</p>
						{/if}
						
						<div class="mt-3 space-y-3">
							<!-- Progress bar -->
							<div>
								<div class="flex justify-between text-xs mb-1">
									<span>Completion Progress</span>
									<span>{getCompletionPercentage(task)}%</span>
								</div>
								<progress class="progress progress-primary w-full" value={task.completions?.length || 0} max={task.targetCompletions}></progress>
							</div>
							
							<!-- XP Rewards -->
							{#if Object.keys(task.xpRewards || {}).length > 0}
								<div>
									<p class="text-xs text-base-content/70 mb-1">XP Rewards:</p>
									<div class="flex flex-wrap gap-1">
										{#each Object.entries(task.xpRewards || {}) as [statId, xp]}
											<div class="badge badge-outline">+{xp} XP</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
						
						<div class="card-actions justify-end mt-2">
							<button 
								class="btn btn-sm btn-outline btn-success gap-1"
								on:click={() => completeTask(task.id)}
								disabled={task.completions?.length >= task.targetCompletions}
							>
								<CheckCircle2 size={16} />
								Complete
							</button>
							<a href="/tasks/{task.id}" class="btn btn-sm btn-ghost">
								Details
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
