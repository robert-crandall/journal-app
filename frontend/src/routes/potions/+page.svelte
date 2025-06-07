<script lang="ts">
	import { onMount } from 'svelte';
	import { potionsApi } from '$lib/api';
	
	let potions: any[] = [];
	let loading = true;
	let showCreateForm = false;
	let editingPotion: any = null;
	
	// Form data
	let formData = {
		title: '',
		hypothesis: '',
		startDate: '',
		endDate: ''
	};
	
	onMount(async () => {
		await loadPotions();
		// Set today's date as default start date
		formData.startDate = new Date().toISOString().split('T')[0];
	});
	
	async function loadPotions() {
		try {
			loading = true;
			const response = await potionsApi.getAll();
			potions = response.potions;
		} catch (error) {
			console.error('Failed to load potions:', error);
		} finally {
			loading = false;
		}
	}
	
	function openCreateForm() {
		formData = {
			title: '',
			hypothesis: '',
			startDate: new Date().toISOString().split('T')[0],
			endDate: ''
		};
		editingPotion = null;
		showCreateForm = true;
	}
	
	function openEditForm(potion: any) {
		formData = {
			title: potion.title,
			hypothesis: potion.hypothesis || '',
			startDate: potion.startDate ? potion.startDate.split('T')[0] : '',
			endDate: potion.endDate ? potion.endDate.split('T')[0] : ''
		};
		editingPotion = potion;
		showCreateForm = true;
	}
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			const potionData = {
				title: formData.title,
				hypothesis: formData.hypothesis || undefined,
				startDate: formData.startDate,
				endDate: formData.endDate || undefined
			};
			
			if (editingPotion) {
				await potionsApi.update(editingPotion.id, potionData);
			} else {
				await potionsApi.create(potionData);
			}
			
			showCreateForm = false;
			await loadPotions();
		} catch (error) {
			console.error('Failed to save potion:', error);
		}
	}
	
	async function endPotion(potionId: string) {
		if (confirm('Are you sure you want to end this experiment? This action cannot be undone.')) {
			try {
				await potionsApi.end(potionId);
				await loadPotions();
			} catch (error) {
				console.error('Failed to end potion:', error);
			}
		}
	}
	
	async function deletePotion(potionId: string) {
		if (confirm('Are you sure you want to delete this experiment?')) {
			try {
				await potionsApi.delete(potionId);
				await loadPotions();
			} catch (error) {
				console.error('Failed to delete potion:', error);
			}
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}
	
	function getDaysSince(startDate: string) {
		const start = new Date(startDate);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
	
	function getStatus(potion: any) {
		if (potion.endDate) {
			return 'completed';
		}
		if (potion.plannedEndDate && new Date(potion.plannedEndDate) < new Date()) {
			return 'overdue';
		}
		return 'active';
	}
	
	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return 'badge-success';
			case 'overdue':
				return 'badge-warning';
			case 'active':
			default:
				return 'badge-primary';
		}
	}
</script>

<svelte:head>
	<title>Potions - Life Quest</title>
</svelte:head>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Potions</h1>
			<p class="text-base-content/70">Personal experiments and habit trials</p>
		</div>
		<button class="btn btn-primary" onclick={openCreateForm}>
			<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Experiment
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each potions as potion}
				{@const status = getStatus(potion)}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<div class="flex justify-between items-start mb-4">
							<div class="flex-1">
								<h3 class="card-title text-lg">{potion.title}</h3>
								<div class="flex items-center gap-2 mt-2">
									<div class="badge {getStatusBadge(status)} badge-sm">
										{status.charAt(0).toUpperCase() + status.slice(1)}
									</div>
									<span class="text-xs text-base-content/60">
										Day {getDaysSince(potion.startDate)}
									</span>
								</div>
							</div>
							<div class="dropdown dropdown-end">
								<button class="btn btn-ghost btn-sm" aria-label="Potion options">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
									</svg>
								</button>
								<ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
									<li><button onclick={() => openEditForm(potion)}>Edit</button></li>
									{#if status === 'active'}
										<li><button onclick={() => endPotion(potion.id)}>End Experiment</button></li>
									{/if}
									<li><button onclick={() => deletePotion(potion.id)} class="text-error">Delete</button></li>
								</ul>
							</div>
						</div>
						
						{#if potion.hypothesis}
							<div class="mb-4">
								<h4 class="font-semibold text-sm mb-1">Hypothesis</h4>
								<p class="text-sm text-base-content/70">{potion.hypothesis}</p>
							</div>
						{/if}
						
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-base-content/60">Started:</span>
								<span>{formatDate(potion.startDate)}</span>
							</div>
							{#if potion.endDate}
								<div class="flex justify-between">
									<span class="text-base-content/60">Ended:</span>
									<span>{formatDate(potion.endDate)}</span>
								</div>
							{:else if potion.plannedEndDate}
								<div class="flex justify-between">
									<span class="text-base-content/60">Planned End:</span>
									<span>{formatDate(potion.plannedEndDate)}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
			
			{#if potions.length === 0}
				<div class="col-span-full text-center py-12">
					<div class="mb-4">
						<svg class="w-16 h-16 mx-auto text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
						</svg>
					</div>
					<p class="text-lg text-base-content/70">No experiments yet</p>
					<p class="text-base-content/50">Start your first personal experiment to track habits or test hypotheses!</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Create/Edit Potion Modal -->
{#if showCreateForm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingPotion ? 'Edit Experiment' : 'New Experiment'}
			</h3>
			
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="form-control">
					<label class="label" for="potionTitle">
						<span class="label-text">Title *</span>
					</label>
					<input 
						id="potionTitle"
						type="text" 
						class="input input-bordered" 
						bind:value={formData.title}
						placeholder="e.g., Morning meditation, No social media, Cold showers"
						required
					/>
				</div>
				
				<div class="form-control">
					<label class="label" for="potionHypothesis">
						<span class="label-text">Hypothesis</span>
						<span class="label-text-alt">What do you expect to happen?</span>
					</label>
					<textarea 
						id="potionHypothesis"
						class="textarea textarea-bordered" 
						bind:value={formData.hypothesis}
						placeholder="If I do X for Y days, then I expect Z to happen because..."
						rows="3"
					></textarea>
				</div>
				
				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="potionStartDate">
							<span class="label-text">Start Date *</span>
						</label>
						<input 
							id="potionStartDate"
							type="date" 
							class="input input-bordered" 
							bind:value={formData.startDate}
							required
						/>
					</div>
					
					<div class="form-control">
						<label class="label" for="potionEndDate">
							<span class="label-text">Planned End Date</span>
						</label>
						<input 
							id="potionEndDate"
							type="date" 
							class="input input-bordered" 
							bind:value={formData.endDate}
						/>
					</div>
				</div>
				
				<div class="modal-action">
					<button type="button" class="btn" onclick={() => showCreateForm = false}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						{editingPotion ? 'Update' : 'Start Experiment'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
