<script lang="ts">
	import { onMount } from 'svelte';
	import { BookOpen, Plus, Calendar, Tag } from 'lucide-svelte';
	import type { JournalEntryWithTags } from '$lib/types.js';
	
	let entries: JournalEntryWithTags[] = $state([]);
	let loading = $state(true);
	let page = $state(1);
	let hasMore = $state(true);
	
	onMount(async () => {
		await loadEntries();
	});
	
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
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Journal</h1>
			<p class="text-base-content/70 mt-1">Your personal reflection space</p>
		</div>
		<a href="/journal/new" class="btn btn-primary gap-2">
			<Plus size={20} />
			New Entry
		</a>
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
