<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Camera, ImagePlus, Upload, X, Edit3, Trash2 } from 'lucide-svelte';
  import { PhotoService } from '$lib/api/photos';

  // Import types directly from shared types (following development principles)
  import type { PhotoResponse } from '../../../../shared/types/photos';

  export let linkedType: 'journal' | 'measurement';
  export let linkedId: string;
  export let photos: PhotoResponse[] = [];
  export let allowMultiple = true;
  export let maxFiles = 10;
  export let disabled = false;
  export let showPreview = true;

  const dispatch = createEventDispatcher<{
    upload: PhotoResponse;
    uploaded: PhotoResponse[];
    delete: string;
    error: string;
  }>();

  let fileInput: HTMLInputElement;
  let uploading = false;
  let uploadProgress = 0;
  let error: string | null = null;
  let isDragOver = false;

  // Maximum file size (20MB to match backend)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (files.length > 0) {
      handleFiles(files);
    }

    // Reset the input so the same file can be selected again
    target.value = '';
  }

  async function handleFiles(files: File[]) {
    error = null;

    // Validate file count
    if (!allowMultiple && files.length > 1) {
      error = 'Please select only one file.';
      dispatch('error', error);
      return;
    }

    if (photos.length + files.length > maxFiles) {
      error = `Cannot upload more than ${maxFiles} photos.`;
      dispatch('error', error);
      return;
    }

    // Validate each file
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        error = validation.error || 'Validation failed';
        dispatch('error', error);
        return;
      }
    }

    // Upload files
    try {
      uploading = true;
      uploadProgress = 0;

      if (allowMultiple && files.length > 1) {
        // Bulk upload
        const uploadedPhotos = await PhotoService.uploadPhotos(linkedType, linkedId, files);

        photos = [...photos, ...uploadedPhotos];
        dispatch('uploaded', uploadedPhotos);

        // Dispatch individual upload events for each photo
        uploadedPhotos.forEach((photo) => {
          dispatch('upload', photo);
        });
      } else {
        // Single upload
        const uploadedPhoto = await PhotoService.uploadPhoto(linkedType, linkedId, files[0]);

        photos = [...photos, uploadedPhoto];
        dispatch('upload', uploadedPhoto);
        dispatch('uploaded', [uploadedPhoto]);
      }

      uploadProgress = 100;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Upload failed';
      dispatch('error', error);
    } finally {
      uploading = false;
      setTimeout(() => {
        uploadProgress = 0;
      }, 1000);
    }
  }

  function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const fileType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.includes(fileType)) {
      return {
        valid: false,
        error: `Unsupported file type. Please use: ${ALLOWED_TYPES.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.`,
      };
    }

    return { valid: true };
  }

  function triggerFileInput() {
    if (!disabled && !uploading) {
      fileInput.click();
    }
  }

  async function deletePhoto(photoId: string) {
    try {
      await PhotoService.deletePhoto(photoId);
      photos = photos.filter((p) => p.id !== photoId);
      dispatch('delete', photoId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete photo';
      dispatch('error', error);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  // iOS camera support
  function triggerCamera() {
    if (!disabled && !uploading && fileInput) {
      // Set capture attribute for mobile camera
      fileInput.setAttribute('capture', 'environment');
      fileInput.click();
      // Remove after use to allow regular file selection
      setTimeout(() => fileInput.removeAttribute('capture'), 100);
    }
  }

  function triggerGallery() {
    if (!disabled && !uploading && fileInput) {
      fileInput.removeAttribute('capture');
      fileInput.click();
    }
  }
</script>

<div class="photo-upload">
  <!-- Upload Area -->
  <div
    class="upload-area rounded-lg border-2 border-dashed p-6 text-center transition-colors"
    class:border-primary={isDragOver}
    class:border-base-300={!isDragOver && !error}
    class:border-error={error && !isDragOver}
    class:bg-primary-light={isDragOver}
    class:bg-error-light={error && !isDragOver}
    class:opacity-50={disabled}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-label="Photo upload area"
  >
    {#if uploading}
      <!-- Upload Progress -->
      <div class="flex flex-col items-center gap-4">
        <div class="loading loading-spinner loading-lg text-primary"></div>
        <p class="text-base-content/70 text-sm">Uploading photos...</p>
        {#if uploadProgress > 0}
          <progress class="progress progress-primary w-full max-w-xs" value={uploadProgress} max="100"></progress>
        {/if}
      </div>
    {:else}
      <!-- Upload Instructions -->
      <div class="flex flex-col items-center gap-4">
        <div class="flex gap-2">
          <div class="bg-base-200 rounded-full p-3">
            <ImagePlus size={24} class="text-primary" />
          </div>
        </div>

        <div>
          <h3 class="text-base-content font-medium">Add Photos</h3>
          <p class="text-base-content/60 mt-1 text-sm">Drag & drop photos here, or click to browse</p>
          <p class="text-base-content/50 mt-1 text-xs">
            {allowMultiple ? `Up to ${maxFiles} photos` : '1 photo'} • Max {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB each
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap justify-center gap-2">
          <!-- Camera Button (Mobile) -->
          <button type="button" class="btn btn-primary btn-sm gap-2" class:btn-disabled={disabled} on:click={triggerCamera} {disabled}>
            <Camera size={16} />
            Camera
          </button>

          <!-- Gallery Button -->
          <button type="button" class="btn btn-outline btn-primary btn-sm gap-2" class:btn-disabled={disabled} on:click={triggerGallery} {disabled}>
            <Upload size={16} />
            Gallery
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="alert alert-error mt-4">
      <X size={20} />
      <span class="text-sm">{error}</span>
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        on:click={() => {
          error = null;
        }}
      >
        Dismiss
      </button>
    </div>
  {/if}

  <!-- Photo Preview Grid -->
  {#if showPreview && photos.length > 0}
    <div class="photo-grid mt-6">
      <h4 class="text-base-content/80 mb-3 text-sm font-medium">
        Photos ({photos.length})
      </h4>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {#each photos as photo (photo.id)}
          <div class="photo-item group bg-base-200 relative aspect-square overflow-hidden rounded-lg">
            <!-- Photo Image -->
            <img
              src={PhotoService.getThumbnailUrl(photo.thumbnailPath)}
              alt={photo.caption || 'Uploaded photo'}
              class="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />

            <!-- Hover Overlay -->
            <div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <!-- View Full Size -->
              <button
                type="button"
                class="btn btn-ghost btn-xs text-white hover:bg-white/20"
                on:click={() => window.open(PhotoService.getPhotoUrl(photo.filePath))}
                title="View full size"
              >
                <Edit3 size={14} />
              </button>

              <!-- Delete -->
              <button type="button" class="btn btn-ghost btn-xs hover:bg-error/20 text-white" on:click={() => deletePhoto(photo.id)} title="Delete photo">
                <Trash2 size={14} />
              </button>
            </div>

            <!-- Caption -->
            {#if photo.caption}
              <div class="absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-xs text-white">
                <p class="truncate">{photo.caption}</p>
              </div>
            {/if}

            <!-- File Info -->
            <div class="absolute top-2 right-2">
              <div class="badge badge-neutral badge-xs opacity-80">
                {formatFileSize(parseInt(photo.fileSize))}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Hidden File Input -->
  <input
    bind:this={fileInput}
    type="file"
    accept={ALLOWED_TYPES.join(',')}
    multiple={allowMultiple}
    on:change={handleFileSelect}
    class="hidden"
    aria-label="Select photos"
  />
</div>

<style>
  .upload-area {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .upload-area:hover:not(.opacity-50) {
    border-color: hsl(var(--primary));
    background-color: hsl(var(--primary) / 0.05);
  }

  .bg-primary-light {
    background-color: hsl(var(--primary) / 0.05);
  }

  .bg-error-light {
    background-color: hsl(var(--error) / 0.05);
  }

  .photo-grid {
    animation: slideUp 0.3s ease-out;
  }

  .photo-item {
    animation: scaleIn 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
