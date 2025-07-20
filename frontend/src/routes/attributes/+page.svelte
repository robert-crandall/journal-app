<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { userAttributesApi } from '$lib/api/user-attributes';
  import type {
    GroupedUserAttributes,
    UserAttribute,
    AttributeSource,
  } from '../../../../../backend/src/types/user-attributes';
  import { Plus, User, Brain, Lightbulb, Zap, Shield, Heart, Edit3, Trash2, Filter } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // Reactive state for attributes data
  let groupedAttributes: GroupedUserAttributes = $state({});
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let selectedSource: AttributeSource | 'all' = $state('all');

  // Load data on component mount
  onMount(async () => {
    await loadAttributesData();
  });

  // Separate function to load attributes data
  async function loadAttributesData() {
    try {
      loading = true;
      error = null;

      console.log('Loading attributes data...');
      const attributesData = await userAttributesApi.getGroupedUserAttributes();
      console.log('Received attributes data:', attributesData);
      groupedAttributes = attributesData;
    } catch (err) {
      console.error('Failed to load attributes:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load attributes';
    } finally {
      loading = false;
    }
  }

  // Filter attributes based on source
  let filteredGroupedAttributes = $derived(() => {
    if (selectedSource === 'all') {
      return groupedAttributes;
    }

    const filtered: GroupedUserAttributes = {};
    for (const [category, attributes] of Object.entries(groupedAttributes)) {
      const filteredAttrs = attributes.filter(attr => attr.source === selectedSource);
      if (filteredAttrs.length > 0) {
        filtered[category] = filteredAttrs;
      }
    }
    return filtered;
  });

  // Helper functions
  function getCategoryIcon(category: string) {
    switch (category.toLowerCase()) {
      case 'priorities':
        return Zap;
      case 'values':
        return Heart;
      case 'motivators':
        return Lightbulb;
      case 'challenges':
        return Shield;
      case 'strengths':
        return User;
      case 'interests':
        return Brain;
      default:
        return User;
    }
  }

  function getSourceBadgeClass(source: AttributeSource) {
    switch (source) {
      case 'user_set':
        return 'badge-primary';
      case 'gpt_summary':
        return 'badge-secondary';
      case 'journal_analysis':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  }

  function getSourceLabel(source: AttributeSource) {
    switch (source) {
      case 'user_set':
        return 'User Set';
      case 'gpt_summary':
        return 'AI Summary';
      case 'journal_analysis':
        return 'Journal Analysis';
      default:
        return source;
    }
  }

  async function deleteAttribute(attributeId: string) {
    if (!confirm('Are you sure you want to delete this attribute?')) {
      return;
    }

    try {
      await userAttributesApi.deleteUserAttribute(attributeId);
      await loadAttributesData(); // Reload data
    } catch (err) {
      console.error('Failed to delete attribute:', err);
      error = err instanceof Error ? err.message : 'Failed to delete attribute';
    }
  }

  function navigateToCreate() {
    goto('/attributes/create');
  }

  function navigateToEdit(attributeId: string) {
    goto(`/attributes/${attributeId}/edit`);
  }
</script>

<svelte:head>
  <title>Personal Attributes - Journal App</title>
  <meta name="description" content="View and manage your personal attributes and traits" />
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl">
  <!-- Header -->
  <div class="flex flex-col gap-4 mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-base-content">Personal Attributes</h1>
        <p class="text-base-content/70 mt-2">
          Track your values, priorities, motivators, and other personal traits
        </p>
      </div>

      <button
        class="btn btn-primary"
        onclick={navigateToCreate}
      >
        <Plus size={20} />
        Add Attribute
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex items-center gap-2">
        <Filter size={16} />
        <span class="text-sm font-medium">Filter by source:</span>
      </div>
      
      <div class="join">
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="All"
          checked={selectedSource === 'all'}
          onchange={() => selectedSource = 'all'}
        />
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="User Set"
          checked={selectedSource === 'user_set'}
          onchange={() => selectedSource = 'user_set'}
        />
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="AI Summary"
          checked={selectedSource === 'gpt_summary'}
          onchange={() => selectedSource = 'gpt_summary'}
        />
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="Journal Analysis"
          checked={selectedSource === 'journal_analysis'}
          onchange={() => selectedSource = 'journal_analysis'}
        />
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error mb-6">
      <span>{error}</span>
      <button class="btn btn-sm btn-outline" onclick={loadAttributesData}>
        Try Again
      </button>
    </div>
  {:else if Object.keys(filteredGroupedAttributes).length === 0}
    <!-- Empty State -->
    <div class="text-center py-12">
      <User size={64} class="mx-auto text-base-content/30 mb-4" />
      <h3 class="text-xl font-semibold mb-2">No attributes found</h3>
      <p class="text-base-content/70 mb-6">
        {selectedSource === 'all' 
          ? "Start building your personal profile by adding some attributes about yourself."
          : "No attributes found for the selected source filter."
        }
      </p>
      {#if selectedSource === 'all'}
        <button class="btn btn-primary" onclick={navigateToCreate}>
          <Plus size={20} />
          Add Your First Attribute
        </button>
      {/if}
    </div>
  {:else}
    <!-- Attributes Grid -->
    <div class="grid gap-6">
      {#each Object.entries(filteredGroupedAttributes) as [category, attributes]}
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body">
            <div class="flex items-center gap-3 mb-4">
              <svelte:component this={getCategoryIcon(category)} size={24} class="text-primary" />
              <h2 class="card-title text-xl capitalize">{category}</h2>
              <div class="badge badge-neutral">{attributes.length}</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each attributes as attribute}
                <div class="card bg-base-200 border border-base-300">
                  <div class="card-body p-4">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h3 class="font-semibold text-base-content">{attribute.value}</h3>
                      <div class="dropdown dropdown-end">
                        <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-square">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                          </svg>
                        </div>
                        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                          <li>
                            <button onclick={() => navigateToEdit(attribute.id)} class="text-sm">
                              <Edit3 size={14} />
                              Edit
                            </button>
                          </li>
                          <li>
                            <button onclick={() => deleteAttribute(attribute.id)} class="text-sm text-error">
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="badge {getSourceBadgeClass(attribute.source)} badge-sm">
                        {getSourceLabel(attribute.source)}
                      </div>
                      <div class="text-xs text-base-content/50">
                        {formatDateTime(new Date(attribute.lastUpdated))}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
