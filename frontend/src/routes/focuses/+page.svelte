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
	<!-- Create/Edit Focus Page -->
	<div class="min-h-screen bg-gray-50">
		<div class="bg-white border-b border-gray-200">
			<div class="max-w-4xl mx-auto px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<button
							on:click={closeCreatePage}
							class="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100"
						>
							<svelte:component this={icons.ArrowLeft} size={20} />
						</button>
						<div>
							<h1 class="text-xl font-semibold text-gray-900">
								{editingFocus ? 'Edit Focus Area' : 'Create Focus Area'}
							</h1>
							{#if selectedTemplate}
								<p class="text-sm text-gray-600">Based on template: {selectedTemplate.name}</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="max-w-2xl mx-auto px-6 py-8">
			{#if error}
				<div class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
					<div class="flex">
						<svelte:component this={icons.AlertCircle} class="h-5 w-5 text-red-400" />
						<div class="ml-3">
							<p class="text-sm text-red-700">{error}</p>
						</div>
						<button
							on:click={() => error = ''}
							class="ml-auto text-red-400 hover:text-red-600"
						>
							<svelte:component this={icons.X} size={16} />
						</button>
					</div>
				</div>
			{/if}

			<form on:submit={handleSubmit} class="space-y-6">
				<!-- Basic Information -->
				<div class="bg-white rounded-md shadow-md p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
					
					<div class="space-y-4">
						<div>
							<label for="focusName" class="block text-sm font-medium text-gray-700 mb-1">
								Focus Name <span class="text-red-500">*</span>
							</label>
							<input
								id="focusName"
								type="text"
								bind:value={focusFormData.name}
								placeholder="e.g., Fitness, Learning, Parenting"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="focusDescription" class="block text-sm font-medium text-gray-700 mb-1">
								Description
							</label>
							<textarea
								id="focusDescription"
								bind:value={focusFormData.description}
								placeholder="Describe what this focus area is about..."
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							></textarea>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="focusIcon" class="block text-sm font-medium text-gray-700 mb-1">
									Icon
								</label>
								<select
									id="focusIcon"
									bind:value={focusFormData.icon}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">Select an icon...</option>
									{#each iconOptions as iconOption}
										<option value={iconOption.name}>{iconOption.label}</option>
									{/each}
								</select>
								{#if focusFormData.icon}
									<div class="mt-2 flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
										<span class="text-sm text-gray-600">Preview:</span>
										<svelte:component this={getIconComponent(focusFormData.icon)} size={16} class="text-blue-600" />
									</div>
								{/if}
							</div>

							<div>
								<label for="focusDayOfWeek" class="block text-sm font-medium text-gray-700 mb-1">
									Scheduled Day
								</label>
								<select
									id="focusDayOfWeek"
									bind:value={focusFormData.dayOfWeek}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
					</div>
				</div>

				<!-- Sample Activities -->
				<div class="bg-white rounded-md shadow-md p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Sample Activities</h2>
					
					<div class="space-y-4">
						<div class="flex space-x-2">
							<input
								type="text"
								bind:value={newActivity}
								placeholder="e.g., Go for a run, Read a book"
								on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<button
								type="button"
								on:click={addActivity}
								class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
							>
								Add
							</button>
						</div>

						{#if focusFormData.sampleActivities.length > 0}
							<div class="space-y-2">
								{#each focusFormData.sampleActivities as activity, index}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
										<span class="text-sm text-gray-700">{activity}</span>
										<button
											type="button"
											on:click={() => removeActivity(index)}
											class="text-red-500 hover:text-red-700 transition-colors"
										>
											<svelte:component this={icons.X} size={16} />
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Link to Stat -->
				<div class="bg-white rounded-md shadow-md p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Link to Stat</h2>
					
					<div>
						<label for="focusStat" class="block text-sm font-medium text-gray-700 mb-1">
							Linked Stat (Optional)
						</label>
						<select
							id="focusStat"
							bind:value={focusFormData.statId}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value={undefined}>No stat linked</option>
							{#each stats as stat}
								<option value={stat.id}>{stat.name}</option>
							{/each}
						</select>
						<p class="mt-1 text-sm text-gray-600">
							Link this focus to a stat to track progress when completing related tasks
						</p>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex justify-end space-x-3 pt-6">
					<button
						type="button"
						on:click={closeCreatePage}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
					>
						{editingFocus ? 'Update Focus' : 'Create Focus'}
					</button>
				</div>
			</form>
		</div>
	</div>
{:else}
	<!-- Main Focus Areas Page -->
	<div class="max-w-6xl mx-auto px-6 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Focus Areas</h1>
					<p class="text-gray-600 mt-1">Organize your growth areas and track progress through levels</p>
				</div>
				<div class="flex space-x-3">
					<button
						on:click={() => showFocusLibrary = true}
						class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
					>
						<svelte:component this={icons.Library} size={16} />
						<span>Browse Library</span>
					</button>
					<button
						on:click={openCreatePage}
						class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
					>
						<svelte:component this={icons.Plus} size={16} />
						<span>New Focus</span>
					</button>
				</div>
			</div>

			{#if error}
				<div class="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
					<div class="flex">
						<svelte:component this={icons.AlertCircle} class="h-5 w-5 text-red-400" />
						<div class="ml-3">
							<p class="text-sm text-red-700">{error}</p>
						</div>
						<button
							on:click={() => error = ''}
							class="ml-auto text-red-400 hover:text-red-600"
						>
							<svelte:component this={icons.X} size={16} />
						</button>
					</div>
				</div>
			{/if}

			<!-- Quick Insights -->
			{#if focuses.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="bg-white rounded-md shadow-md p-4 border-l-4 border-blue-500">
						<div class="text-2xl font-bold text-gray-900">{totalFocuses}</div>
						<div class="text-sm text-gray-600">Total Focus Areas</div>
					</div>
					<div class="bg-white rounded-md shadow-md p-4 border-l-4 border-green-500">
						<div class="text-2xl font-bold text-gray-900">{focusesWithLevels}</div>
						<div class="text-sm text-gray-600">With Levels</div>
					</div>
					<div class="bg-white rounded-md shadow-md p-4 border-l-4 border-purple-500">
						<div class="text-2xl font-bold text-gray-900">{weeklyFocuses}</div>
						<div class="text-sm text-gray-600">Scheduled Weekly</div>
					</div>
					<div class="bg-white rounded-md shadow-md p-4 border-l-4 border-orange-500">
						<div class="text-2xl font-bold text-gray-900">{linkedToStats}</div>
						<div class="text-sm text-gray-600">Linked to Stats</div>
					</div>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="flex justify-center py-12">
				<div class="flex items-center space-x-2 text-gray-500">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
					<span>Loading focus areas...</span>
				</div>
			</div>
		{:else if focuses.length === 0}
			<div class="text-center py-12">
				<div class="bg-white rounded-md shadow-md p-8">
					<svelte:component this={icons.Target} size={48} class="mx-auto text-gray-400 mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No focus areas yet</h3>
					<p class="text-gray-600 mb-6">Create your first focus area to start organizing your growth journey</p>
					<div class="flex justify-center space-x-3">
						<button
							on:click={() => showFocusLibrary = true}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							Browse Templates
						</button>
						<button
							on:click={openCreatePage}
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
						>
							Create Custom Focus
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Weekly Schedule View -->
			{#if weeklyFocuses > 0}
				<div class="bg-white rounded-md shadow-md p-6 mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Weekly Focus Schedule</h2>
					<div class="grid grid-cols-7 gap-2">
						{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
							{@const dayFocus = focuses.find(focus => focus.dayOfWeek === day)}
							<div class="text-center p-3 rounded-md transition-colors {dayFocus ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}">
								<div class="text-xs font-medium text-gray-600 mb-2">{day.slice(0, 3)}</div>
								{#if dayFocus}
									<div class="mb-2">
										<svelte:component this={getIconComponent(dayFocus.icon)} size={20} class="mx-auto text-blue-600" />
									</div>
									<div class="text-sm font-medium text-gray-900">{dayFocus.name}</div>
								{:else}
									<div class="text-gray-400 text-sm py-4">—</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Focus Areas Grid -->
			<div class="space-y-6">
				{#each focuses as focus}
					<div class="bg-white rounded-md shadow-md p-6">
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<div class="flex items-center space-x-3 mb-2">
									<div class="p-2 bg-blue-50 rounded-md">
										<svelte:component this={getIconComponent(focus.icon)} size={20} class="text-blue-600" />
									</div>
									<h3 class="text-xl font-semibold text-gray-900">{focus.name}</h3>
								</div>
								
								{#if focus.description}
									<p class="text-gray-600 mb-3">{focus.description}</p>
								{/if}

								<div class="flex flex-wrap gap-2 mb-3">
									{#if focus.dayOfWeek}
										<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
											<svelte:component this={icons.Calendar} size={12} class="mr-1" />
											{focus.dayOfWeek}
										</span>
									{/if}
									{#if focus.stat}
										<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
											<svelte:component this={getIconComponent(focus.stat.icon)} size={12} class="mr-1" />
											{focus.stat.name} (Level {focus.stat.level})
										</span>
									{/if}
								</div>

								{#if focus.sampleActivities && focus.sampleActivities.length > 0}
									<div class="mb-4">
										<p class="text-sm font-medium text-gray-700 mb-2">Sample Activities:</p>
										<div class="flex flex-wrap gap-1">
											{#each focus.sampleActivities.slice(0, 3) as activity}
												<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
													{activity}
												</span>
											{/each}
											{#if focus.sampleActivities.length > 3}
												<span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-500">
													+{focus.sampleActivities.length - 3} more
												</span>
											{/if}
										</div>
									</div>
								{/if}
							</div>

							<div class="flex items-center space-x-2 ml-4">
								<button
									on:click={() => openLevelForm(focus)}
									class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
									title="Add Level"
								>
									<svelte:component this={icons.Plus} size={16} />
								</button>
								<button
									on:click={() => openEditPage(focus)}
									class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
									title="Edit Focus"
								>
									<svelte:component this={icons.Edit2} size={16} />
								</button>
								<button
									on:click={() => deleteFocus(focus.id)}
									class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
									title="Delete Focus"
								>
									<svelte:component this={icons.Trash2} size={16} />
								</button>
							</div>
						</div>

						<!-- Levels -->
						{#if focus.levels && focus.levels.length > 0}
							<div class="border-t border-gray-200 pt-4">
								<h4 class="text-sm font-medium text-gray-700 mb-3">Levels ({focus.levels.length})</h4>
								<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
									{#each focus.levels as level}
										<div class="p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
											<h5 class="font-medium text-sm text-gray-900">{level.name}</h5>
											{#if level.description}
												<p class="text-xs text-gray-600 mt-1">{level.description}</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="border-t border-gray-200 pt-4">
								<div class="text-center py-4">
									<p class="text-sm text-gray-500 mb-2">No levels created yet</p>
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
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Level Creation Modal -->
{#if showLevelForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-md shadow-lg max-w-md w-full">
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">
					Add Level to {selectedFocus?.name}
				</h3>
				
				<form on:submit={handleLevelSubmit} class="space-y-4">
					<div>
						<label for="levelName" class="block text-sm font-medium text-gray-700 mb-1">
							Level Name <span class="text-red-500">*</span>
						</label>
						<input
							id="levelName"
							type="text"
							bind:value={levelFormData.name}
							placeholder="e.g., Beginner, Intermediate, Advanced"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					
					<div>
						<label for="levelDescription" class="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							id="levelDescription"
							bind:value={levelFormData.description}
							placeholder="Describe what this level represents..."
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						></textarea>
					</div>
					
					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={() => showLevelForm = false}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
						>
							Add Level
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Focus Library Modal -->
{#if showFocusLibrary}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-md shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
			<div class="p-6 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">Choose a Focus from Library</h3>
				<p class="text-gray-600 mt-1">Select a suggested focus area to get started, or create a custom one.</p>
			</div>
			
			<div class="p-6 overflow-y-auto max-h-96">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each EXTENDED_FOCUS_LIBRARY as template}
						<button
							type="button"
							on:click={() => selectTemplate(template)}
							class="text-left p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md transition-colors"
						>
							<div class="flex items-center space-x-3 mb-3">
								<div class="p-2 bg-blue-100 rounded-md">
									<svelte:component this={getIconComponent(template.icon_id)} size={16} class="text-blue-600" />
								</div>
								<h4 class="font-medium text-gray-900">{template.name}</h4>
							</div>
							<p class="text-sm text-gray-600 mb-3">{template.description}</p>
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
			
			<div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
				<button
					type="button"
					on:click={() => showFocusLibrary = false}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={() => { showFocusLibrary = false; openCreatePage(); }}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
				>
					Create Custom Instead
				</button>
			</div>
		</div>
	</div>
{/if}
