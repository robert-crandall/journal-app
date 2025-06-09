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
	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	// Form data
	let title = $state('');
	let content = $state('');
	let mood_score = $state<number | null>(null);
	let is_private = $state(false);
	let tags_input = $state('');

	const entryId = $page.params.id;

	onMount(async () => {
		try {
			const fetchedEntry = await api.getEntry(entryId);
			entry = {
				...fetchedEntry,
				createdAt: fetchedEntry.created_at,
				updatedAt: fetchedEntry.updated_at,
				sessionId: fetchedEntry.session_id
			};

			// Initialize form data
			title = entry.title;
			content = entry.content;
			mood_score = entry.mood_score;
			is_private = entry.is_private;
			tags_input = entry.tags.join(', ');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load entry';
		} finally {
			loading = false;
		}
	});

	async function handleSave(event: Event) {
		event.preventDefault();
		
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}

		if (!content.trim()) {
			error = 'Content is required';
			return;
		}

		saving = true;
		error = '';
		success = '';

		try {
			const tags = tags_input
				.split(',')
				.map(tag => tag.trim())
				.filter(tag => tag.length > 0);

			await api.updateJournalEntry(entryId, {
				title: title.trim(),
				content: content.trim(),
				mood_score,
				is_private,
				tags
			});

			success = 'Entry updated successfully!';
			setTimeout(() => {
				goto(`/journal/${entryId}`);
			}, 1500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update entry';
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto(`/journal/${entryId}`);
	}

	function handleBack() {
		goto('/journal');
	}
</script>

<svelte:head>
	<title>Edit Entry | Journal</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	{#if loading}
		<LoadingSpinner />
	{:else if error && !entry}
		<div class="space-y-4">
			<Alert type="error" message={error} />
			<button onclick={handleBack} class="btn btn-outline">
				← Back to Journal
			</button>
		</div>
	{:else if entry}
		<!-- Header -->
		<div class="mb-8">
			<div class="space-y-2">
				<button onclick={handleBack} class="btn btn-ghost btn-sm">
					← Back to Journal
				</button>
				<h1 class="text-3xl font-bold text-base-content">Edit Entry</h1>
				<div class="text-sm text-base-content/70">
					Created {format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')} at {format(new Date(entry.createdAt), 'h:mm a')}
				</div>
			</div>
		</div>

		<!-- Alerts -->
		{#if error}
			<div class="mb-6">
				<Alert type="error" message={error} />
			</div>
		{/if}

		{#if success}
			<div class="mb-6">
				<Alert type="success" message={success} />
			</div>
		{/if}

		<!-- Edit Form -->
		<form onsubmit={handleSave} class="space-y-6">
			<!-- Title -->
			<div class="form-control">
				<label class="label" for="title">
					<span class="label-text font-medium">Title</span>
				</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="What's on your mind?"
					class="input input-bordered w-full"
					required
					disabled={saving}
				/>
			</div>

			<!-- Content -->
			<div class="form-control">
				<label class="label" for="content">
					<span class="label-text font-medium">Content</span>
				</label>
				<textarea
					id="content"
					bind:value={content}
					placeholder="Share your thoughts..."
					class="textarea textarea-bordered h-64 resize-none"
					required
					disabled={saving}
				></textarea>
			</div>

			<!-- Options Row -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Mood Score -->
				<div class="form-control">
					<label class="label" for="mood">
						<span class="label-text font-medium">Mood Score (1-10)</span>
					</label>
					<input
						id="mood"
						type="number"
						bind:value={mood_score}
						min="1"
						max="10"
						placeholder="Optional"
						class="input input-bordered w-full"
						disabled={saving}
					/>
				</div>

				<!-- Tags -->
				<div class="form-control">
					<label class="label" for="tags">
						<span class="label-text font-medium">Tags</span>
						<span class="label-text-alt">Separate with commas</span>
					</label>
					<input
						id="tags"
						type="text"
						bind:value={tags_input}
						placeholder="mood, reflection, gratitude"
						class="input input-bordered w-full"
						disabled={saving}
					/>
				</div>
			</div>

			<!-- Privacy -->
			<div class="form-control">
				<label class="cursor-pointer label justify-start gap-3">
					<input
						type="checkbox"
						bind:checked={is_private}
						class="checkbox checkbox-primary"
						disabled={saving}
					/>
					<div>
						<span class="label-text font-medium">Private Entry</span>
						<div class="text-sm text-base-content/70">Only you can see this entry</div>
					</div>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-3 pt-4">
				<button
					type="submit"
					class="btn btn-primary flex-1 sm:flex-none"
					disabled={saving || !title.trim() || !content.trim()}
				>
					{#if saving}
						<span class="loading loading-spinner loading-sm"></span>
						Saving...
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Save Changes
					{/if}
				</button>
				
				<button
					type="button"
					onclick={handleCancel}
					class="btn btn-outline flex-1 sm:flex-none"
					disabled={saving}
				>
					Cancel
				</button>
			</div>
		</form>

		<!-- Entry Metadata (Read-only) -->
		<div class="mt-12 pt-8 border-t border-base-300">
			<h3 class="text-lg font-semibold mb-4">Entry Information</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
				<div>
					<span class="font-medium text-base-content/70">Created:</span>
					<span class="ml-2">{format(new Date(entry.createdAt), 'PPP p')}</span>
				</div>
				<div>
					<span class="font-medium text-base-content/70">Last Updated:</span>
					<span class="ml-2">{format(new Date(entry.updatedAt), 'PPP p')}</span>
				</div>
				{#if entry.sessionId}
					<div class="sm:col-span-2">
						<span class="font-medium text-base-content/70">Session ID:</span>
						<span class="ml-2 font-mono text-xs">{entry.sessionId}</span>
					</div>
				{/if}
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
