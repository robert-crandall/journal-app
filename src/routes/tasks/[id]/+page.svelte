<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { 
		ArrowLeft, 
		ListChecks, 
		Calendar, 
		CheckCircle2, 
		AlarmClock, 
		Award, 
		Edit, 
		Trash 
	} from 'lucide-svelte';
	import type { ExperimentTaskWithCompletions, CharacterStat } from '$lib/types';
	
	let task = $state<ExperimentTaskWithCompletions | null>(null);
	let stats = $state<CharacterStat[]>([]);
	let loading = $state(true);
	let error = $state('');
	let showDeleteConfirm = $state(false);
	let deleteLoading = $state(false);
	
	onMount(async () => {
		await Promise.all([loadTask(), loadStats()]);
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
	
	function getStatName(statId: string) {
		return stats.find(s => s.id === statId)?.name || 'Unknown Stat';
	}
	
	function getCompletionPercentage() {
		if (!task) return 0;
		const completed = task.completions?.length || 0;
		const target = task.targetCompletions || 1;
		return Math.min(100, Math.round((completed / target) * 100));
	}
	
	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
	
	async function completeTask() {
		if (!task) return;
		
		try {
			const response = await fetch(`/api/tasks/${task.id}/complete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			
			if (response.ok) {
				await loadTask();
			} else {
				const errorData = await response.json();
				console.error('Failed to complete task:', errorData);
			}
		} catch (err) {
			console.error('Error completing task:', err);
		}
	}
	
	async function deleteTask() {
		if (!task) return;
		
		deleteLoading = true;
		
		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				goto('/tasks');
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to delete task';
				showDeleteConfirm = false;
			}
		} catch (err) {
			console.error('Error deleting task:', err);
			error = 'An error occurred while deleting the task';
			showDeleteConfirm = false;
		} finally {
			deleteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{task ? task.title : 'Task Details'} - Journal App</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/tasks" class="btn btn-ghost btn-sm">
				<ArrowLeft size={16} />
				Back to Tasks
			</a>
			<div class="divider divider-horizontal"></div>
			<div>
				<h1 class="text-2xl font-bold">{task?.title || 'Task Details'}</h1>
				{#if task?.experiment}
					<div class="text-base-content/60 text-sm">
						Part of experiment: 
						<a href="/experiments/{task.experiment.id}" class="link">
							{task.experiment.title}
						</a>
					</div>
				{/if}
			</div>
		</div>
		
		{#if task}
			<div class="flex items-center gap-2">
				<a href="/tasks/{task.id}/edit" class="btn btn-ghost btn-sm">
					<Edit size={16} />
					Edit
				</a>
				<button class="btn btn-error btn-sm" on:click={() => showDeleteConfirm = true}>
					<Trash size={16} />
					Delete
				</button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadTask}>Retry</button>
		</div>
	{:else if task}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="md:col-span-2 space-y-6">
				{#if task.description}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title">Description</h2>
							<p class="whitespace-pre-line">{task.description}</p>
						</div>
					</div>
				{/if}
				
				<!-- Task Completion Progress -->
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<h2 class="card-title flex items-center gap-2">
							<CheckCircle2 size={18} />
							Completion Progress
						</h2>
						
						<div class="mt-3 space-y-4">
							<div class="flex items-center justify-between">
								<div class="text-xl font-semibold">{task.completions?.length || 0}/{task.targetCompletions}</div>
								<div class="badge badge-primary">{getCompletionPercentage()}% Complete</div>
							</div>
							
							<progress 
								class="progress progress-primary w-full" 
								value={task.completions?.length || 0} 
								max={task.targetCompletions}>
							</progress>
							
							{#if (task.completions?.length || 0) < task.targetCompletions}
								<button 
									class="btn btn-success w-full gap-2" 
									on:click={completeTask}
								>
									<CheckCircle2 size={18} />
									Mark as Complete
								</button>
							{:else}
								<div class="alert alert-success">
									<CheckCircle2 size={18} />
									<span>Task has been completed {task.completions?.length} times!</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
				
				<!-- Completion History -->
				{#if task.completions && task.completions.length > 0}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title flex items-center gap-2">
								<AlarmClock size={18} />
								Completion History
							</h2>
							
							<div class="mt-3">
								<ul class="space-y-2">
									{#each [...task.completions].sort((a, b) => 
										new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
									) as completion, index}
										<li class="flex items-center gap-3">
											<div class="badge badge-sm">{index + 1}</div>
											<div class="flex items-center gap-1">
												<Calendar size={14} />
												<span>{formatDate(completion.completedAt)}</span>
											</div>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Sidebar -->
			<div class="space-y-4">
				<!-- XP Rewards -->
				{#if task.xpRewards && Object.keys(task.xpRewards).length > 0}
					<div class="card bg-base-100 border border-base-300">
						<div class="card-body">
							<h2 class="card-title flex items-center gap-2">
								<Award size={18} />
								XP Rewards
							</h2>
							
							<div class="mt-3 space-y-2">
								{#each Object.entries(task.xpRewards) as [statId, xp]}
									<div class="flex items-center justify-between">
										<div>
											<a href="/stats/{statId}" class="link">
												{getStatName(statId)}
											</a>
										</div>
										<div class="badge badge-primary">+{xp} XP</div>
									</div>
								{/each}
								
								<div class="text-xs text-base-content/60 mt-2">
									You'll earn these rewards each time you complete this task.
								</div>
							</div>
						</div>
					</div>
				{/if}
				
				<!-- Created Date -->
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<h2 class="card-title text-sm">Created</h2>
						<div class="flex items-center gap-2 text-base-content/70">
							<Calendar size={16} />
							<span>{formatDate(task.createdAt)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="alert alert-error">
			<span>Task not found</span>
			<a href="/tasks" class="btn btn-sm">Back to Tasks</a>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="card bg-base-100 max-w-md w-full">
			<div class="card-body">
				<h2 class="card-title text-error">Delete Task?</h2>
				<p>Are you sure you want to delete this task? This action cannot be undone.</p>
				<div class="card-actions justify-end mt-4">
					<button class="btn btn-ghost" on:click={() => showDeleteConfirm = false} disabled={deleteLoading}>
						Cancel
					</button>
					<button class="btn btn-error" on:click={deleteTask} disabled={deleteLoading}>
						{#if deleteLoading}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							Delete
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
