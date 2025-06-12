<script lang="ts">
	import { onMount } from 'svelte';
	import { Target, Plus, Calendar, AlertCircle } from 'lucide-svelte';
	import type { Experiment } from '$lib/types';
	
	let experiments = $state<Experiment[]>([]);
	let loading = $state(true);
	let page = $state(1);
	let hasMore = $state(true);
	let activeExperimentsOnly = $state(false);
	
	onMount(async () => {
		await loadExperiments();
	});
	
	async function loadExperiments(reset = false) {
		try {
			loading = true;
			const currentPage = reset ? 1 : page;
			const activeParam = activeExperimentsOnly ? 'true' : '';
			
			const response = await fetch(`/api/experiments?page=${currentPage}&limit=10${activeParam ? `&active=${activeParam}` : ''}`);
			
			if (response.ok) {
				const data = await response.json();
				if (reset) {
					experiments = data.experiments;
				} else {
					experiments = [...experiments, ...data.experiments];
				}
				hasMore = data.experiments.length === 10;
				page = currentPage + 1;
			}
		} catch (error) {
			console.error('Error loading experiments:', error);
		} finally {
			loading = false;
		}
	}
	
	function toggleActiveFilter() {
		activeExperimentsOnly = !activeExperimentsOnly;
		loadExperiments(true);
	}
	
	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function calculateProgress(startDate: string | Date, endDate: string | Date) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const now = new Date();
		
		// If the experiment hasn't started yet
		if (now < start) return 0;
		
		// If the experiment is already over
		if (now > end) return 100;
		
		// Calculate progress
		const total = end.getTime() - start.getTime();
		const current = now.getTime() - start.getTime();
		return Math.round((current / total) * 100);
	}
	
	function getExperimentStatus(experiment: Experiment) {
		const now = new Date();
		const start = new Date(experiment.startDate);
		const end = new Date(experiment.endDate);
		
		if (!experiment.isActive) return 'Inactive';
		if (now < start) return 'Upcoming';
		if (now > end) return 'Completed';
		return 'Active';
	}
</script>

<svelte:head>
	<title>Experiments - Journal App</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Experiments</h1>
			<p class="text-base-content/70 mt-1">Track your personal quests and research</p>
		</div>
		<a href="/experiments/new" class="btn btn-primary gap-2">
			<Plus size={20} />
			New Experiment
		</a>
	</div>
	
	<!-- Filters -->
	<div class="flex flex-wrap gap-2">
		<button 
			class="btn btn-sm {activeExperimentsOnly ? 'btn-secondary' : 'btn-outline'}" 
			onclick={toggleActiveFilter}
		>
			{activeExperimentsOnly ? 'Showing Active Only' : 'Show All Experiments'}
		</button>
	</div>

	<!-- Experiments List -->
	{#if loading && experiments.length === 0}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if experiments.length === 0}
		<div class="text-center py-16">
			<Target size={64} class="mx-auto text-base-content/30 mb-4" />
			<h2 class="text-xl font-semibold mb-2">No experiments yet</h2>
			<p class="text-base-content/70 mb-6">Start a new personal experiment to track and measure your growth</p>
			<a href="/experiments/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				Create First Experiment
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each experiments as experiment}
				{@const status = getExperimentStatus(experiment)}
				{@const progress = calculateProgress(experiment.startDate, experiment.endDate)}
				
				<div class="card bg-base-100 border border-base-300 hover:border-base-400 transition-colors">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<a href="/experiments/{experiment.id}" class="hover:underline">
									<h3 class="font-semibold text-lg">{experiment.title}</h3>
								</a>
								
								{#if experiment.description}
									<p class="text-base-content/70 mt-1 line-clamp-2">{experiment.description}</p>
								{/if}
								
								<div class="flex flex-wrap gap-3 items-center mt-3">
									<div class="flex items-center gap-1 text-sm text-base-content/60">
										<Calendar size={16} />
										<span>{formatDate(experiment.startDate)} - {formatDate(experiment.endDate)}</span>
									</div>
									
									<div class="badge {status === 'Active' ? 'badge-success' : 
									            status === 'Upcoming' ? 'badge-info' : 
												status === 'Completed' ? 'badge-neutral' : 
												'badge-ghost'}">
										{status}
									</div>
								</div>
								
								{#if status === 'Active'}
									<div class="mt-4">
										<div class="flex justify-between text-xs mb-1">
											<span>Progress</span>
											<span>{progress}%</span>
										</div>
										<progress class="progress progress-success w-full" value={progress} max="100"></progress>
									</div>
								{/if}
							</div>
							
							<a href="/experiments/{experiment.id}" class="btn btn-ghost btn-sm btn-circle">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			{/each}
			
			{#if hasMore}
				<div class="flex justify-center pt-4">
					<button class="btn btn-outline" onclick={() => loadExperiments()} disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							Load More
						{/if}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
