<script lang="ts">
	import { onMount } from 'svelte';
	import { focusesApi, statsApi } from '$lib/api';
	import { EXTENDED_FOCUS_LIBRARY, type FocusTemplate } from '$lib/focusLibrary';
	import * as icons from 'lucide-svelte';

	let focuses: any[] = [];
	let stats: any[] = [];
	let loading = true;
	let error = '';
	let showCreatePage = false;
	let showLevelForm = false;
	let editingFocus: any = null;
	let selectedFocus: any = null;
	let showFocusLibrary = false;
	let selectedTemplate: FocusTemplate | null = null;

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

	// Icon mapping for Lucide icons
	const iconOptions = [
		{ name: 'target', label: 'Target' },
		{ name: 'heart', label: 'Health' },
		{ name: 'dumbbell', label: 'Fitness' },
		{ name: 'brain', label: 'Learning' },
		{ name: 'briefcase', label: 'Career' },
		{ name: 'users', label: 'Family' },
		{ name: 'palette', label: 'Creativity' },
		{ name: 'dollar-sign', label: 'Finance' },
		{ name: 'home', label: 'Home' },
		{ name: 'book', label: 'Reading' },
		{ name: 'gamepad-2', label: 'Hobbies' },
		{ name: 'plane', label: 'Travel' },
		{ name: 'leaf', label: 'Environment' },
		{ name: 'smile', label: 'Wellness' },
		{ name: 'zap', label: 'Energy' },
		{ name: 'trophy', label: 'Achievement' },
		{ name: 'star', label: 'Goals' },
		{ name: 'mountain', label: 'Adventure' },
		{ name: 'music', label: 'Music' },
		{ name: 'camera', label: 'Photography' }
	];

	// Form data
	let focusFormData = {
		name: '',
		description: '',
		icon: '',
		dayOfWeek: '',
		sampleActivities: [] as string[],
		statId: undefined as string | undefined,
		gptContext: undefined as any
	};

	let levelFormData = {
		name: '',
		description: ''
	};

	// Helper for sample activities
	let newActivity = '';

	function addActivity() {
		if (newActivity.trim()) {
			focusFormData.sampleActivities = [...focusFormData.sampleActivities, newActivity.trim()];
			newActivity = '';
		}
	}

	function removeActivity(index: number) {
		focusFormData.sampleActivities = focusFormData.sampleActivities.filter((_, i) => i !== index);
	}

	onMount(async () => {
		await Promise.all([loadFocuses(), loadStats()]);
	});

	async function loadStats() {
		try {
			const response = await statsApi.getAll();
			stats = response;
		} catch (err: any) {
			console.error('Failed to load stats:', err);
		}
	}

	async function loadFocuses() {
		try {
			loading = true;
			const response = await focusesApi.getAll();
			focuses = response.focuses;
		} catch (err: any) {
			error = err.message || 'Failed to load focuses';
		} finally {
			loading = false;
		}
	}

	function openCreatePage() {
		focusFormData = {
			name: '',
			description: '',
			icon: '',
			dayOfWeek: '',
			sampleActivities: [],
			statId: undefined,
			gptContext: undefined
		};
		editingFocus = null;
		showCreatePage = true;
	}

	function openEditPage(focus: any) {
		focusFormData = {
			name: focus.name,
			description: focus.description || '',
			icon: focus.icon || '',
			dayOfWeek: focus.dayOfWeek || '',
			sampleActivities: focus.sampleActivities || [],
			statId: focus.statId || undefined,
			gptContext: focus.gptContext
		};
		editingFocus = focus;
		showCreatePage = true;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			if (editingFocus) {
				await focusesApi.update(editingFocus.id, focusFormData);
			} else {
				await focusesApi.create(focusFormData);
			}

			showCreatePage = false;
			await loadFocuses();
		} catch (err: any) {
			error = err.message || 'Failed to save focus';
		}
	}

	async function deleteFocus(focusId: string) {
		if (
			confirm(
				'Are you sure you want to delete this focus? This will also delete all associated levels.'
			)
		) {
			try {
				await focusesApi.delete(focusId);
				await loadFocuses();
			} catch (err: any) {
				error = err.message || 'Failed to delete focus';
			}
		}
	}

	function openLevelForm(focus: any) {
		selectedFocus = focus;
		levelFormData = {
			name: '',
			description: ''
		};
		showLevelForm = true;
	}

	async function handleLevelSubmit(event: Event) {
		event.preventDefault();
		try {
			await focusesApi.createLevel(selectedFocus.id, levelFormData);
			showLevelForm = false;
			await loadFocuses();
		} catch (err: any) {
			error = err.message || 'Failed to create level';
		}
	}

	async function selectTemplate(template: FocusTemplate) {
		selectedTemplate = template;
		// Find the matching stat
		const matchingStat = stats?.find((stat) => stat.name === template.suggested_stat);

		// Auto-fill form with template data
		focusFormData = {
			name: template.name,
			description: template.description,
			icon: template.icon_id,
			dayOfWeek: template.suggested_day,
			sampleActivities: [...template.sample_activities],
			statId: matchingStat?.id,
			gptContext: undefined
		};

		showFocusLibrary = false;
		showCreatePage = true;
	}

	function closeCreatePage() {
		showCreatePage = false;
		editingFocus = null;
		selectedTemplate = null;
	}

	// Derived values for insights
	$: totalFocuses = focuses.length;
	$: focusesWithLevels = focuses.filter((f) => f.levels && f.levels.length > 0).length;
	$: weeklyFocuses = focuses.filter((f) => f.dayOfWeek).length;
	$: linkedToStats = focuses.filter((f) => f.statId).length;
</script>

<svelte:head>
	<title>Focus Areas - LifeQuest</title>
</svelte:head>

{#if showCreatePage}
	<!-- Create/Edit Focus Modal - Atlassian Style -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 backdrop-blur-sm"
	>
		<div
			class="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div class="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
							<svelte:component this={icons.Target} size={16} class="text-blue-600" />
						</div>
						<h2 class="text-lg font-semibold text-neutral-900">
							{editingFocus ? 'Edit focus area' : 'Create focus area'}
						</h2>
					</div>
					<button
						on:click={closeCreatePage}
						class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-200"
					>
						<svelte:component this={icons.X} size={16} class="text-neutral-500" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="max-h-[calc(85vh-140px)] overflow-y-auto px-6 py-6">
				{#if error}
					<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.AlertTriangle}
								size={16}
								class="mt-0.5 flex-shrink-0 text-red-500"
							/>
							<div class="flex-1">
								<p class="text-sm font-medium text-red-900">Error</p>
								<p class="mt-1 text-sm text-red-700">{error}</p>
							</div>
							<button
								on:click={() => (error = '')}
								class="text-red-400 transition-colors hover:text-red-600"
							>
								<svelte:component this={icons.X} size={14} />
							</button>
						</div>
					</div>
				{/if}

				{#if selectedTemplate}
					<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.BookOpen}
								size={16}
								class="mt-0.5 flex-shrink-0 text-blue-600"
							/>
							<div>
								<p class="text-sm font-medium text-blue-900">
									Using template: {selectedTemplate.name}
								</p>
								<p class="mt-1 text-xs text-blue-700">
									You can modify any of these fields before creating
								</p>
							</div>
						</div>
					</div>
				{/if}

				<form on:submit={handleSubmit} class="space-y-6">
					<!-- Basic Details -->
					<div class="space-y-4">
						<div>
							<label for="focusName" class="mb-2 block text-sm font-medium text-neutral-900">
								Name <span class="text-red-500">*</span>
							</label>
							<input
								id="focusName"
								type="text"
								bind:value={focusFormData.name}
								placeholder="e.g., Fitness, Learning, Creative Projects"
								required
								class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="focusDescription" class="mb-2 block text-sm font-medium text-neutral-900">
								Description
							</label>
							<textarea
								id="focusDescription"
								bind:value={focusFormData.description}
								placeholder="What is this focus area about? What goals or activities does it include?"
								rows="3"
								class="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							></textarea>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label for="focusIcon" class="mb-2 block text-sm font-medium text-neutral-900">
									Icon
								</label>
								<select
									id="focusIcon"
									bind:value={focusFormData.icon}
									class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								>
									<option value="">Choose an icon...</option>
									{#each iconOptions as iconOption}
										<option value={iconOption.name}>{iconOption.label}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="focusDayOfWeek" class="mb-2 block text-sm font-medium text-neutral-900">
									Scheduled day
								</label>
								<select
									id="focusDayOfWeek"
									bind:value={focusFormData.dayOfWeek}
									class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								>
									<option value="">No specific day</option>
									<option value="Monday">Monday</option>
									<option value="Tuesday">Tuesday</option>
									<option value="Wednesday">Wednesday</option>
									<option value="Thursday">Thursday</option>
									<option value="Friday">Friday</option>
									<option value="Saturday">Saturday</option>
									<option value="Sunday">Sunday</option>
								</select>
							</div>
						</div>

						{#if focusFormData.icon}
							<div class="flex items-center space-x-3 rounded-lg bg-neutral-50 p-3">
								<span class="text-sm font-medium text-neutral-700">Preview:</span>
								<div class="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
									<svelte:component
										this={getIconComponent(focusFormData.icon)}
										size={14}
										class="text-blue-600"
									/>
								</div>
								<span class="text-sm text-neutral-600"
									>{iconOptions.find((opt) => opt.name === focusFormData.icon)?.label}</span
								>
							</div>
						{/if}
					</div>

					<!-- Sample Activities -->
					<div class="space-y-4">
						<div>
							<h3 class="mb-2 text-sm font-medium text-neutral-900">Sample Activities</h3>
							<p class="mb-3 text-xs text-neutral-600">
								Add examples of activities that fit this focus area
							</p>
						</div>

						<div class="flex space-x-2">
							<input
								type="text"
								bind:value={newActivity}
								placeholder="e.g., Morning jog, Read 30 pages, Practice guitar"
								on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
								class="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<button
								type="button"
								on:click={addActivity}
								disabled={!newActivity.trim()}
								class="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								Add
							</button>
						</div>

						{#if focusFormData.sampleActivities.length > 0}
							<div class="max-h-32 space-y-2 overflow-y-auto">
								{#each focusFormData.sampleActivities as activity, index}
									<div
										class="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
									>
										<span class="text-sm text-neutral-900">{activity}</span>
										<button
											type="button"
											on:click={() => removeActivity(index)}
											class="p-1 text-neutral-400 transition-colors hover:text-red-600 focus:outline-none"
										>
											<svelte:component this={icons.X} size={14} />
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<div
								class="rounded-lg border border-dashed border-neutral-300 py-6 text-center text-neutral-500"
							>
								<svelte:component this={icons.Plus} size={20} class="mx-auto mb-2 opacity-50" />
								<p class="text-sm">No activities added yet</p>
							</div>
						{/if}
					</div>

					<!-- Link to Stat -->
					<div class="space-y-4">
						<div>
							<h3 class="mb-2 text-sm font-medium text-neutral-900">Link to Stat</h3>
							<p class="mb-3 text-xs text-neutral-600">
								Connect this focus to a character stat for automatic progress tracking
							</p>
						</div>

						<div>
							<label for="focusStat" class="mb-2 block text-sm font-medium text-neutral-700">
								Linked stat
							</label>
							<select
								id="focusStat"
								bind:value={focusFormData.statId}
								class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							>
								<option value={undefined}>No stat linked</option>
								{#each stats as stat}
									<option value={stat.id}>{stat.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex justify-end space-x-3 border-t border-neutral-200 pt-4">
						<button
							type="button"
							on:click={closeCreatePage}
							class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							{editingFocus ? 'Update focus' : 'Create focus'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<!-- Main Focus Areas Page - Atlassian Style -->
	<div class="mx-auto max-w-7xl px-6 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Focus Areas</h1>
					<p class="mt-1 text-neutral-600">
						Organize your growth areas and track progress through levels
					</p>
				</div>
				<div class="flex items-center space-x-3">
					<button
						on:click={() => (showFocusLibrary = true)}
						class="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:bg-neutral-800"
					>
						<svelte:component this={icons.Library} size={16} class="mr-2" />
						Browse library
					</button>
					<button
						on:click={openCreatePage}
						class="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						<svelte:component this={icons.Plus} size={16} class="mr-2" />
						Create focus
					</button>
				</div>
			</div>

			{#if error}
				<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
					<div class="flex items-start space-x-3">
						<svelte:component
							this={icons.AlertTriangle}
							size={16}
							class="mt-0.5 flex-shrink-0 text-red-500"
						/>
						<div class="flex-1">
							<p class="text-sm font-medium text-red-900">Error</p>
							<p class="mt-1 text-sm text-red-700">{error}</p>
						</div>
						<button
							on:click={() => (error = '')}
							class="text-red-400 transition-colors hover:text-red-600"
						>
							<svelte:component this={icons.X} size={14} />
						</button>
					</div>
				</div>
			{/if}

			<!-- Quick Stats -->
			{#if focuses.length > 0}
				<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
					<div class="rounded-lg border border-neutral-200 bg-white p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
								<svelte:component this={icons.Target} size={16} class="text-blue-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{totalFocuses}</div>
								<div class="text-xs text-neutral-600">Total focuses</div>
							</div>
						</div>
					</div>
					<div class="rounded-lg border border-neutral-200 bg-white p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
								<svelte:component this={icons.TrendingUp} size={16} class="text-green-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{focusesWithLevels}</div>
								<div class="text-xs text-neutral-600">With levels</div>
							</div>
						</div>
					</div>
					<div class="rounded-lg border border-neutral-200 bg-white p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
								<svelte:component this={icons.Calendar} size={16} class="text-purple-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{weeklyFocuses}</div>
								<div class="text-xs text-neutral-600">Scheduled</div>
							</div>
						</div>
					</div>
					<div class="rounded-lg border border-neutral-200 bg-white p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
								<svelte:component this={icons.Link} size={16} class="text-orange-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{linkedToStats}</div>
								<div class="text-xs text-neutral-600">Linked to stats</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="flex justify-center py-16">
				<div class="flex items-center space-x-3 text-neutral-500">
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600"
					></div>
					<span class="text-sm">Loading focus areas...</span>
				</div>
			</div>
		{:else if focuses.length === 0}
			<div class="py-16 text-center">
				<div
					class="mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-12 dark:bg-neutral-800"
				>
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100"
					>
						<svelte:component this={icons.Target} size={24} class="text-neutral-400" />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-neutral-900">No focus areas yet</h3>
					<p class="mb-6 text-sm text-neutral-600">
						Create your first focus area to start organizing your growth journey
					</p>
					<div class="flex justify-center space-x-3">
						<button
							on:click={() => (showFocusLibrary = true)}
							class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:bg-neutral-800"
						>
							Browse library
						</button>
						<button
							on:click={openCreatePage}
							class="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							Create custom focus
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Weekly Schedule -->
			{#if weeklyFocuses > 0}
				<div class="mb-8 rounded-lg border border-neutral-200 bg-white p-6 dark:bg-neutral-800">
					<h2 class="mb-4 text-lg font-semibold text-neutral-900">Weekly Schedule</h2>
					<div class="grid grid-cols-7 gap-3">
						{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
							{@const dayFocus = focuses.find((focus) => focus.dayOfWeek === day)}
							<div
								class="rounded-lg border p-3 text-center transition-colors {dayFocus
									? 'border-blue-200 bg-blue-50'
									: 'border-neutral-200 bg-neutral-50'}"
							>
								<div class="mb-2 text-xs font-medium text-neutral-600">{day.slice(0, 3)}</div>
								{#if dayFocus}
									<div class="mb-2">
										<div
											class="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100"
										>
											<svelte:component
												this={getIconComponent(dayFocus.icon)}
												size={16}
												class="text-blue-600"
											/>
										</div>
									</div>
									<div class="text-xs font-medium text-neutral-900">{dayFocus.name}</div>
								{:else}
									<div class="py-6 text-xs text-neutral-400">—</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Focus Areas List -->
			<div class="space-y-4">
				{#each focuses as focus}
					<div
						class="rounded-lg border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-sm dark:bg-neutral-800"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<!-- Header -->
								<div class="mb-3 flex items-center space-x-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
										<svelte:component
											this={getIconComponent(focus.icon)}
											size={20}
											class="text-blue-600"
										/>
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">{focus.name}</h3>
										{#if focus.description}
											<p class="mt-1 text-sm text-neutral-600">{focus.description}</p>
										{/if}
									</div>
								</div>

								<!-- Metadata -->
								<div class="mb-4 flex flex-wrap gap-2">
									{#if focus.dayOfWeek}
										<span
											class="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"
										>
											<svelte:component this={icons.Calendar} size={12} class="mr-1" />
											{focus.dayOfWeek}
										</span>
									{/if}
									{#if focus.stat}
										<span
											class="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
										>
											<svelte:component
												this={getIconComponent(focus.stat.icon)}
												size={12}
												class="mr-1"
											/>
											{focus.stat.name}
										</span>
									{/if}
									{#if focus.levels && focus.levels.length > 0}
										<span
											class="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
										>
											<svelte:component this={icons.TrendingUp} size={12} class="mr-1" />
											{focus.levels.length} level{focus.levels.length !== 1 ? 's' : ''}
										</span>
									{/if}
								</div>

								<!-- Sample Activities -->
								{#if focus.sampleActivities && focus.sampleActivities.length > 0}
									<div class="mb-4">
										<p class="mb-2 text-sm font-medium text-neutral-700">Sample activities:</p>
										<div class="flex flex-wrap gap-1">
											{#each focus.sampleActivities.slice(0, 3) as activity}
												<span
													class="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
												>
													{activity}
												</span>
											{/each}
											{#if focus.sampleActivities.length > 3}
												<span
													class="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-500"
												>
													+{focus.sampleActivities.length - 3} more
												</span>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Levels -->
								{#if focus.levels && focus.levels.length > 0}
									<div class="border-t border-neutral-200 pt-4">
										<h4 class="mb-3 text-sm font-medium text-neutral-700">Levels</h4>
										<div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
											{#each focus.levels as level}
												<div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
													<h5 class="text-sm font-medium text-neutral-900">{level.name}</h5>
													{#if level.description}
														<p class="mt-1 text-xs text-neutral-600">{level.description}</p>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="border-t border-neutral-200 pt-4">
										<div class="py-3 text-center">
											<p class="mb-2 text-sm text-neutral-500">No levels created yet</p>
											<button
												on:click={() => openLevelForm(focus)}
												class="text-sm font-medium text-blue-600 hover:text-blue-700"
											>
												Add your first level
											</button>
										</div>
									</div>
								{/if}
							</div>

							<!-- Actions -->
							<div class="ml-4 flex items-center space-x-1">
								<button
									on:click={() => openLevelForm(focus)}
									class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100"
									title="Add Level"
								>
									<svelte:component this={icons.Plus} size={16} class="text-neutral-500" />
								</button>
								<button
									on:click={() => openEditPage(focus)}
									class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100"
									title="Edit Focus"
								>
									<svelte:component this={icons.Edit2} size={16} class="text-neutral-500" />
								</button>
								<button
									on:click={() => deleteFocus(focus.id)}
									class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-red-50"
									title="Delete Focus"
								>
									<svelte:component this={icons.Trash2} size={16} class="text-red-500" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Level Creation Modal - Atlassian Style -->
{#if showLevelForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-lg bg-white shadow-2xl dark:bg-neutral-800">
			<!-- Modal Header -->
			<div class="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
							<svelte:component this={icons.TrendingUp} size={16} class="text-green-600" />
						</div>
						<h3 class="text-lg font-semibold text-neutral-900">
							Add level to {selectedFocus?.name}
						</h3>
					</div>
					<button
						on:click={() => (showLevelForm = false)}
						class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-200"
					>
						<svelte:component this={icons.X} size={16} class="text-neutral-500" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="px-6 py-6">
				<form on:submit={handleLevelSubmit} class="space-y-4">
					<div>
						<label for="levelName" class="mb-2 block text-sm font-medium text-neutral-900">
							Level name <span class="text-red-500">*</span>
						</label>
						<input
							id="levelName"
							type="text"
							bind:value={levelFormData.name}
							placeholder="e.g., Beginner, Intermediate, Advanced"
							required
							class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="levelDescription" class="mb-2 block text-sm font-medium text-neutral-900">
							Description
						</label>
						<textarea
							id="levelDescription"
							bind:value={levelFormData.description}
							placeholder="Describe what this level represents..."
							rows="3"
							class="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>

					<div class="flex justify-end space-x-3 border-t border-neutral-200 pt-4">
						<button
							type="button"
							on:click={() => (showLevelForm = false)}
							class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							Add level
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Focus Library Modal - Atlassian Style -->
{#if showFocusLibrary}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		<div
			class="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div class="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
							<svelte:component this={icons.Library} size={16} class="text-purple-600" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-neutral-900">Choose from library</h3>
							<p class="text-sm text-neutral-600">Select a template to get started quickly</p>
						</div>
					</div>
					<button
						on:click={() => (showFocusLibrary = false)}
						class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-200"
					>
						<svelte:component this={icons.X} size={16} class="text-neutral-500" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="max-h-[calc(85vh-140px)] overflow-y-auto px-6 py-6">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each EXTENDED_FOCUS_LIBRARY as template}
						<button
							type="button"
							on:click={() => selectTemplate(template)}
							class="group rounded-lg border border-neutral-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50 dark:bg-neutral-800"
						>
							<div class="mb-3 flex items-center space-x-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200"
								>
									<svelte:component
										this={getIconComponent(template.icon_id)}
										size={16}
										class="text-blue-600"
									/>
								</div>
								<h4 class="font-medium text-neutral-900">{template.name}</h4>
							</div>
							<p class="mb-3 line-clamp-2 text-sm text-neutral-600">{template.description}</p>
							<div class="flex flex-wrap gap-2">
								<span
									class="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-700"
								>
									{template.suggested_day}
								</span>
								<span
									class="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs text-green-700"
								>
									{template.suggested_stat}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="flex justify-end space-x-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
				<button
					type="button"
					on:click={() => (showFocusLibrary = false)}
					class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:bg-neutral-800"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={() => {
						showFocusLibrary = false;
						openCreatePage();
					}}
					class="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
				>
					Create custom instead
				</button>
			</div>
		</div>
	</div>
{/if}
