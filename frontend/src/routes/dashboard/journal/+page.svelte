<script lang="ts">
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import api, { type JournalEntry } from '$lib/api.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let entries = $state<JournalEntry[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let searchTerm = $state('');
	let selectedTag = $state('');
	let allTags = $state<string[]>([]);

	onMount(async () => {
		await loadEntries();
	});

	async function loadEntries() {
		isLoading = true;
		error = '';

		try {
			const params: any = {};
			if (selectedTag) params.tag = selectedTag;
			
			entries = await api.getJournalEntries(params);
			
			// Extract all unique tags
			const tagSet = new Set<string>();
			entries.forEach(entry => {
				entry.tags?.forEach(tag => tagSet.add(tag));
			});
			allTags = Array.from(tagSet).sort();
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load journal entries';
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string) {
		return format(new Date(dateString), 'MMM d, yyyy');
	}

	function formatTime(dateString: string) {
		return format(new Date(dateString), 'h:mm a');
	}

	function clearError() {
		error = '';
	}

	async function handleTagFilter(tag: string) {
		selectedTag = tag === selectedTag ? '' : tag;
		await loadEntries();
	}

	// Filter entries based on search term
	const filteredEntries = $derived(() => {
		if (!searchTerm.trim()) return entries;
		
		const search = searchTerm.toLowerCase();
		return entries.filter(entry => 
			entry.title.toLowerCase().includes(search) ||
			entry.content.toLowerCase().includes(search) ||
			entry.tags?.some(tag => tag.toLowerCase().includes(search))
		);
	});
</script>

<svelte:head>
	<title>My Journal Entries - Journal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-base-content">My Journal Entries</h1>
			<p class="text-base-content/70 mt-1">
				{entries.length} {entries.length === 1 ? 'entry' : 'entries'}
			</p>
		</div>
		<a href="/journal/new" class="btn btn-primary">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
			</svg>
			New Entry
		</a>
	</div>

	{#if error}
		<Alert message={error} type="error" onDismiss={clearError} />
	{/if}

	<!-- Filters -->
	<div class="card bg-base-100 shadow-lg">
		<div class="card-body">
			<div class="flex flex-col sm:flex-row gap-4">
				<!-- Search -->
				<div class="form-control flex-1">
					<label class="label" for="search">
						<span class="label-text">Search entries</span>
					</label>
					<input
						id="search"
						type="text"
						bind:value={searchTerm}
						class="input input-bordered focus-ring"
						placeholder="Search by title, content, or tags..."
					/>
				</div>

				<!-- Tag filter -->
				{#if allTags.length > 0}
					<div class="form-control">
						<label class="label">
							<span class="label-text">Filter by tag</span>
						</label>
						<div class="flex flex-wrap gap-2">
							{#each allTags.slice(0, 6) as tag}
								<button
									class="badge badge-lg cursor-pointer transition-colors {selectedTag === tag ? 'badge-primary' : 'badge-ghost hover:badge-neutral'}"
									onclick={() => handleTagFilter(tag)}
								>
									{tag}
								</button>
							{/each}
							{#if selectedTag}
								<button
									class="badge badge-lg badge-error cursor-pointer"
									onclick={() => handleTagFilter('')}
									title="Clear filter"
								>
									✕
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Entries -->
	{#if isLoading}
		<div class="flex justify-center py-8">
			<LoadingSpinner size="lg" />
		</div>
	{:else if filteredEntries.length === 0}
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body text-center py-16">
				{#if entries.length === 0}
					<svg class="w-16 h-16 mx-auto text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
					</svg>
					<h3 class="text-xl font-medium text-base-content mt-4">No journal entries yet</h3>
					<p class="text-base-content/70 mt-2">Start your journaling journey today!</p>
					<a href="/journal/new" class="btn btn-primary mt-6">
						Write Your First Entry
					</a>
				{:else}
					<svg class="w-16 h-16 mx-auto text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
					<h3 class="text-xl font-medium text-base-content mt-4">No matching entries</h3>
					<p class="text-base-content/70 mt-2">Try adjusting your search or filter criteria</p>
					<button 
						class="btn btn-ghost mt-4"
						onclick={() => { searchTerm = ''; selectedTag = ''; }}
					>
						Clear Filters
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each filteredEntries as entry}
				<div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h2 class="card-title text-lg">
									<a href="/journal/{entry.id}" class="hover:text-primary transition-colors">
										{entry.title}
									</a>
								</h2>
								<p class="text-base-content/70 mt-2 line-clamp-3">
									{entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content}
								</p>
								<div class="flex items-center gap-4 mt-4 text-sm text-base-content/50">
									<span>{formatDate(entry.created_at)}</span>
									<span>{formatTime(entry.created_at)}</span>
									{#if entry.is_private}
										<span class="badge badge-sm badge-ghost">
											<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
											</svg>
											Private
										</span>
									{/if}
								</div>
							</div>
							<div class="flex flex-col items-end gap-2">
								{#if entry.mood_score}
									<div class="badge badge-primary badge-sm">
										Mood: {entry.mood_score}/10
									</div>
								{/if}
								<div class="dropdown dropdown-end">
									<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle">
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
										</svg>
									</div>
									<ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 z-10">
										<li><a href="/journal/{entry.id}">View</a></li>
										<li><a href="/journal/{entry.id}/edit">Edit</a></li>
									</ul>
								</div>
							</div>
						</div>
						{#if entry.tags && entry.tags.length > 0}
							<div class="flex flex-wrap gap-2 mt-4">
								{#each entry.tags as tag}
									<button
										class="badge badge-sm badge-ghost hover:badge-neutral cursor-pointer"
										onclick={() => handleTagFilter(tag)}
									>
										{tag}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
