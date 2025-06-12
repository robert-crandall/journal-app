<script lang="ts">
	import { onMount } from 'svelte';
	import { Tag, Plus, Search, X } from 'lucide-svelte';
	
	interface ContentTag {
		id: string;
		userId: string;
		name: string;
		createdAt: string;
	}
	
	let tags = $state<ContentTag[]>([]);
	let filteredTags = $state<ContentTag[]>([]);
	let searchQuery = $state('');
	let loading = $state(true);
	let error = $state('');
	
	$effect(() => {
		filteredTags = searchQuery
			? tags.filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: tags;
	});
	
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
				tags = data.tags || [];
				// Initial filtering
				filteredTags = tags;
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load tags';
			}
		} catch (err) {
			console.error('Error loading tags:', err);
			error = 'An error occurred while loading tags';
		} finally {
			loading = false;
		}
	}
	
	function clearSearch() {
		searchQuery = '';
	}
</script>

<svelte:head>
	<title>Tags - Journal App</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-base-content">Tags</h1>
			<p class="text-base-content/70 mt-1">Manage your journal content tags</p>
		</div>
		<a href="/tags/new" class="btn btn-primary gap-2">
			<Plus size={20} />
			New Tag
		</a>
	</div>
	
	<!-- Search Bar -->
	<div class="flex items-center gap-2 max-w-md">
		<div class="relative flex-1">
			<input
				type="text"
				class="input input-bordered w-full pl-10 pr-10"
				placeholder="Search tags..."
				bind:value={searchQuery}
			/>
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
			{#if searchQuery}
				<button 
					class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
					on:click={clearSearch}
				>
					<X size={16} />
				</button>
			{/if}
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadTags}>Retry</button>
		</div>
	{/if}

	<!-- Tags List -->
	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if tags.length === 0}
		<div class="text-center py-16">
			<Tag size={64} class="mx-auto text-base-content/30 mb-4" />
			<h2 class="text-xl font-semibold mb-2">No tags yet</h2>
			<p class="text-base-content/70 mb-6">Create tags to organize your journal entries</p>
			<a href="/tags/new" class="btn btn-primary gap-2">
				<Plus size={20} />
				Create First Tag
			</a>
		</div>
	{:else if filteredTags.length === 0}
		<div class="text-center py-12">
			<p class="text-base-content/70 mb-4">No tags match your search</p>
			<button class="btn btn-outline btn-sm" on:click={clearSearch}>Clear Search</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each filteredTags as tag (tag.id)}
				<a 
					href="/tags/{tag.id}" 
					class="card bg-base-100 border border-base-300 hover:border-base-400 transition-colors hover:shadow-sm"
				>
					<div class="card-body p-4">
						<div class="flex items-center gap-2">
							<Tag size={18} />
							<h3 class="font-medium">{tag.name}</h3>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
