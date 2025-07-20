<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { userAttributesApi } from '$lib/api/user-attributes';
  import type { GroupedUserAttributes, UserAttribute, AttributeSource } from '../../../../../backend/src/types/user-attributes';
  import { Plus, User, Brain, Lightbulb, Zap, Shield, Heart, Edit3, Trash2, Filter } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // Reactive state for attributes data
  let groupedAttributes = $state({
    priorities: [],
    values: [],
    motivators: [],
    challenges: [],
  } as GroupedUserAttributes);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let selectedSource: AttributeSource | 'all' = $state('all');

  // Filter attributes based on source
  let filteredGroupedAttributes = $derived.by(() => {
    if (selectedSource === 'all') {
      return groupedAttributes;
    }

    const filtered: GroupedUserAttributes = {};
    for (const [category, attributes] of Object.entries(groupedAttributes)) {
      if (Array.isArray(attributes)) {
        const filteredAttrs = attributes.filter((attr: any) => attr.source === selectedSource);
        if (filteredAttrs.length > 0) {
          filtered[category] = filteredAttrs;
        }
      }
    }
    return filtered;
  });

  // Check if we have any attributes to display
  let hasAnyAttributes = $derived(() => {
    const attrs = filteredGroupedAttributes;
    return Object.values(attrs).some((categoryAttrs) => categoryAttrs && categoryAttrs.length > 0);
  });

  // Load data on component mount
  onMount(async () => {
    await loadAttributesData();
  });
  async function loadAttributesData() {
    try {
      loading = true;
      error = null;

      const attributesData = await userAttributesApi.getGroupedUserAttributes();

      // Ensure all expected categories exist as arrays
      groupedAttributes = {
        // Include any other categories that might exist first
        ...attributesData,
        // Then override with guaranteed arrays for expected categories
        priorities: attributesData.priorities || [],
        values: attributesData.values || [],
        motivators: attributesData.motivators || [],
        challenges: attributesData.challenges || [],
      };
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

<div class="container mx-auto max-w-6xl p-4">
  <!-- Header -->
  <div class="mb-8 flex flex-col gap-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-base-content text-3xl font-bold">Personal Attributes</h1>
        <p class="text-base-content/70 mt-2">Track your values, priorities, motivators, and other personal traits</p>
      </div>

      <button class="btn btn-primary" onclick={navigateToCreate}>
        <Plus size={20} />
        Add Attribute
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4">
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
          onchange={() => (selectedSource = 'all')}
        />
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="User Set"
          checked={selectedSource === 'user_set'}
          onchange={() => (selectedSource = 'user_set')}
        />
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="AI Summary"
          checked={selectedSource === 'gpt_summary'}
          onchange={() => (selectedSource = 'gpt_summary')}
        />
        <input
          class="join-item btn btn-sm"
          type="radio"
          name="source-filter"
          aria-label="Journal Analysis"
          checked={selectedSource === 'journal_analysis'}
          onchange={() => (selectedSource = 'journal_analysis')}
        />
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error mb-6">
      <span>{error}</span>
      <button class="btn btn-sm btn-outline" onclick={loadAttributesData}> Try Again </button>
    </div>
  {:else if !hasAnyAttributes}
    <!-- Empty State -->
    <div class="py-12 text-center">
      <User size={64} class="text-base-content/30 mx-auto mb-4" />
      <h3 class="mb-2 text-xl font-semibold">No attributes found</h3>
      <p class="text-base-content/70 mb-6">
        {selectedSource === 'all'
          ? 'Start building your personal profile by adding some attributes about yourself.'
          : 'No attributes found for the selected source filter.'}
      </p>
      {#if selectedSource === 'all'}
        <button class="btn btn-primary" onclick={navigateToCreate}>
          <Plus size={20} />
          Add Your First Attribute
        </button>
      {/if}

      <!-- Debug info -->
      <details class="mt-4">
        <summary class="text-base-content/50 cursor-pointer text-xs">Debug Info</summary>
        <div class="bg-base-200 mt-2 rounded p-2 text-left text-xs">
          <p>selectedSource: {selectedSource}</p>
          <p>hasAnyAttributes: {hasAnyAttributes}</p>
          <pre>{JSON.stringify(groupedAttributes, null, 2)}</pre>
        </div>
      </details>
    </div>
  {:else}
    <!-- Attributes Grid -->
    <div class="grid gap-6">
      {#each Object.entries(filteredGroupedAttributes) as [category, attributes]}
        {#if attributes && attributes.length > 0}
          {@const IconComponent = getCategoryIcon(category)}
          <div class="card bg-base-100 border-base-300 border">
            <div class="card-body">
              <div class="mb-4 flex items-center gap-3">
                <IconComponent size={24} class="text-primary" />
                <h2 class="card-title text-xl capitalize">{category}</h2>
                <div class="badge badge-neutral">{attributes.length}</div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each attributes as attribute}
                  <div class="card bg-base-200 border-base-300 border">
                    <div class="card-body p-4">
                      <div class="mb-2 flex items-start justify-between gap-2">
                        <h3 class="text-base-content font-semibold">{attribute.value}</h3>
                        <div class="dropdown dropdown-end">
                          <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-square">
                            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                            </svg>
                          </div>
                          <div class="dropdown-content menu bg-base-100 rounded-box w-32 p-2 shadow">
                            <button onclick={() => navigateToEdit(attribute.id)} class="btn btn-ghost btn-sm justify-start text-sm">
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button onclick={() => deleteAttribute(attribute.id)} class="btn btn-ghost btn-sm text-error justify-start text-sm">
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between">
                        <div class="badge {getSourceBadgeClass(attribute.source)} badge-sm">
                          {getSourceLabel(attribute.source)}
                        </div>
                        <div class="text-base-content/50 text-xs">
                          {formatDateTime(new Date(attribute.lastUpdated))}
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
