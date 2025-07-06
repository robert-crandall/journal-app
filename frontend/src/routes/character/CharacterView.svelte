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
      goals: character.goals || '',
      motto: character.motto || '',
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
    if (editData.motto && editData.motto.length > 200) {
      error = 'Motto must be 200 characters or less';
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

      if (editData.characterClass?.trim() && editData.characterClass.trim() !== character.characterClass) {
        updateData.characterClass = editData.characterClass.trim();
      }

      if (editData.backstory?.trim() !== (character.backstory || '')) {
        updateData.backstory = editData.backstory?.trim() || undefined;
      }

      if (editData.goals?.trim() !== (character.goals || '')) {
        updateData.goals = editData.goals?.trim() || undefined;
      }

      if (editData.motto?.trim() !== (character.motto || '')) {
        updateData.motto = editData.motto?.trim() || undefined;
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

<!-- Character View/Edit with Material Design -->
<div class="mx-auto max-w-7xl">
  {#if isEditing}
    <!-- Edit Mode - Material Design Form -->
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Left Column: Edit Form -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 border-base-300 border shadow-2xl">
          <div class="card-body p-8">
            <div class="mb-8 text-center">
              <div class="avatar placeholder mb-4">
                <div class="bg-secondary text-secondary-content w-16 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
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
                </div>
              </div>
              <h2 class="text-secondary mb-2 text-3xl font-bold">Edit Your Character</h2>
              <p class="text-base-content/60">Update your character's details and story</p>
            </div>

            {#if error}
              <div class="alert alert-error mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
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

            <form on:submit|preventDefault={saveChanges} class="space-y-8">
              <!-- Basic Info Section -->
              <div class="space-y-6">
                <h3 class="text-secondary border-secondary/20 border-b pb-2 text-xl font-semibold">Basic Information</h3>

                <!-- Character Name -->
                <div class="form-control">
                  <label class="label" for="edit-name">
                    <span class="label-text font-medium">Character Name *</span>
                    <span class="label-text-alt text-xs opacity-60">{(editData.name || '').length}/100</span>
                  </label>
                  <div class="relative">
                    <input
                      id="edit-name"
                      type="text"
                      placeholder="Enter your character's name"
                      class="input input-bordered input-lg focus:input-secondary w-full transition-all duration-200 focus:scale-[1.02]"
                      bind:value={editData.name}
                      maxlength="100"
                      required
                    />
                    <div class="absolute inset-y-0 right-3 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-base-content/40"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Character Class -->
                <div class="form-control">
                  <label class="label" for="edit-class">
                    <span class="label-text font-medium">Character Class *</span>
                    <span class="label-text-alt text-xs opacity-60">{(editData.characterClass || '').length}/100</span>
                  </label>
                  <div class="relative">
                    <input
                      id="edit-class"
                      type="text"
                      placeholder="Enter your character class"
                      class="input input-bordered input-lg focus:input-secondary w-full transition-all duration-200 focus:scale-[1.02]"
                      bind:value={editData.characterClass}
                      maxlength="100"
                      required
                    />
                    <div class="absolute inset-y-0 right-3 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-base-content/40"
                      >
                        <path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Character Motto -->
                <div class="form-control">
                  <label class="label" for="edit-motto">
                    <span class="label-text font-medium">Character Motto</span>
                    <span class="label-text-alt text-xs opacity-60">{(editData.motto || '').length}/200</span>
                  </label>
                  <div class="relative">
                    <input
                      id="edit-motto"
                      type="text"
                      placeholder="Enter your character's motto or guiding principle"
                      class="input input-bordered input-lg focus:input-secondary w-full transition-all duration-200 focus:scale-[1.02]"
                      bind:value={editData.motto}
                      maxlength="200"
                    />
                    <div class="absolute inset-y-0 right-3 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-base-content/40"
                      >
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Character Story Section -->
              <div class="space-y-6">
                <h3 class="text-secondary border-secondary/20 border-b pb-2 text-xl font-semibold">Character Story</h3>

                <!-- Backstory -->
                <div class="form-control">
                  <label class="label" for="edit-backstory">
                    <span class="label-text font-medium">Backstory</span>
                  </label>
                  <div class="relative">
                    <textarea
                      id="edit-backstory"
                      class="textarea textarea-bordered textarea-lg focus:textarea-secondary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                      placeholder="Tell us about your character's background..."
                      bind:value={editData.backstory}
                    ></textarea>
                  </div>
                </div>

                <!-- Goals -->
                <div class="form-control">
                  <label class="label" for="edit-goals">
                    <span class="label-text font-medium">Goals & Aspirations</span>
                  </label>
                  <div class="relative">
                    <textarea
                      id="edit-goals"
                      class="textarea textarea-bordered textarea-lg focus:textarea-secondary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                      placeholder="What does your character want to achieve?"
                      bind:value={editData.goals}
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-center gap-4 pt-6">
                <button type="button" class="btn btn-outline btn-lg gap-2 transition-all duration-200 hover:scale-105" on:click={cancelEdit} disabled={loading}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  Cancel
                </button>
                <button type="submit" class="btn btn-secondary btn-lg min-w-40 gap-2 shadow-lg transition-all duration-200 hover:scale-105" disabled={loading}>
                  {#if loading}
                    <span class="loading loading-spinner loading-md"></span>
                    Saving...
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
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
          </div>
        </div>
      </div>

      <!-- Right Column: Live Preview -->
      <div class="lg:col-span-1">
        <div class="sticky top-8">
          <div class="card from-secondary/10 to-accent/10 border-secondary/20 border bg-gradient-to-br">
            <div class="card-body p-6">
              <h3 class="card-title text-secondary mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Live Preview
              </h3>
              <div class="space-y-4">
                <div>
                  <span class="text-sm font-medium opacity-70">Character Name:</span>
                  <p class="font-semibold">
                    {editData.name || 'Your Character Name'}
                  </p>
                </div>
                <div>
                  <span class="text-sm font-medium opacity-70">Class:</span>
                  <p class="font-semibold">
                    {editData.characterClass || 'Your Character Class'}
                  </p>
                </div>
                {#if editData.motto}
                  <div>
                    <span class="text-sm font-medium opacity-70">Motto:</span>
                    <p class="text-secondary italic">"{editData.motto}"</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- View Mode - Enhanced Layout -->
    <div class="grid gap-8 lg:grid-cols-4">
      <!-- Left Column: Character Profile -->
      <div class="lg:col-span-1">
        <div class="card from-primary/10 to-secondary/10 border-primary/20 sticky top-8 border bg-gradient-to-br shadow-2xl">
          <div class="card-body p-8 text-center">
            <!-- Character Avatar -->
            <div class="avatar placeholder mb-6">
              <div class="bg-primary text-primary-content w-24 rounded-full">
                <span class="text-3xl font-bold">
                  {character.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <!-- Character Name & Class -->
            <h2 class="text-primary mb-2 text-2xl font-bold">{character.name}</h2>
            <div class="badge badge-primary badge-lg mb-4">{character.characterClass}</div>

            <!-- Character Stats -->
            <div class="stats stats-vertical bg-base-100/50 mb-6 shadow">
              <div class="stat py-3">
                <div class="stat-title text-xs">Created</div>
                <div class="stat-value text-sm">{formatDate(character.createdAt)}</div>
              </div>
              <div class="stat py-3">
                <div class="stat-title text-xs">Character Level</div>
                <div class="stat-value text-sm">1</div>
              </div>
            </div>

            <!-- Character Motto -->
            {#if character.motto}
              <blockquote class="text-primary text-lg leading-relaxed font-medium italic">
                "{character.motto}"
              </blockquote>
            {/if}
          </div>
        </div>
      </div>

      <!-- Right Column: Character Details -->
      <div class="space-y-8 lg:col-span-3">
        {#if error}
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex justify-start gap-4">
          <button class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105" on:click={startEdit} disabled={loading}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
            class="btn btn-error btn-outline btn-lg gap-2 transition-all duration-200 hover:scale-105"
            on:click={() => (deleteConfirmOpen = true)}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3,6 5,6 21,6" />
              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2" />
            </svg>
            Delete Character
          </button>
        </div>

        <!-- Character Story Content -->
        <div class="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
          <!-- Backstory -->
          {#if character.backstory}
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="card-title text-secondary mb-4 flex items-center gap-2 text-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  Backstory
                </h3>
                <div class="prose prose-sm max-w-none text-left leading-relaxed">
                  {@html marked.parse(character.backstory)}
                </div>
              </div>
            </div>
          {/if}

          <!-- Goals -->
          {#if character.goals}
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="card-title text-accent mb-4 flex items-center gap-2 text-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                  </svg>
                  Goals & Aspirations
                </h3>
                <div class="prose prose-sm max-w-none text-left leading-relaxed">
                  {@html marked.parse(character.goals)}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Character Progress Section (Placeholder) -->
        <div class="card from-accent/10 to-secondary/10 border-accent/20 border bg-gradient-to-r">
          <div class="card-body p-6">
            <h3 class="card-title text-accent mb-4 flex items-center gap-2 text-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="10,8 16,12 10,16" />
              </svg>
              Character Progress
            </h3>
            <div class="grid gap-4 text-center md:grid-cols-3">
              <div class="stat">
                <div class="stat-title">Quests Completed</div>
                <div class="stat-value text-primary text-2xl">0</div>
              </div>
              <div class="stat">
                <div class="stat-title">Experience Points</div>
                <div class="stat-value text-secondary text-2xl">0</div>
              </div>
              <div class="stat">
                <div class="stat-title">Achievements</div>
                <div class="stat-value text-accent text-2xl">0</div>
              </div>
            </div>
            <p class="text-base-content/60 mt-4 text-center">Start completing quests to see your character's progress!</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if deleteConfirmOpen}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Delete Character</h3>
      <p class="py-4">
        Are you sure you want to delete <strong>{character.name}</strong>? This action cannot be undone.
      </p>
      <div class="modal-action">
        <button class="btn btn-outline" on:click={() => (deleteConfirmOpen = false)} disabled={loading}> Cancel </button>
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
