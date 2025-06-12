<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Tag, Edit, Trash, BookOpen } from 'lucide-svelte';
	
	interface ContentTag {
		id: string;
		userId: string;
		name: string;
		createdAt: string;
	}
	
	interface JournalEntry {
		id: string;
		title: string | null;
		createdAt: string;
	}
	
	let tag = $state<ContentTag | null>(null);
	let usageCount = $state(0);
	let journalEntries = $state<JournalEntry[]>([]);
	let loading = $state(true);
	let error = $state('');
	let showDeleteConfirm = $state(false);
	let deleteLoading = $state(false);
	
	onMount(async () => {
		await loadTagDetails();
	});
	
	async function loadTagDetails() {
		try {
			loading = true;
			error = '';
			const tagId = $page.params.id;
			
			const response = await fetch(`/api/tags/${tagId}`);
			
			if (response.ok) {
				const data = await response.json();
				tag = data.tag;
				usageCount = data.usageCount;
				journalEntries = data.journalEntries || [];
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to load tag details';
			}
		} catch (err) {
			console.error('Error loading tag details:', err);
			error = 'An error occurred while loading tag details';
		} finally {
			loading = false;
		}
	}
	
	async function deleteTag() {
		if (!tag) return;
		
		deleteLoading = true;
		
		try {
			const response = await fetch(`/api/tags/${tag.id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				goto('/tags');
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to delete tag';
				showDeleteConfirm = false;
			}
		} catch (err) {
			console.error('Error deleting tag:', err);
			error = 'An error occurred while deleting the tag';
			showDeleteConfirm = false;
		} finally {
			deleteLoading = false;
		}
	}
	
	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{tag ? tag.name : 'Tag'} - Journal App</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/tags" class="btn btn-ghost btn-sm">
				<ArrowLeft size={16} />
				Back to Tags
			</a>
			<div class="divider divider-horizontal"></div>
			<div class="flex items-center gap-2">
				<Tag size={20} />
				<h1 class="text-2xl font-bold">{tag?.name || 'Tag Details'}</h1>
			</div>
		</div>
		
		{#if tag}
			<div class="flex items-center gap-2">
				<a href="/tags/{tag.id}/edit" class="btn btn-ghost btn-sm">
					<Edit size={16} />
					Edit
				</a>
				<button class="btn btn-error btn-sm" on:click={() => showDeleteConfirm = true}>
					<Trash size={16} />
					Delete
				</button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
			<button class="btn btn-sm" on:click={loadTagDetails}>Retry</button>
		</div>
	{:else if tag}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Tag Info -->
			<div class="card bg-base-100 border border-base-300">
				<div class="card-body">
					<h2 class="card-title">Tag Information</h2>
					<div class="space-y-4 mt-2">
						<div>
							<div class="text-sm text-base-content/70">Name</div>
							<div class="font-medium flex items-center gap-2">
								<Tag size={16} />
								{tag.name}
							</div>
						</div>
						
						<div>
							<div class="text-sm text-base-content/70">Created</div>
							<div>{formatDate(tag.createdAt)}</div>
						</div>
						
						<div>
							<div class="text-sm text-base-content/70">Usage</div>
							<div class="font-medium">
								Used in {usageCount} {usageCount === 1 ? 'entry' : 'entries'}
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Journal Entries -->
			<div class="md:col-span-2">
				<div class="card bg-base-100 border border-base-300">
					<div class="card-body">
						<h2 class="card-title flex items-center gap-2">
							<BookOpen size={18} />
							Journal Entries
						</h2>
						
						{#if journalEntries.length === 0}
							<div class="text-center py-6 text-base-content/70">
								<p>This tag hasn't been used in any journal entries yet</p>
							</div>
						{:else}
							<div class="mt-3">
								<ul class="divide-y divide-base-300">
									{#each journalEntries as entry}
										<li class="py-3">
											<a href="/journal/{entry.id}" class="block hover:bg-base-200 transition-colors rounded-md p-2 -mx-2">
												<div class="font-medium">{entry.title || 'Untitled Entry'}</div>
												<div class="text-sm text-base-content/70">{formatDate(entry.createdAt)}</div>
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="alert alert-error">
			<span>Tag not found</span>
			<a href="/tags" class="btn btn-sm">Back to Tags</a>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="card bg-base-100 max-w-md w-full">
			<div class="card-body">
				<h2 class="card-title text-error">Delete Tag?</h2>
				<p>Are you sure you want to delete the tag "{tag?.name}"?</p>
				
				{#if usageCount > 0}
					<div class="alert alert-warning mt-2">
						<span>This tag is used in {usageCount} {usageCount === 1 ? 'journal entry' : 'journal entries'}. 
						Deleting it will remove it from all entries.</span>
					</div>
				{/if}
				
				<div class="card-actions justify-end mt-4">
					<button class="btn btn-ghost" on:click={() => showDeleteConfirm = false} disabled={deleteLoading}>
						Cancel
					</button>
					<button class="btn btn-error" on:click={deleteTag} disabled={deleteLoading}>
						{#if deleteLoading}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							Delete
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
