<script lang="ts">
  import '../app.css';
  import { beforeNavigate } from '$app/navigation';
  import { updated } from '$app/state';
  import Navigation from '$lib/components/Navigation.svelte';
  import ThemeSelector from '$lib/components/ThemeSelector.svelte';
  import type { LayoutData } from './$types.js';

  let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

  // Handle version updates - force full page navigation when a new version is detected
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) {
      // Force a full page reload to get the latest version
      location.href = to.url.href;
    }
  });

  // Auto-update when a new version is detected (no user notification)
  $effect(() => {
    if (updated.current) {
      // Automatically reload the page to get the latest version
      // Small delay to ensure the detection is stable
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  });
</script>

{#if data?.user}
  <Navigation user={data.user} />
{:else}
  <!-- Public Navigation for unauthenticated users -->
  <div class="navbar bg-primary text-primary-content shadow-lg">
    <div class="navbar-start">
      <a href="/" class="btn btn-ghost text-xl font-bold text-primary-content hover:bg-primary-content/10">Life Quest</a>
    </div>
    <div class="navbar-end gap-2">
      <ThemeSelector />
      <a href="/login" class="btn btn-ghost text-primary-content hover:bg-primary-content/10">Login</a>
      <a href="/register" class="btn btn-secondary">Register</a>
    </div>
  </div>
{/if}

{@render children()}
