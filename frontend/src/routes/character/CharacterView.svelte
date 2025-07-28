<script lang="ts">
  // Add new attribute
  async function addNewAttribute() {
    if (!newAttributeValue.trim()) {
      addAttributeError = 'Attribute value cannot be empty';
      return;
    }
    try {
      addAttributeLoading = true;
      addAttributeError = null;
      await userAttributesApi.createAttribute({ value: newAttributeValue.trim(), source: 'user_set' });
      newAttributeValue = '';
      await loadUserAttributes();
    } catch (e: unknown) {
      addAttributeError = e instanceof Error ? e.message : 'Failed to add attribute';
      console.error('Error adding attribute:', e);
    } finally {
      addAttributeLoading = false;
    }
  }
  import { createEventDispatcher, onMount } from 'svelte';
  import { characterApi } from '../../lib/api/characters';
  import { userAttributesApi } from '../../lib/api/user-attributes';
  import type { Character } from '../../lib/types/characters';
  import type { UpdateCharacterForm as UpdateCharacterData } from '../../lib/types/character-form';
  import type { UserAttribute } from '../../lib/types/user-attributes';
  import { formatDateTime } from '../../lib/utils/date';
  import Markdown from '$lib/components/common/Markdown.svelte';

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

  // User attributes state
  let userAttributes: UserAttribute[] = [];
  let attributesLoading = false;
  let attributesError: string | null = null;
  let editingAttributeId: string | null = null;
  let editingAttributeValue: string = '';

  // Add attribute state
  let newAttributeValue: string = '';
  let addAttributeLoading = false;
  let addAttributeError: string | null = null;

  // Form data for editing
  let editData: UpdateCharacterData = {};

  // Load user attributes
  async function loadUserAttributes() {
    try {
      attributesLoading = true;
      attributesError = null;
      userAttributes = await userAttributesApi.getUserAttributes();
    } catch (e: unknown) {
      attributesError = e instanceof Error ? e.message : 'Failed to load user attributes';
      console.error('Error loading user attributes:', e);
    } finally {
      attributesLoading = false;
    }
  }

  // Load attributes on component mount
  onMount(() => {
    loadUserAttributes();
  });

  // Start editing
  function startEdit() {
    editData = {
      name: character.name,
      characterClass: character.characterClass || '',
      backstory: character.backstory || '',
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
    if (editData.name.length > 100) {
      error = 'Character name must be 100 characters or less';
      return false;
    }
    if (editData.characterClass && editData.characterClass.length > 100) {
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

  // Start editing attribute inline
  function startEditAttribute(attributeId: string, currentValue: string) {
    editingAttributeId = attributeId;
    editingAttributeValue = currentValue;
  }

  // Cancel editing attribute
  function cancelEditAttribute() {
    editingAttributeId = null;
    editingAttributeValue = '';
  }

  // Save edited attribute
  async function saveEditAttribute() {
    if (!editingAttributeId || !editingAttributeValue.trim()) {
      return;
    }

    try {
      await userAttributesApi.updateAttribute(editingAttributeId, {
        value: editingAttributeValue.trim(),
      });
      await loadUserAttributes(); // Refresh the list
      editingAttributeId = null;
      editingAttributeValue = '';
    } catch (e: unknown) {
      attributesError = e instanceof Error ? e.message : 'Failed to update attribute';
      console.error('Error updating attribute:', e);
    }
  }

  // Handle keyboard events for inline editing
  function handleAttributeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEditAttribute();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditAttribute();
    }
  }

  // Delete attribute
  async function deleteAttribute(attributeId: string, attributeValue: string) {
    if (confirm(`Are you sure you want to delete "${attributeValue}"?`)) {
      try {
        await userAttributesApi.deleteAttribute(attributeId);
        await loadUserAttributes(); // Refresh the list
      } catch (e: unknown) {
        attributesError = e instanceof Error ? e.message : 'Failed to delete attribute';
        console.error('Error deleting attribute:', e);
      }
    }
  }
</script>

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
                  <span class="label-text font-medium">Character Class</span>
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
  <div class="grid gap-8 pb-8">
    <div class="card bg-primary/20 border-primary/60 sticky top-8 border bg-gradient-to-br shadow-2xl">
      <div class="card-body p-8 text-center">
        {#if character.motto}
          <blockquote class="text-primary text-lg leading-relaxed font-medium italic">
            "{character.motto}"
          </blockquote>
        {/if}
        <h2 class="text-primary mb-2 text-xl font-bold">
          {character.name}{character.characterClass ? ` - ${character.characterClass}` : ''}
        </h2>
      </div>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <!-- View Mode - Enhanced Layout -->
  <div class="grid gap-8 lg:grid-cols-2">
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
          <div class="max-w-none text-left leading-relaxed">
            <Markdown content={character.backstory} classes="max-w-none text-left leading-relaxed" />
          </div>
        </div>
      </div>
    {/if}

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
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
          Character Attributes
        </h3>

        {#if attributesLoading}
          <div class="flex justify-center py-4">
            <span class="loading loading-spinner loading-md"></span>
          </div>
        {:else if attributesError}
          <div class="alert alert-error">
            <span>{attributesError}</span>
            <button class="btn btn-sm" on:click={loadUserAttributes}>Retry</button>
          </div>
        {:else}
          <!-- Add Attribute UI -->
          <form class="mb-4 flex items-center gap-2" on:submit|preventDefault={addNewAttribute}>
            <input
              type="text"
              class="input input-bordered input-sm flex-1"
              placeholder="Add new attribute..."
              bind:value={newAttributeValue}
              maxlength="100"
              aria-label="New attribute value"
              disabled={addAttributeLoading}
            />
            <button type="submit" class="btn btn-primary btn-sm" disabled={addAttributeLoading || !newAttributeValue.trim()} aria-label="Add attribute">
              {#if addAttributeLoading}
                <span class="loading loading-spinner loading-xs"></span>
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
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                </svg>
                Add
              {/if}
            </button>
          </form>
          {#if addAttributeError}
            <div class="alert alert-error mb-2 px-3 py-2 text-xs">
              <span>{addAttributeError}</span>
            </div>
          {/if}
          {#if userAttributes.length === 0}
            <div class="text-base-content/60 py-6 text-center">
              <p class="mb-2">No attributes discovered yet</p>
              <p class="text-sm">Attributes will appear here as you write journal entries or add them above</p>
            </div>
          {:else}
            <div class="space-y-0">
              {#each userAttributes as attribute, index (attribute.id)}
                <div class="flex items-center justify-between py-3 {index < userAttributes.length - 1 ? 'border-base-300 border-b' : ''}">
                  <div class="flex-1">
                    {#if editingAttributeId === attribute.id}
                      <!-- Inline editing mode -->
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          bind:value={editingAttributeValue}
                          on:keydown={handleAttributeKeydown}
                          on:blur={saveEditAttribute}
                          class="input input-bordered input-sm flex-1"
                          placeholder="Attribute value"
                          autofocus
                        />
                        <button class="btn btn-ghost btn-xs hover:btn-success" on:click={saveEditAttribute} title="Save changes" aria-label="Save changes">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </button>
                        <button class="btn btn-ghost btn-xs hover:btn-error" on:click={cancelEditAttribute} title="Cancel editing" aria-label="Cancel editing">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    {:else}
                      <!-- Display mode -->
                      <span class="text-base font-medium">{attribute.value}</span>
                      {#if attribute.source}
                        <span class="text-base-content/60 ml-2 text-xs">
                          ({attribute.source === 'journal_analysis' ? 'discovered' : attribute.source})
                        </span>
                      {/if}
                    {/if}
                  </div>
                  {#if editingAttributeId !== attribute.id}
                    <div class="ml-4 flex items-center gap-1">
                      <!-- Edit button -->
                      <button
                        class="btn btn-ghost btn-xs hover:btn-primary"
                        on:click={() => startEditAttribute(attribute.id, attribute.value)}
                        title="Edit attribute"
                        aria-label="Edit attribute"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
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
                      </button>
                      <!-- Delete button -->
                      <button
                        class="btn btn-ghost btn-xs hover:btn-error"
                        on:click={() => deleteAttribute(attribute.id, attribute.value)}
                        title="Delete attribute"
                        aria-label="Delete attribute"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
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
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
            <div class="text-base-content/60 mt-4 text-xs">
              {userAttributes.length} attribute{userAttributes.length === 1 ? '' : 's'} discovered
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Action Buttons -->
<div class="flex justify-start gap-4 pt-8">
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
