<script lang="ts">
	import { onMount } from 'svelte';
	import { focusesApi, statsApi } from '$lib/api';
	
	let focuses: any[] = [];
	let stats: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let showLevelForm = false;
	let editingFocus: any = null;
	let selectedFocus: any = null;
	
	// Form data
	let focusFormData = {
		name: '',
		description: '',
		emoji: '',
		color: '',
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
		await loadFocuses();
		await loadStats();
	});

	async function loadStats() {
		try {
			const response = await statsApi.getAll();
			stats = response.stats;
		} catch (error) {
			console.error('Failed to load stats:', error);
		}
	}
	
	async function loadFocuses() {
		try {
			loading = true;
			const response = await focusesApi.getAll();
			focuses = response.focuses;
		} catch (error) {
			console.error('Failed to load focuses:', error);
		} finally {
			loading = false;
		}
	}
	
	function openCreateForm() {
		focusFormData = {
			name: '',
			description: '',
			emoji: '',
			color: '',
			dayOfWeek: '',
			sampleActivities: [],
			statId: undefined,
			gptContext: undefined
		};
		editingFocus = null;
		showCreateForm = true;
	}
	
	function openEditForm(focus: any) {
		focusFormData = {
			name: focus.name,
			description: focus.description || '',
			emoji: focus.emoji || '',
			color: focus.color || '',
			dayOfWeek: focus.dayOfWeek || '',
			sampleActivities: focus.sampleActivities || [],
			statId: focus.statId || undefined,
			gptContext: focus.gptContext
		};
		editingFocus = focus;
		showCreateForm = true;
	}
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			if (editingFocus) {
				await focusesApi.update(editingFocus.id, focusFormData);
			} else {
				await focusesApi.create(focusFormData);
			}
			
			showCreateForm = false;
			await loadFocuses();
		} catch (error) {
			console.error('Failed to save focus:', error);
		}
	}
	
	async function deleteFocus(focusId: string) {
		if (confirm('Are you sure you want to delete this focus? This will also delete all associated levels.')) {
			try {
				await focusesApi.delete(focusId);
				await loadFocuses();
			} catch (error) {
				console.error('Failed to delete focus:', error);
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
		} catch (error) {
			console.error('Failed to create level:', error);
		}
	}
	
	async function restoreDefaults() {
		if (!confirm('This will add any missing default weekly focuses to your collection. Are you sure?')) {
			return;
		}
		
		try {
			const result = await focusesApi.restoreDefaults();
			await loadFocuses();
			alert(`Successfully restored ${result.createdCount} default focuses!`);
		} catch (error: any) {
			console.error('Failed to restore defaults:', error);
			alert('Failed to restore default focuses: ' + error.message);
		}
	}
</script>

<svelte:head>
	<title>Focus Areas - Life Quest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Focus Areas</h1>
			<p class="text-base-content/70">Manage your growth areas and their levels</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline" onclick={restoreDefaults}>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Restore Defaults
			</button>
			<button class="btn btn-primary" onclick={openCreateForm}>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New Focus Area
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<!-- Weekly Focus View -->
		{#if focuses.some(focus => focus.dayOfWeek)}
			<div class="card bg-base-100 shadow-sm mb-6">
				<div class="card-body">
					<h2 class="card-title mb-4">📅 Weekly Focus Schedule</h2>
					<div class="grid grid-cols-7 gap-2">
						{#each ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as day}
							{@const dayFocus = focuses.find(focus => focus.dayOfWeek === day)}
							<div class="text-center p-3 rounded-lg {dayFocus ? 'bg-primary/10 border border-primary/20' : 'bg-base-200/50'}">
								<div class="text-xs font-medium text-base-content/60 mb-1">{day.slice(0, 3)}</div>
								{#if dayFocus}
									<div class="text-lg mb-1">{dayFocus.emoji || '📍'}</div>
									<div class="text-sm font-medium" style={dayFocus.color ? `color: ${dayFocus.color}` : ''}>{dayFocus.name}</div>
								{:else}
									<div class="text-base-content/30 text-sm">No focus</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
		
		<div class="grid gap-6">
			{#each focuses as focus}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									{#if focus.emoji}
										<span class="text-2xl">{focus.emoji}</span>
									{/if}
									<h3 class="card-title text-xl" style={focus.color ? `color: ${focus.color}` : ''}>{focus.name}</h3>
								</div>
								{#if focus.description}
									<p class="text-base-content/70 mt-2">{focus.description}</p>
								{/if}
								<div class="flex flex-wrap gap-2 mt-2">
									{#if focus.dayOfWeek}
										<span class="badge badge-outline badge-sm">
											📅 {focus.dayOfWeek}
										</span>
									{/if}
									{#if focus.stat}
										<span class="badge badge-primary badge-sm">
											{focus.stat.emoji ? `${focus.stat.emoji} ` : ''}
											Stat: {focus.stat.name} ({focus.stat.value})
										</span>
									{/if}
								</div>
								{#if focus.sampleActivities && focus.sampleActivities.length > 0}
									<div class="mt-3">
										<p class="text-sm font-medium text-base-content/80 mb-1">Sample Activities:</p>
										<div class="flex flex-wrap gap-1">
											{#each focus.sampleActivities as activity}
												<span class="badge badge-ghost badge-xs">{activity}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
							<div class="flex gap-2">
								<button 
									class="btn btn-sm btn-outline" 
									onclick={() => openLevelForm(focus)}
								>
									Add Level
								</button>
								<button 
									class="btn btn-sm btn-ghost" 
									onclick={() => openEditForm(focus)}
								>
									Edit
								</button>
								<button 
									class="btn btn-sm btn-error btn-outline" 
									onclick={() => deleteFocus(focus.id)}
								>
									Delete
								</button>
							</div>
						</div>
						
						{#if focus.levels && focus.levels.length > 0}
							<div class="mt-4">
								<h4 class="font-semibold text-sm mb-3">Levels</h4>
								<div class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
									{#each focus.levels as level}
										<div class="bg-base-200 rounded-lg p-3">
											<h5 class="font-medium text-sm">{level.name}</h5>
											{#if level.description}
												<p class="text-xs text-base-content/60 mt-1">{level.description}</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<div class="mt-4 p-4 bg-base-200 rounded-lg text-center">
								<p class="text-sm text-base-content/50">No levels created yet</p>
								<button 
									class="btn btn-xs btn-outline mt-2" 
									onclick={() => openLevelForm(focus)}
								>
									Add First Level
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
			
			{#if focuses.length === 0}
				<div class="text-center py-12">
					<p class="text-lg text-base-content/70">No focus areas yet</p>
					<p class="text-base-content/50">Create your first focus area to start organizing your growth!</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Create/Edit Focus Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingFocus ? 'Edit Focus Area' : 'Create New Focus Area'}
			</h3>
			
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="focusName">
						<span class="label-text">Name *</span>
					</label>
					<input 
						id="focusName"
						type="text" 
						class="input input-bordered" 
						bind:value={focusFormData.name}
						placeholder="e.g., Fitness, Learning, Parenting"
						required
					/>
				</div>
				
				<div class="form-control">
					<label class="label" for="focusDescription">
						<span class="label-text">Description</span>
					</label>
					<textarea 
						id="focusDescription"
						class="textarea textarea-bordered" 
						bind:value={focusFormData.description}
						placeholder="Describe what this focus area is about..."
						rows="3"
					></textarea>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="focusEmoji">
							<span class="label-text">Emoji</span>
						</label>
						<input 
							id="focusEmoji"
							type="text" 
							class="input input-bordered" 
							bind:value={focusFormData.emoji}
							placeholder="🔥 🧠 💪"
							maxlength="2"
						/>
					</div>
					
					<div class="form-control">
						<label class="label" for="focusColor">
							<span class="label-text">Color</span>
						</label>
						<select 
							id="focusColor"
							class="select select-bordered" 
							bind:value={focusFormData.color}
						>
							<option value="">Default</option>
							<option value="red">Red</option>
							<option value="blue">Blue</option>
							<option value="green">Green</option>
							<option value="yellow">Yellow</option>
							<option value="purple">Purple</option>
							<option value="pink">Pink</option>
							<option value="orange">Orange</option>
						</select>
					</div>
				</div>
				
				<div class="form-control">
					<label class="label" for="focusDayOfWeek">
						<span class="label-text">Day of Week</span>
					</label>
					<select 
						id="focusDayOfWeek"
						class="select select-bordered" 
						bind:value={focusFormData.dayOfWeek}
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
				
				<div class="form-control">
					<label class="label">
						<span class="label-text">Sample Activities</span>
					</label>
					<div class="space-y-2">
						<div class="flex gap-2">
							<input 
								type="text" 
								class="input input-bordered flex-1" 
								bind:value={newActivity}
								placeholder="e.g., Go for a run, Read a book"
								onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity())}
							/>
							<button 
								type="button" 
								class="btn btn-outline btn-sm" 
								onclick={addActivity}
							>
								Add
							</button>
						</div>
						{#if focusFormData.sampleActivities.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each focusFormData.sampleActivities as activity, index}
									<div class="badge badge-outline gap-2">
										{activity}
										<button 
											type="button" 
											class="text-error hover:text-error-focus"
											onclick={() => removeActivity(index)}
										>
											×
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
				
				<div class="form-control">
					<label class="label" for="focusStat">
						<span class="label-text">Linked Stat (Optional)</span>
					</label>
					<select 
						id="focusStat"
						class="select select-bordered" 
						bind:value={focusFormData.statId}
					>
						<option value={undefined}>No stat linked</option>
						{#each stats as stat}
							<option value={stat.id}>
								{stat.emoji ? `${stat.emoji} ` : ''}{stat.name}
							</option>
						{/each}
					</select>
					<div class="text-xs text-base-content/60 mt-1">
						Link this focus to a stat to track progress when completing related tasks
					</div>
				</div>
				
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => showCreateForm = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						{editingFocus ? 'Update' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Create Level Modal -->
{#if showLevelForm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				Add Level to {selectedFocus?.name}
			</h3>
			
			<form onsubmit={handleLevelSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="levelName">
						<span class="label-text">Level Name *</span>
					</label>
					<input 
						id="levelName"
						type="text" 
						class="input input-bordered" 
						bind:value={levelFormData.name}
						placeholder="e.g., Beginner, Intermediate, Advanced"
						required
					/>
				</div>
				
				<div class="form-control">
					<label class="label" for="levelDescription">
						<span class="label-text">Description</span>
					</label>
					<textarea 
						id="levelDescription"
						class="textarea textarea-bordered" 
						bind:value={levelFormData.description}
						placeholder="Describe what this level represents..."
						rows="3"
					></textarea>
				</div>
				
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => showLevelForm = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Add Level
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
