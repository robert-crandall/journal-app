<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi } from '$lib/api';

	let stats: any[] = [];
	let templates: any[] = [];
	let loading = true;
	let error = '';
	let showCreateForm = false;
	let showTemplateSelector = false;
	let editingStat: any = null;

	// Form state
	let formData = {
		name: '',
		description: '',
		emoji: '',
		color: 'blue',
		category: 'body' as 'body' | 'mind' | 'connection' | 'shadow' | 'spirit' | 'legacy',
		enabled: true,
		value: 0
	};

	const colorOptions = [
		'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
		'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
		'fuchsia', 'pink', 'rose'
	];

	const categoryOptions = [
		{ value: 'body', label: 'Body', description: 'Physical health and vitality' },
		{ value: 'mind', label: 'Mind', description: 'Mental clarity and wisdom' },
		{ value: 'connection', label: 'Connection', description: 'Social and emotional bonds' },
		{ value: 'shadow', label: 'Shadow', description: 'Hidden aspects and growth' },
		{ value: 'spirit', label: 'Spirit', description: 'Purpose and transcendence' },
		{ value: 'legacy', label: 'Legacy', description: 'Long-term impact and contribution' }
	];

	onMount(async () => {
		await loadStats();
		await loadTemplates();
	});

	async function loadStats() {
		try {
			loading = true;
			stats = await statsApi.getAll();
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function loadTemplates() {
		try {
			templates = await statsApi.getTemplates();
		} catch (err: any) {
			console.error('Failed to load templates:', err);
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			emoji: '',
			color: 'blue',
			category: 'body',
			enabled: true,
			value: 0
		};
		showCreateForm = false;
		editingStat = null;
	}

	function startEdit(stat: any) {
		editingStat = stat;
		formData = { ...stat };
		showCreateForm = true;
	}

	async function handleSubmit() {
		try {
			if (editingStat) {
				await statsApi.update(editingStat.id, formData);
			} else {
				await statsApi.create(formData);
			}
			resetForm();
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function incrementStat(statId: string, amount = 1) {
		try {
			await statsApi.increment(statId, amount);
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function toggleStatEnabled(stat: any) {
		try {
			await statsApi.update(stat.id, { enabled: !stat.enabled });
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function deleteStat(statId: string, isSystemDefault: boolean) {
		if (isSystemDefault) {
			error = 'Cannot delete system default stats. You can disable them instead.';
			return;
		}
		
		if (confirm('Are you sure you want to delete this stat?')) {
			try {
				await statsApi.delete(statId);
				await loadStats();
			} catch (err: any) {
				error = err.message;
			}
		}
	}

	async function applyTemplate(templateId: string) {
		try {
			await statsApi.applyTemplate(templateId);
			showTemplateSelector = false;
			await loadStats();
		} catch (err: any) {
			error = err.message;
		}
	}

	function getProgressWidth(value: number) {
		return Math.min(100, Math.max(0, (value / 99) * 100));
	}

	function groupStatsByCategory(stats: any[]) {
		const grouped: Record<string, any[]> = {};
		stats.forEach(stat => {
			const category = stat.category || 'uncategorized';
			if (!grouped[category]) {
				grouped[category] = [];
			}
			grouped[category].push(stat);
		});
		return grouped;
	}

	$: groupedStats = groupStatsByCategory(stats);
</script>

<svelte:head>
	<title>Stats - LifeQuest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Character Stats</h1>
		<div class="flex gap-2">
			<button 
				class="btn btn-outline"
				on:click={() => showTemplateSelector = true}
			>
				📋 Apply Template
			</button>
			<button 
				class="btn btn-primary"
				on:click={() => showCreateForm = true}
			>
				+ New Stat
			</button>
		</div>
	</div>

	{#if error}
		<div class="alert alert-error mb-4">
			<span>{error}</span>
			<button class="btn btn-sm btn-ghost" on:click={() => error = ''}>✕</button>
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if stats.length === 0}
		<div class="text-center py-12">
			<p class="text-lg text-gray-500 mb-4">No stats yet</p>
			<div class="flex justify-center gap-4">
				<button 
					class="btn btn-outline"
					on:click={() => showTemplateSelector = true}
				>
					Start with a Template
				</button>
				<button 
					class="btn btn-primary"
					on:click={() => showCreateForm = true}
				>
					Create Custom Stat
				</button>
			</div>
		</div>
	{:else}
		{#each Object.entries(groupedStats) as [category, categoryStats]}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
					{#if category === 'body'}
						💪 Body
					{:else if category === 'mind'}
						🧠 Mind
					{:else if category === 'connection'}
						💝 Connection
					{:else if category === 'shadow'}
						🌙 Shadow
					{:else if category === 'spirit'}
						✨ Spirit
					{:else if category === 'legacy'}
						🏛️ Legacy
					{:else}
						📊 {category}
					{/if}
				</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each categoryStats as stat}
						<div class="card bg-base-100 shadow-xl border border-base-300 {!stat.enabled ? 'opacity-50' : ''}">
							<div class="card-body">
								<div class="flex justify-between items-start mb-4">
									<div class="flex items-center gap-2">
										{#if stat.emoji}
											<span class="text-2xl">{stat.emoji}</span>
										{/if}
										<h2 class="card-title text-lg">{stat.name}</h2>
										{#if stat.systemDefault}
											<span class="badge badge-xs badge-primary" title="System Default">SYS</span>
										{/if}
									</div>
									<div class="dropdown dropdown-end">
										<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
											⋮
										</div>
										<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
										<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow">
											<li><button on:click={() => startEdit(stat)}>Edit</button></li>
											<li>
												<button on:click={() => toggleStatEnabled(stat)}>
													{stat.enabled ? 'Disable' : 'Enable'}
												</button>
											</li>
											<li>
												<button 
													on:click={() => deleteStat(stat.id, stat.systemDefault)} 
													class="text-error {stat.systemDefault ? 'opacity-50' : ''}"
													disabled={stat.systemDefault}
												>
													Delete {stat.systemDefault ? '(Protected)' : ''}
												</button>
											</li>
										</ul>
									</div>
								</div>

								{#if stat.description}
									<p class="text-sm text-gray-600 mb-4">{stat.description}</p>
								{/if}

								<div class="mb-4">
									<div class="flex justify-between items-center mb-2">
										<span class="text-sm font-medium">Level {stat.value}</span>
										<span class="text-xs text-gray-500">{stat.value}/99</span>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-3">
										<div 
											class="bg-{stat.color}-500 h-3 rounded-full transition-all duration-300"
											style="width: {getProgressWidth(stat.value)}%"
										></div>
									</div>
								</div>

								{#if stat.enabled}
									<div class="card-actions justify-between">
										<div class="flex gap-1">
											<button 
												class="btn btn-xs btn-outline"
												on:click={() => incrementStat(stat.id, 1)}
											>
												+1
											</button>
											<button 
												class="btn btn-xs btn-outline"
												on:click={() => incrementStat(stat.id, 5)}
											>
												+5
											</button>
										</div>
										<button 
											class="btn btn-xs btn-outline btn-{stat.color}"
											on:click={() => startEdit(stat)}
										>
											Edit
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<!-- Template Selector Modal -->
{#if showTemplateSelector}
	<div class="modal modal-open">
		<div class="modal-box max-w-4xl">
			<h3 class="font-bold text-lg mb-4">Choose a Character Build</h3>
			<p class="mb-6 text-gray-600">Select a template to quickly set up stats that work well together:</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				{#each templates as template}
					<div class="card bg-base-100 border border-base-300 hover:border-primary cursor-pointer transition-colors"
						 on:click={() => applyTemplate(template.id)}>
						<div class="card-body">
							<h4 class="card-title text-lg">{template.name}</h4>
							<p class="text-sm text-gray-600 mb-4">{template.description}</p>
							<div class="flex flex-wrap gap-1">
								{#each template.recommendedStats as statName}
									<span class="badge badge-outline badge-sm">{statName}</span>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn" on:click={() => showTemplateSelector = false}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<!-- Create/Edit Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<form class="modal-box" on:submit|preventDefault={handleSubmit}>
			<h3 class="font-bold text-lg mb-4">
				{editingStat ? 'Edit Stat' : 'Create New Stat'}
			</h3>
			
			<div class="form-control mb-4">
				<label class="label" for="name">
					<span class="label-text">Name</span>
				</label>
				<input 
					type="text" 
					id="name"
					class="input input-bordered" 
					bind:value={formData.name}
					required
				/>
			</div>

			<div class="form-control mb-4">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<textarea 
					id="description"
					class="textarea textarea-bordered" 
					bind:value={formData.description}
					placeholder="What this stat represents..."
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<div class="form-control">
					<label class="label" for="emoji">
						<span class="label-text">Emoji</span>
					</label>
					<input 
						type="text" 
						id="emoji"
						class="input input-bordered" 
						bind:value={formData.emoji}
						placeholder="🧠"
					/>
				</div>

				<div class="form-control">
					<label class="label" for="category">
						<span class="label-text">Category</span>
					</label>
					<select 
						id="category"
						class="select select-bordered" 
						bind:value={formData.category}
					>
						{#each categoryOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-control mb-4">
				<label class="label" for="color">
					<span class="label-text">Color</span>
				</label>
				<select 
					id="color"
					class="select select-bordered" 
					bind:value={formData.color}
				>
					{#each colorOptions as color}
						<option value={color}>{color}</option>
					{/each}
				</select>
			</div>

			<div class="grid grid-cols-2 gap-4 mb-6">
				<div class="form-control">
					<label class="label" for="value">
						<span class="label-text">Initial Value</span>
					</label>
					<input 
						type="number" 
						id="value"
						class="input input-bordered" 
						bind:value={formData.value}
						min="0"
						max="99"
					/>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">Enabled</span>
						<input 
							type="checkbox" 
							class="checkbox" 
							bind:checked={formData.enabled}
						/>
					</label>
				</div>
			</div>

			<div class="modal-action">
				<button type="button" class="btn" on:click={resetForm}>Cancel</button>
				<button type="submit" class="btn btn-primary">
					{editingStat ? 'Update' : 'Create'}
				</button>
			</div>
		</form>
	</div>
{/if}
