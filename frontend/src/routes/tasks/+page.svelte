<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksApi, familyApi, statsApi } from '$lib/api';
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
	let stats: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingTask: any = null;
	let saveMessage = '';
	let searchQuery = '';
	let filterStatus = 'all'; // all, active, completed, overdue
	let sortBy = 'dueDate'; // dueDate, created, title, priority
	let viewMode = 'list'; // list, board
	let showFilters = false;

	// Form data
	let formData = {
		title: '',
		description: '',
		dueDate: '',
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
			const [tasksRes, familyRes, statsRes] = await Promise.all([
				tasksApi.getAll(),
				familyApi.getAll(),
				statsApi.getAll()
			]);
			tasks = tasksRes.tasks;
			familyMembers = familyRes.familyMembers;
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

		if (diffDays < 0) return 'text-red-600 bg-red-50'; // Overdue
		if (diffDays === 0) return 'text-amber-700 bg-amber-50'; // Today
		if (diffDays <= 3) return 'text-orange-700 bg-orange-50'; // Soon
		return 'text-neutral-600 bg-neutral-50'; // Future
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
		sortBy = 'dueDate';
	}
</script>

<svelte:head>
	<title>Tasks - Life Quest</title>
</svelte:head>

<!-- Success Message -->
{#if saveMessage}
	<div
		class="fixed top-6 right-6 z-50 max-w-sm rounded-lg border border-green-200 bg-white p-4 shadow-lg"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<CheckCircle2 class="h-5 w-5 text-green-600" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-neutral-900">{saveMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="bg-neutral-25 min-h-screen">
	<!-- Hero Header -->
	<div class="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
		<div class="container mx-auto px-6 py-12">
			<div class="max-w-4xl">
				<div class="mb-4 flex items-center gap-4">
					<div class="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
						<Target class="h-8 w-8" />
					</div>
					<div>
						<h1 class="mb-2 text-4xl font-bold">Task Management</h1>
						<p class="text-lg text-blue-100">Stay organized and achieve your goals</p>
					</div>
				</div>

				<!-- Hero Stats -->
				<div class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<Clock class="h-4 w-4 text-blue-200" />
							<span class="text-sm text-blue-200">Active</span>
						</div>
						<div class="text-2xl font-bold">{activeTasks.length}</div>
					</div>

					{#if overdueTasks.length > 0}
						<div class="rounded-lg border border-red-400/30 bg-red-500/20 p-4 backdrop-blur-sm">
							<div class="mb-1 flex items-center gap-2">
								<AlertCircle class="h-4 w-4 text-red-200" />
								<span class="text-sm text-red-200">Overdue</span>
							</div>
							<div class="text-2xl font-bold text-red-100">{overdueTasks.length}</div>
						</div>
					{:else}
						<div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
							<div class="mb-1 flex items-center gap-2">
								<AlertCircle class="h-4 w-4 text-blue-200" />
								<span class="text-sm text-blue-200">Overdue</span>
							</div>
							<div class="text-2xl font-bold">0</div>
						</div>
					{/if}

					<div class="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
						<div class="mb-1 flex items-center gap-2">
							<Calendar class="h-4 w-4 text-blue-200" />
							<span class="text-sm text-blue-200">Due Today</span>
						</div>
						<div class="text-2xl font-bold">{todayTasks.length}</div>
					</div>

					<div class="rounded-lg border border-green-400/30 bg-green-500/20 p-4 backdrop-blur-sm">
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
	<div class="sticky top-0 z-10 border-b border-neutral-200 bg-white">
		<div class="container mx-auto px-6 py-4">
			<div class="flex flex-col items-center gap-4 lg:flex-row">
				<!-- Search -->
				<div class="relative flex-1">
					<Search
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-400"
					/>
					<input
						type="text"
						placeholder="Search tasks by title or description..."
						class="w-full rounded-lg border border-neutral-300 bg-white py-3 pr-4 pl-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Filters and Actions -->
				<div class="flex flex-wrap items-center gap-3">
					<!-- Status Filter -->
					<div class="relative">
						<select
							class="appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={filterStatus}
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="completed">Completed</option>
							<option value="overdue">Overdue</option>
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-neutral-400"
						/>
					</div>

					<!-- Sort -->
					<div class="relative">
						<select
							class="appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							bind:value={sortBy}
						>
							<option value="dueDate">Due Date</option>
							<option value="title">Title</option>
							<option value="created">Created</option>
						</select>
						<ChevronDown
							class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-neutral-400"
						/>
					</div>

					<!-- Reset -->
					{#if searchQuery || filterStatus !== 'all' || sortBy !== 'dueDate'}
						<button
							class="rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
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
						class="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
					></div>
					<p class="font-medium text-neutral-600">Loading your tasks...</p>
				</div>
			</div>
		{:else if filteredTasks.length === 0}
			<div class="py-20 text-center">
				<div class="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-12 shadow-sm">
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100"
					>
						<Target class="h-10 w-10 text-neutral-400" />
					</div>
					{#if tasks.length === 0}
						<h3 class="mb-3 text-2xl font-bold text-neutral-900">Ready to get organized?</h3>
						<p class="mb-8 leading-relaxed text-neutral-600">
							Create your first task and take the first step towards achieving your goals.
						</p>
						<button class="btn-primary px-6 py-3 text-lg" onclick={openCreateForm}>
							<Plus class="mr-2 h-5 w-5" />
							Create Your First Task
						</button>
					{:else}
						<h3 class="mb-3 text-2xl font-bold text-neutral-900">No matching tasks</h3>
						<p class="mb-8 leading-relaxed text-neutral-600">
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
						class="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6"
					>
						<div class="flex items-start gap-4">
							<div class="rounded-lg bg-amber-100 p-2">
								<AlertCircle class="h-5 w-5 text-amber-600" />
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
						class="group rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
					>
						<!-- Task Header -->
						<div class="p-6 pb-4">
							<div class="flex items-start gap-4">
								<!-- Priority Indicator & Status -->
								<div class="mt-1 flex flex-col items-center gap-2">
									{#if task.completedAt}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<CheckCircle2 class="h-5 w-5 text-green-600" />
										</div>
									{:else if priority === 'overdue'}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
											<AlertCircle class="h-5 w-5 text-red-600" />
										</div>
									{:else if priority === 'urgent'}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
											<Clock class="h-5 w-5 text-amber-600" />
										</div>
									{:else}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
											<Target class="h-5 w-5 text-blue-600" />
										</div>
									{/if}
								</div>

								<!-- Task Content -->
								<div class="min-w-0 flex-1">
									<div class="mb-3 flex items-start justify-between gap-4">
										<h3
											class="text-xl leading-tight font-semibold text-neutral-900 {task.completedAt
												? 'text-neutral-500 line-through'
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
													class="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
													onclick={() => completeTask(task.id)}
													title="Mark as complete"
												>
													<CheckCircle2 class="h-5 w-5" />
												</button>
											{/if}
											<button
												class="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-50"
												onclick={() => openEditForm(task)}
												title="Edit task"
											>
												<Edit class="h-5 w-5" />
											</button>
											<button
												class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
												onclick={() => deleteTask(task.id)}
												title="Delete task"
											>
												<Trash2 class="h-5 w-5" />
											</button>
										</div>
									</div>

									{#if task.description}
										<p
											class="mb-4 leading-relaxed text-neutral-600 {task.completedAt
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
								{#if task.familyMember?.name}
									<div
										class="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700"
									>
										{task.familyMember.name}
									</div>
								{/if}
								{#if task.stat?.name}
									<div
										class="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
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
			class="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-white/10 p-2">
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
						class="rounded-lg p-2 transition-colors hover:bg-white/10"
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
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
								<div class="h-2 w-2 rounded-full bg-blue-500"></div>
								Task Details
							</h3>

							<!-- Title -->
							<div class="mb-6 space-y-2">
								<label for="title" class="block text-sm font-medium text-neutral-900">
									Task Title *
								</label>
								<input
									id="title"
									type="text"
									class="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
									class="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									placeholder="Add context, notes, or additional details..."
									bind:value={formData.description}
									rows="3"
								></textarea>
							</div>
						</div>

						<!-- Scheduling -->
						<div>
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
								<div class="h-2 w-2 rounded-full bg-amber-500"></div>
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
										class="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
										bind:value={formData.dueDate}
									/>
									<Calendar
										class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-neutral-400"
									/>
								</div>
							</div>
						</div>

						<!-- Organization -->
						<div>
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
								<div class="h-2 w-2 rounded-full bg-purple-500"></div>
								Organization
							</h3>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<!-- Family Member -->
								{#if familyMembers.length > 0}
									<div class="space-y-2">
										<label for="familyMemberId" class="block text-sm font-medium text-neutral-900">
											Family Member
										</label>
										<div class="relative">
											<select
												id="familyMemberId"
												class="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
												bind:value={formData.familyMemberId}
											>
												<option value="">Choose family member...</option>
												{#each familyMembers as member}
													<option value={member.id}>{member.name}</option>
												{/each}
											</select>
											<ChevronDown
												class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-neutral-400"
											/>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Rewards -->
						{#if stats.length > 0}
							<div>
								<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									Rewards & Progress
								</h3>

								<div class="space-y-2">
									<label for="statId" class="block text-sm font-medium text-neutral-900">
										Linked Stat
									</label>
									<div class="relative">
										<select
											id="statId"
											class="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
											class="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-neutral-400"
										/>
									</div>
									<div class="mt-2 flex items-center gap-2">
										<div class="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
											<CheckCircle2 class="h-3 w-3 text-green-600" />
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
			<div class="border-t border-neutral-200 bg-neutral-50 px-8 py-6">
				<div class="flex justify-end gap-4">
					<button
						type="button"
						class="rounded-lg px-6 py-3 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
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
