<script lang="ts">
	import { onMount } from 'svelte';
	import { focusesApi, statsApi } from '$lib/api';
	import { EXTENDED_FOCUS_LIBRARY, type FocusTemplate } from '$lib/focusLibrary';
	import * as icons from 'lucide-svelte';
	import IconPicker from '$lib/components/IconPicker.svelte';

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
			class="bg-base-100 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div class="border-base-300 bg-base-200 border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
							<svelte:component this={icons.Target} size={16} class="text-info" />
						</div>
						<h2 class="text-base-content text-lg font-semibold">
							{editingFocus ? 'Edit focus area' : 'Create focus area'}
						</h2>
					</div>
					<button
						on:click={closeCreatePage}
						class="hover:bg-base-300 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-base-content/60" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="max-h-[calc(85vh-140px)] overflow-y-auto px-6 py-6">
				{#if error}
					<div class="border-error/20 bg-error/10 mb-6 rounded-lg border p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.AlertTriangle}
								size={16}
								class="mt-0.5 flex-shrink-0 text-red-500"
							/>
							<div class="flex-1">
								<p class="text-sm font-medium text-red-900">Error</p>
								<p class="text-error mt-1 text-sm">{error}</p>
							</div>
							<button
								on:click={() => (error = '')}
								class="hover:text-error text-red-400 transition-colors"
							>
								<svelte:component this={icons.X} size={14} />
							</button>
						</div>
					</div>
				{/if}

				{#if selectedTemplate}
					<div class="border-primary/20 bg-primary/5 mb-6 rounded-lg border p-4">
						<div class="flex items-start space-x-3">
							<svelte:component
								this={icons.BookOpen}
								size={16}
								class="text-info mt-0.5 flex-shrink-0"
							/>
							<div>
								<p class="text-sm font-medium text-blue-900">
									Using template: {selectedTemplate.name}
								</p>
								<p class="text-primary mt-1 text-xs">
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
							<label for="focusName" class="text-base-content mb-2 block text-sm font-medium">
								Name <span class="text-red-500">*</span>
							</label>
							<input
								id="focusName"
								type="text"
								bind:value={focusFormData.name}
								placeholder="e.g., Fitness, Learning, Creative Projects"
								required
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<div>
							<label
								for="focusDescription"
								class="text-base-content mb-2 block text-sm font-medium"
							>
								Description
							</label>
							<textarea
								id="focusDescription"
								bind:value={focusFormData.description}
								placeholder="What is this focus area about? What goals or activities does it include?"
								rows="3"
								class="border-base-300 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							></textarea>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label for="focusIcon" class="text-base-content mb-2 block text-sm font-medium">
									Icon
								</label>
								<IconPicker
									bind:selectedIcon={focusFormData.icon}
									availableIcons={iconOptions}
									showPreview={false}
								/>
							</div>

							<div>
								<label
									for="focusDayOfWeek"
									class="text-base-content mb-2 block text-sm font-medium"
								>
									Scheduled day
								</label>
								<select
									id="focusDayOfWeek"
									bind:value={focusFormData.dayOfWeek}
									class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
							<div class="bg-base-200 flex items-center space-x-3 rounded-lg p-3">
								<span class="text-base-content/80 text-sm font-medium">Preview:</span>
								<div class="bg-primary/10 flex h-6 w-6 items-center justify-center rounded">
									<svelte:component
										this={getIconComponent(focusFormData.icon)}
										size={14}
										class="text-info"
									/>
								</div>
								<span class="text-base-content/70 text-sm"
									>{iconOptions.find((opt) => opt.name === focusFormData.icon)?.label}</span
								>
							</div>
						{/if}
					</div>

					<!-- Sample Activities -->
					<div class="space-y-4">
						<div>
							<h3 class="text-base-content mb-2 text-sm font-medium">Sample Activities</h3>
							<p class="text-base-content/70 mb-3 text-xs">
								Add examples of activities that fit this focus area
							</p>
						</div>

						<div class="flex space-x-2">
							<input
								type="text"
								bind:value={newActivity}
								placeholder="e.g., Morning jog, Read 30 pages, Practice guitar"
								on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
								class="border-base-300 flex-1 rounded-lg border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
							<button
								type="button"
								on:click={addActivity}
								disabled={!newActivity.trim()}
								class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								Add
							</button>
						</div>

						{#if focusFormData.sampleActivities.length > 0}
							<div class="max-h-32 space-y-2 overflow-y-auto">
								{#each focusFormData.sampleActivities as activity, index}
									<div
										class="border-base-300 bg-base-200 flex items-center justify-between rounded-lg border p-3"
									>
										<span class="text-base-content text-sm">{activity}</span>
										<button
											type="button"
											on:click={() => removeActivity(index)}
											class="text-base-content/50 hover:text-error p-1 transition-colors focus:outline-none"
										>
											<svelte:component this={icons.X} size={14} />
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<div
								class="border-base-300 text-base-content/60 rounded-lg border border-dashed py-6 text-center"
							>
								<svelte:component this={icons.Plus} size={20} class="mx-auto mb-2 opacity-50" />
								<p class="text-sm">No activities added yet</p>
							</div>
						{/if}
					</div>

					<!-- Link to Stat -->
					<div class="space-y-4">
						<div>
							<h3 class="text-base-content mb-2 text-sm font-medium">Link to Stat</h3>
							<p class="text-base-content/70 mb-3 text-xs">
								Connect this focus to a character stat for automatic progress tracking
							</p>
						</div>

						<div>
							<label for="focusStat" class="text-base-content/80 mb-2 block text-sm font-medium">
								Linked stat
							</label>
							<select
								id="focusStat"
								bind:value={focusFormData.statId}
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							>
								<option value={undefined}>No stat linked</option>
								{#each stats as stat}
									<option value={stat.id}>{stat.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Actions -->
					<div class="border-base-300 flex justify-end space-x-3 border-t pt-4">
						<button
							type="button"
							on:click={closeCreatePage}
							class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
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
					<h1 class="text-base-content text-2xl font-bold">Focus Areas</h1>
					<p class="text-base-content/70 mt-1">
						Organize your growth areas and track progress through levels
					</p>
				</div>
				<div class="flex items-center space-x-3">
					<button
						on:click={() => (showFocusLibrary = true)}
						class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
					>
						<svelte:component this={icons.Library} size={16} class="mr-2" />
						Browse library
					</button>
					<button
						on:click={openCreatePage}
						class="bg-primary text-primary-content hover:bg-primary/90 inline-flex items-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors"
					>
						<svelte:component this={icons.Plus} size={16} class="mr-2" />
						Create focus
					</button>
				</div>
			</div>

			{#if error}
				<div class="border-error/20 bg-error/10 mb-6 rounded-lg border p-4">
					<div class="flex items-start space-x-3">
						<svelte:component
							this={icons.AlertTriangle}
							size={16}
							class="mt-0.5 flex-shrink-0 text-red-500"
						/>
						<div class="flex-1">
							<p class="text-sm font-medium text-red-900">Error</p>
							<p class="text-error mt-1 text-sm">{error}</p>
						</div>
						<button
							on:click={() => (error = '')}
							class="hover:text-error text-red-400 transition-colors"
						>
							<svelte:component this={icons.X} size={14} />
						</button>
					</div>
				</div>
			{/if}

			<!-- Quick Stats -->
			{#if focuses.length > 0}
				<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Target} size={16} class="text-info" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{totalFocuses}</div>
								<div class="text-base-content/70 text-xs">Total focuses</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.TrendingUp} size={16} class="text-success" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{focusesWithLevels}</div>
								<div class="text-base-content/70 text-xs">With levels</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Calendar} size={16} class="text-secondary" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{weeklyFocuses}</div>
								<div class="text-base-content/70 text-xs">Scheduled</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
								<svelte:component this={icons.Link} size={16} class="text-orange-600" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{linkedToStats}</div>
								<div class="text-base-content/70 text-xs">Linked to stats</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="flex justify-center py-16">
				<div class="text-base-content/60 flex items-center space-x-3">
					<div
						class="border-base-300 h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600"
					></div>
					<span class="text-sm">Loading focus areas...</span>
				</div>
			</div>
		{:else if focuses.length === 0}
			<div class="py-16 text-center">
				<div
					class="border-base-300 bg-base-100 mx-auto max-w-md rounded-lg border p-12 dark:bg-neutral-800"
				>
					<div
						class="bg-base-200 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
					>
						<svelte:component this={icons.Target} size={24} class="text-base-content/50" />
					</div>
					<h3 class="text-base-content mb-2 text-lg font-semibold">No focus areas yet</h3>
					<p class="text-base-content/70 mb-6 text-sm">
						Create your first focus area to start organizing your growth journey
					</p>
					<div class="flex justify-center space-x-3">
						<button
							on:click={() => (showFocusLibrary = true)}
							class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
						>
							Browse library
						</button>
						<button
							on:click={openCreatePage}
							class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
						>
							Create custom focus
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Weekly Schedule -->
			{#if weeklyFocuses > 0}
				<div class="border-base-300 bg-base-100 mb-8 rounded-lg border p-6 dark:bg-neutral-800">
					<h2 class="text-base-content mb-4 text-lg font-semibold">Weekly Schedule</h2>
					<div class="grid grid-cols-7 gap-3">
						{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
							{@const dayFocus = focuses.find((focus) => focus.dayOfWeek === day)}
							<div
								class="rounded-lg border p-3 text-center transition-colors {dayFocus
									? 'border-primary/20 bg-primary/5'
									: 'border-base-300 bg-base-200'}"
							>
								<div class="text-base-content/70 mb-2 text-xs font-medium">{day.slice(0, 3)}</div>
								{#if dayFocus}
									<div class="mb-2">
										<div
											class="bg-primary/10 mx-auto flex h-8 w-8 items-center justify-center rounded-lg"
										>
											<svelte:component
												this={getIconComponent(dayFocus.icon)}
												size={16}
												class="text-info"
											/>
										</div>
									</div>
									<div class="text-base-content text-xs font-medium">{dayFocus.name}</div>
								{:else}
									<div class="text-base-content/50 py-6 text-xs">—</div>
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
						class="border-base-300 bg-base-100 rounded-lg border p-6 transition-shadow hover:shadow-sm dark:bg-neutral-800"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<!-- Header -->
								<div class="mb-3 flex items-center space-x-3">
									<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
										<svelte:component
											this={getIconComponent(focus.icon)}
											size={20}
											class="text-info"
										/>
									</div>
									<div>
										<h3 class="text-base-content text-lg font-semibold">{focus.name}</h3>
										{#if focus.description}
											<p class="text-base-content/70 mt-1 text-sm">{focus.description}</p>
										{/if}
									</div>
								</div>

								<!-- Metadata -->
								<div class="mb-4 flex flex-wrap gap-2">
									{#if focus.dayOfWeek}
										<span
											class="bg-info/20 text-info inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
										>
											<svelte:component this={icons.Calendar} size={12} class="mr-1" />
											{focus.dayOfWeek}
										</span>
									{/if}
									{#if focus.stat}
										<span
											class="bg-success/20 text-success inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
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
											class="bg-primary/20 text-primary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
										>
											<svelte:component this={icons.TrendingUp} size={12} class="mr-1" />
											{focus.levels.length} level{focus.levels.length !== 1 ? 's' : ''}
										</span>
									{/if}
								</div>

								<!-- Sample Activities -->
								{#if focus.sampleActivities && focus.sampleActivities.length > 0}
									<div class="mb-4">
										<p class="text-base-content/80 mb-2 text-sm font-medium">Sample activities:</p>
										<div class="flex flex-wrap gap-1">
											{#each focus.sampleActivities.slice(0, 3) as activity}
												<span
													class="bg-base-200 text-base-content/80 inline-flex items-center rounded-md px-2 py-1 text-xs"
												>
													{activity}
												</span>
											{/each}
											{#if focus.sampleActivities.length > 3}
												<span
													class="bg-base-200 text-base-content/60 inline-flex items-center rounded-md px-2 py-1 text-xs"
												>
													+{focus.sampleActivities.length - 3} more
												</span>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Levels -->
								{#if focus.levels && focus.levels.length > 0}
									<div class="border-base-300 border-t pt-4">
										<h4 class="text-base-content/80 mb-3 text-sm font-medium">Levels</h4>
										<div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
											{#each focus.levels as level}
												<div class="border-base-300 bg-base-200 rounded-lg border p-3">
													<h5 class="text-base-content text-sm font-medium">{level.name}</h5>
													{#if level.description}
														<p class="text-base-content/70 mt-1 text-xs">{level.description}</p>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="border-base-300 border-t pt-4">
										<div class="py-3 text-center">
											<p class="text-base-content/60 mb-2 text-sm">No levels created yet</p>
											<button
												on:click={() => openLevelForm(focus)}
												class="text-info hover:text-primary text-sm font-medium"
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
									class="hover:bg-base-200 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
									title="Add Level"
								>
									<svelte:component this={icons.Plus} size={16} class="text-base-content/60" />
								</button>
								<button
									on:click={() => openEditPage(focus)}
									class="hover:bg-base-200 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
									title="Edit Focus"
								>
									<svelte:component this={icons.Edit2} size={16} class="text-base-content/60" />
								</button>
								<button
									on:click={() => deleteFocus(focus.id)}
									class="hover:bg-error/10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
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
		<div class="bg-base-100 w-full max-w-md rounded-lg shadow-2xl dark:bg-neutral-800">
			<!-- Modal Header -->
			<div class="border-base-300 bg-base-200 border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
							<svelte:component this={icons.TrendingUp} size={16} class="text-success" />
						</div>
						<h3 class="text-base-content text-lg font-semibold">
							Add level to {selectedFocus?.name}
						</h3>
					</div>
					<button
						on:click={() => (showLevelForm = false)}
						class="hover:bg-base-300 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-base-content/60" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="px-6 py-6">
				<form on:submit={handleLevelSubmit} class="space-y-4">
					<div>
						<label for="levelName" class="text-base-content mb-2 block text-sm font-medium">
							Level name <span class="text-red-500">*</span>
						</label>
						<input
							id="levelName"
							type="text"
							bind:value={levelFormData.name}
							placeholder="e.g., Beginner, Intermediate, Advanced"
							required
							class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="levelDescription" class="text-base-content mb-2 block text-sm font-medium">
							Description
						</label>
						<textarea
							id="levelDescription"
							bind:value={levelFormData.description}
							placeholder="Describe what this level represents..."
							rows="3"
							class="border-base-300 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>

					<div class="border-base-300 flex justify-end space-x-3 border-t pt-4">
						<button
							type="button"
							on:click={() => (showLevelForm = false)}
							class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
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
			class="bg-base-100 max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg shadow-2xl dark:bg-neutral-800"
		>
			<!-- Modal Header -->
			<div class="border-base-300 bg-base-200 border-b px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg">
							<svelte:component this={icons.Library} size={16} class="text-secondary" />
						</div>
						<div>
							<h3 class="text-base-content text-lg font-semibold">Choose from library</h3>
							<p class="text-base-content/70 text-sm">Select a template to get started quickly</p>
						</div>
					</div>
					<button
						on:click={() => (showFocusLibrary = false)}
						class="hover:bg-base-300 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-base-content/60" />
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
							class="group border-base-300 bg-base-100 hover:border-primary/30 hover:bg-primary/5 rounded-lg border p-4 text-left transition-all dark:bg-neutral-800"
						>
							<div class="mb-3 flex items-center space-x-3">
								<div
									class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-hover:bg-blue-200"
								>
									<svelte:component
										this={getIconComponent(template.icon_id)}
										size={16}
										class="text-info"
									/>
								</div>
								<h4 class="text-base-content font-medium">{template.name}</h4>
							</div>
							<p class="text-base-content/70 mb-3 line-clamp-2 text-sm">{template.description}</p>
							<div class="flex flex-wrap gap-2">
								<span
									class="bg-secondary/10 text-secondary inline-flex items-center rounded-md px-2 py-1 text-xs"
								>
									{template.suggested_day}
								</span>
								<span
									class="bg-success/10 text-success inline-flex items-center rounded-md px-2 py-1 text-xs"
								>
									{template.suggested_stat}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="border-base-300 bg-base-200 flex justify-end space-x-3 border-t px-6 py-4">
				<button
					type="button"
					on:click={() => (showFocusLibrary = false)}
					class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={() => {
						showFocusLibrary = false;
						openCreatePage();
					}}
					class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
				>
					Create custom instead
				</button>
			</div>
		</div>
	</div>
{/if}
