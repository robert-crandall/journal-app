<script lang="ts">
  import { goto } from '$app/navigation';
  import { questsApi } from '$lib/api/quests';
  import type { CreateQuestRequest } from '$lib/types/quest';
  import { ArrowLeft, Save, Target } from 'lucide-svelte';

  // Form state
  let formData: CreateQuestRequest = {
    title: '',
    summary: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    endDate: ''
  };

  let isSubmitting = false;
  let error = '';

  async function handleSubmit() {
    try {
      error = '';
      isSubmitting = true;

      // Basic validation
      if (!formData.title.trim()) {
        error = 'Title is required';
        return;
      }

      if (!formData.startDate) {
        error = 'Start date is required';
        return;
      }

      // Validate end date is after start date if provided
      if (formData.endDate && formData.endDate <= formData.startDate) {
        error = 'End date must be after start date';
        return;
      }

      // Clean up form data
      const questData: CreateQuestRequest = {
        title: formData.title.trim(),
        startDate: formData.startDate,
      };

      if (formData.summary?.trim()) {
        questData.summary = formData.summary.trim();
      }

      if (formData.endDate) {
        questData.endDate = formData.endDate;
      }

      // Create the quest
      const quest = await questsApi.createQuest(questData);
      
      // Redirect to the quest detail page
      goto(`/quests/${quest.id}`);
    } catch (err) {
      console.error('Failed to create quest:', err);
      error = err instanceof Error ? err.message : 'Failed to create quest';
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto('/quests');
  }
</script>

<svelte:head>
  <title>New Quest - Life Journal</title>
</svelte:head>

<div class="max-w-2xl mx-auto p-4">
  <!-- Page Header -->
  <div class="flex items-center gap-4 mb-6">
    <button 
      class="btn btn-ghost btn-sm" 
      on:click={handleCancel}
      disabled={isSubmitting}
    >
      <ArrowLeft class="w-4 h-4" />
      Back
    </button>
    <div>
      <h1 class="text-3xl font-bold flex items-center gap-3">
        <Target class="w-8 h-8 text-primary" />
        New Quest
      </h1>
      <p class="text-base-content/60 mt-1">Create a new life adventure to track</p>
    </div>
  </div>

  <!-- Error Alert -->
  {#if error}
    <div class="alert alert-error mb-6">
      <span>{error}</span>
    </div>
  {/if}

  <!-- Quest Form -->
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-6">
        <!-- Quest Title -->
        <div class="form-control">
          <label class="label" for="title">
            <span class="label-text font-medium">Quest Title *</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter your quest title..."
            class="input input-bordered w-full"
            bind:value={formData.title}
            disabled={isSubmitting}
            required
          />
          <div class="label">
            <span class="label-text-alt text-base-content/60">
              Give your quest a memorable and inspiring name
            </span>
          </div>
        </div>

        <!-- Quest Summary -->
        <div class="form-control">
          <label class="label" for="summary">
            <span class="label-text font-medium">Summary</span>
          </label>
          <textarea
            id="summary"
            placeholder="Describe what this quest is about..."
            class="textarea textarea-bordered h-24 resize-none"
            bind:value={formData.summary}
            disabled={isSubmitting}
          ></textarea>
          <div class="label">
            <span class="label-text-alt text-base-content/60">
              Optional description of your quest goals and motivation
            </span>
          </div>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Start Date -->
          <div class="form-control">
            <label class="label" for="startDate">
              <span class="label-text font-medium">Start Date *</span>
            </label>
            <input
              id="startDate"
              type="date"
              class="input input-bordered w-full"
              bind:value={formData.startDate}
              disabled={isSubmitting}
              required
            />
          </div>

          <!-- End Date -->
          <div class="form-control">
            <label class="label" for="endDate">
              <span class="label-text font-medium">End Date</span>
            </label>
            <input
              id="endDate"
              type="date"
              class="input input-bordered w-full"
              bind:value={formData.endDate}
              disabled={isSubmitting}
              min={formData.startDate}
            />
            <div class="label">
              <span class="label-text-alt text-base-content/60">
                Optional target completion date
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
      <button 
        type="button" 
        class="btn btn-outline" 
        on:click={handleCancel}
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="btn btn-primary" 
        disabled={isSubmitting || !formData.title.trim()}
      >
        {#if isSubmitting}
          <span class="loading loading-spinner loading-sm"></span>
          Creating Quest...
        {:else}
          <Save class="w-4 h-4" />
          Create Quest
        {/if}
      </button>
    </div>
  </form>
</div>
