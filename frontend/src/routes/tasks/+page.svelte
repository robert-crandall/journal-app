<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksApi, familyApi, focusesApi, statsApi } from '$lib/api';
	import * as icons from 'lucide-svelte';
	
	let tasks: any[] = [];
	let familyMembers: any[] = [];
	let focuses: any[] = [];
	let stats: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingTask: any = null;
	
	// Form data
	let formData = {
		title: '',
		description: '',
		dueDate: '',
		focusId: '',
		levelId: '',
		familyMemberId: '',
		statId: ''
	};
	
	onMount(async () => {
		await loadData();
	});
	
	async function loadData() {
		try {
			loading = true;
			const [tasksRes, familyRes, focusesRes, statsRes] = await Promise.all([
				tasksApi.getAll(),
				familyApi.getAll(),
				focusesApi.getAll(),
				statsApi.getAll()
			]);
			tasks = tasksRes.tasks;
			familyMembers = familyRes.familyMembers;
			focuses = focusesRes.focuses;
			stats = statsRes.stats;
		} catch (error) {
			console.error('Failed to load data:', error);
		} finally {
			loading = false;
		}
	}
	
	function openCreateForm() {
		formData = {
			title: '',
			description: '',
			dueDate: '',
			focusId: '',
			levelId: '',
			familyMemberId: '',
			statId: ''
		};
		editingTask = null;
		showCreateForm = true;
	}
	
	function openEditForm(task: any) {
		formData = {
			title: task.title,
			description: task.description || '',
			dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
			focusId: task.focusId || '',
			levelId: task.levelId || '',
			familyMemberId: task.familyMemberId || '',
			statId: task.statId || ''
		};
		editingTask = task;
		showCreateForm = true;
	}
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			const taskData = {
				...formData,
				dueDate: formData.dueDate || undefined,
				focusId: formData.focusId || undefined,
				levelId: formData.levelId || undefined,
				familyMemberId: formData.familyMemberId || undefined,
				statId: formData.statId || undefined
			};
			
			if (editingTask) {
				await tasksApi.update(editingTask.id, taskData);
			} else {
				await tasksApi.create(taskData);
			}
			
			showCreateForm = false;
			await loadData();
		} catch (error) {
			console.error('Failed to save task:', error);
		}
	}
	
	async function completeTask(taskId: string) {
		try {
			await tasksApi.complete(taskId);
			await loadData();
		} catch (error) {
			console.error('Failed to complete task:', error);
		}
	}
	
	async function deleteTask(taskId: string) {
		if (confirm('Are you sure you want to delete this task?')) {
			try {
				await tasksApi.delete(taskId);
				await loadData();
			} catch (error) {
				console.error('Failed to delete task:', error);
			}
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Tasks - Life Quest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Tasks</h1>
			<p class="text-base-content/70">Manage your quests and objectives</p>
		</div>
		<button class="btn btn-primary" onclick={openCreateForm}>
			<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Task
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each tasks as task}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h3 class="card-title text-lg">{task.title}</h3>
								{#if task.description}
									<p class="text-base-content/70 mt-2">{task.description}</p>
								{/if}
								<div class="flex flex-wrap gap-2 mt-3">
									{#if task.dueDate}
										<div class="badge badge-outline">
											Due: {formatDate(task.dueDate)}
										</div>
									{/if}
									{#if task.focus?.name}
										<div class="badge badge-primary badge-outline">
											{task.focus.name}
										</div>
									{/if}
									{#if task.level?.name}
										<div class="badge badge-secondary badge-outline">
											{task.level.name}
										</div>
									{/if}
									{#if task.familyMember?.name}
										<div class="badge badge-accent badge-outline">
											{task.familyMember.name}
										</div>
									{/if}
									{#if task.stat?.name}
										<div class="badge badge-info badge-outline flex items-center gap-1">
											{#if task.stat.icon && icons[task.stat.icon]}
												<svelte:component this={icons[task.stat.icon]} class="w-3 h-3" />
											{/if}
											Stat: {task.stat.name}
										</div>
									{/if}
								</div>
							</div>
							<div class="flex gap-2 ml-4">
								{#if !task.completedAt}
									<button 
										class="btn btn-sm btn-success" 
										onclick={() => completeTask(task.id)}
									>
										Complete
									</button>
								{:else}
									<div class="badge badge-success">Completed</div>
								{/if}
								<button 
									class="btn btn-sm btn-ghost" 
									onclick={() => openEditForm(task)}
								>
									Edit
								</button>
								<button 
									class="btn btn-sm btn-error btn-outline" 
									onclick={() => deleteTask(task.id)}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
			
			{#if tasks.length === 0}
				<div class="text-center py-12">
					<p class="text-lg text-base-content/70">No tasks yet</p>
					<p class="text-base-content/50">Create your first quest to get started!</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Create/Edit Task Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingTask ? 'Edit Task' : 'Create New Task'}
			</h3>
			
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="title">
						<span class="label-text">Title *</span>
					</label>
					<input 
						id="title"
						type="text" 
						class="input input-bordered" 
						bind:value={formData.title}
						required
					/>
				</div>
				
				<div class="form-control">
					<label class="label" for="description">
						<span class="label-text">Description</span>
					</label>
					<textarea 
						id="description"
						class="textarea textarea-bordered" 
						bind:value={formData.description}
						rows="3"
					></textarea>
				</div>
				
				<div class="form-control">
					<label class="label" for="dueDate">
						<span class="label-text">Due Date</span>
					</label>
					<input 
						id="dueDate"
						type="date" 
						class="input input-bordered" 
						bind:value={formData.dueDate}
					/>
				</div>
				
				<div class="form-control">
					<label class="label" for="familyMemberId">
						<span class="label-text">Family Member</span>
					</label>
					<select 
						id="familyMemberId"
						class="select select-bordered" 
						bind:value={formData.familyMemberId}
					>
						<option value="">Select family member (optional)</option>
						{#each familyMembers as member}
							<option value={member.id}>{member.name}</option>
						{/each}
					</select>
				</div>
				
				<div class="form-control">
					<label class="label" for="focusId">
						<span class="label-text">Focus Area</span>
					</label>
					<select 
						id="focusId"
						class="select select-bordered" 
						bind:value={formData.focusId}
					>
						<option value="">Select focus (optional)</option>
						{#each focuses as focus}
							<option value={focus.id}>{focus.name}</option>
						{/each}
					</select>
				</div>
				
				<div class="form-control">
					<label class="label" for="statId">
						<span class="label-text">Linked Stat</span>
					</label>
					<select 
						id="statId"
						class="select select-bordered" 
						bind:value={formData.statId}
					>
						<option value="">Select stat (optional)</option>
						{#each stats as stat}
							<option value={stat.id}>
								{stat.name} ({stat.value})
							</option>
						{/each}
					</select>
					<div class="text-xs text-base-content/60 mt-1">
						Completing this task will increment the selected stat
					</div>
				</div>
				
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => showCreateForm = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						{editingTask ? 'Update' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
