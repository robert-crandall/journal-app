<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import api, { type JournalEntry } from '$lib/api.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let sessionId = $derived($page.params.sessionId);
	
	let title = $state('');
	let content = $state('');
	let moodScore = $state<number | null>(null);
	let isPrivate = $state(false);
	let tags = $state<string[]>([]);
	let newTag = $state('');
	
	let isGenerating = $state(true);
	let isSubmitting = $state(false);
	let error = $state('');
	let generationError = $state('');

	onMount(async () => {
		if (!sessionId) {
			goto('/journal/new');
			return;
		}

		try {
			// This would typically call the GPT service to generate the final entry
			// For now, we'll simulate this process
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Mock generated content - in real implementation, this comes from the backend
			title = "Today's Reflections";
			content = "This is where the GPT-generated journal entry would appear, compiled from the conversation history. It would be written in the user's voice and capture the key themes and insights from their session.";
			
		} catch (err) {
			generationError = err instanceof Error ? err.message : 'Failed to generate journal entry';
		} finally {
			isGenerating = false;
		}
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!title.trim() || !content.trim()) {
			error = 'Title and content are required';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const entry = await api.submitJournalEntry({
				session_id: sessionId,
				title: title.trim(),
				content: content.trim(),
				mood_score: moodScore || undefined,
				is_private: isPrivate,
				tags: tags
			});

			// Success! Navigate to the entry
			goto(`/journal/${entry.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save journal entry';
		} finally {
			isSubmitting = false;
		}
	}

	function addTag() {
		if (!newTag.trim()) return;
		
		const tag = newTag.trim().toLowerCase();
		if (!tags.includes(tag)) {
			tags = [...tags, tag];
		}
		newTag = '';
	}

	function removeTag(tagToRemove: string) {
		tags = tags.filter(tag => tag !== tagToRemove);
	}

	function handleTagKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}

	function clearError() {
		error = '';
	}

	function clearGenerationError() {
		generationError = '';
	}
</script>

<svelte:head>
	<title>Complete Your Entry - Journal</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-base-content">Complete Your Journal Entry</h1>
			<p class="text-base-content/70">Review and customize your AI-generated entry</p>
		</div>
		<button 
			class="btn btn-ghost" 
			onclick={() => goto('/journal/new')}
			disabled={isSubmitting}
		>
			Back to Conversation
		</button>
	</div>

	{#if error}
		<Alert message={error} type="error" onDismiss={clearError} class="mb-6" />
	{/if}

	{#if generationError}
		<Alert message={generationError} type="error" onDismiss={clearGenerationError} class="mb-6" />
	{/if}

	{#if isGenerating}
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body text-center py-16">
				<LoadingSpinner size="lg" />
				<h3 class="text-lg font-medium mt-4">Generating Your Journal Entry</h3>
				<p class="text-base-content/70 mt-2">
					AI is processing your conversation and creating a cohesive journal entry in your voice...
				</p>
			</div>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Title -->
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title mb-4">Entry Details</h2>
					
					<div class="form-control">
						<label class="label" for="title">
							<span class="label-text font-medium">Title</span>
						</label>
						<input
							id="title"
							type="text"
							bind:value={title}
							class="input input-bordered focus-ring"
							placeholder="Give your entry a title..."
							required
							disabled={isSubmitting}
						/>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title mb-4">Your Journal Entry</h2>
					
					<div class="form-control">
						<label class="label" for="content">
							<span class="label-text font-medium">Content</span>
						</label>
						<textarea
							id="content"
							bind:value={content}
							class="textarea textarea-bordered h-64 focus-ring prose-journal"
							placeholder="Your journal entry content..."
							required
							disabled={isSubmitting}
						></textarea>
						<div class="label">
							<span class="label-text-alt">Feel free to edit or add to the AI-generated content</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Metadata -->
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title mb-4">Additional Details</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Mood Score -->
						<div class="form-control">
							<label class="label" for="mood">
								<span class="label-text font-medium">Mood Score (Optional)</span>
							</label>
							<select
								id="mood"
								bind:value={moodScore}
								class="select select-bordered focus-ring"
								disabled={isSubmitting}
							>
								<option value={null}>Select mood...</option>
								{#each Array.from({length: 10}, (_, i) => i + 1) as score}
									<option value={score}>{score} - {score <= 3 ? 'Low' : score <= 7 ? 'Moderate' : 'High'}</option>
								{/each}
							</select>
						</div>

						<!-- Privacy -->
						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text font-medium">Privacy Settings</span>
								<input
									type="checkbox"
									bind:checked={isPrivate}
									class="toggle toggle-primary"
									disabled={isSubmitting}
								/>
							</label>
							<div class="label">
								<span class="label-text-alt">
									{isPrivate ? 'Private entry' : 'Shared entry'}
								</span>
							</div>
						</div>
					</div>

					<!-- Tags -->
					<div class="form-control mt-6">
						<label class="label" for="tags">
							<span class="label-text font-medium">Tags</span>
						</label>
						<div class="flex gap-2 mb-2">
							<input
								id="tags"
								type="text"
								bind:value={newTag}
								onkeydown={handleTagKeyDown}
								class="input input-bordered flex-1 focus-ring"
								placeholder="Add a tag..."
								disabled={isSubmitting}
							/>
							<button
								type="button"
								onclick={addTag}
								class="btn btn-ghost"
								disabled={!newTag.trim() || isSubmitting}
							>
								Add
							</button>
						</div>
						{#if tags.length > 0}
							<div class="flex flex-wrap gap-2 mt-2">
								{#each tags as tag}
									<span class="badge badge-primary gap-2">
										{tag}
										<button
											type="button"
											onclick={() => removeTag(tag)}
											class="btn btn-xs btn-ghost btn-circle"
											disabled={isSubmitting}
										>
											✕
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Submit -->
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<div class="flex justify-end gap-3">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => goto('/journal/new')}
							disabled={isSubmitting}
						>
							Back to Conversation
						</button>
						<button
							type="submit"
							class="btn btn-primary"
							disabled={isSubmitting || !title.trim() || !content.trim()}
						>
							{#if isSubmitting}
								<LoadingSpinner size="sm" />
								Saving Entry...
							{:else}
								Save Journal Entry
							{/if}
						</button>
					</div>
				</div>
			</div>
		</form>
	{/if}
</div>
