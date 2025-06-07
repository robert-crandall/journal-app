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
		gptContext: null,
		statId: null
	};
	
	let levelFormData = {
		name: '',
		description: ''
	};
	
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
			gptContext: null,
			statId: null
		};
		editingFocus = null;
		showCreateForm = true;
	}
	
	function openEditForm(focus: any) {
		focusFormData = {
			name: focus.name,
			description: focus.description || '',
			gptContext: focus.gptContext,
			statId: focus.statId || null
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
		<button class="btn btn-primary" onclick={openCreateForm}>
			<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Focus Area
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<div class="grid gap-6">
			{#each focuses as focus}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<h3 class="card-title text-xl">{focus.name}</h3>
								{#if focus.description}
									<p class="text-base-content/70 mt-2">{focus.description}</p>
								{/if}
								{#if focus.stat}
									<div class="mt-2">
										<span class="badge badge-primary badge-sm">
											{focus.stat.emoji ? `${focus.stat.emoji} ` : ''}
											Stat: {focus.stat.name} ({focus.stat.value})
										</span>
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
				
				<div class="form-control">
					<label class="label" for="focusStat">
						<span class="label-text">Linked Stat (Optional)</span>
					</label>
					<select 
						id="focusStat"
						class="select select-bordered" 
						bind:value={focusFormData.statId}
					>
						<option value={null}>No stat linked</option>
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
