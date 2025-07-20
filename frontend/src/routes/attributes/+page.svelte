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
    console.log('Derived function called');
    console.log('selectedSource:', selectedSource);
    console.log('groupedAttributes:', groupedAttributes);
    console.log('Object.keys(groupedAttributes):', Object.keys(groupedAttributes));
    
    if (selectedSource === 'all') {
      console.log('Returning all attributes:', groupedAttributes);
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
    console.log('Returning filtered attributes:', filtered);
    return filtered;
  });

  // Check if we have any attributes to display
  let hasAnyAttributes = $derived(() => {
    const attrs = filteredGroupedAttributes;
    return Object.values(attrs).some(categoryAttrs => categoryAttrs && categoryAttrs.length > 0);
  });

  // Load data on component mount
  onMount(async () => {
    await loadAttributesData();
  });
  async function loadAttributesData() {
    try {
      loading = true;
      error = null;

      console.log('Loading attributes data...');
      const attributesData = await userAttributesApi.getGroupedUserAttributes();
      console.log('Received attributes data:', attributesData);
      console.log('Type of data:', typeof attributesData);
      console.log('Object.keys:', Object.keys(attributesData));
      console.log('Data structure check:');
      console.log('- priorities:', attributesData.priorities?.length ?? 'undefined');
      console.log('- values:', attributesData.values?.length ?? 'undefined');
      console.log('- motivators:', attributesData.motivators?.length ?? 'undefined');
      console.log('- challenges:', attributesData.challenges?.length ?? 'undefined');
      
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
      
      console.log('Final groupedAttributes:', groupedAttributes);
      console.log('Final groupedAttributes keys:', Object.keys(groupedAttributes));
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
  {:else if !hasAnyAttributes}
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
      
      <!-- Debug info -->
      <details class="mt-4">
        <summary class="text-xs text-base-content/50 cursor-pointer">Debug Info</summary>
        <div class="text-xs text-left mt-2 p-2 bg-base-200 rounded">
          <p>filteredGroupedAttributes keys: {Object.keys(filteredGroupedAttributes).join(', ')}</p>
          <p>groupedAttributes keys: {Object.keys(groupedAttributes).join(', ')}</p>
          <p>selectedSource: {selectedSource}</p>
          <p>hasAnyAttributes: {hasAnyAttributes}</p>
          <pre>{JSON.stringify(groupedAttributes, null, 2)}</pre>
        </div>
      </details>
    </div>
  {:else}
    <!-- Attributes Grid -->
    <div class="grid gap-6">
      Hello
      <p class="text-xs text-base-content/50 mb-2">
        Debug: filteredGroupedAttributes has {Object.keys(filteredGroupedAttributes).length} keys: 
        {Object.keys(filteredGroupedAttributes).join(', ')}
      </p>
      {#each Object.entries(filteredGroupedAttributes) as [category, attributes]}
      World
        {#if attributes && attributes.length > 0}
          {@const IconComponent = getCategoryIcon(category)}
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body">
              <div class="flex items-center gap-3 mb-4">
                <IconComponent size={24} class="text-primary" />
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
                        <div class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                          <button onclick={() => navigateToEdit(attribute.id)} class="text-sm btn btn-ghost btn-sm justify-start">
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button onclick={() => deleteAttribute(attribute.id)} class="text-sm btn btn-ghost btn-sm justify-start text-error">
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
        {/if}
      {/each}
    </div>
  {/if}
</div>
