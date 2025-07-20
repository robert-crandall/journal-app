<script lang="ts">
  import { goto } from '$app/navigation';
  import { userAttributesApi } from '$lib/api/user-attributes';
  import type { CreateUserAttributeRequest, AttributeSource } from '../../../../../../backend/src/types/user-attributes';
  import { ArrowLeft, Save, User, Brain, Lightbulb, Zap, Shield, Heart } from 'lucide-svelte';

  // Form state
  let formData: CreateUserAttributeRequest = $state({
    category: '',
    value: '',
    source: 'user_set',
  });

  let loading = $state(false);
  let error = $state<string | null>(null);

  // Common categories for quick selection
  const commonCategories = [
    { name: 'priorities', icon: Zap, description: 'What matters most to you' },
    { name: 'values', icon: Heart, description: 'Your core beliefs and principles' },
    { name: 'motivators', icon: Lightbulb, description: 'What drives and inspires you' },
    { name: 'challenges', icon: Shield, description: 'Areas you struggle with' },
    { name: 'strengths', icon: User, description: 'Your natural talents and abilities' },
    { name: 'interests', icon: Brain, description: 'Topics and activities you enjoy' },
  ];

  // Form validation
  let isValid = $derived(formData.category.trim().length > 0 && formData.value.trim().length > 0);

  // Handle form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid || loading) return;

    try {
      loading = true;
      error = null;

      // Trim whitespace from inputs
      const cleanedData = {
        ...formData,
        category: formData.category.trim(),
        value: formData.value.trim(),
      };

      await userAttributesApi.createUserAttribute(cleanedData);

      // Navigate back to attributes list
      goto('/attributes');
    } catch (err) {
      console.error('Failed to create attribute:', err);
      error = err instanceof Error ? err.message : 'Failed to create attribute';
    } finally {
      loading = false;
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
</script>

<svelte:head>
  <title>Add Attribute - Journal App</title>
  <meta name="description" content="Add a new personal attribute or trait" />
</svelte:head>

<div class="container mx-auto max-w-2xl p-4">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <button class="btn btn-ghost btn-sm" onclick={goBack}>
      <ArrowLeft size={20} />
      Back
    </button>

    <div>
      <h1 class="text-base-content text-2xl font-bold">Add Personal Attribute</h1>
      <p class="text-base-content/70 mt-1">Add a new trait that represents your personality or preferences</p>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error mb-6">
      <span>{error}</span>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-6">
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
      <button type="button" class="btn btn-outline" onclick={goBack} disabled={loading}> Cancel </button>

      <button type="submit" class="btn btn-primary flex-1" disabled={!isValid || loading}>
        {#if loading}
          <span class="loading loading-spinner loading-sm"></span>
          Creating...
        {:else}
          <Save size={20} />
          Create Attribute
        {/if}
      </button>
    </div>
  </form>
</div>
