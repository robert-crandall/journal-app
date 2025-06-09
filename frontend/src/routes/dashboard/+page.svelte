<script lang="ts">
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import api, { type JournalEntry } from '$lib/api.js';
	import Alert from '$lib/components/Alert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let entries = $state<JournalEntry[]>([]);
	let loading = $state(true);
	let error = $state('');
	let stats = $state({
		totalEntries: 0,
		thisWeek: 0,
		thisMonth: 0
	});

	onMount(async () => {
		try {
			// Fetch recent entries for dashboard
			const fetchedEntries = await api.getJournalEntries({ limit: 5 });
			entries = fetchedEntries.map(entry => ({
				...entry,
				createdAt: entry.created_at,
				updatedAt: entry.updated_at,
				sessionId: entry.session_id
			}));

			// Calculate stats
			const now = new Date();
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

			stats = {
				totalEntries: entries.length,
				thisWeek: entries.filter(entry => new Date(entry.createdAt) >= weekAgo).length,
				thisMonth: entries.filter(entry => new Date(entry.createdAt) >= monthAgo).length
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Dashboard | Journal</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-base-content mb-2">Dashboard</h1>
		<p class="text-base-content/70">Welcome back! Here's your journaling activity.</p>
	</div>

	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<Alert type="error" message={error} />
	{:else}
		<div class="space-y-8">
			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="stat bg-base-100 rounded-lg shadow-sm">
					<div class="stat-title">Total Entries</div>
					<div class="stat-value text-primary">{stats.totalEntries}</div>
					<div class="stat-desc">All time</div>
				</div>
				
				<div class="stat bg-base-100 rounded-lg shadow-sm">
					<div class="stat-title">This Week</div>
					<div class="stat-value text-secondary">{stats.thisWeek}</div>
					<div class="stat-desc">Last 7 days</div>
				</div>
				
				<div class="stat bg-base-100 rounded-lg shadow-sm">
					<div class="stat-title">This Month</div>
					<div class="stat-value text-accent">{stats.thisMonth}</div>
					<div class="stat-desc">Last 30 days</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<h2 class="card-title">Quick Actions</h2>
					<div class="flex flex-wrap gap-4 mt-4">
						<a href="/journal/new" class="btn btn-primary">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							Start New Journal Entry
						</a>
						<a href="/journal" class="btn btn-outline">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
							View All Entries
						</a>
					</div>
				</div>
			</div>

			<!-- Recent Entries -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">Recent Entries</h2>
						<a href="/journal" class="btn btn-ghost btn-sm">View all</a>
					</div>
					
					{#if entries.length === 0}
						<div class="text-center py-8">
							<svg class="w-16 h-16 mx-auto text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
							<p class="text-base-content/70 mb-4">No journal entries yet</p>
							<a href="/journal/new" class="btn btn-primary">Create your first entry</a>
						</div>
					{:else}
						<div class="space-y-4">
							{#each entries as entry}
								<div class="flex items-start gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
									<div class="flex-1">
										<h3 class="font-medium text-base-content">
											<a href="/journal/{entry.id}" class="hover:text-primary transition-colors">
												{entry.title}
											</a>
										</h3>
										<p class="text-sm text-base-content/70 mt-1 line-clamp-2">
											{entry.content.substring(0, 100)}...
										</p>
										<div class="flex items-center gap-4 mt-2 text-xs text-base-content/60">
											<span>{format(new Date(entry.createdAt), 'MMM d, yyyy')}</span>
											{#if entry.tags.length > 0}
												<span>•</span>
												<div class="flex gap-1">
													{#each entry.tags.slice(0, 3) as tag}
														<span class="badge badge-xs badge-outline">{tag}</span>
													{/each}
													{#if entry.tags.length > 3}
														<span class="badge badge-xs">+{entry.tags.length - 3}</span>
													{/if}
												</div>
											{/if}
										</div>
									</div>
									<a href="/journal/{entry.id}" class="btn btn-ghost btn-sm" aria-label="View entry">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
										</svg>
									</a>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
