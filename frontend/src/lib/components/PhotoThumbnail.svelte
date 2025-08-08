<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { PhotoService } from '$lib/api/photos';
  import type { PhotoResponse } from '$lib/types/photos';
  import { ImageIcon } from 'lucide-svelte';
  import PhotoEditModal from './PhotoEditModal.svelte';

  interface Props {
    photo: PhotoResponse;
    size?: 'small' | 'medium' | 'large';
    class?: string;
    showCaption?: boolean;
    showHoverIcon?: boolean;
  }

  let { photo, size = 'medium', class: className = '', showCaption = false, showHoverIcon = false }: Props = $props();

  let currentPhoto = $state(photo);
  let showEditModal = $state(false);

  const dispatch = createEventDispatcher<{
    update: PhotoResponse;
    delete: string; // photo ID
  }>();

  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-64 h-64',
    large: 'w-96 h-96',
  };

  const containerClasses = `${sizeClasses[size]} ${className} block flex-shrink-0 overflow-hidden rounded-lg transition-opacity hover:opacity-80 cursor-pointer`;

  function handleClick() {
    showEditModal = true;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  function handlePhotoUpdate(event: CustomEvent<PhotoResponse>) {
    currentPhoto = event.detail;
    dispatch('update', event.detail);
  }

  function handlePhotoDelete(event: CustomEvent<string>) {
    dispatch('delete', event.detail);
  }
</script>

{#if showCaption || showHoverIcon}
  <div class="group relative {containerClasses}" onclick={handleClick} onkeydown={handleKeydown} role="button" tabindex="0">
    <img src={PhotoService.getThumbnailUrl(currentPhoto.thumbnailPath)} alt="" class="h-full w-full object-cover transition-transform group-hover:scale-110" />

    <!-- Caption overlay -->
    {#if showCaption && currentPhoto.caption}
      <div class="absolute right-0 bottom-0 left-0 bg-black/70 p-2">
        <p class="truncate text-xs text-white">{currentPhoto.caption}</p>
      </div>
    {/if}

    <!-- Hover icon -->
    {#if showHoverIcon}
      <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
        <ImageIcon size={20} class="text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    {/if}
  </div>
{:else}
  <div class={containerClasses} onclick={handleClick} onkeydown={handleKeydown} role="button" tabindex="0">
    <img src={PhotoService.getThumbnailUrl(currentPhoto.thumbnailPath)} alt="" class="h-full w-full object-cover" />
  </div>
{/if}

<!-- Photo Edit Modal -->
<PhotoEditModal bind:open={showEditModal} photo={currentPhoto} on:update={handlePhotoUpdate} on:delete={handlePhotoDelete} />
