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
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
		if (confirm('Are you sure you want to delete this focus? This will also delete all associated levels.')) {
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
		const matchingStat = stats?.find(stat => stat.name === template.suggested_stat);
		
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
	$: focusesWithLevels = focuses.filter(f => f.levels && f.levels.length > 0).length;
	$: weeklyFocuses = focuses.filter(f => f.dayOfWeek).length;
	$: linkedToStats = focuses.filter(f => f.statId).length;

</script>

<svelte:head>
	<title>Focus Areas - LifeQuest</title>
</svelte:head>

{#if showCreatePage}
	<!-- Create/Edit Focus Modal - Atlassian Style -->
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto pt-12">
		<div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
			<!-- Modal Header -->
			<div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
							<svelte:component this={icons.Target} size={16} class="text-blue-600" />
						</div>
						<h2 class="text-lg font-semibold text-neutral-900">
							{editingFocus ? 'Edit focus area' : 'Create focus area'}
						</h2>
					</div>
					<button
						on:click={closeCreatePage}
						class="w-8 h-8 rounded-lg hover:bg-neutral-200 flex items-center justify-center transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-neutral-500" />
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="px-6 py-6 overflow-y-auto max-h-[calc(85vh-140px)]">
				{#if error}
					<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<div class="flex items-start space-x-3">
							<svelte:component this={icons.AlertTriangle} size={16} class="text-red-500 mt-0.5 flex-shrink-0" />
							<div class="flex-1">
								<p class="text-sm font-medium text-red-900">Error</p>
								<p class="text-sm text-red-700 mt-1">{error}</p>
							</div>
							<button
								on:click={() => error = ''}
								class="text-red-400 hover:text-red-600 transition-colors"
							>
								<svelte:component this={icons.X} size={14} />
							</button>
						</div>
					</div>
				{/if}

				{#if selectedTemplate}
					<div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-start space-x-3">
							<svelte:component this={icons.BookOpen} size={16} class="text-blue-600 mt-0.5 flex-shrink-0" />
							<div>
								<p class="text-sm font-medium text-blue-900">Using template: {selectedTemplate.name}</p>
								<p class="text-xs text-blue-700 mt-1">You can modify any of these fields before creating</p>
							</div>
						</div>
					</div>
				{/if}

				<form on:submit={handleSubmit} class="space-y-6">
					<!-- Basic Details -->
					<div class="space-y-4">
						<div>
							<label for="focusName" class="block text-sm font-medium text-neutral-900 mb-2">
								Name <span class="text-red-500">*</span>
							</label>
							<input
								id="focusName"
								type="text"
								bind:value={focusFormData.name}
								placeholder="e.g., Fitness, Learning, Creative Projects"
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
							/>
						</div>

						<div>
							<label for="focusDescription" class="block text-sm font-medium text-neutral-900 mb-2">
								Description
							</label>
							<textarea
								id="focusDescription"
								bind:value={focusFormData.description}
								placeholder="What is this focus area about? What goals or activities does it include?"
								rows="3"
								class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
							></textarea>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="focusIcon" class="block text-sm font-medium text-neutral-900 mb-2">
									Icon
								</label>
								<select
									id="focusIcon"
									bind:value={focusFormData.icon}
									class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
								>
									<option value="">Choose an icon...</option>
									{#each iconOptions as iconOption}
										<option value={iconOption.name}>{iconOption.label}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="focusDayOfWeek" class="block text-sm font-medium text-neutral-900 mb-2">
									Scheduled day
								</label>
								<select
									id="focusDayOfWeek"
									bind:value={focusFormData.dayOfWeek}
									class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
							<div class="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
								<span class="text-sm font-medium text-neutral-700">Preview:</span>
								<div class="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
									<svelte:component this={getIconComponent(focusFormData.icon)} size={14} class="text-blue-600" />
								</div>
								<span class="text-sm text-neutral-600">{iconOptions.find(opt => opt.name === focusFormData.icon)?.label}</span>
							</div>
						{/if}
					</div>

					<!-- Sample Activities -->
					<div class="space-y-4">
						<div>
							<h3 class="text-sm font-medium text-neutral-900 mb-2">Sample Activities</h3>
							<p class="text-xs text-neutral-600 mb-3">Add examples of activities that fit this focus area</p>
						</div>
						
						<div class="flex space-x-2">
							<input
								type="text"
								bind:value={newActivity}
								placeholder="e.g., Morning jog, Read 30 pages, Practice guitar"
								on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
								class="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
							/>
							<button
								type="button"
								on:click={addActivity}
								disabled={!newActivity.trim()}
								class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Add
							</button>
						</div>

						{#if focusFormData.sampleActivities.length > 0}
							<div class="space-y-2 max-h-32 overflow-y-auto">
								{#each focusFormData.sampleActivities as activity, index}
									<div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
										<span class="text-sm text-neutral-900">{activity}</span>
										<button
											type="button"
											on:click={() => removeActivity(index)}
											class="text-neutral-400 hover:text-red-600 focus:outline-none transition-colors p-1"
										>
											<svelte:component this={icons.X} size={14} />
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-6 text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
								<svelte:component this={icons.Plus} size={20} class="mx-auto mb-2 opacity-50" />
								<p class="text-sm">No activities added yet</p>
							</div>
						{/if}
					</div>

					<!-- Link to Stat -->
					<div class="space-y-4">
						<div>
							<h3 class="text-sm font-medium text-neutral-900 mb-2">Link to Stat</h3>
							<p class="text-xs text-neutral-600 mb-3">Connect this focus to a character stat for automatic progress tracking</p>
						</div>
						
						<div>
							<label for="focusStat" class="block text-sm font-medium text-neutral-700 mb-2">
								Linked stat
							</label>
							<select
								id="focusStat"
								bind:value={focusFormData.statId}
								class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
							>
								<option value={undefined}>No stat linked</option>
								{#each stats as stat}
									<option value={stat.id}>{stat.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
						<button
							type="button"
							on:click={closeCreatePage}
							class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
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
	<div class="max-w-7xl mx-auto px-6 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Focus Areas</h1>
					<p class="text-neutral-600 mt-1">Organize your growth areas and track progress through levels</p>
				</div>
				<div class="flex items-center space-x-3">
					<button
						on:click={() => showFocusLibrary = true}
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
					>
						<svelte:component this={icons.Library} size={16} class="mr-2" />
						Browse library
					</button>
					<button
						on:click={openCreatePage}
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
					>
						<svelte:component this={icons.Plus} size={16} class="mr-2" />
						Create focus
					</button>
				</div>
			</div>

			{#if error}
				<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="flex items-start space-x-3">
						<svelte:component this={icons.AlertTriangle} size={16} class="text-red-500 mt-0.5 flex-shrink-0" />
						<div class="flex-1">
							<p class="text-sm font-medium text-red-900">Error</p>
							<p class="text-sm text-red-700 mt-1">{error}</p>
						</div>
						<button
							on:click={() => error = ''}
							class="text-red-400 hover:text-red-600 transition-colors"
						>
							<svelte:component this={icons.X} size={14} />
						</button>
					</div>
				</div>
			{/if}

			<!-- Quick Stats -->
			{#if focuses.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.Target} size={16} class="text-blue-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{totalFocuses}</div>
								<div class="text-xs text-neutral-600">Total focuses</div>
							</div>
						</div>
					</div>
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.TrendingUp} size={16} class="text-green-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{focusesWithLevels}</div>
								<div class="text-xs text-neutral-600">With levels</div>
							</div>
						</div>
					</div>
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.Calendar} size={16} class="text-purple-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{weeklyFocuses}</div>
								<div class="text-xs text-neutral-600">Scheduled</div>
							</div>
						</div>
					</div>
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
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
					<div class="animate-spin rounded-full h-5 w-5 border-2 border-neutral-300 border-t-blue-600"></div>
					<span class="text-sm">Loading focus areas...</span>
				</div>
			</div>
		{:else if focuses.length === 0}
			<div class="text-center py-16">
				<div class="bg-white border border-neutral-200 rounded-lg p-12 max-w-md mx-auto">
					<div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svelte:component this={icons.Target} size={24} class="text-neutral-400" />
					</div>
					<h3 class="text-lg font-semibold text-neutral-900 mb-2">No focus areas yet</h3>
					<p class="text-neutral-600 mb-6 text-sm">Create your first focus area to start organizing your growth journey</p>
					<div class="flex justify-center space-x-3">
						<button
							on:click={() => showFocusLibrary = true}
							class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
						>
							Browse library
						</button>
						<button
							on:click={openCreatePage}
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
						>
							Create custom focus
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Weekly Schedule -->
			{#if weeklyFocuses > 0}
				<div class="bg-white border border-neutral-200 rounded-lg p-6 mb-8">
					<h2 class="text-lg font-semibold text-neutral-900 mb-4">Weekly Schedule</h2>
					<div class="grid grid-cols-7 gap-3">
						{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
							{@const dayFocus = focuses.find(focus => focus.dayOfWeek === day)}
							<div class="text-center p-3 rounded-lg border transition-colors {dayFocus ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'}">
								<div class="text-xs font-medium text-neutral-600 mb-2">{day.slice(0, 3)}</div>
								{#if dayFocus}
									<div class="mb-2">
										<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
											<svelte:component this={getIconComponent(dayFocus.icon)} size={16} class="text-blue-600" />
										</div>
									</div>
									<div class="text-xs font-medium text-neutral-900">{dayFocus.name}</div>
								{:else}
									<div class="text-neutral-400 text-xs py-6">—</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Focus Areas List -->
			<div class="space-y-4">
				{#each focuses as focus}
					<div class="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<!-- Header -->
								<div class="flex items-center space-x-3 mb-3">
									<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
										<svelte:component this={getIconComponent(focus.icon)} size={20} class="text-blue-600" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">{focus.name}</h3>
										{#if focus.description}
											<p class="text-sm text-neutral-600 mt-1">{focus.description}</p>
										{/if}
									</div>
								</div>

								<!-- Metadata -->
								<div class="flex flex-wrap gap-2 mb-4">
									{#if focus.dayOfWeek}
										<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
											<svelte:component this={icons.Calendar} size={12} class="mr-1" />
											{focus.dayOfWeek}
										</span>
									{/if}
									{#if focus.stat}
										<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
											<svelte:component this={getIconComponent(focus.stat.icon)} size={12} class="mr-1" />
											{focus.stat.name}
										</span>
									{/if}
									{#if focus.levels && focus.levels.length > 0}
										<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
											<svelte:component this={icons.TrendingUp} size={12} class="mr-1" />
											{focus.levels.length} level{focus.levels.length !== 1 ? 's' : ''}
										</span>
									{/if}
								</div>

								<!-- Sample Activities -->
								{#if focus.sampleActivities && focus.sampleActivities.length > 0}
									<div class="mb-4">
										<p class="text-sm font-medium text-neutral-700 mb-2">Sample activities:</p>
										<div class="flex flex-wrap gap-1">
											{#each focus.sampleActivities.slice(0, 3) as activity}
												<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-neutral-100 text-neutral-700">
													{activity}
												</span>
											{/each}
											{#if focus.sampleActivities.length > 3}
												<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-neutral-100 text-neutral-500">
													+{focus.sampleActivities.length - 3} more
												</span>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Levels -->
								{#if focus.levels && focus.levels.length > 0}
									<div class="border-t border-neutral-200 pt-4">
										<h4 class="text-sm font-medium text-neutral-700 mb-3">Levels</h4>
										<div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
											{#each focus.levels as level}
												<div class="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
													<h5 class="font-medium text-sm text-neutral-900">{level.name}</h5>
													{#if level.description}
														<p class="text-xs text-neutral-600 mt-1">{level.description}</p>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="border-t border-neutral-200 pt-4">
										<div class="text-center py-3">
											<p class="text-sm text-neutral-500 mb-2">No levels created yet</p>
											<button
												on:click={() => openLevelForm(focus)}
												class="text-sm text-blue-600 hover:text-blue-700 font-medium"
											>
												Add your first level
											</button>
										</div>
									</div>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex items-center space-x-1 ml-4">
								<button
									on:click={() => openLevelForm(focus)}
									class="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
									title="Add Level"
								>
									<svelte:component this={icons.Plus} size={16} class="text-neutral-500" />
								</button>
								<button
									on:click={() => openEditPage(focus)}
									class="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
									title="Edit Focus"
								>
									<svelte:component this={icons.Edit2} size={16} class="text-neutral-500" />
								</button>
								<button
									on:click={() => deleteFocus(focus.id)}
									class="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
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
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-2xl max-w-md w-full">
			<!-- Modal Header -->
			<div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
							<svelte:component this={icons.TrendingUp} size={16} class="text-green-600" />
						</div>
						<h3 class="text-lg font-semibold text-neutral-900">
							Add level to {selectedFocus?.name}
						</h3>
					</div>
					<button
						on:click={() => showLevelForm = false}
						class="w-8 h-8 rounded-lg hover:bg-neutral-200 flex items-center justify-center transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-neutral-500" />
					</button>
				</div>
			</div>
			
			<!-- Modal Body -->
			<div class="px-6 py-6">
				<form on:submit={handleLevelSubmit} class="space-y-4">
					<div>
						<label for="levelName" class="block text-sm font-medium text-neutral-900 mb-2">
							Level name <span class="text-red-500">*</span>
						</label>
						<input
							id="levelName"
							type="text"
							bind:value={levelFormData.name}
							placeholder="e.g., Beginner, Intermediate, Advanced"
							required
							class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						/>
					</div>
					
					<div>
						<label for="levelDescription" class="block text-sm font-medium text-neutral-900 mb-2">
							Description
						</label>
						<textarea
							id="levelDescription"
							bind:value={levelFormData.description}
							placeholder="Describe what this level represents..."
							rows="3"
							class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
						></textarea>
					</div>
					
					<div class="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
						<button
							type="button"
							on:click={() => showLevelForm = false}
							class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
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
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
			<!-- Modal Header -->
			<div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
							<svelte:component this={icons.Library} size={16} class="text-purple-600" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-neutral-900">Choose from library</h3>
							<p class="text-sm text-neutral-600">Select a template to get started quickly</p>
						</div>
					</div>
					<button
						on:click={() => showFocusLibrary = false}
						class="w-8 h-8 rounded-lg hover:bg-neutral-200 flex items-center justify-center transition-colors"
					>
						<svelte:component this={icons.X} size={16} class="text-neutral-500" />
					</button>
				</div>
			</div>
			
			<!-- Modal Body -->
			<div class="px-6 py-6 overflow-y-auto max-h-[calc(85vh-140px)]">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each EXTENDED_FOCUS_LIBRARY as template}
						<button
							type="button"
							on:click={() => selectTemplate(template)}
							class="text-left p-4 bg-white border border-neutral-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all group"
						>
							<div class="flex items-center space-x-3 mb-3">
								<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
									<svelte:component this={getIconComponent(template.icon_id)} size={16} class="text-blue-600" />
								</div>
								<h4 class="font-medium text-neutral-900">{template.name}</h4>
							</div>
							<p class="text-sm text-neutral-600 mb-3 line-clamp-2">{template.description}</p>
							<div class="flex flex-wrap gap-2">
								<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700">
									{template.suggested_day}
								</span>
								<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-700">
									{template.suggested_stat}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Modal Footer -->
			<div class="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end space-x-3">
				<button
					type="button"
					on:click={() => showFocusLibrary = false}
					class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={() => { showFocusLibrary = false; openCreatePage(); }}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
				>
					Create custom instead
				</button>
			</div>
		</div>
	</div>
{/if}
