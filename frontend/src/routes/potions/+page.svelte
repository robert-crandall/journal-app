<script lang="ts">
	import { onMount } from 'svelte';
	import { potionsApi } from '$lib/api';
	import * as icons from 'lucide-svelte';
	
	let potions: any[] = [];
	let loading = true;
	let error = '';
	let showCreateForm = false;
	let editingPotion: any = null;
	let openDropdownId: string | null = null;
	
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
			error = '';
			const response = await potionsApi.getAll();
			potions = response.potions;
		} catch (err: any) {
			error = err.message || 'Failed to load potions';
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

	function closeCreateForm() {
		showCreateForm = false;
		editingPotion = null;
	}

	function toggleDropdown(potionId: string) {
		openDropdownId = openDropdownId === potionId ? null : potionId;
	}

	function closeDropdown() {
		openDropdownId = null;
	}

	// Close dropdown when clicking outside
	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as Element;
		if (openDropdownId && !target.closest('.dropdown-container')) {
			closeDropdown();
		}
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
		} catch (err: any) {
			error = err.message || 'Failed to save potion';
		}
	}
	
	async function endPotion(potionId: string) {
		if (confirm('Are you sure you want to end this experiment? This action cannot be undone.')) {
			try {
				await potionsApi.end(potionId);
				await loadPotions();
				closeDropdown();
			} catch (err: any) {
				error = err.message || 'Failed to end potion';
			}
		}
	}
	
	async function deletePotion(potionId: string) {
		if (confirm('Are you sure you want to delete this experiment?')) {
			try {
				await potionsApi.delete(potionId);
				await loadPotions();
				closeDropdown();
			} catch (err: any) {
				error = err.message || 'Failed to delete potion';
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

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'text-green-700 bg-green-100 border-green-200';
			case 'overdue':
				return 'text-orange-700 bg-orange-100 border-orange-200';
			case 'active':
			default:
				return 'text-blue-700 bg-blue-100 border-blue-200';
		}
	}
	
	// Analysis functionality
	let analyzing = false;
	let potionAnalyses: Record<string, any> = {};
	
	async function analyzePotion(potionId: string) {
		try {
			analyzing = true;
			const result = await potionsApi.analyze(potionId);
			potionAnalyses[potionId] = result.analysis;
			closeDropdown();
		} catch (err: any) {
			error = err.message || 'Failed to analyze potion';
		} finally {
			analyzing = false;
		}
	}

	async function analyzeAll() {
		try {
			analyzing = true;
			await potionsApi.analyzeAll();
			await loadPotions();
		} catch (err: any) {
			error = err.message || 'Failed to analyze all potions';
		} finally {
			analyzing = false;
		}
	}
	
	async function loadPotionAnalysis(potionId: string) {
		try {
			const result = await potionsApi.getAnalysis(potionId);
			if (result.analysis) {
				potionAnalyses[potionId] = result.analysis;
			}
			closeDropdown();
		} catch (err: any) {
			error = err.message || 'Failed to load analysis';
		}
	}
	
	function getEffectivenessIcon(effectiveness: string) {
		switch (effectiveness) {
			case 'likely_effective':
				return icons.CheckCircle;
			case 'mixed_results':
				return icons.HelpCircle;
			case 'likely_ineffective':
				return icons.XCircle;
			case 'insufficient_data':
			default:
				return icons.Clock;
		}
	}

	function getEffectivenessColor(effectiveness: string) {
		switch (effectiveness) {
			case 'likely_effective':
				return 'text-green-600';
			case 'mixed_results':
				return 'text-yellow-600';
			case 'likely_ineffective':
				return 'text-red-600';
			case 'insufficient_data':
			default:
				return 'text-neutral-600';
		}
	}
	
	function getEffectivenessText(effectiveness: string) {
		switch (effectiveness) {
			case 'likely_effective':
				return 'Likely Effective';
			case 'mixed_results':
				return 'Mixed Results';
			case 'likely_ineffective':
				return 'Likely Ineffective';
			case 'insufficient_data':
			default:
				return 'Insufficient Data';
		}
	}

	// Derived stats
	$: activePotions = potions.filter(p => !p.endDate);
	$: completedPotions = potions.filter(p => p.endDate);
	$: overduePotions = potions.filter(p => getStatus(p) === 'overdue');
	$: totalPotions = potions.length;
</script>

<svelte:head>
	<title>Potions - LifeQuest</title>
</svelte:head>

{#if showCreateForm}
	<!-- Create/Edit Potion Modal - Atlassian Style -->
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto pt-12">
		<div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
			<!-- Modal Header -->
			<div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
							<svelte:component this={icons.Beaker} size={16} class="text-purple-600" />
						</div>
						<h3 class="text-lg font-semibold text-neutral-900">
							{editingPotion ? 'Edit experiment' : 'New experiment'}
						</h3>
					</div>
					<button
						on:click={closeCreateForm}
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

				<form on:submit={handleSubmit} class="space-y-6">
					<div>
						<label for="potionTitle" class="block text-sm font-medium text-neutral-900 mb-2">
							Title <span class="text-red-500">*</span>
						</label>
						<input 
							id="potionTitle"
							type="text" 
							bind:value={formData.title}
							placeholder="e.g., Morning meditation, No social media, Cold showers"
							required
							class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						/>
					</div>
					
					<div>
						<label for="potionHypothesis" class="block text-sm font-medium text-neutral-900 mb-2">
							Hypothesis
						</label>
						<p class="text-xs text-neutral-600 mb-2">What do you expect to happen?</p>
						<textarea 
							id="potionHypothesis"
							bind:value={formData.hypothesis}
							placeholder="If I do X for Y days, then I expect Z to happen because..."
							rows="4"
							class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
						></textarea>
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="potionStartDate" class="block text-sm font-medium text-neutral-900 mb-2">
								Start Date <span class="text-red-500">*</span>
							</label>
							<input 
								id="potionStartDate"
								type="date" 
								bind:value={formData.startDate}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
							/>
						</div>
						
						<div>
							<label for="potionEndDate" class="block text-sm font-medium text-neutral-900 mb-2">
								Planned End Date
							</label>
							<input 
								id="potionEndDate"
								type="date" 
								bind:value={formData.endDate}
								class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
							/>
						</div>
					</div>
					
					<div class="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
						<button 
							type="button" 
							on:click={closeCreateForm}
							class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
						>
							Cancel
						</button>
						<button 
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
						>
							{editingPotion ? 'Update experiment' : 'Start experiment'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<!-- Main Potions Page - Atlassian Style -->
	<div class="max-w-7xl mx-auto px-6 py-8" on:click={handleOutsideClick}>
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h1 class="text-2xl font-bold text-neutral-900">Potions</h1>
					<p class="text-neutral-600 mt-1">Personal experiments and habit trials</p>
				</div>
				<div class="flex items-center space-x-3">
					<button 
						on:click={analyzeAll}
						disabled={analyzing}
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if analyzing}
							<div class="animate-spin rounded-full h-4 w-4 border-2 border-neutral-300 border-t-blue-600 mr-2"></div>
						{:else}
							<svelte:component this={icons.Search} size={16} class="mr-2" />
						{/if}
						Analyze All
					</button>
					<button 
						on:click={openCreateForm}
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
					>
						<svelte:component this={icons.Plus} size={16} class="mr-2" />
						New Experiment
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
			{#if totalPotions > 0}
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.Activity} size={16} class="text-blue-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{activePotions.length}</div>
								<div class="text-xs text-neutral-600">Active</div>
							</div>
						</div>
					</div>
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.CheckCircle} size={16} class="text-green-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{completedPotions.length}</div>
								<div class="text-xs text-neutral-600">Completed</div>
							</div>
						</div>
					</div>
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.Clock} size={16} class="text-orange-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{overduePotions.length}</div>
								<div class="text-xs text-neutral-600">Overdue</div>
							</div>
						</div>
					</div>
					<div class="bg-white border border-neutral-200 rounded-lg p-4">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.Beaker} size={16} class="text-purple-600" />
							</div>
							<div>
								<div class="text-lg font-semibold text-neutral-900">{totalPotions}</div>
								<div class="text-xs text-neutral-600">Total experiments</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Potions Grid -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-blue-600"></div>
			</div>
		{:else if totalPotions === 0}
			<div class="text-center py-12">
				<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svelte:component this={icons.Beaker} size={24} class="text-purple-600" />
				</div>
				<h3 class="text-lg font-semibold text-neutral-900 mb-2">No experiments yet</h3>
				<p class="text-neutral-600 mb-6">Start your first personal experiment to track habits or test hypotheses!</p>
				<button 
					on:click={openCreateForm}
					class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
				>
					<svelte:component this={icons.Plus} size={16} class="mr-2" />
					Start Your First Experiment
				</button>
			</div>
		{:else}
			<div class="space-y-4">
				{#each potions as potion}
					{@const status = getStatus(potion)}
					<div class="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
						<!-- Header Row -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<div class="flex items-center space-x-3 mb-2">
									<h3 class="text-lg font-semibold text-neutral-900">{potion.title}</h3>
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(status)}">
										{status === 'active' ? 'Active' : status === 'completed' ? 'Completed' : 'Overdue'}
									</span>
								</div>
								<div class="flex items-center space-x-4 text-sm text-neutral-600">
									<span>Day {getDaysSince(potion.startDate)}</span>
									<span>Started {formatDate(potion.startDate)}</span>
									{#if potion.endDate}
										<span>Ended {formatDate(potion.endDate)}</span>
									{:else if potion.plannedEndDate}
										<span>Planned end {formatDate(potion.plannedEndDate)}</span>
									{/if}
								</div>
							</div>
							
							<!-- Actions Dropdown -->
							<div class="dropdown-container relative">
								<button 
									on:click={() => toggleDropdown(potion.id)}
									class="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
								>
									<svelte:component this={icons.MoreVertical} size={16} class="text-neutral-500" />
								</button>
								
								{#if openDropdownId === potion.id}
									<div class="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
										<div class="py-1">
											<button
												on:click={() => analyzePotion(potion.id)}
												disabled={analyzing}
												class="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center space-x-2"
											>
												<svelte:component this={icons.Search} size={14} />
												<span>Analyze Effectiveness</span>
											</button>
											<button
												on:click={() => loadPotionAnalysis(potion.id)}
												class="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center space-x-2"
											>
												<svelte:component this={icons.BarChart3} size={14} />
												<span>View Analysis</span>
											</button>
											<div class="border-t border-neutral-200 my-1"></div>
											<button
												on:click={() => openEditForm(potion)}
												class="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center space-x-2"
											>
												<svelte:component this={icons.Edit2} size={14} />
												<span>Edit</span>
											</button>
											{#if status === 'active'}
												<button
													on:click={() => endPotion(potion.id)}
													class="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center space-x-2"
												>
													<svelte:component this={icons.StopCircle} size={14} />
													<span>End Experiment</span>
												</button>
											{/if}
											<div class="border-t border-neutral-200 my-1"></div>
											<button
												on:click={() => deletePotion(potion.id)}
												class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
											>
												<svelte:component this={icons.Trash2} size={14} />
												<span>Delete</span>
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
						
						<!-- Hypothesis -->
						{#if potion.hypothesis}
							<div class="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
								<h4 class="text-sm font-medium text-neutral-900 mb-1">Hypothesis</h4>
								<p class="text-sm text-neutral-700">{potion.hypothesis}</p>
							</div>
						{/if}
						
						<!-- Analysis Results -->
						{#if potionAnalyses[potion.id]}
							{@const analysis = potionAnalyses[potion.id]}
							<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<div class="flex items-center space-x-2 mb-3">
									<svelte:component 
										this={getEffectivenessIcon(analysis.effectiveness)} 
										size={16} 
										class={getEffectivenessColor(analysis.effectiveness)} 
									/>
									<h4 class="text-sm font-semibold text-neutral-900">
										{getEffectivenessText(analysis.effectiveness)}
									</h4>
								</div>
								<p class="text-sm text-neutral-700 mb-2">{analysis.summary}</p>
								{#if analysis.recommendations}
									<div class="text-xs text-neutral-600">
										<span class="font-medium">Recommendation:</span> {analysis.recommendations}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
