<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksApi, familyApi, focusesApi, statsApi } from '$lib/api';
	import {
		Plus,
		Calendar,
		Filter,
		Search,
		ChevronDown,
		Target,
		CheckCircle2,
		Clock,
		AlertCircle,
		MoreHorizontal,
		Edit,
		Trash2,
		X
	} from 'lucide-svelte';
	import * as icons from 'lucide-svelte';

	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return Target;

		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
	$: filteredTasks = tasks
		.filter((task) => {
			// Search filter
			if (
				searchQuery &&
				!task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!task.description?.toLowerCase().includes(searchQuery.toLowerCase())
			)
				return false;

			// Status filter
			if (filterStatus === 'active' && task.completedAt) return false;
			if (filterStatus === 'completed' && !task.completedAt) return false;
			if (
				filterStatus === 'overdue' &&
				(task.completedAt || !task.dueDate || new Date(task.dueDate) >= new Date())
			)
				return false;

			// Focus filter
			if (filterFocus && task.focusId !== filterFocus) return false;
			return true;
		})
		.sort((a, b) => {
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
			if (sortBy === 'created')
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			return 0;
		});

	$: activeTasks = tasks.filter((task) => !task.completedAt);
	$: completedTasks = tasks.filter((task) => task.completedAt);
	$: overdueTasks = tasks.filter(
		(task) => !task.completedAt && task.dueDate && new Date(task.dueDate) < new Date()
	);
	$: todayTasks = tasks.filter(
		(task) =>
			!task.completedAt &&
			task.dueDate &&
			new Date(task.dueDate).toDateString() === new Date().toDateString()
	);
	$: upcomingTasks = tasks.filter(
		(task) =>
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
		setTimeout(() => (saveMessage = ''), 3000);
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

		if (diffDays < 0) return 'text-error bg-error/10'; // Overdue
		if (diffDays === 0) return 'text-warning bg-warning/10'; // Today
		if (diffDays <= 3) return 'text-orange-700 bg-orange-50'; // Soon
		return 'text-base-content/70 bg-base-200'; // Future
	}

	function getTaskPriority(task: any) {
		if (!task.dueDate) return 'low';
		const daysUntilDue = Math.ceil(
			(new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
		);
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
	<div
		class="fixed top-6 right-6 z-50 max-w-sm rounded-lg border border-success/20 bg-base-100 p-4 shadow-lg"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<CheckCircle2 class="h-5 w-5 text-success" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-base-content">{saveMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="bg-neutral-25 min-h-screen">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-blue-600 to-blue-700 text-primary-content">
		<div class="container mx-auto px-6 py-12">
			<div class="max-w-4xl">
				<div class="mb-4 flex items-center gap-4">
					<div class="rounded-lg bg-base-100/10 p-3 backdrop-blur-sm">
						<Target class="h-8 w-8" />
					</div>
					<div>
						<h1 class="mb-2 text-4xl font-bold">Task Management</h1>
						<p class="text-lg text-blue-100">Stay organized and achieve your goals</p>
					</div>
				</div>

				<!-- Hero Stats -->
				<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="rounded-lg bg-base-100/10 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<Clock class="h-4 w-4 text-blue-200" />
							<span class="text-sm text-blue-200">Active</span>
						</div>
						<div class="text-2xl font-bold">{activeTasks.length}</div>
					</div>

					{#if overdueTasks.length > 0}
						<div class="rounded-lg border border-red-400/30 bg-error/20 p-4 backdrop-blur-sm">
							<div class="mb-1 flex items-center gap-2">
								<AlertCircle class="h-4 w-4 text-red-200" />
								<span class="text-sm text-red-200">Overdue</span>
							</div>
							<div class="text-2xl font-bold text-red-100">{overdueTasks.length}</div>
						</div>
					{:else}
						<div class="rounded-lg bg-base-100/10 p-4 backdrop-blur-sm">
							<div class="mb-1 flex items-center gap-2">
								<AlertCircle class="h-4 w-4 text-blue-200" />
								<span class="text-sm text-blue-200">Overdue</span>
							</div>
							<div class="text-2xl font-bold">0</div>
						</div>
					{/if}

					<div class="rounded-lg bg-base-100/10 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<Calendar class="h-4 w-4 text-blue-200" />
							<span class="text-sm text-blue-200">Due Today</span>
						</div>
						<div class="text-2xl font-bold">{todayTasks.length}</div>
					</div>

					<div class="rounded-lg border border-green-400/30 bg-success/100/20 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<CheckCircle2 class="h-4 w-4 text-green-200" />
							<span class="text-sm text-green-200">Completed</span>
						</div>
						<div class="text-2xl font-bold text-green-100">{completedTasks.length}</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Controls Section -->
	<div class="sticky top-0 z-10 border-b border-base-300 bg-base-100">
		<div class="container mx-auto px-6 py-4">
			<div class="flex flex-col items-center gap-4 lg:flex-row">
				<!-- Search -->
				<div class="relative flex-1">
					<Search
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-base-content/50"
					/>
					<input
						type="text"
						placeholder="Search tasks by title or description..."
						class="w-full rounded-lg border border-base-300 bg-base-100 py-3 pr-4 pl-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Filters and Actions -->
				<div class="flex flex-wrap items-center gap-3">
					<!-- Status Filter -->
					<div class="relative">
						<select
							class="appearance-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 pr-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={filterStatus}
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="completed">Completed</option>
							<option value="overdue">Overdue</option>
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-base-content/50"
						/>
					</div>

					<!-- Focus Filter -->
					{#if focuses.length > 0}
						<div class="relative">
							<select
								class="appearance-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 pr-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
								bind:value={filterFocus}
							>
								<option value="">All Focus Areas</option>
								{#each focuses as focus}
									<option value={focus.id}>{focus.name}</option>
								{/each}
							</select>
							<ChevronDown
								class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-base-content/50"
							/>
						</div>
					{/if}

					<!-- Sort -->
					<div class="relative">
						<select
							class="appearance-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 pr-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={sortBy}
						>
							<option value="dueDate">Due Date</option>
							<option value="title">Title</option>
							<option value="created">Created</option>
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-base-content/50"
						/>
					</div>

					<!-- Reset -->
					{#if searchQuery || filterStatus !== 'all' || filterFocus || sortBy !== 'dueDate'}
						<button
							class="rounded-lg px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content"
							onclick={resetFilters}
						>
							Reset
						</button>
					{/if}

					<!-- Create Task Button -->
					<button class="btn-primary ml-2 flex items-center gap-2" onclick={openCreateForm}>
						<Plus class="h-4 w-4" />
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
					<div
						class="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
					></div>
					<p class="font-medium text-base-content/70">Loading your tasks...</p>
				</div>
			</div>
		{:else if filteredTasks.length === 0}
			<div class="py-20 text-center">
				<div class="mx-auto max-w-md rounded-xl border border-base-300 bg-base-100 p-12 shadow-sm">
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-base-200"
					>
						<Target class="h-10 w-10 text-base-content/50" />
					</div>
					{#if tasks.length === 0}
						<h3 class="mb-3 text-2xl font-bold text-base-content">Ready to get organized?</h3>
						<p class="mb-8 leading-relaxed text-base-content/70">
							Create your first task and take the first step towards achieving your goals.
						</p>
						<button class="btn-primary px-6 py-3 text-lg" onclick={openCreateForm}>
							<Plus class="mr-2 h-5 w-5" />
							Create Your First Task
						</button>
					{:else}
						<h3 class="mb-3 text-2xl font-bold text-base-content">No matching tasks</h3>
						<p class="mb-8 leading-relaxed text-base-content/70">
							Try adjusting your search or filter criteria to find what you're looking for.
						</p>
						<button class="btn-ghost px-6 py-3 text-lg" onclick={resetFilters}>
							<Filter class="mr-2 h-5 w-5" />
							Reset All Filters
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Quick Actions Bar -->
			{#if overdueTasks.length > 0 || todayTasks.length > 0}
				<div class="mb-8">
					<div
						class="rounded-xl border border-warning/20 bg-gradient-to-r from-amber-50 to-orange-50 p-6"
					>
						<div class="flex items-start gap-4">
							<div class="rounded-lg bg-warning/10 p-2">
								<AlertCircle class="h-5 w-5 text-warning" />
							</div>
							<div class="flex-1">
								<h3 class="mb-2 font-semibold text-amber-900">Attention Required</h3>
								<div class="flex flex-wrap gap-4 text-sm text-amber-800">
									{#if overdueTasks.length > 0}
										<span
											>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span
										>
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
					<div
						class="group rounded-xl border border-base-300 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md"
					>
						<!-- Task Header -->
						<div class="p-6 pb-4">
							<div class="flex items-start gap-4">
								<!-- Priority Indicator & Status -->
								<div class="mt-1 flex flex-col items-center gap-2">
									{#if task.completedAt}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
											<CheckCircle2 class="h-5 w-5 text-success" />
										</div>
									{:else if priority === 'overdue'}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-error/10">
											<AlertCircle class="h-5 w-5 text-error" />
										</div>
									{:else if priority === 'urgent'}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
											<Clock class="h-5 w-5 text-warning" />
										</div>
									{:else}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
											<Target class="h-5 w-5 text-info" />
										</div>
									{/if}
								</div>

								<!-- Task Content -->
								<div class="min-w-0 flex-1">
									<div class="mb-3 flex items-start justify-between gap-4">
										<h3
											class="text-xl leading-tight font-semibold text-base-content {task.completedAt
												? 'text-base-content/60 line-through'
												: ''}"
										>
											{task.title}
										</h3>

										<!-- Actions -->
										<div
											class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
										>
											{#if !task.completedAt}
												<button
													class="rounded-lg p-2 text-success transition-colors hover:bg-success/10"
													onclick={() => completeTask(task.id)}
													title="Mark as complete"
												>
													<CheckCircle2 class="h-5 w-5" />
												</button>
											{/if}
											<button
												class="rounded-lg p-2 text-base-content/70 transition-colors hover:bg-base-200"
												onclick={() => openEditForm(task)}
												title="Edit task"
											>
												<Edit class="h-5 w-5" />
											</button>
											<button
												class="rounded-lg p-2 text-error transition-colors hover:bg-error/10"
												onclick={() => deleteTask(task.id)}
												title="Delete task"
											>
												<Trash2 class="h-5 w-5" />
											</button>
										</div>
									</div>

									{#if task.description}
										<p
											class="mb-4 leading-relaxed text-base-content/70 {task.completedAt
												? 'line-through'
												: ''}"
										>
											{task.description}
										</p>
									{/if}
								</div>
							</div>
						</div>

						<!-- Task Footer -->
						<div class="px-6 pb-6">
							<div class="flex flex-wrap items-center gap-3">
								<!-- Due Date -->
								{#if task.dueDate}
									<div
										class="inline-flex items-center gap-2 px-3 py-2 {getDateColor(
											task.dueDate
										)} rounded-lg text-sm font-medium"
									>
										<Calendar class="h-4 w-4" />
										{formatDate(task.dueDate)}
									</div>
								{/if}

								<!-- Tags -->
								{#if task.focus?.name}
									<div
										class="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary"
									>
										{task.focus.name}
									</div>
								{/if}
								{#if task.familyMember?.name}
									<div
										class="inline-flex items-center rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-sm font-medium text-secondary"
									>
										{task.familyMember.name}
									</div>
								{/if}
								{#if task.stat?.name}
									<div
										class="inline-flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success"
									>
										<svelte:component this={getIconComponent(task.stat.icon)} class="h-4 w-4" />
										{task.stat.name}
									</div>
								{/if}
							</div>

							<!-- Mobile Actions -->
							{#if !task.completedAt}
								<div class="mt-4 flex gap-3 sm:hidden">
									<button
										class="btn-success flex-1 py-2 text-sm"
										onclick={() => completeTask(task.id)}
									>
										<CheckCircle2 class="mr-2 h-4 w-4" />
										Complete
									</button>
									<button class="btn-ghost px-4 py-2 text-sm" onclick={() => openEditForm(task)}>
										<Edit class="h-4 w-4" />
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={closeModal}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-base-100 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-primary-content">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-base-100/10 p-2">
							<Target class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-2xl font-bold">
								{editingTask ? 'Edit Task' : 'Create New Task'}
							</h2>
							<p class="mt-1 text-sm text-blue-100">
								{editingTask ? 'Update your task details' : 'Add a new task to your workflow'}
							</p>
						</div>
					</div>
					<button
						class="rounded-lg p-2 transition-colors hover:bg-base-100/10"
						onclick={() => (showCreateForm = false)}
					>
						<X class="h-6 w-6" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="max-h-[calc(90vh-180px)] overflow-y-auto">
				<form onsubmit={handleSubmit} class="space-y-8 p-8">
					<!-- Essential Fields -->
					<div class="space-y-6">
						<div>
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-base-content">
								<div class="h-2 w-2 rounded-full bg-primary"></div>
								Task Details
							</h3>

							<!-- Title -->
							<div class="mb-6 space-y-2">
								<label for="title" class="block text-sm font-medium text-base-content">
									Task Title *
								</label>
								<input
									id="title"
									type="text"
									class="w-full rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									placeholder="What needs to be done?"
									bind:value={formData.title}
									required
								/>
							</div>

							<!-- Description -->
							<div class="space-y-2">
								<label for="description" class="block text-sm font-medium text-base-content">
									Description
								</label>
								<textarea
									id="description"
									class="w-full resize-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									placeholder="Add context, notes, or additional details..."
									bind:value={formData.description}
									rows="3"
								></textarea>
							</div>
						</div>

						<!-- Scheduling -->
						<div>
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-base-content">
								<div class="h-2 w-2 rounded-full bg-warning"></div>
								Scheduling
							</h3>

							<div class="space-y-2">
								<label for="dueDate" class="block text-sm font-medium text-base-content">
									Due Date
								</label>
								<div class="relative">
									<input
										id="dueDate"
										type="date"
										class="w-full rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
										bind:value={formData.dueDate}
									/>
									<Calendar
										class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-base-content/50"
									/>
								</div>
							</div>
						</div>

						<!-- Organization -->
						<div>
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-base-content">
								<div class="h-2 w-2 rounded-full bg-secondary"></div>
								Organization
							</h3>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<!-- Focus Area -->
								{#if focuses.length > 0}
									<div class="space-y-2">
										<label for="focusId" class="block text-sm font-medium text-base-content">
											Focus Area
										</label>
										<div class="relative">
											<select
												id="focusId"
												class="w-full appearance-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
												bind:value={formData.focusId}
											>
												<option value="">Choose focus area...</option>
												{#each focuses as focus}
													<option value={focus.id}>{focus.name}</option>
												{/each}
											</select>
											<ChevronDown
												class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-base-content/50"
											/>
										</div>
									</div>
								{/if}

								<!-- Family Member -->
								{#if familyMembers.length > 0}
									<div class="space-y-2">
										<label for="familyMemberId" class="block text-sm font-medium text-base-content">
											Family Member
										</label>
										<div class="relative">
											<select
												id="familyMemberId"
												class="w-full appearance-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
												bind:value={formData.familyMemberId}
											>
												<option value="">Choose family member...</option>
												{#each familyMembers as member}
													<option value={member.id}>{member.name}</option>
												{/each}
											</select>
											<ChevronDown
												class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-base-content/50"
											/>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Rewards -->
						{#if stats.length > 0}
							<div>
								<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-base-content">
									<div class="h-2 w-2 rounded-full bg-success/100"></div>
									Rewards & Progress
								</h3>

								<div class="space-y-2">
									<label for="statId" class="block text-sm font-medium text-base-content">
										Linked Stat
									</label>
									<div class="relative">
										<select
											id="statId"
											class="w-full appearance-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
											bind:value={formData.statId}
										>
											<option value="">Choose stat to boost...</option>
											{#each stats as stat}
												<option value={stat.id}>
													{stat.name} (Current: {stat.value})
												</option>
											{/each}
										</select>
										<ChevronDown
											class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-base-content/50"
										/>
									</div>
									<div class="mt-2 flex items-center gap-2">
										<div class="flex h-4 w-4 items-center justify-center rounded-full bg-success/10">
											<CheckCircle2 class="h-3 w-3 text-success" />
										</div>
										<p class="text-xs text-base-content/70">
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
			<div class="border-t border-base-300 bg-base-200 px-8 py-6">
				<div class="flex justify-end gap-4">
					<button
						type="button"
						class="rounded-lg px-6 py-3 font-medium text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content"
						onclick={() => (showCreateForm = false)}
					>
						Cancel
					</button>
					<button type="submit" class="btn-primary px-8 py-3 text-lg" onclick={handleSubmit}>
						{editingTask ? 'Update Task' : 'Create Task'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
