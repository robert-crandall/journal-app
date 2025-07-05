<script lang="ts">
	import type { Content } from '$lib/server/db/schema.js';
	import { enhance } from '$app/forms';

	type Props = {
		content?: Content;
		mode: 'create' | 'update';
		onCancel?: () => void;
		form?: any; // Form action result from parent
	};

	let { content, mode, onCancel, form }: Props = $props();

	let isSubmitting = $state(false);
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">
			{mode === 'create' ? 'Create New Post' : 'Update Post'}
		</h2>

		<!-- Display errors -->
		{#if form?.error}
			<div class="alert alert-error">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/{mode}"
			class="space-y-4"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			{#if content?.id}
				<input type="hidden" name="id" value={content.id} />
			{/if}

			<div class="form-control">
				<label class="label" for="title">
					<span class="label-text">Title</span>
				</label>
				<input
					type="text"
					id="title"
					name="title"
					value={content?.title ?? ''}
					placeholder="Enter a title for your post"
					class="input input-bordered w-full"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="content">
					<span class="label-text">Content (Markdown supported)</span>
				</label>
				<textarea
					id="content"
					name="content"
					value={content?.content ?? ''}
					placeholder="Write your content here... You can use **bold**, *italic*, # headers, and more!"
					class="textarea textarea-bordered h-48 w-full"
					required
					disabled={isSubmitting}
				></textarea>
				<div class="label">
					<span class="label-text-alt">
						Tip: Use Markdown syntax like **bold**, *italic*, `code`, and # headers
					</span>
				</div>
			</div>

			<div class="card-actions justify-end gap-2">
				{#if onCancel}
					<button type="button" class="btn btn-ghost" onclick={onCancel} disabled={isSubmitting}>
						Cancel
					</button>
				{/if}
				<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="loading loading-spinner loading-sm"></span>
						{mode === 'create' ? 'Creating...' : 'Saving...'}
					{:else}
						{mode === 'create' ? 'Create Post' : 'Save Changes'}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
