<script lang="ts">
  import type { PageData, ActionData } from './$types.js';
  import type { Content } from '$lib/server/db/schema.js';
  import ContentForm from '$lib/components/ContentForm.svelte';
  import ContentCard from '$lib/components/ContentCard.svelte';

  // Extended type until SvelteKit generates proper types
  interface DashboardData extends PageData {
    content: Content[];
  }

  let { data, form }: { data: DashboardData; form: ActionData } = $props();

  let showCreateForm = $state(false);
  let updatingContent = $state<Content | null>(null);
  let lastAction = $state<'create' | 'update' | null>(null);
  let lastFormSuccess = $state<boolean>(false);

  // Watch for successful form submissions to auto-close forms
  $effect(() => {
    // Only auto-close if this is a new success (not a persistent success state)
    if (form?.success && !lastFormSuccess) {
      // Track what action was just completed
      if (showCreateForm) {
        lastAction = 'create';
      } else if (updatingContent) {
        lastAction = 'update';
      }

      // Hide forms after successful submission
      showCreateForm = false;
      updatingContent = null;
    }

    // Track the success state to detect new successes
    lastFormSuccess = !!form?.success;

    // Clear success state when form is cleared/reset
    if (!form?.success) {
      lastAction = null;
    }
  });

  function handleCreateNew() {
    updatingContent = null;
    showCreateForm = true;
    lastAction = null; // Clear any previous success state
  }

  function handleUpdate(content: Content) {
    updatingContent = content;
    showCreateForm = false;
    lastAction = null; // Clear any previous success state
  }

  function handleCancel() {
    showCreateForm = false;
    updatingContent = null;
    lastAction = null; // Clear any previous success state
  }

  function handleDelete() {
    // The ContentCard component handles the actual deletion
    // This is just here for consistency
  }
</script>

<svelte:head>
  <title>Dashboard - Journal App</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <div class="container mx-auto p-6">
    <!-- Welcome Section -->
    <div class="hero bg-base-100 mb-6 rounded-lg shadow-xl">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">Welcome back!</h1>
          <p class="py-6">
            Hello, {data.user.name}! You're successfully logged in to your journal app.
          </p>
          <div class="stats shadow">
            <div class="stat">
              <div class="stat-title">Member since</div>
              <div class="stat-value text-lg">
                {new Date(data.user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Total Posts</div>
              <div class="stat-value text-lg">{data.content.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="mb-6 flex gap-4">
      <button class="btn btn-primary" onclick={handleCreateNew} disabled={showCreateForm || updatingContent !== null}>
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create New Post
      </button>
    </div>

    <!-- Success Message (shown outside of form so it persists after form auto-hide) -->
    {#if form?.success && lastAction}
      <div class="alert alert-success mb-6">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Post {lastAction === 'update' ? 'updated' : 'created'} successfully!</span>
      </div>
    {/if}

    <!-- Create/Update Form -->
    {#if showCreateForm}
      <div class="mb-6">
        <ContentForm mode="create" onCancel={handleCancel} {form} />
      </div>
    {/if}

    {#if updatingContent}
      <div class="mb-6">
        <ContentForm mode="update" content={updatingContent} onCancel={handleCancel} {form} />
      </div>
    {/if}

    <!-- Content List -->
    {#if data.content.length > 0}
      <div class="space-y-6">
        <h2 class="text-2xl font-bold">Your Posts</h2>
        {#each data.content as content (content.id)}
          <ContentCard {content} onUpdate={handleUpdate} onDelete={handleDelete} showActions={!showCreateForm && !updatingContent} />
        {/each}
      </div>
    {:else if !showCreateForm}
      <div class="py-12 text-center">
        <div class="mx-auto max-w-md">
          <h3 class="mb-4 text-xl font-semibold">No posts yet</h3>
          <p class="text-base-content/60 mb-6">
            Start your journaling journey by creating your first post. You can write in Markdown and see it beautifully rendered!
          </p>
          <button class="btn btn-primary" onclick={handleCreateNew}> Create Your First Post </button>
        </div>
      </div>
    {/if}

    <!-- Feature Cards (Updated) -->
    <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">✍️ Write & Update</h2>
          <p>Create and update your posts with full Markdown support.</p>
          <div class="card-actions justify-end">
            <div class="badge badge-success">Active</div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">📖 Read & Browse</h2>
          <p>View your posts with beautiful Markdown rendering.</p>
          <div class="card-actions justify-end">
            <div class="badge badge-success">Active</div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">🎨 Themes</h2>
          <p>Switch between light, dark, and auto themes.</p>
          <div class="card-actions justify-end">
            <div class="badge badge-success">Active</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
