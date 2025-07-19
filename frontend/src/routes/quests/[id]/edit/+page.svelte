<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { questsApi } from '$lib/api/quests';
  import type { QuestResponse, UpdateQuestRequest } from '$lib/types/quest';
  import { formatDateTime } from '$lib/utils/date';
  import { ArrowLeft, Save, Target, Trash2, Archive } from 'lucide-svelte';

  let questId: string;
  let quest: QuestResponse | null = null;
  let isLoading = true;
  let isSubmitting = false;
  let isDeleting = false;
  let error = '';
  let deleteConfirmation = '';

  // Form state
  let formData: UpdateQuestRequest = {
    title: '',
    summary: '',
    startDate: '',
    endDate: '',
    reflection: '',
    status: 'active',
  };

  $: questId = $page.params.id;

  onMount(async () => {
    if (questId) {
      await loadQuest();
    }
  });

  async function loadQuest() {
    try {
      isLoading = true;
      error = '';
      quest = await questsApi.getQuest(questId);

      if (quest) {
        // Populate form with quest data
        formData = {
          title: quest.title,
          summary: quest.summary || '',
          startDate: quest.startDate,
          endDate: quest.endDate || '',
          reflection: quest.reflection || '',
          status: quest.status as 'active' | 'completed' | 'archived',
        };
      }
    } catch (err) {
      console.error('Failed to load quest:', err);
      error = err instanceof Error ? err.message : 'Failed to load quest';
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit() {
    try {
      error = '';
      isSubmitting = true;

      // Basic validation
      if (!formData.title?.trim()) {
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
      const updateData: UpdateQuestRequest = {
        title: formData.title.trim(),
        startDate: formData.startDate,
        status: formData.status,
      };

      if (formData.summary?.trim()) {
        updateData.summary = formData.summary.trim();
      }

      if (formData.endDate) {
        updateData.endDate = formData.endDate;
      }

      if (formData.reflection?.trim()) {
        updateData.reflection = formData.reflection.trim();
      }

      // Update the quest
      const updatedQuest = await questsApi.updateQuest(questId, updateData);

      if (updatedQuest) {
        // Redirect to the quest detail page
        goto(`/quests/${updatedQuest.id}`);
      } else {
        error = 'Failed to update quest';
      }
    } catch (err) {
      console.error('Failed to update quest:', err);
      error = err instanceof Error ? err.message : 'Failed to update quest';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete() {
    if (deleteConfirmation !== quest?.title) {
      error = 'Please type the quest title exactly to confirm deletion';
      return;
    }

    try {
      error = '';
      isDeleting = true;

      await questsApi.deleteQuest(questId);

      // Redirect to quests list
      goto('/quests');
    } catch (err) {
      console.error('Failed to delete quest:', err);
      error = err instanceof Error ? err.message : 'Failed to delete quest';
    } finally {
      isDeleting = false;
    }
  }

  function handleCancel() {
    goto(`/quests/${questId}`);
  }
</script>

<svelte:head>
  <title>Edit Quest - Life Journal</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-4">
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
    </div>
  {:else if error && !quest}
    <!-- Error State -->
    <div class="alert alert-error mb-6">
      <span>{error}</span>
      <button class="btn btn-sm btn-ghost" on:click={loadQuest}> Try Again </button>
    </div>
  {:else if quest}
    <!-- Page Header -->
    <div class="mb-6 flex items-center gap-4">
      <button class="btn btn-ghost btn-sm" on:click={handleCancel} disabled={isSubmitting || isDeleting}>
        <ArrowLeft class="h-4 w-4" />
        Back
      </button>
      <div>
        <h1 class="flex items-center gap-3 text-3xl font-bold">
          <Target class="text-primary h-8 w-8" />
          Edit Quest
        </h1>
        <p class="text-base-content/60 mt-1">Update your quest details</p>
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
              disabled={isSubmitting || isDeleting}
              required
            />
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
              disabled={isSubmitting || isDeleting}
            ></textarea>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                disabled={isSubmitting || isDeleting}
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
                disabled={isSubmitting || isDeleting}
                min={formData.startDate}
              />
            </div>
          </div>

          <!-- Status -->
          <div class="form-control">
            <label class="label" for="status">
              <span class="label-text font-medium">Status</span>
            </label>
            <select id="status" class="select select-bordered w-full" bind:value={formData.status} disabled={isSubmitting || isDeleting}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <!-- Reflection -->
          <div class="form-control">
            <label class="label" for="reflection">
              <span class="label-text font-medium">Reflection</span>
            </label>
            <textarea
              id="reflection"
              placeholder="What have you learned or achieved in this quest?"
              class="textarea textarea-bordered h-32 resize-none"
              bind:value={formData.reflection}
              disabled={isSubmitting || isDeleting}
            ></textarea>
            <div class="label">
              <span class="label-text-alt text-base-content/60"> Optional notes about your progress and insights </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div class="flex gap-3">
          <button type="button" class="btn btn-outline" on:click={handleCancel} disabled={isSubmitting || isDeleting}> Cancel </button>
        </div>
        <div class="flex gap-3">
          <button type="submit" class="btn btn-primary" disabled={isSubmitting || isDeleting || !formData.title?.trim()}>
            {#if isSubmitting}
              <span class="loading loading-spinner loading-sm"></span>
              Updating...
            {:else}
              <Save class="h-4 w-4" />
              Update Quest
            {/if}
          </button>
        </div>
      </div>
    </form>

    <!-- Danger Zone -->
    <div class="card bg-base-100 border-error/20 border shadow-sm">
      <div class="card-body">
        <h3 class="card-title text-error">Danger Zone</h3>
        <div class="space-y-4">
          <p class="text-base-content/60 text-sm">
            Deleting a quest will permanently remove it and all its links to experiments and journals. This action cannot be undone.
          </p>

          <!-- Delete Confirmation -->
          <div class="form-control">
            <label class="label" for="deleteConfirmation">
              <span class="label-text">Type "{quest.title}" to confirm deletion:</span>
            </label>
            <input
              id="deleteConfirmation"
              type="text"
              placeholder="Quest title"
              class="input input-bordered input-error w-full"
              bind:value={deleteConfirmation}
              disabled={isSubmitting || isDeleting}
            />
          </div>

          <button type="button" class="btn btn-error" disabled={isSubmitting || isDeleting || deleteConfirmation !== quest.title} on:click={handleDelete}>
            {#if isDeleting}
              <span class="loading loading-spinner loading-sm"></span>
              Deleting...
            {:else}
              <Trash2 class="h-4 w-4" />
              Delete Quest
            {/if}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Quest Not Found -->
    <div class="py-12 text-center">
      <Target class="text-base-300 mx-auto mb-4 h-16 w-16" />
      <h2 class="mb-2 text-xl font-semibold">Quest not found</h2>
      <p class="text-base-content/60 mb-4">The quest you're trying to edit doesn't exist or you don't have access to it.</p>
      <a href="/quests" class="btn btn-primary">
        <ArrowLeft class="h-4 w-4" />
        Back to Quests
      </a>
    </div>
  {/if}
</div>
