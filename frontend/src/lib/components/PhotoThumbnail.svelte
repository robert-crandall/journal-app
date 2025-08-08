<script lang="ts">
  import { PhotoService } from '$lib/api/photos';
  import type { PhotoResponse } from '$lib/types/photos';
  import { ImageIcon } from 'lucide-svelte';

  interface Props {
    photo: PhotoResponse;
    size?: 'small' | 'medium' | 'large';
    class?: string;
    showCaption?: boolean;
    showHoverIcon?: boolean;
  }

  let { photo, size = 'medium', class: className = '', showCaption = false, showHoverIcon = false }: Props = $props();

  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-64 h-64',
    large: 'w-96 h-96',
  };

  const containerClasses = `${sizeClasses[size]} ${className} block flex-shrink-0 overflow-hidden rounded-lg transition-opacity hover:opacity-80`;
</script>

{#if showCaption || showHoverIcon}
  <div class="group relative {containerClasses}">
    <a href={PhotoService.getPhotoUrl(photo.filePath)} class="absolute inset-0">
      <img src={PhotoService.getThumbnailUrl(photo.thumbnailPath)} alt="" class="h-full w-full object-cover transition-transform group-hover:scale-110" />

      <!-- Caption overlay -->
      {#if showCaption && photo.caption}
        <div class="absolute right-0 bottom-0 left-0 bg-black/70 p-2">
          <p class="truncate text-xs text-white">{photo.caption}</p>
        </div>
      {/if}

      <!-- Hover icon -->
      {#if showHoverIcon}
        <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
          <ImageIcon size={20} class="text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      {/if}
    </a>
  </div>
{:else}
  <a href={PhotoService.getPhotoUrl(photo.filePath)} class={containerClasses}>
    <img src={PhotoService.getThumbnailUrl(photo.thumbnailPath)} alt="" class="h-full w-full object-cover" />
  </a>
{/if}
