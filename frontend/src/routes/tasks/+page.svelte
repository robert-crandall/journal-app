<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksApi, familyApi, focusesApi, statsApi } from '$lib/api';
	import * as icons from 'lucide-svelte';
	
	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return icons.Target;
		
		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');
		
		return icons[componentName] || icons.Target;
	}
	
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
			<h1 class="text-3xl font-bold text-theme-text">Tasks</h1>
			<p class="text-theme-text/70">Manage your quests and objectives</p>
		</div>
		<button class="bg-theme-primary text-white px-4 py-2 rounded-md font-medium hover:bg-theme-primary/90 transition-colors flex items-center gap-2" onclick={openCreateForm}>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Task
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each tasks as task}
				<div class="bg-theme-card border border-theme-border rounded-md shadow-sm p-6">
					<div class="flex justify-between items-start">
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-theme-text">{task.title}</h3>
							{#if task.description}
								<p class="text-theme-text/70 mt-2">{task.description}</p>
							{/if}
							<div class="flex flex-wrap gap-2 mt-3">
								{#if task.dueDate}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
										Due: {formatDate(task.dueDate)}
									</span>
								{/if}
								{#if task.focus?.name}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
										{task.focus.name}
									</span>
								{/if}
								{#if task.level?.name}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-secondary/10 text-theme-secondary border border-theme-secondary/20">
										{task.level.name}
									</span>
								{/if}
								{#if task.familyMember?.name}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
										{task.familyMember.name}
									</span>
								{/if}
								{#if task.stat?.name}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 gap-1">
										<svelte:component this={getIconComponent(task.stat.icon)} class="w-3 h-3" />
										Stat: {task.stat.name}
									</span>
								{/if}
							</div>
						</div>
						<div class="flex gap-2 ml-4">
							{#if !task.completedAt}
								<button 
									class="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors" 
									onclick={() => completeTask(task.id)}
								>
									Complete
								</button>
							{:else}
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</span>
							{/if}
							<button 
								class="bg-theme-card text-theme-text border border-theme-border px-3 py-1.5 rounded-md text-sm font-medium hover:bg-theme-accent/10 transition-colors" 
								onclick={() => openEditForm(task)}
							>
								Edit
							</button>
							<button 
								class="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30" 
								onclick={() => deleteTask(task.id)}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			{/each}
			
			{#if tasks.length === 0}
				<div class="text-center py-12">
					<p class="text-lg text-theme-text/70">No tasks yet</p>
					<p class="text-theme-text/50">Create your first quest to get started!</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Create/Edit Task Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-theme-card border border-theme-border rounded-md shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<h3 class="font-bold text-lg mb-4 text-theme-text">
					{editingTask ? 'Edit Task' : 'Create New Task'}
				</h3>
				
				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-theme-text mb-2" for="title">
							Title *
						</label>
						<input 
							id="title"
							type="text" 
							class="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors" 
							bind:value={formData.title}
							required
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-theme-text mb-2" for="description">
							Description
						</label>
						<textarea 
							id="description"
							class="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors" 
							bind:value={formData.description}
							rows="3"
						></textarea>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-theme-text mb-2" for="dueDate">
							Due Date
						</label>
						<input 
							id="dueDate"
							type="date" 
							class="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors" 
							bind:value={formData.dueDate}
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-theme-text mb-2" for="familyMemberId">
							Family Member
						</label>
						<select 
							id="familyMemberId"
							class="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors" 
							bind:value={formData.familyMemberId}
						>
							<option value="">Select family member (optional)</option>
							{#each familyMembers as member}
								<option value={member.id}>{member.name}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-theme-text mb-2" for="focusId">
							Focus Area
						</label>
						<select 
							id="focusId"
							class="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors" 
							bind:value={formData.focusId}
						>
							<option value="">Select focus (optional)</option>
							{#each focuses as focus}
								<option value={focus.id}>{focus.name}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-theme-text mb-2" for="statId">
							Linked Stat
						</label>
						<select 
							id="statId"
							class="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-colors" 
							bind:value={formData.statId}
						>
							<option value="">Select stat (optional)</option>
							{#each stats as stat}
								<option value={stat.id}>
									{stat.name} ({stat.value})
								</option>
							{/each}
						</select>
						<div class="text-xs text-theme-text/60 mt-1">
							Completing this task will increment the selected stat
						</div>
					</div>
					
					<div class="flex justify-end gap-3 pt-4 border-t border-theme-border">
						<button type="button" class="bg-theme-card text-theme-text border border-theme-border px-4 py-2 rounded-md font-medium hover:bg-theme-accent/10 transition-colors" onclick={() => showCreateForm = false}>
							Cancel
						</button>
						<button type="submit" class="bg-theme-primary text-white px-4 py-2 rounded-md font-medium hover:bg-theme-primary/90 transition-colors">
							{editingTask ? 'Update' : 'Create'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
