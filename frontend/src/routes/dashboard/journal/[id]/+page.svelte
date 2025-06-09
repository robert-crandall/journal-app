<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import { api, type JournalEntry } from '$lib/api.js';
	import Alert from '$lib/components/Alert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let entry = $state<JournalEntry | null>(null);
	let loading = $state(true);
	let error = $state('');

	const entryId = $page.params.id;

	onMount(async () => {
		try {
			const fetchedEntry = await api.getEntry(entryId);
			// Add compatibility aliases
			entry = {
				...fetchedEntry,
				createdAt: fetchedEntry.created_at,
				updatedAt: fetchedEntry.updated_at,
				sessionId: fetchedEntry.session_id,
				mood: fetchedEntry.mood_score ? `Score: ${fetchedEntry.mood_score}` : undefined
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load entry';
		} finally {
			loading = false;
		}
	});

	function handleEdit() {
		goto(`/journal/${entryId}/edit`);
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
			return;
		}

		try {
			await api.deleteEntry(entryId);
			goto('/journal');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete entry';
		}
	}

	function handleBack() {
		goto('/journal');
	}
</script>

<svelte:head>
	<title>{entry ? `${entry.title} | Journal` : 'Journal Entry'}</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	{#if loading}
		<LoadingSpinner />
	{:else if error}
		<div class="space-y-4">
			<Alert type="error" message={error} />
			<button onclick={handleBack} class="btn btn-outline">
				← Back to Journal
			</button>
		</div>
	{:else if entry}
		<!-- Header -->
		<div class="mb-8">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-2">
					<button onclick={handleBack} class="btn btn-ghost btn-sm">
						← Back to Journal
					</button>
					<h1 class="text-3xl font-bold text-base-content">{entry.title}</h1>
					<div class="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
						<time>{format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')}</time>
						<span>•</span>
						<span>{format(new Date(entry.createdAt), 'h:mm a')}</span>
						{#if entry.mood}
							<span>•</span>
							<span class="badge badge-outline">{entry.mood}</span>
						{/if}
					</div>
				</div>
				
				<div class="flex gap-2">
					<button onclick={handleEdit} class="btn btn-primary btn-sm">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
						</svg>
						Edit
					</button>
					<div class="dropdown dropdown-end">
						<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
							</svg>
						</div>
						<ul class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow">
							<li>
								<button onclick={handleDelete} class="text-error">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
									</svg>
									Delete Entry
								</button>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="space-y-8">
			<!-- Main Content -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<div class="prose prose-lg max-w-none">
						{@html entry.content.replace(/\n/g, '<br>')}
					</div>
				</div>
			</div>

			<!-- Tags -->
			{#if entry.tags && entry.tags.length > 0}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<h3 class="card-title text-lg">Tags</h3>
						<div class="flex flex-wrap gap-2">
							{#each entry.tags as tag}
								<span class="badge badge-outline">{tag}</span>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Metadata -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body">
					<h3 class="card-title text-lg">Details</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium text-base-content/70">Created:</span>
							<span class="ml-2">{format(new Date(entry.createdAt), 'PPP p')}</span>
						</div>
						<div>
							<span class="font-medium text-base-content/70">Updated:</span>
							<span class="ml-2">{format(new Date(entry.updatedAt), 'PPP p')}</span>
						</div>
						{#if entry.mood}
							<div>
								<span class="font-medium text-base-content/70">Mood:</span>
								<span class="ml-2">{entry.mood}</span>
							</div>
						{/if}
						{#if entry.sessionId}
							<div>
								<span class="font-medium text-base-content/70">Session:</span>
								<span class="ml-2 font-mono text-xs">{entry.sessionId}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-8">
			<p class="text-base-content/70">Entry not found</p>
			<button onclick={handleBack} class="btn btn-outline mt-4">
				← Back to Journal
			</button>
		</div>
	{/if}
</div>
