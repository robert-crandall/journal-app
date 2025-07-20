<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { userAttributesApi } from '$lib/api/user-attributes';
  import type { UserAttribute, UpdateUserAttributeRequest, AttributeSource } from '../../../../../../../backend/src/types/user-attributes';
  import { ArrowLeft, Save, User, Brain, Lightbulb, Zap, Shield, Heart } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // Get attribute ID from route params
  let attributeId = $derived($page.params.id);

  // Component state
  let attribute: UserAttribute | null = $state(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Form state
  let formData: UpdateUserAttributeRequest = $state({
    category: '',
    value: '',
    source: 'user_set',
  });

  // Common categories for quick selection
  const commonCategories = [
    { name: 'priorities', icon: Zap, description: 'What matters most to you' },
    { name: 'values', icon: Heart, description: 'Your core beliefs and principles' },
    { name: 'motivators', icon: Lightbulb, description: 'What drives and inspires you' },
    { name: 'challenges', icon: Shield, description: 'Areas you struggle with' },
    { name: 'strengths', icon: User, description: 'Your natural talents and abilities' },
    { name: 'interests', icon: Brain, description: 'Topics and activities you enjoy' },
  ];

  // Load attribute data on mount
  onMount(async () => {
    await loadAttribute();
  });

  async function loadAttribute() {
    try {
      loading = true;
      error = null;

      attribute = await userAttributesApi.getUserAttribute(attributeId);

      // Initialize form with current attribute data
      formData = {
        category: attribute.category,
        value: attribute.value,
        source: attribute.source,
      };
    } catch (err) {
      console.error('Failed to load attribute:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load attribute';
    } finally {
      loading = false;
    }
  }

  // Form validation
  let isValid = $derived(formData.category?.trim().length > 0 && formData.value?.trim().length > 0);

  let hasChanges = $derived(
    attribute && (formData.category !== attribute.category || formData.value !== attribute.value || formData.source !== attribute.source),
  );

  // Handle form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid || saving || !hasChanges) return;

    try {
      saving = true;
      error = null;

      // Trim whitespace from inputs
      const cleanedData = {
        ...formData,
        category: formData.category?.trim(),
        value: formData.value?.trim(),
      };

      await userAttributesApi.updateUserAttribute(attributeId, cleanedData);

      // Navigate back to attributes list
      goto('/attributes');
    } catch (err) {
      console.error('Failed to update attribute:', err);
      error = err instanceof Error ? err.message : 'Failed to update attribute';
    } finally {
      saving = false;
    }
  }

  // Handle category selection
  function selectCategory(categoryName: string) {
    formData.category = categoryName;
  }

  // Handle back navigation
  function goBack() {
    goto('/attributes');
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
</script>

<svelte:head>
  <title>Edit Attribute - Journal App</title>
  <meta name="description" content="Edit a personal attribute or trait" />
</svelte:head>

<div class="container mx-auto max-w-2xl p-4">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <button class="btn btn-ghost btn-sm" onclick={goBack}>
      <ArrowLeft size={20} />
      Back
    </button>

    <div class="flex-1">
      <h1 class="text-base-content text-2xl font-bold">Edit Personal Attribute</h1>
      {#if attribute}
        <p class="text-base-content/70 mt-1">
          Last updated: {formatDateTime(new Date(attribute.lastUpdated))}
        </p>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="alert alert-error mb-6">
      <span>{error}</span>
      <button class="btn btn-sm btn-outline" onclick={loadAttribute}> Try Again </button>
    </div>
  {:else if attribute}
    <form onsubmit={handleSubmit} class="space-y-6">
      <!-- Current Info -->
      <div class="card bg-base-200 border-base-300 border">
        <div class="card-body p-4">
          <h3 class="mb-2 font-semibold">Current Information</h3>
          <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div>
              <span class="text-base-content/60">Category:</span>
              <div class="font-medium capitalize">{attribute.category}</div>
            </div>
            <div>
              <span class="text-base-content/60">Value:</span>
              <div class="font-medium">{attribute.value}</div>
            </div>
            <div>
              <span class="text-base-content/60">Source:</span>
              <div class="font-medium">{getSourceLabel(attribute.source)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Selection -->
      <div class="form-control">
        <label class="label" for="category-input">
          <span class="label-text font-medium">Category</span>
          <span class="label-text-alt">Required</span>
        </label>

        <!-- Quick Category Selection -->
        <div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {#each commonCategories as category}
            <button
              type="button"
              class="card bg-base-200 border-base-300 hover:border-primary hover:bg-base-100 cursor-pointer border-2 p-3 transition-colors {formData.category ===
              category.name
                ? 'border-primary bg-primary/10'
                : ''}"
              onclick={() => selectCategory(category.name)}
            >
              <div class="flex flex-col items-center gap-2 text-center">
                <svelte:component this={category.icon} size={20} class="text-primary" />
                <div>
                  <div class="text-sm font-medium capitalize">{category.name}</div>
                  <div class="text-base-content/60 mt-1 text-xs">{category.description}</div>
                </div>
              </div>
            </button>
          {/each}
        </div>

        <!-- Custom Category Input -->
        <input
          id="category-input"
          type="text"
          placeholder="Or enter a custom category..."
          class="input input-bordered w-full"
          bind:value={formData.category}
          maxlength="100"
          required
        />
        <label class="label">
          <span class="label-text-alt text-base-content/60"> Categories help organize your attributes (e.g., priorities, values, interests) </span>
        </label>
      </div>

      <!-- Value Input -->
      <div class="form-control">
        <label class="label" for="value-input">
          <span class="label-text font-medium">Value</span>
          <span class="label-text-alt">Required</span>
        </label>
        <input
          id="value-input"
          type="text"
          placeholder="e.g., family, creativity, physical health..."
          class="input input-bordered w-full"
          bind:value={formData.value}
          maxlength="200"
          required
        />
        <label class="label">
          <span class="label-text-alt text-base-content/60"> The specific trait or characteristic (e.g., "family", "learning", "adventure") </span>
        </label>
      </div>

      <!-- Source Selection -->
      <div class="form-control">
        <label class="label" for="source-select">
          <span class="label-text font-medium">Source</span>
        </label>
        <select id="source-select" class="select select-bordered w-full" bind:value={formData.source}>
          <option value="user_set">User Set</option>
          <option value="gpt_summary">AI Summary</option>
          <option value="journal_analysis">Journal Analysis</option>
        </select>
        <label class="label">
          <span class="label-text-alt text-base-content/60"> How this attribute was identified or created </span>
        </label>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-3 pt-6 sm:flex-row">
        <button type="button" class="btn btn-outline" onclick={goBack} disabled={saving}> Cancel </button>

        <button type="submit" class="btn btn-primary flex-1" disabled={!isValid || saving || !hasChanges}>
          {#if saving}
            <span class="loading loading-spinner loading-sm"></span>
            Saving...
          {:else}
            <Save size={20} />
            Save Changes
          {/if}
        </button>
      </div>

      {#if !hasChanges && !saving}
        <div class="alert alert-info">
          <span>No changes detected. Modify the fields above to save updates.</span>
        </div>
      {/if}
    </form>
  {/if}
</div>
