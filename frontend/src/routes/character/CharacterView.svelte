<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { characterApi, type Character, type UpdateCharacterData } from '../../lib/api/characters';
  import { marked } from 'marked';

	const dispatch = createEventDispatcher<{
		characterUpdated: Character;
		characterDeleted: void;
	}>();

	export let character: Character;

	// State for editing
	let isEditing = false;
	let loading = false;
	let error: string | null = null;
	let deleteConfirmOpen = false;

	// Form data for editing
	let editData: UpdateCharacterData = {};

	// Start editing
	function startEdit() {
		editData = {
			name: character.name,
			characterClass: character.characterClass,
			backstory: character.backstory || '',
			goals: character.goals || ''
		};
		isEditing = true;
		error = null;
	}

	// Cancel editing
	function cancelEdit() {
		isEditing = false;
		editData = {};
		error = null;
	}

	// Validate edit form
	function validateEditForm(): boolean {
		if (!editData.name?.trim()) {
			error = 'Character name is required';
			return false;
		}
		if (!editData.characterClass?.trim()) {
			error = 'Character class is required';
			return false;
		}
		if (editData.name.length > 100) {
			error = 'Character name must be 100 characters or less';
			return false;
		}
		if (editData.characterClass.length > 100) {
			error = 'Character class must be 100 characters or less';
			return false;
		}
		return true;
	}

	// Save changes
	async function saveChanges() {
		error = null;

		if (!validateEditForm()) {
			return;
		}

		try {
			loading = true;

			// Prepare data - only send fields that have changed and are non-empty
			const updateData: UpdateCharacterData = {};

			if (editData.name?.trim() && editData.name.trim() !== character.name) {
				updateData.name = editData.name.trim();
			}

			if (
				editData.characterClass?.trim() &&
				editData.characterClass.trim() !== character.characterClass
			) {
				updateData.characterClass = editData.characterClass.trim();
			}

			if (editData.backstory?.trim() !== (character.backstory || '')) {
				updateData.backstory = editData.backstory?.trim() || undefined;
			}

			if (editData.goals?.trim() !== (character.goals || '')) {
				updateData.goals = editData.goals?.trim() || undefined;
			}

			// Only make API call if there are changes
			if (Object.keys(updateData).length > 0) {
				const updatedCharacter = await characterApi.updateCharacter(updateData);
				dispatch('characterUpdated', updatedCharacter);
			}

			isEditing = false;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to update character';
			console.error('Error updating character:', e);
		} finally {
			loading = false;
		}
	}

	// Delete character
	async function deleteCharacter() {
		try {
			loading = true;
			await characterApi.deleteCharacter();
			dispatch('characterDeleted');
			deleteConfirmOpen = false;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to delete character';
			console.error('Error deleting character:', e);
		} finally {
			loading = false;
		}
	}

	// Format date for display
	function formatDate(isoString: string): string {
		try {
			const date = new Date(isoString);
			return date.toLocaleDateString();
		} catch {
			return isoString;
		}
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		{#if isEditing}
			<!-- Edit Mode -->
			<h2 class="card-title mb-4 justify-center text-2xl">Edit Your Character</h2>

			{#if error}
				<div class="alert alert-error mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<form on:submit|preventDefault={saveChanges}>
				<!-- Character Name -->
				<div class="form-control mb-4 w-full">
					<label class="label" for="edit-name">
						<span class="label-text">Character Name <span class="text-error">*</span></span>
					</label>
					<input
						id="edit-name"
						type="text"
						placeholder="Enter your character's name"
						class="input input-bordered w-full"
						bind:value={editData.name}
						maxlength="100"
						required
					/>
					<div class="label">
						<span class="label-text-alt">What should we call your character?</span>
						<span class="label-text-alt">{(editData.name || '').length}/100</span>
					</div>
				</div>

				<!-- Character Class -->
				<div class="form-control mb-4 w-full">
					<label class="label" for="edit-class">
						<span class="label-text">Character Class <span class="text-error">*</span></span>
					</label>
					<input
						id="edit-class"
						type="text"
						placeholder="Enter your character class"
						class="input input-bordered w-full"
						bind:value={editData.characterClass}
						maxlength="100"
						required
					/>
					<div class="label">
						<span class="label-text-alt">What type of person are you becoming?</span>
						<span class="label-text-alt">{(editData.characterClass || '').length}/100</span>
					</div>
				</div>

				<!-- Backstory -->
				<div class="form-control mb-4 w-full">
					<label class="label" for="edit-backstory">
						<span class="label-text">Backstory</span>
					</label>
					<textarea
						id="edit-backstory"
						class="textarea textarea-bordered h-24"
						placeholder="Tell us about your character's background..."
						bind:value={editData.backstory}
					></textarea>
					<div class="label">
						<span class="label-text-alt">Optional: Describe your character's background</span>
					</div>
				</div>

				<!-- Goals -->
				<div class="form-control mb-6 w-full">
					<label class="label" for="edit-goals">
						<span class="label-text">Goals</span>
					</label>
					<textarea
						id="edit-goals"
						class="textarea textarea-bordered h-24"
						placeholder="What does your character want to achieve?"
						bind:value={editData.goals}
					></textarea>
					<div class="label">
						<span class="label-text-alt">Optional: What are your character's goals?</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="card-actions justify-center gap-2">
					<button type="button" class="btn btn-outline" on:click={cancelEdit} disabled={loading}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
							Saving...
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
								<polyline points="17,21 17,13 7,13 7,21" />
								<polyline points="7,3 7,8 15,8" />
							</svg>
							Save Changes
						{/if}
					</button>
				</div>
			</form>
		{:else}
			<!-- View Mode -->
			<h2 class="card-title mb-4 justify-center text-2xl">{character.name}</h2>

			{#if error}
				<div class="alert alert-error mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<div class="grid gap-6">
				<!-- Character Info Card -->
				<div class="stats stats-vertical lg:stats-horizontal shadow">
					<div class="stat">
						<div class="stat-title">Class</div>
						<div class="stat-value text-lg">{character.characterClass}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Created</div>
						<div class="stat-value text-lg">{formatDate(character.createdAt)}</div>
					</div>
				</div>

				<!-- Backstory -->
				{#if character.backstory}
					<div class="card bg-base-200">
						<div class="card-body">
							<h3 class="card-title text-lg">Backstory</h3>
              <div class="prose prose-sm">
                {@html marked.parse(character.backstory)}
              </div>
						</div>
					</div>
				{/if}

				<!-- Goals -->
				{#if character.goals}
					<div class="card bg-base-200">
						<div class="card-body">
							<h3 class="card-title text-lg">Goals</h3>
              <div class="prose prose-sm">
                {@html marked.parse(character.goals)}
              </div>
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="card-actions justify-center gap-2">
					<button class="btn btn-primary" on:click={startEdit} disabled={loading}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
						</svg>
						Edit Character
					</button>
					<button
						class="btn btn-error btn-outline"
						on:click={() => (deleteConfirmOpen = true)}
						disabled={loading}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="3,6 5,6 21,6" />
							<path
								d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"
							/>
						</svg>
						Delete Character
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if deleteConfirmOpen}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Delete Character</h3>
			<p class="py-4">
				Are you sure you want to delete <strong>{character.name}</strong>? This action cannot be
				undone.
			</p>
			<div class="modal-action">
				<button
					class="btn btn-outline"
					on:click={() => (deleteConfirmOpen = false)}
					disabled={loading}
				>
					Cancel
				</button>
				<button class="btn btn-error" on:click={deleteCharacter} disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner loading-sm"></span>
						Deleting...
					{:else}
						Delete
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
