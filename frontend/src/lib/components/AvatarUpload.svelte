<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    upload: string; // base64 string
    remove: void;
  }>();

  export let currentAvatar: string | null = null;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let loading = false;
  export let disabled = false;

  // Size configurations following style guide
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  let fileInput: HTMLInputElement;
  let uploadError = '';

  // Maximum file size (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    uploadError = '';

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      uploadError = 'Please select a JPEG, PNG, or WebP image.';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      uploadError = 'Image must be smaller than 2MB.';
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        dispatch('upload', result);
      }
    };

    reader.onerror = () => {
      uploadError = 'Failed to read image file.';
    };

    reader.readAsDataURL(file);
  }

  function triggerFileInput() {
    if (!disabled && !loading) {
      fileInput.click();
    }
  }

  function removeAvatar() {
    if (!disabled && !loading) {
      dispatch('remove');
    }
  }

  // Get user initials for placeholder
  export let userName = '';
  $: initials = userName
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
</script>

<div class="flex flex-col items-center gap-4">
  <!-- Avatar Display -->
  <div class="avatar placeholder">
    <div
      class="{sizeClasses[size]} bg-base-300 text-base-content group relative rounded-full transition-all duration-200 {disabled || loading
        ? 'opacity-50'
        : 'hover:scale-105'}"
    >
      {#if currentAvatar}
        <img src={currentAvatar} alt="Avatar" class="h-full w-full rounded-full object-cover" />
      {:else}
        <span class="text-sm font-medium">{initials || '?'}</span>
      {/if}

      <!-- Hover overlay -->
      {#if !disabled && !loading}
        <div
          class="bg-opacity-50 absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          on:click={triggerFileInput}
          on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
          role="button"
          tabindex="0"
        >
          <svg class="{iconSizes[size]} text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      {/if}

      <!-- Loading spinner -->
      {#if loading}
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="loading loading-spinner loading-sm text-primary"></span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex gap-2">
    <button
      type="button"
      class="btn btn-sm btn-primary gap-2 transition-all duration-200 hover:scale-105"
      on:click={triggerFileInput}
      disabled={disabled || loading}
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      Upload
    </button>

    {#if currentAvatar}
      <button
        type="button"
        class="btn btn-sm btn-outline btn-error gap-2 transition-all duration-200 hover:scale-105"
        on:click={removeAvatar}
        disabled={disabled || loading}
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Remove
      </button>
    {/if}
  </div>

  <!-- Error Message -->
  {#if uploadError}
    <div class="alert alert-error text-sm">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {uploadError}
    </div>
  {/if}

  <!-- File Size Info -->
  <p class="text-base-content/60 text-center text-xs">JPEG, PNG, or WebP. Max 2MB.</p>
</div>

<!-- Hidden file input -->
<input
  bind:this={fileInput}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  on:change={handleFileSelect}
  class="hidden"
  aria-label="Select avatar image"
/>

<style>
  /* Custom hover lift effect following style guide */
  .hover-lift:hover {
    transform: scale(1.02);
  }
</style>
