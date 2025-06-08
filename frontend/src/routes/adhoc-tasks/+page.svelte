<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { adhocTasksApi, statsApi } from '$lib/api';
	import { goto } from '$app/navigation';
	import * as icons from 'lucide-svelte';
	import IconPicker from '$lib/components/IconPicker.svelte';

	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return icons.Target;

		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');

		return (icons as any)[componentName] || icons.Target;
	}

	let adhocTasks: any[] = [];
	let stats: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingTask: any = null;
	let saveMessage = '';
	let formData = {
		name: '',
		description: '',
		linkedStatId: '',
		xpValue: 25,
		iconId: '',
		category: 'body' as 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy'
	};

	// Category options
	const categoryOptions = [
		{
			value: 'body',
			label: 'Body',
			description: 'Physical health, fitness, and energy',
			icon: '💪',
			color: 'border-red-500'
		},
		{
			value: 'mind',
			label: 'Mind',
			description: 'Mental clarity, wisdom, and intellectual growth',
			icon: '🧠',
			color: 'border-blue-500'
		},
		{
			value: 'connection',
			label: 'Connection',
			description: 'Social bonds, emotional presence, and relationships',
			icon: '💝',
			color: 'border-pink-500'
		},
		{
			value: 'shadow',
			label: 'Shadow',
			description: 'Patterns that drain or sabotage - track for healing',
			icon: '🌑',
			color: 'border-purple-500'
		},
		{
			value: 'spirit',
			label: 'Spirit',
			description: 'Inner alignment, intuition, and existential clarity',
			icon: '🌟',
			color: 'border-yellow-500'
		},
		{
			value: 'legacy',
			label: 'Legacy',
			description: 'Impact on others and long-term contributions',
			icon: '🏛️',
			color: 'border-green-500'
		}
	];

	// Available Lucide icons for tasks
	const availableIconsList = [
		'target',
		'zap',
		'heart',
		'star',
		'coffee',
		'book',
		'dumbbell',
		'leaf',
		'sun',
		'moon',
		'music',
		'camera',
		'pen-tool',
		'compass',
		'flame',
		'droplet',
		'mountain',
		'trees',
		'flower',
		'rainbow',
		'cloud',
		'lightning',
		'snowflake',
		'sunrise',
		'sunset'
	];

	// Convert to format expected by IconPicker
	const availableIcons = availableIconsList.map(iconName => {
		// Create friendly labels from icon names
		const label = iconName
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return { name: iconName, label };
	});

	onMount(() => {
		const unsubscribe = auth.subscribe((state) => {
			if (!state.user && !state.loading) {
				goto('/login');
			}
		});

		async function loadData() {
			try {
				const [adhocTasksData, statsData] = await Promise.all([
					adhocTasksApi.getAll(),
					statsApi.getAll()
				]);

				adhocTasks = adhocTasksData.adhocTasks || [];
				stats = statsData || [];
			} catch (error) {
				console.error('Failed to load ad hoc tasks:', error);
			} finally {
				loading = false;
			}
		}

		loadData();
		return unsubscribe;
	});

	function openCreateForm() {
		editingTask = null;
		formData = {
			name: '',
			description: '',
			linkedStatId: '',
			xpValue: 25,
			iconId: '',
			category: 'body'
		};
		showCreateForm = true;
	}

	function openEditForm(task: any) {
		editingTask = task;
		formData = {
			name: task.name,
			description: task.description || '',
			linkedStatId: task.linkedStatId,
			xpValue: task.xpValue,
			iconId: task.iconId || '',
			category: task.category
		};
		showCreateForm = true;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!formData.name.trim() || !formData.linkedStatId) {
			showSaveMessage('Please fill in all required fields');
			return;
		}

		try {
			if (editingTask) {
				await adhocTasksApi.update(editingTask.id, formData);
				showSaveMessage('Ad hoc task updated ✓');
			} else {
				await adhocTasksApi.create(formData);
				showSaveMessage('Ad hoc task created ✓');
			}

			// Refresh ad hoc tasks
			const adhocTasksData = await adhocTasksApi.getAll();
			adhocTasks = adhocTasksData.adhocTasks || [];

			// Close form
			showCreateForm = false;
		} catch (error) {
			console.error('Failed to save ad hoc task:', error);
			showSaveMessage('Failed to save ad hoc task');
		}
	}

	async function deleteTask(taskId: string) {
		if (!confirm('Are you sure you want to delete this ad hoc task?')) {
			return;
		}

		try {
			await adhocTasksApi.delete(taskId);

			// Refresh ad hoc tasks
			const adhocTasksData = await adhocTasksApi.getAll();
			adhocTasks = adhocTasksData.adhocTasks || [];

			showSaveMessage('Ad hoc task deleted ✓');
		} catch (error) {
			console.error('Failed to delete ad hoc task:', error);
			showSaveMessage('Failed to delete ad hoc task');
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

	function getCategoryInfo(category: string) {
		return categoryOptions.find((opt) => opt.value === category) || categoryOptions[0];
	}
</script>

<svelte:head>
	<title>Anytime Tasks Library - LifeQuest</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div
					class="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
				<p class="text-sm text-neutral-600">Loading your anytime tasks...</p>
			</div>
		</div>
	{:else}
		<!-- Save Message -->
		{#if saveMessage}
			<div
				class="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg transition-opacity"
			>
				<svelte:component this={icons.CheckCircle} class="h-4 w-4" />
				{saveMessage}
			</div>
		{/if}

		<!-- Header -->
		<header class="border-b border-neutral-200 bg-white">
			<div class="mx-auto max-w-6xl px-4 py-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
							<svelte:component this={icons.Zap} class="h-6 w-6 text-purple-600" />
						</div>
						<div>
							<h1 class="text-3xl font-bold text-neutral-900">Anytime Tasks Library</h1>
							<p class="text-neutral-600">Create and manage your quick action tasks</p>
						</div>
					</div>
					<button
						onclick={openCreateForm}
						class="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
					>
						<svelte:component this={icons.Plus} class="h-4 w-4" />
						Add Task
					</button>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="mx-auto max-w-6xl px-4 py-8">
			{#if adhocTasks.length === 0}
				<!-- Empty State -->
				<div class="rounded-xl border border-neutral-200 bg-white p-12 text-center">
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100"
					>
						<svelte:component this={icons.Zap} class="h-10 w-10 text-purple-600" />
					</div>
					<h2 class="mb-3 text-2xl font-bold text-neutral-900">Build Your Task Library</h2>
					<p class="mx-auto mb-8 max-w-md leading-relaxed text-neutral-600">
						Create quick actions you can complete anytime to earn XP and build momentum. Perfect for
						habits like workouts, reading, or meditation.
					</p>
					<button
						onclick={openCreateForm}
						class="mx-auto flex items-center gap-2 rounded-lg bg-purple-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-purple-700"
					>
						<svelte:component this={icons.Plus} class="h-5 w-5" />
						Create Your First Task
					</button>
				</div>
			{:else}
				<!-- Task Grid -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each adhocTasks as task}
						{@const categoryInfo = getCategoryInfo(task.category)}
						<div
							class="group rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
						>
							<!-- Task Header -->
							<div class="mb-4 flex items-start justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
										{#if task.iconId}
											<svelte:component
												this={getIconComponent(task.iconId)}
												class="h-6 w-6 text-purple-600"
											/>
										{:else}
											<svelte:component this={icons.Target} class="h-6 w-6 text-purple-600" />
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<h3 class="truncate font-semibold text-neutral-900">{task.name}</h3>
										<div class="mt-1 flex items-center gap-2">
											<span class="text-xs font-medium text-purple-600">
												+{task.xpValue} XP
											</span>
											<span class="text-xs text-neutral-500">•</span>
											<span class="text-xs text-neutral-600">
												{categoryInfo.icon}
												{categoryInfo.label}
											</span>
										</div>
									</div>
								</div>
								<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<button
										onclick={() => openEditForm(task)}
										class="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
										title="Edit task"
									>
										<svelte:component this={icons.Edit} class="h-4 w-4" />
									</button>
									<button
										onclick={() => deleteTask(task.id)}
										class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
										title="Delete task"
									>
										<svelte:component this={icons.Trash2} class="h-4 w-4" />
									</button>
								</div>
							</div>

							<!-- Description -->
							{#if task.description}
								<p class="mb-4 line-clamp-2 text-sm text-neutral-600">
									{task.description}
								</p>
							{/if}

							<!-- Linked Stat -->
							<div class="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
								<svelte:component this={icons.TrendingUp} class="h-4 w-4 text-green-600" />
								<span class="text-sm font-medium text-neutral-900">
									{task.linkedStat.name}
								</span>
								<span class="text-xs text-neutral-500">
									(Level {task.linkedStat.level})
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</main>
	{/if}
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
			<div class="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-white">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-white/10 p-2">
							<svelte:component this={icons.Zap} class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-2xl font-bold">
								{editingTask ? 'Edit Anytime Task' : 'Create New Anytime Task'}
							</h2>
							<p class="mt-1 text-sm text-purple-100">
								{editingTask
									? 'Update your task details'
									: 'Add a new quick action to your library'}
							</p>
						</div>
					</div>
					<button
						class="rounded-lg p-2 transition-colors hover:bg-white/10"
						onclick={() => (showCreateForm = false)}
					>
						<svelte:component this={icons.X} class="h-6 w-6" />
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
								<div class="h-2 w-2 rounded-full bg-purple-500"></div>
								Task Details
							</h3>

							<!-- Name -->
							<div class="mb-6 space-y-2">
								<label for="name" class="block text-sm font-medium text-neutral-900">
									Task Name *
								</label>
								<input
									id="name"
									type="text"
									bind:value={formData.name}
									placeholder="e.g., Morning Workout, Read 10 Pages, Meditate"
									class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required
								/>
							</div>

							<!-- Description -->
							<div class="mb-6 space-y-2">
								<label for="description" class="block text-sm font-medium text-neutral-900">
									Description
								</label>
								<textarea
									id="description"
									bind:value={formData.description}
									placeholder="Describe this task or add notes..."
									rows="3"
									class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
								></textarea>
							</div>

							<!-- XP Value -->
							<div class="mb-6 space-y-2">
								<label for="xpValue" class="block text-sm font-medium text-neutral-900">
									XP Reward
								</label>
								<input
									id="xpValue"
									type="number"
									min="1"
									max="100"
									bind:value={formData.xpValue}
									class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required
								/>
								<p class="text-xs text-neutral-600">
									How much XP should this task award when completed? (1-100)
								</p>
							</div>
						</div>

						<!-- Configuration -->
						<div>
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
								<div class="h-2 w-2 rounded-full bg-green-500"></div>
								Configuration
							</h3>

							<!-- Category -->
							<div class="mb-6 space-y-2">
								<label for="category" class="block text-sm font-medium text-neutral-900">
									Category *
								</label>
								<select
									id="category"
									bind:value={formData.category}
									class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required
								>
									{#each categoryOptions as option}
										<option value={option.value}>
											{option.icon}
											{option.label} - {option.description}
										</option>
									{/each}
								</select>
							</div>

							<!-- Linked Stat -->
							<div class="mb-6 space-y-2">
								<label for="linkedStatId" class="block text-sm font-medium text-neutral-900">
									Linked Stat *
								</label>
								<select
									id="linkedStatId"
									bind:value={formData.linkedStatId}
									class="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required
								>
									<option value="">Choose a stat to boost...</option>
									{#each stats as stat}
										<option value={stat.id}>
											{stat.name} (Level {stat.level}, {stat.xp} XP)
										</option>
									{/each}
								</select>
								<p class="text-xs text-neutral-600">
									This stat will receive the XP when the task is completed
								</p>
							</div>

							<!-- Icon -->
							<div class="space-y-2">
								<label for="iconId" class="block text-sm font-medium text-neutral-900">
									Icon
								</label>
								<IconPicker 
									bind:selectedIcon={formData.iconId}
									availableIcons={availableIcons}
									showPreview={false}
								/>
							</div>
						</div>
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
					<button
						type="submit"
						class="rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
						onclick={handleSubmit}
					>
						{editingTask ? 'Update Task' : 'Create Task'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
