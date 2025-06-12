<script lang="ts">
	import { Tag, Plus } from 'lucide-svelte';
	import { onMount } from 'svelte';
	
	export let selectedTagIds: string[] = [];
	
	interface ContentTag {
		id: string;
		userId: string;
		name: string;
		createdAt: string;
	}
	
	let allTags: ContentTag[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	
	let filteredTags = $derived(
		searchQuery
			? allTags.filter(tag => 
				tag.name.toLowerCase().includes(searchQuery.toLowerCase())
			  )
			: allTags
	);
	
	onMount(async () => {
		await loadTags();
	});
	
	async function loadTags() {
		try {
			loading = true;
			error = '';
			
			const response = await fetch('/api/tags');
			
			if (response.ok) {
				const data = await response.json();
				allTags = data.tags || [];
			} else {
				error = 'Failed to load tags';
			}
		} catch (err) {
			console.error('Error loading tags:', err);
			error = 'An error occurred while loading tags';
		} finally {
			loading = false;
		}
	}
	
	function toggleTag(tag: ContentTag) {
		if (selectedTagIds.includes(tag.id)) {
			selectedTagIds = selectedTagIds.filter(id => id !== tag.id);
		} else {
			selectedTagIds = [...selectedTagIds, tag.id];
		}
	}
</script>

<div class="space-y-3">
	<div class="flex justify-between items-center">
		<h3 class="font-medium flex items-center gap-2">
			<Tag size={16} />
			Content Tags
		</h3>
		<a href="/tags/new" class="btn btn-ghost btn-xs gap-1" target="_blank">
			<Plus size={12} />
			New Tag
		</a>
	</div>
	
	<!-- Search -->
	{#if allTags.length > 0}
		<div class="relative">
			<input
				type="text"
				class="input input-sm input-bordered w-full pl-8"
				placeholder="Search tags..."
				bind:value={searchQuery}
			/>
			<Tag size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
		</div>
	{/if}
	
	<!-- Tag List -->
	{#if loading}
		<div class="flex justify-center py-2">
			<span class="loading loading-spinner loading-sm"></span>
		</div>
	{:else if error}
		<div class="alert alert-error alert-sm">
			<span class="text-xs">{error}</span>
			<button class="btn btn-xs" on:click={loadTags}>Retry</button>
		</div>
	{:else if allTags.length === 0}
		<div class="text-center py-2 text-sm text-base-content/70">
			You haven't created any tags yet.
		</div>
	{:else if filteredTags.length === 0}
		<div class="text-center py-2 text-sm text-base-content/70">
			No tags match your search.
		</div>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each filteredTags as tag (tag.id)}
				<button
					class="badge {selectedTagIds.includes(tag.id) ? 'badge-primary' : 'badge-outline'} cursor-pointer"
					on:click={() => toggleTag(tag)}
				>
					{tag.name}
				</button>
			{/each}
		</div>
	{/if}
</div>
