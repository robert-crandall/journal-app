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
				return 'text-success bg-success/10 border-success/20';
			case 'overdue':
				return 'text-orange-700 bg-orange-100 border-orange-200';
			case 'active':
			default:
				return 'text-primary bg-primary/10 border-primary/20';
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
				return 'text-success';
			case 'mixed_results':
				return 'text-yellow-600';
			case 'likely_ineffective':
				return 'text-error';
			case 'insufficient_data':
			default:
				return 'text-base-content/70';
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
	$: activePotions = potions.filter((p) => !p.endDate);
	$: completedPotions = potions.filter((p) => p.endDate);
	$: overduePotions = potions.filter((p) => getStatus(p) === 'overdue');
	$: totalPotions = potions.length;
</script>

<svelte:head>
	<title>Potions - LifeQuest</title>
</svelte:head>

{#if showCreateForm}
	<!-- Create/Edit Potion Modal - Atlassian Style -->
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
						<div class="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg">
							<svelte:component this={icons.Beaker} size={16} class="text-secondary" />
						</div>
						<h3 class="text-base-content text-lg font-semibold">
							{editingPotion ? 'Edit experiment' : 'New experiment'}
						</h3>
					</div>
					<button
						on:click={closeCreateForm}
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

				<form on:submit={handleSubmit} class="space-y-6">
					<div>
						<label for="potionTitle" class="text-base-content mb-2 block text-sm font-medium">
							Title <span class="text-red-500">*</span>
						</label>
						<input
							id="potionTitle"
							type="text"
							bind:value={formData.title}
							placeholder="e.g., Morning meditation, No social media, Cold showers"
							required
							class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="potionHypothesis" class="text-base-content mb-2 block text-sm font-medium">
							Hypothesis
						</label>
						<p class="text-base-content/70 mb-2 text-xs">What do you expect to happen?</p>
						<textarea
							id="potionHypothesis"
							bind:value={formData.hypothesis}
							placeholder="If I do X for Y days, then I expect Z to happen because..."
							rows="4"
							class="border-base-300 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						></textarea>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="potionStartDate" class="text-base-content mb-2 block text-sm font-medium">
								Start Date <span class="text-red-500">*</span>
							</label>
							<input
								id="potionStartDate"
								type="date"
								bind:value={formData.startDate}
								required
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="potionEndDate" class="text-base-content mb-2 block text-sm font-medium">
								Planned End Date
							</label>
							<input
								id="potionEndDate"
								type="date"
								bind:value={formData.endDate}
								class="border-base-300 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>
					</div>

					<div class="border-base-300 flex justify-end space-x-3 border-t pt-4">
						<button
							type="button"
							on:click={closeCreateForm}
							class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors dark:bg-neutral-800"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="bg-primary text-primary-content hover:bg-primary/90 rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
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
	<div class="mx-auto max-w-7xl px-6 py-8" on:click={handleOutsideClick}>
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-base-content text-2xl font-bold">Potions</h1>
					<p class="text-base-content/70 mt-1">Personal experiments and habit trials</p>
				</div>
				<div class="flex items-center space-x-3">
					<button
						on:click={analyzeAll}
						disabled={analyzing}
						class="border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800"
					>
						{#if analyzing}
							<div
								class="border-base-300 mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-blue-600"
							></div>
						{:else}
							<svelte:component this={icons.Search} size={16} class="mr-2" />
						{/if}
						Analyze All
					</button>
					<button
						on:click={openCreateForm}
						class="bg-primary text-primary-content hover:bg-primary/90 inline-flex items-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors"
					>
						<svelte:component this={icons.Plus} size={16} class="mr-2" />
						New Experiment
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
			{#if totalPotions > 0}
				<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Activity} size={16} class="text-info" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{activePotions.length}</div>
								<div class="text-base-content/70 text-xs">Active</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.CheckCircle} size={16} class="text-success" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{completedPotions.length}</div>
								<div class="text-base-content/70 text-xs">Completed</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
								<svelte:component this={icons.Clock} size={16} class="text-orange-600" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{overduePotions.length}</div>
								<div class="text-base-content/70 text-xs">Overdue</div>
							</div>
						</div>
					</div>
					<div class="border-base-300 bg-base-100 rounded-lg border p-4 dark:bg-neutral-800">
						<div class="flex items-center space-x-3">
							<div class="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg">
								<svelte:component this={icons.Beaker} size={16} class="text-secondary" />
							</div>
							<div>
								<div class="text-base-content text-lg font-semibold">{totalPotions}</div>
								<div class="text-base-content/70 text-xs">Total experiments</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Potions Grid -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="border-base-300 h-8 w-8 animate-spin rounded-full border-2 border-t-blue-600"
				></div>
			</div>
		{:else if totalPotions === 0}
			<div class="py-12 text-center">
				<div
					class="bg-secondary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				>
					<svelte:component this={icons.Beaker} size={24} class="text-secondary" />
				</div>
				<h3 class="text-base-content mb-2 text-lg font-semibold">No experiments yet</h3>
				<p class="text-base-content/70 mb-6">
					Start your first personal experiment to track habits or test hypotheses!
				</p>
				<button
					on:click={openCreateForm}
					class="bg-primary text-primary-content hover:bg-primary/90 inline-flex items-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors"
				>
					<svelte:component this={icons.Plus} size={16} class="mr-2" />
					Start Your First Experiment
				</button>
			</div>
		{:else}
			<div class="space-y-4">
				{#each potions as potion}
					{@const status = getStatus(potion)}
					<div
						class="border-base-300 bg-base-100 rounded-lg border p-6 transition-shadow hover:shadow-md dark:bg-neutral-800"
					>
						<!-- Header Row -->
						<div class="mb-4 flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-2 flex items-center space-x-3">
									<h3 class="text-base-content text-lg font-semibold">{potion.title}</h3>
									<span
										class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusColor(
											status
										)}"
									>
										{status === 'active'
											? 'Active'
											: status === 'completed'
												? 'Completed'
												: 'Overdue'}
									</span>
								</div>
								<div class="text-base-content/70 flex items-center space-x-4 text-sm">
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
									class="hover:bg-base-200 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
								>
									<svelte:component
										this={icons.MoreVertical}
										size={16}
										class="text-base-content/60"
									/>
								</button>

								{#if openDropdownId === potion.id}
									<div
										class="border-base-300 bg-base-100 absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border shadow-lg dark:bg-neutral-800"
									>
										<div class="py-1">
											<button
												on:click={() => analyzePotion(potion.id)}
												disabled={analyzing}
												class="text-base-content/80 hover:bg-base-200 flex w-full items-center space-x-2 px-3 py-2 text-left text-sm transition-colors"
											>
												<svelte:component this={icons.Search} size={14} />
												<span>Analyze Effectiveness</span>
											</button>
											<button
												on:click={() => loadPotionAnalysis(potion.id)}
												class="text-base-content/80 hover:bg-base-200 flex w-full items-center space-x-2 px-3 py-2 text-left text-sm transition-colors"
											>
												<svelte:component this={icons.BarChart3} size={14} />
												<span>View Analysis</span>
											</button>
											<div class="border-base-300 my-1 border-t"></div>
											<button
												on:click={() => openEditForm(potion)}
												class="text-base-content/80 hover:bg-base-200 flex w-full items-center space-x-2 px-3 py-2 text-left text-sm transition-colors"
											>
												<svelte:component this={icons.Edit2} size={14} />
												<span>Edit</span>
											</button>
											{#if status === 'active'}
												<button
													on:click={() => endPotion(potion.id)}
													class="text-base-content/80 hover:bg-base-200 flex w-full items-center space-x-2 px-3 py-2 text-left text-sm transition-colors"
												>
													<svelte:component this={icons.StopCircle} size={14} />
													<span>End Experiment</span>
												</button>
											{/if}
											<div class="border-base-300 my-1 border-t"></div>
											<button
												on:click={() => deletePotion(potion.id)}
												class="text-error hover:bg-error/10 flex w-full items-center space-x-2 px-3 py-2 text-left text-sm transition-colors"
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
							<div class="border-base-300 bg-base-200 mb-4 rounded-lg border p-3">
								<h4 class="text-base-content mb-1 text-sm font-medium">Hypothesis</h4>
								<p class="text-base-content/80 text-sm">{potion.hypothesis}</p>
							</div>
						{/if}

						<!-- Analysis Results -->
						{#if potionAnalyses[potion.id]}
							{@const analysis = potionAnalyses[potion.id]}
							<div class="border-primary/20 bg-primary/5 rounded-lg border p-4">
								<div class="mb-3 flex items-center space-x-2">
									<svelte:component
										this={getEffectivenessIcon(analysis.effectiveness)}
										size={16}
										class={getEffectivenessColor(analysis.effectiveness)}
									/>
									<h4 class="text-base-content text-sm font-semibold">
										{getEffectivenessText(analysis.effectiveness)}
									</h4>
								</div>
								<p class="text-base-content/80 mb-2 text-sm">{analysis.summary}</p>
								{#if analysis.recommendations}
									<div class="text-base-content/70 text-xs">
										<span class="font-medium">Recommendation:</span>
										{analysis.recommendations}
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
