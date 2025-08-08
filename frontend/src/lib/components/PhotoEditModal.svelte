<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { PhotoService } from '$lib/api/photos';
  import type { PhotoResponse } from '$lib/types/photos';
  import { Trash2, X, SaveIcon } from 'lucide-svelte';

  let { 
    open = $bindable(false),
    photo = null
  }: {
    open: boolean;
    photo: PhotoResponse | null;
  } = $props();

  let caption = $state('');
  let loading = $state(false);
  let deleting = $state(false);
  let error = $state<string | null>(null);

  const dispatch = createEventDispatcher<{
    update: PhotoResponse;
    delete: string; // photo ID
    close: void;
  }>();

  // Initialize caption when photo changes
  $effect(() => {
    if (photo && open) {
      caption = photo.caption || '';
      error = null;
    }
  });

  async function handleSave() {
    if (!photo || loading) return;

    loading = true;
    error = null;

    try {
      const updatedPhoto = await PhotoService.updatePhoto(photo.id, {
        caption: caption.trim() || null,
      });

      dispatch('update', updatedPhoto);
      handleClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update photo';
    } finally {
      loading = false;
    }
  }

  async function handleDelete() {
    if (!photo || deleting) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    deleting = true;
    error = null;

    try {
      await PhotoService.deletePhoto(photo.id);
      dispatch('delete', photo.id);
      handleClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete photo';
    } finally {
      deleting = false;
    }
  }

  function handleClose() {
    open = false;
    caption = '';
    error = null;
    dispatch('close');
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSave();
    }
  }

  function handleModalClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

{#if open && photo}
  <div class="modal modal-open" role="dialog" tabindex="-1" onclick={handleModalClick} onkeydown={handleKeyPress}>
    <div class="modal-box w-11/12 max-w-4xl">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold">Edit Photo</h3>
        <button type="button" class="btn btn-ghost btn-sm btn-circle" onclick={handleClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="alert alert-error mb-4">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Photo Display -->
        <div class="flex justify-center">
          <div class="overflow-hidden rounded-lg bg-base-200">
            <img 
              src={PhotoService.getPhotoUrl(photo.filePath)} 
              alt={photo.caption || photo.originalFilename} 
              class="max-h-96 max-w-full object-contain"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Edit Form -->
        <div class="space-y-4">
          <!-- Photo Info -->
          <div class="space-y-2">
            <div class="text-sm">
              <span class="font-medium">Upload Date:</span>
              <span class="text-base-content/70">{new Date(photo.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <!-- Caption Editor -->
          <form onsubmit={handleSave} class="space-y-4">
            <div class="form-control">
              <label for="caption" class="label">
                <span class="label-text font-medium">Caption</span>
              </label>
              <textarea
                id="caption"
                bind:value={caption}
                placeholder="Add a caption to describe this photo..."
                rows="3"
                class="textarea textarea-bordered w-full"
                disabled={loading || deleting}
              ></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between">
              <!-- Delete Button -->
              <button
                type="button"
                class="btn btn-error btn-outline gap-2"
                onclick={handleDelete}
                disabled={loading || deleting}
              >
                {#if deleting}
                  <span class="loading loading-spinner loading-sm"></span>
                  Deleting...
                {:else}
                  <Trash2 size={16} />
                  Delete Photo
                {/if}
              </button>

              <!-- Save/Cancel Buttons -->
              <button
                type="submit"
                class="btn btn-primary gap-2"
                disabled={loading || deleting}
              >
                {#if loading}
                  <span class="loading loading-spinner loading-sm"></span>
                  Saving...
                {:else}
                  <SaveIcon size={16} />
                  Save Changes
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
