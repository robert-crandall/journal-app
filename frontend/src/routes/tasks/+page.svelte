<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksApi, familyApi, focusesApi, statsApi } from '$lib/api';
	import { Plus, Calendar, Filter, Search, ChevronDown, Target, CheckCircle2, Clock, AlertCircle, MoreHorizontal, Edit, Trash2, X } from 'lucide-svelte';
	import * as icons from 'lucide-svelte';
	
	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return Target;
		
		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');
		
		return (icons as any)[componentName] || Target;
	}
	
	let tasks: any[] = [];
	let familyMembers: any[] = [];
	let focuses: any[] = [];
	let stats: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingTask: any = null;
	let saveMessage = '';
	let searchQuery = '';
	let filterStatus = 'all'; // all, active, completed, overdue
	let filterFocus = '';
	let sortBy = 'dueDate'; // dueDate, created, title, priority
	let viewMode = 'list'; // list, board
	let showFilters = false;
	
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

	// Enhanced computed properties
	$: filteredTasks = tasks.filter(task => {
		// Search filter
		if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
			!task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
		
		// Status filter
		if (filterStatus === 'active' && task.completedAt) return false;
		if (filterStatus === 'completed' && !task.completedAt) return false;
		if (filterStatus === 'overdue' && (task.completedAt || !task.dueDate || new Date(task.dueDate) >= new Date())) return false;
		
		// Focus filter
		if (filterFocus && task.focusId !== filterFocus) return false;
		return true;
	}).sort((a, b) => {
		if (sortBy === 'dueDate') {
			// Show overdue first, then by date
			const aOverdue = !a.completedAt && a.dueDate && new Date(a.dueDate) < new Date();
			const bOverdue = !b.completedAt && b.dueDate && new Date(b.dueDate) < new Date();
			if (aOverdue && !bOverdue) return -1;
			if (!aOverdue && bOverdue) return 1;
			if (!a.dueDate && !b.dueDate) return 0;
			if (!a.dueDate) return 1;
			if (!b.dueDate) return -1;
			return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
		}
		if (sortBy === 'title') return a.title.localeCompare(b.title);
		if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		return 0;
	});

	$: activeTasks = tasks.filter(task => !task.completedAt);
	$: completedTasks = tasks.filter(task => task.completedAt);
	$: overdueTasks = tasks.filter(task => 
		!task.completedAt && 
		task.dueDate && 
		new Date(task.dueDate) < new Date()
	);
	$: todayTasks = tasks.filter(task => 
		!task.completedAt && 
		task.dueDate && 
		new Date(task.dueDate).toDateString() === new Date().toDateString()
	);
	$: upcomingTasks = tasks.filter(task => 
		!task.completedAt && 
		task.dueDate && 
		new Date(task.dueDate) > new Date() &&
		new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
	);
	
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
				showSaveMessage('Task updated successfully ✓');
			} else {
				await tasksApi.create(taskData);
				showSaveMessage('New task created ✓');
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
			showSaveMessage('Task completed! 🎉');
		} catch (error) {
			console.error('Failed to complete task:', error);
		}
	}
	
	async function deleteTask(taskId: string) {
		if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
			try {
				await tasksApi.delete(taskId);
				await loadData();
				showSaveMessage('Task deleted');
			} catch (error) {
				console.error('Failed to delete task:', error);
			}
		}
	}

	function showSaveMessage(message: string) {
		saveMessage = message;
		setTimeout(() => saveMessage = '', 3000);
	}

	function closeModal(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			showCreateForm = false;
		}
	}
	
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const today = new Date();
		const diffTime = date.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays === -1) return 'Yesterday';
		if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
		if (diffDays <= 7) return `In ${diffDays} days`;
		
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
		});
	}

	function getDateColor(dateString: string) {
		const date = new Date(dateString);
		const today = new Date();
		const diffTime = date.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays < 0) return 'text-red-600 bg-red-50'; // Overdue
		if (diffDays === 0) return 'text-amber-700 bg-amber-50'; // Today
		if (diffDays <= 3) return 'text-orange-700 bg-orange-50'; // Soon
		return 'text-neutral-600 bg-neutral-50'; // Future
	}

	function getTaskPriority(task: any) {
		if (!task.dueDate) return 'low';
		const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
		if (daysUntilDue < 0) return 'overdue';
		if (daysUntilDue === 0) return 'urgent';
		if (daysUntilDue <= 3) return 'high';
		return 'medium';
	}

	function resetFilters() {
		searchQuery = '';
		filterStatus = 'all';
		filterFocus = '';
		sortBy = 'dueDate';
	}
</script>

<svelte:head>
	<title>Tasks - Life Quest</title>
</svelte:head>

<!-- Success Message -->
{#if saveMessage}
	<div class="fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-lg rounded-lg p-4 max-w-sm">
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<CheckCircle2 class="w-5 h-5 text-green-600" />
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-neutral-900">{saveMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-neutral-25">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
		<div class="container mx-auto px-6 py-12">
			<div class="max-w-4xl">
				<div class="flex items-center gap-4 mb-4">
					<div class="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
						<Target class="w-8 h-8" />
					</div>
					<div>
						<h1 class="text-4xl font-bold mb-2">Task Management</h1>
						<p class="text-blue-100 text-lg">Stay organized and achieve your goals</p>
					</div>
				</div>
				
				<!-- Hero Stats -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
					<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
						<div class="flex items-center gap-2 mb-1">
							<Clock class="w-4 h-4 text-blue-200" />
							<span class="text-sm text-blue-200">Active</span>
						</div>
						<div class="text-2xl font-bold">{activeTasks.length}</div>
					</div>
					
					{#if overdueTasks.length > 0}
						<div class="bg-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-red-400/30">
							<div class="flex items-center gap-2 mb-1">
								<AlertCircle class="w-4 h-4 text-red-200" />
								<span class="text-sm text-red-200">Overdue</span>
							</div>
							<div class="text-2xl font-bold text-red-100">{overdueTasks.length}</div>
						</div>
					{:else}
						<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
							<div class="flex items-center gap-2 mb-1">
								<AlertCircle class="w-4 h-4 text-blue-200" />
								<span class="text-sm text-blue-200">Overdue</span>
							</div>
							<div class="text-2xl font-bold">0</div>
						</div>
					{/if}
					
					<div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
						<div class="flex items-center gap-2 mb-1">
							<Calendar class="w-4 h-4 text-blue-200" />
							<span class="text-sm text-blue-200">Due Today</span>
						</div>
						<div class="text-2xl font-bold">{todayTasks.length}</div>
					</div>
					
					<div class="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
						<div class="flex items-center gap-2 mb-1">
							<CheckCircle2 class="w-4 h-4 text-green-200" />
							<span class="text-sm text-green-200">Completed</span>
						</div>
						<div class="text-2xl font-bold text-green-100">{completedTasks.length}</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Controls Section -->
	<div class="bg-white border-b border-neutral-200 sticky top-0 z-10">
		<div class="container mx-auto px-6 py-4">
			<div class="flex flex-col lg:flex-row gap-4 items-center">
				<!-- Search -->
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
					<input 
						type="text" 
						placeholder="Search tasks by title or description..." 
						class="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
						bind:value={searchQuery}
					/>
				</div>
				
				<!-- Filters and Actions -->
				<div class="flex flex-wrap gap-3 items-center">
					<!-- Status Filter -->
					<div class="relative">
						<select 
							class="appearance-none bg-white border border-neutral-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
							bind:value={filterStatus}
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="completed">Completed</option>
							<option value="overdue">Overdue</option>
						</select>
						<ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
					</div>
					
					<!-- Focus Filter -->
					{#if focuses.length > 0}
						<div class="relative">
							<select 
								class="appearance-none bg-white border border-neutral-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
								bind:value={filterFocus}
							>
								<option value="">All Focus Areas</option>
								{#each focuses as focus}
									<option value={focus.id}>{focus.name}</option>
								{/each}
							</select>
							<ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
						</div>
					{/if}
					
					<!-- Sort -->
					<div class="relative">
						<select 
							class="appearance-none bg-white border border-neutral-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
							bind:value={sortBy}
						>
							<option value="dueDate">Due Date</option>
							<option value="title">Title</option>
							<option value="created">Created</option>
						</select>
						<ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
					</div>
					
					<!-- Reset -->
					{#if searchQuery || filterStatus !== 'all' || filterFocus || sortBy !== 'dueDate'}
						<button 
							class="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
							onclick={resetFilters}
						>
							Reset
						</button>
					{/if}
					
					<!-- Create Task Button -->
					<button 
						class="btn-primary flex items-center gap-2 ml-2"
						onclick={openCreateForm}
					>
						<Plus class="w-4 h-4" />
						<span>New Task</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="container mx-auto px-6 py-8">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="flex flex-col items-center gap-4">
					<div class="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
					<p class="text-neutral-600 font-medium">Loading your tasks...</p>
				</div>
			</div>
		{:else if filteredTasks.length === 0}
			<div class="text-center py-20">
				<div class="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 max-w-md mx-auto">
					<div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<Target class="w-10 h-10 text-neutral-400" />
					</div>
					{#if tasks.length === 0}
						<h3 class="text-2xl font-bold text-neutral-900 mb-3">Ready to get organized?</h3>
						<p class="text-neutral-600 mb-8 leading-relaxed">Create your first task and take the first step towards achieving your goals.</p>
						<button class="btn-primary text-lg px-6 py-3" onclick={openCreateForm}>
							<Plus class="w-5 h-5 mr-2" />
							Create Your First Task
						</button>
					{:else}
						<h3 class="text-2xl font-bold text-neutral-900 mb-3">No matching tasks</h3>
						<p class="text-neutral-600 mb-8 leading-relaxed">Try adjusting your search or filter criteria to find what you're looking for.</p>
						<button class="btn-ghost text-lg px-6 py-3" onclick={resetFilters}>
							<Filter class="w-5 h-5 mr-2" />
							Reset All Filters
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Quick Actions Bar -->
			{#if overdueTasks.length > 0 || todayTasks.length > 0}
				<div class="mb-8">
					<div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
						<div class="flex items-start gap-4">
							<div class="p-2 bg-amber-100 rounded-lg">
								<AlertCircle class="w-5 h-5 text-amber-600" />
							</div>
							<div class="flex-1">
								<h3 class="font-semibold text-amber-900 mb-2">Attention Required</h3>
								<div class="flex flex-wrap gap-4 text-sm text-amber-800">
									{#if overdueTasks.length > 0}
										<span>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span>
									{/if}
									{#if todayTasks.length > 0}
										<span>{todayTasks.length} due today</span>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Task Grid -->
			<div class="grid gap-6">
				{#each filteredTasks as task (task.id)}
					{@const priority = getTaskPriority(task)}
					<div class="bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200 group">
						<!-- Task Header -->
						<div class="p-6 pb-4">
							<div class="flex items-start gap-4">
								<!-- Priority Indicator & Status -->
								<div class="flex flex-col items-center gap-2 mt-1">
									{#if task.completedAt}
										<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
											<CheckCircle2 class="w-5 h-5 text-green-600" />
										</div>
									{:else if priority === 'overdue'}
										<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
											<AlertCircle class="w-5 h-5 text-red-600" />
										</div>
									{:else if priority === 'urgent'}
										<div class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
											<Clock class="w-5 h-5 text-amber-600" />
										</div>
									{:else}
										<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<Target class="w-5 h-5 text-blue-600" />
										</div>
									{/if}
								</div>
								
								<!-- Task Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-4 mb-3">
										<h3 class="text-xl font-semibold text-neutral-900 leading-tight {task.completedAt ? 'line-through text-neutral-500' : ''}">{task.title}</h3>
										
										<!-- Actions -->
										<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
											{#if !task.completedAt}
												<button 
													class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
													onclick={() => completeTask(task.id)}
													title="Mark as complete"
												>
													<CheckCircle2 class="w-5 h-5" />
												</button>
											{/if}
											<button 
												class="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
												onclick={() => openEditForm(task)}
												title="Edit task"
											>
												<Edit class="w-5 h-5" />
											</button>
											<button 
												class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
												onclick={() => deleteTask(task.id)}
												title="Delete task"
											>
												<Trash2 class="w-5 h-5" />
											</button>
										</div>
									</div>
									
									{#if task.description}
										<p class="text-neutral-600 mb-4 leading-relaxed {task.completedAt ? 'line-through' : ''}">{task.description}</p>
									{/if}
								</div>
							</div>
						</div>
						
						<!-- Task Footer -->
						<div class="px-6 pb-6">
							<div class="flex flex-wrap items-center gap-3">
								<!-- Due Date -->
								{#if task.dueDate}
									<div class="inline-flex items-center gap-2 px-3 py-2 {getDateColor(task.dueDate)} rounded-lg text-sm font-medium">
										<Calendar class="w-4 h-4" />
										{formatDate(task.dueDate)}
									</div>
								{/if}
								
								<!-- Tags -->
								{#if task.focus?.name}
									<div class="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
										{task.focus.name}
									</div>
								{/if}
								{#if task.familyMember?.name}
									<div class="inline-flex items-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
										{task.familyMember.name}
									</div>
								{/if}
								{#if task.stat?.name}
									<div class="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
										<svelte:component this={getIconComponent(task.stat.icon)} class="w-4 h-4" />
										{task.stat.name}
									</div>
								{/if}
							</div>
							
							<!-- Mobile Actions -->
							{#if !task.completedAt}
								<div class="flex gap-3 mt-4 sm:hidden">
									<button 
										class="flex-1 btn-success text-sm py-2"
										onclick={() => completeTask(task.id)}
									>
										<CheckCircle2 class="w-4 h-4 mr-2" />
										Complete
									</button>
									<button 
										class="btn-ghost text-sm py-2 px-4"
										onclick={() => openEditForm(task)}
									>
										<Edit class="w-4 h-4" />
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Task Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onclick={closeModal}>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
			<!-- Modal Header -->
			<div class="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-white/10 rounded-lg">
							<Target class="w-6 h-6" />
						</div>
						<div>
							<h2 class="text-2xl font-bold">
								{editingTask ? 'Edit Task' : 'Create New Task'}
							</h2>
							<p class="text-blue-100 text-sm mt-1">
								{editingTask ? 'Update your task details' : 'Add a new task to your workflow'}
							</p>
						</div>
					</div>
					<button 
						class="p-2 hover:bg-white/10 rounded-lg transition-colors"
						onclick={() => showCreateForm = false}
					>
						<X class="w-6 h-6" />
					</button>
				</div>
			</div>
			
			<!-- Modal Body -->
			<div class="overflow-y-auto max-h-[calc(90vh-180px)]">
				<form onsubmit={handleSubmit} class="p-8 space-y-8">
					<!-- Essential Fields -->
					<div class="space-y-6">
						<div>
							<h3 class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
								<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
								Task Details
							</h3>
							
							<!-- Title -->
							<div class="space-y-2 mb-6">
								<label for="title" class="block text-sm font-medium text-neutral-900">
									Task Title *
								</label>
								<input 
									id="title"
									type="text" 
									class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
									placeholder="What needs to be done?"
									bind:value={formData.title}
									required
								/>
							</div>
							
							<!-- Description -->
							<div class="space-y-2">
								<label for="description" class="block text-sm font-medium text-neutral-900">
									Description
								</label>
								<textarea 
									id="description"
									class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none bg-white shadow-sm"
									placeholder="Add context, notes, or additional details..."
									bind:value={formData.description}
									rows="3"
								></textarea>
							</div>
						</div>
						
						<!-- Scheduling -->
						<div>
							<h3 class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
								<div class="w-2 h-2 bg-amber-500 rounded-full"></div>
								Scheduling
							</h3>
							
							<div class="space-y-2">
								<label for="dueDate" class="block text-sm font-medium text-neutral-900">
									Due Date
								</label>
								<div class="relative">
									<input 
										id="dueDate"
										type="date" 
										class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
										bind:value={formData.dueDate}
									/>
									<Calendar class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
								</div>
							</div>
						</div>
						
						<!-- Organization -->
						<div>
							<h3 class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
								<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
								Organization
							</h3>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<!-- Focus Area -->
								{#if focuses.length > 0}
									<div class="space-y-2">
										<label for="focusId" class="block text-sm font-medium text-neutral-900">
											Focus Area
										</label>
										<div class="relative">
											<select 
												id="focusId"
												class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white shadow-sm"
												bind:value={formData.focusId}
											>
												<option value="">Choose focus area...</option>
												{#each focuses as focus}
													<option value={focus.id}>{focus.name}</option>
												{/each}
											</select>
											<ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
										</div>
									</div>
								{/if}
								
								<!-- Family Member -->
								{#if familyMembers.length > 0}
									<div class="space-y-2">
										<label for="familyMemberId" class="block text-sm font-medium text-neutral-900">
											Family Member
										</label>
										<div class="relative">
											<select 
												id="familyMemberId"
												class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white shadow-sm"
												bind:value={formData.familyMemberId}
											>
												<option value="">Choose family member...</option>
												{#each familyMembers as member}
													<option value={member.id}>{member.name}</option>
												{/each}
											</select>
											<ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
										</div>
									</div>
								{/if}
							</div>
						</div>
						
						<!-- Rewards -->
						{#if stats.length > 0}
							<div>
								<h3 class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
									<div class="w-2 h-2 bg-green-500 rounded-full"></div>
									Rewards & Progress
								</h3>
								
								<div class="space-y-2">
									<label for="statId" class="block text-sm font-medium text-neutral-900">
										Linked Stat
									</label>
									<div class="relative">
										<select 
											id="statId"
											class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white shadow-sm"
											bind:value={formData.statId}
										>
											<option value="">Choose stat to boost...</option>
											{#each stats as stat}
												<option value={stat.id}>
													{stat.name} (Current: {stat.value})
												</option>
											{/each}
										</select>
										<ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
									</div>
									<div class="flex items-center gap-2 mt-2">
										<div class="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
											<CheckCircle2 class="w-3 h-3 text-green-600" />
										</div>
										<p class="text-xs text-neutral-600">
											Completing this task will automatically boost the selected stat
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</form>
			</div>
			
			<!-- Modal Footer -->
			<div class="bg-neutral-50 px-8 py-6 border-t border-neutral-200">
				<div class="flex justify-end gap-4">
					<button 
						type="button" 
						class="px-6 py-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors font-medium"
						onclick={() => showCreateForm = false}
					>
						Cancel
					</button>
					<button 
						type="submit" 
						class="btn-primary px-8 py-3 text-lg"
						onclick={handleSubmit}
					>
						{editingTask ? 'Update Task' : 'Create Task'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
