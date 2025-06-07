<script lang="ts">
	import { onMount } from 'svelte';
	import { statsApi } from '$lib/api';

	let stats: any[] = [];
	let loading = true;
	let error = '';
	let showCreateForm = false;
	let editingStat: any = null;

	// Form state
	let formData = {
		name: '',
		description: '',
		emoji: '',
		color: 'blue',
		value: 0
	};

	const colorOptions = [
		'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
		'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
		'fuchsia', 'pink', 'rose'
	];

	onMount(async () => {
		await loadStats();
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

	function resetForm() {
		formData = {
			name: '',
			description: '',
			emoji: '',
			color: 'blue',
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

	async function deleteStat(statId: string) {
		if (confirm('Are you sure you want to delete this stat?')) {
			try {
				await statsApi.delete(statId);
				await loadStats();
			} catch (err: any) {
				error = err.message;
			}
		}
	}

	function getProgressWidth(value: number) {
		return Math.min(100, Math.max(0, (value / 99) * 100));
	}
</script>

<svelte:head>
	<title>Stats - LifeQuest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Stats</h1>
		<button 
			class="btn btn-primary"
			on:click={() => showCreateForm = true}
		>
			+ New Stat
		</button>
	</div>

	{#if error}
		<div class="alert alert-error mb-4">
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="flex justify-center">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if stats.length === 0}
		<div class="text-center py-12">
			<p class="text-lg text-gray-500 mb-4">No stats yet</p>
			<button 
				class="btn btn-primary"
				on:click={() => showCreateForm = true}
			>
				Create your first stat
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each stats as stat}
				<div class="card bg-base-100 shadow-xl border border-base-300">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex items-center gap-2">
								{#if stat.emoji}
									<span class="text-2xl">{stat.emoji}</span>
								{/if}
								<h2 class="card-title text-lg">{stat.name}</h2>
							</div>
							<div class="dropdown dropdown-end">
								<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
									⋮
								</div>
								<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
								<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow">
									<li><button on:click={() => startEdit(stat)}>Edit</button></li>
									<li><button on:click={() => deleteStat(stat.id)} class="text-error">Delete</button></li>
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
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

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

			<div class="form-control mb-4">
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

			<div class="form-control mb-6">
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

			<div class="modal-action">
				<button type="button" class="btn" on:click={resetForm}>Cancel</button>
				<button type="submit" class="btn btn-primary">
					{editingStat ? 'Update' : 'Create'}
				</button>
			</div>
		</form>
	</div>
{/if}
