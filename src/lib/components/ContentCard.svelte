<script lang="ts">
	import type { Content } from '$lib/server/db/schema.js';
	import { markdownToHtml, markdownToPlainText } from '$lib/markdown.js';

	type Props = {
		content: Content;
		onUpdate?: (content: Content) => void;
		onDelete?: (content: Content) => void;
		showActions?: boolean;
	};

	let { content, onUpdate, onDelete, showActions = true }: Props = $props();

	let showFullContent = $state(false);
	let isDeleting = $state(false);

	function handleUpdate() {
		onUpdate?.(content);
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
			return;
		}

		isDeleting = true;

		try {
			const formData = new FormData();
			formData.append('id', content.id);

			const response = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				onDelete?.(content);
				// Reload the page to refresh the content list
				window.location.reload();
			} else {
				alert('Failed to delete the post. Please try again.');
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('Failed to delete the post. Please try again.');
		} finally {
			isDeleting = false;
		}
	}

	$effect(() => {
		// Reset state when content changes
		showFullContent = false;
	});
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h2 class="card-title">{content.title}</h2>
				<p class="text-base-content/60 mb-4 text-sm">
					Created: {new Date(content.createdAt).toLocaleDateString()}
					{#if content.updatedAt !== content.createdAt}
						• Updated: {new Date(content.updatedAt).toLocaleDateString()}
					{/if}
				</p>
			</div>

			{#if showActions}
				<div class="flex gap-2">
					<button class="btn btn-ghost btn-sm" onclick={handleUpdate} aria-label="Update post">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>
					<button
						class="btn btn-ghost btn-sm text-error"
						onclick={handleDelete}
						disabled={isDeleting}
						aria-label="Delete post"
					>
						{#if isDeleting}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<div class="prose prose-sm max-w-none">
			{#if showFullContent}
				{@html markdownToHtml(content.content)}
			{:else}
				<p>{markdownToPlainText(content.content, 200)}</p>
			{/if}
		</div>

		<div class="card-actions items-center justify-between">
			<button class="btn btn-ghost btn-sm" onclick={() => (showFullContent = !showFullContent)}>
				{showFullContent ? 'Show Less' : 'Read More'}
			</button>
		</div>
	</div>
</div>
