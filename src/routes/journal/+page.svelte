<script lang="ts">
	import { onMount } from 'svelte';
	import { BookOpen, Plus, Calendar, Tag, Search, X, Filter } from 'lucide-svelte';
	import type { JournalEntryWithTags } from '$lib/types.js';
	import type { ContentTag } from '$lib/server/db/schema';
	
	let entries: JournalEntryWithTags[] = $state([]);
	let tags: ContentTag[] = $state([]);
	let selectedTagIds: string[] = $state([]);
	let searchQuery = $state('');
	let loading = $state(true);
	let tagsLoading = $state(true); 
	let page = $state(1);
	let hasMore = $state(true);
	let filterExpanded = $state(false);
	
	onMount(async () => {
		await Promise.all([loadEntries(), loadTags()]);
	});
	
	async function loadTags() {
		try {
			tagsLoading = true;
			const response = await fetch('/api/tags');
			
			if (response.ok) {
				const data = await response.json();
				tags = data.tags || [];
			}
		} catch (error) {
			console.error('Error loading tags:', error);
		} finally {
			tagsLoading = false;
		}
	}
	
	async function loadEntries(reset = false) {
		try {
			loading = true;
			const currentPage = reset ? 1 : page;
			const response = await fetch(`/api/journal?page=${currentPage}&limit=10`);
			
			if (response.ok) {
				const data = await response.json();
				if (reset) {
					entries = data.entries;
				} else {
					entries = [...entries, ...data.entries];
				}
				hasMore = data.entries.length === 10;
				page = currentPage + 1;
			}
		} catch (error) {
			console.error('Error loading journal entries:', error);
		} finally {
			loading = false;
		}
	}
	
	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	function formatTimeAgo(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		const now = new Date();
		const diffMs = now.getTime() - dateObj.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		return `${Math.floor(diffDays / 30)} months ago`;
	}
</script>

<svelte:head>
	<title>Journal - Journal App</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Journal</h1>
			<p class="text-base-content/70 mt-1">Your personal reflection space</p>
		</div>
		<a href="/journal/new" class="btn btn-primary gap-2">
			<Plus size={20} />
			New Entry
		</a>
	</div>
	
	<!-- Search & Filter -->
	<div class="space-y-3">
		<!-- Search Bar -->
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<input
					type="text"
					class="input input-bordered w-full pl-10 pr-10"
					placeholder="Search journal entries..."
					bind:value={searchQuery}
				/>
				<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
				{#if searchQuery}
					<button 
						class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
						onclick={() => searchQuery = ''}
					>
						<X size={16} />
					</button>
				{/if}
			</div>
			
			<button 
				class="btn btn-outline {filterExpanded ? 'btn-primary' : ''} gap-1"
				onclick={() => filterExpanded = !filterExpanded}
			>
				<Filter size={18} />
				{#if selectedTagIds.length > 0}
					<span class="badge badge-sm">{selectedTagIds.length}</span>
				{/if}
			</button>
		</div>
		
		<!-- Tags Filters -->
		{#if filterExpanded}
			<div class="bg-base-200 p-4 rounded-lg border border-base-300">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="font-medium flex items-center gap-2">
						<Tag size={16} />
						Filter by Tags
					</h3>
					{#if selectedTagIds.length > 0}
						<button 
							class="btn btn-sm btn-ghost text-xs"
							onclick={() => selectedTagIds = []}
						>
							Clear All
						</button>
					{/if}
				</div>
				
				{#if tagsLoading}
					<div class="flex justify-center py-4">
						<span class="loading loading-spinner loading-sm"></span>
					</div>
				{:else if tags.length === 0}
					<div class="text-center py-4 text-sm text-base-content/70">
						You haven't created any tags yet.
						<a href="/tags/new" class="link link-primary">Create your first tag</a>
					</div>
				{:else}
					<div class="flex flex-wrap gap-2">
						{#each tags as tag}
							<button
								class="badge {selectedTagIds.includes(tag.id) ? 'badge-primary' : 'badge-outline'} cursor-pointer"
								onclick={() => {
									if (selectedTagIds.includes(tag.id)) {
										selectedTagIds = selectedTagIds.filter(id => id !== tag.id);
									} else {
										selectedTagIds = [...selectedTagIds, tag.id];
									}
								}}
							>
								{tag.name}
							</button>
						{/each}
						<a href="/tags" class="badge badge-ghost badge-sm gap-1">
							<Plus size={10} />
							Manage Tags
						</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Entries List -->
	{#if loading && entries.length === 0}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if entries.length === 0}
		<div class="text-center py-16">
			<BookOpen size={64} class="mx-auto text-base-content/30 mb-4" />
			<h2 class="text-xl font-semibold mb-2">No journal entries yet</h2>
			<p class="text-base-content/70 mb-6">Start your journaling journey by creating your first entry</p>
			<a href="/journal/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				Start Journaling
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each entries as entry}
				<div class="card bg-base-100 border border-base-300 hover:border-base-400 transition-colors">
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<Calendar size={16} class="text-base-content/50" />
									<span class="text-sm text-base-content/70">
										{formatDate(entry.createdAt)}
									</span>
									<span class="text-xs text-base-content/50">
										({formatTimeAgo(entry.createdAt)})
									</span>
								</div>
								
								<a href="/journal/{entry.id}" class="block hover:text-primary transition-colors">
									<h2 class="text-xl font-semibold mb-2">
										{entry.title || 'Untitled Entry'}
									</h2>
								</a>
								
								{#if entry.synopsis}
									<p class="text-base-content/80 mb-3">
										{entry.synopsis}
									</p>
								{/if}
								
								<!-- Tags -->
								<div class="flex flex-wrap gap-2 mb-3">
									{#if entry.contentTags?.length > 0}
										{#each entry.contentTags as tag}
											<span class="badge badge-outline badge-sm gap-1">
												<Tag size={12} />
												{tag.name}
											</span>
										{/each}
									{/if}
									
									{#if entry.toneTags?.length > 0}
										{#each entry.toneTags as tag}
											<span class="badge badge-primary badge-sm">
												{tag.name}
											</span>
										{/each}
									{/if}
									
									{#if entry.characterTags?.length > 0}
										{#each entry.characterTags as tag}
											<span class="badge badge-secondary badge-sm">
												{tag.name} +{tag.xpGained}XP
											</span>
										{/each}
									{/if}
								</div>
							</div>
							
							<!-- Processing Status -->
							<div class="flex flex-col items-end gap-2">
								{#if entry.isProcessed}
									<div class="badge badge-success badge-sm">Processed</div>
								{:else if entry.conversationData?.length > 0}
									<div class="badge badge-warning badge-sm">In Progress</div>
								{:else}
									<div class="badge badge-ghost badge-sm">Draft</div>
								{/if}
								
								<a href="/journal/{entry.id}" class="btn btn-sm btn-outline">
									View Entry
								</a>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Load More -->
		{#if hasMore}
			<div class="text-center pt-6">
				{#if loading}
					<span class="loading loading-spinner loading-md"></span>
				{:else}
					<button class="btn btn-outline" onclick={() => loadEntries()}>
						Load More Entries
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>
