<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { journalSummariesApi, journalSummariesUtils } from '$lib/api/journal-summaries';
  import type { JournalSummaryResponse, UpdateJournalSummaryFormData } from '$lib/types/journal-summaries';
  import { BookOpenIcon, CalendarIcon, ArrowLeftIcon, SaveIcon, TagIcon } from 'lucide-svelte';

  // State
  let summary: JournalSummaryResponse | null = null;
  let formData: UpdateJournalSummaryFormData = {};
  let loading = true;
  let saving = false;
  let error: string | null = null;
  let tagsInput = '';

  // Get the summary ID from the URL
  $: summaryId = $page.params.id;

  onMount(async () => {
    if (summaryId) {
      await loadSummary();
    }
  });

  async function loadSummary() {
    try {
      loading = true;
      error = null;
      summary = await journalSummariesApi.getJournalSummary(summaryId);

      if (summary) {
        formData = {
          summary: summary.summary,
          tags: summary.tags || [],
        };
        tagsInput = summary.tags ? summary.tags.join(', ') : '';
      }
    } catch (err) {
      console.error('Failed to load journal summary:', err);
      error = err instanceof Error ? err.message : 'Failed to load journal summary';
    } finally {
      loading = false;
    }
  }

  async function saveSummary() {
    if (!summary) return;

    try {
      saving = true;
      error = null;

      // Parse tags from input
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const updateData: UpdateJournalSummaryFormData = {
        summary: formData.summary,
        tags: tags.length > 0 ? tags : undefined,
      };

      const updatedSummary = await journalSummariesApi.updateJournalSummary(summary.id, updateData);
      goto(`/journal-summaries/${updatedSummary.id}`);
    } catch (err) {
      console.error('Failed to save summary:', err);
      error = err instanceof Error ? err.message : 'Failed to save summary';
    } finally {
      saving = false;
    }
  }

  function goBack() {
    if (summary) {
      goto(`/journal-summaries/${summary.id}`);
    } else {
      goto('/journal-summaries');
    }
  }

  function getStatusBadgeClass(period: 'week' | 'month'): string {
    return period === 'week' ? 'badge-primary' : 'badge-secondary';
  }

  function isValid(): boolean {
    return Boolean(formData.summary && formData.summary.trim().length > 0) && !saving;
  }
</script>

<svelte:head>
  <title>
    {summary
      ? `Edit ${journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate)} Summary - Life Quest`
      : 'Edit Summary - Life Quest'}
  </title>
</svelte:head>

<div class="bg-base-100 min-h-screen">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Breadcrumb -->
    <div class="breadcrumbs mb-6 text-sm">
      <ul>
        <li>
          <button on:click={() => goto('/journal-summaries')} class="text-primary hover:text-primary-focus"> Journal Summaries </button>
        </li>
        <li>
          <button on:click={goBack} class="text-primary hover:text-primary-focus">
            {summary ? journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate) : 'Summary'}
          </button>
        </li>
        <li class="text-base-content/60">Edit</li>
      </ul>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60 mt-4">Loading summary...</p>
        </div>
      </div>

      <!-- Error State -->
    {:else if error && !summary}
      <div class="card bg-error text-error-content shadow-xl">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">
            <BookOpenIcon size={24} />
            Error Loading Summary
          </h2>
          <p>{error}</p>
          <div class="card-actions justify-center">
            <button on:click={loadSummary} class="btn btn-neutral">Try Again</button>
            <button on:click={() => goto('/journal-summaries')} class="btn btn-outline">Back to Summaries</button>
          </div>
        </div>
      </div>

      <!-- Edit Form -->
    {:else if summary}
      <div class="space-y-6">
        <!-- Header -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <div class="mb-2 flex items-center gap-3">
              <CalendarIcon size={24} class="text-primary" />
              <h1 class="text-2xl font-bold">
                Edit {journalSummariesUtils.formatPeriod(summary.period, summary.startDate, summary.endDate)}
              </h1>
              <span class="badge {getStatusBadgeClass(summary.period)}">
                {summary.period}
              </span>
            </div>
            <div class="text-base-content/70 text-sm">
              {summary.startDate} to {summary.endDate}
            </div>
          </div>
        </div>

        <!-- Edit Form -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <form on:submit|preventDefault={saveSummary} class="space-y-6">
              <!-- Summary Content -->
              <div class="form-control">
                <label for="summary-content" class="label">
                  <span class="label-text font-medium">Summary Content</span>
                </label>
                <textarea
                  id="summary-content"
                  bind:value={formData.summary}
                  class="textarea textarea-bordered h-48"
                  placeholder="Write your summary here..."
                  required
                ></textarea>
                <div class="label">
                  <span class="label-text-alt">Use clear, descriptive language to capture the key themes and insights</span>
                </div>
              </div>

              <!-- Tags -->
              <div class="form-control">
                <label for="tags-input" class="label">
                  <span class="label-text font-medium">Tags</span>
                </label>
                <input
                  id="tags-input"
                  type="text"
                  bind:value={tagsInput}
                  class="input input-bordered"
                  placeholder="productivity, health, goals (comma-separated)"
                />
                <div class="label">
                  <span class="label-text-alt">Separate tags with commas</span>
                </div>
              </div>

              <!-- Error Message -->
              {#if error}
                <div class="alert alert-error">
                  <span>{error}</span>
                </div>
              {/if}

              <!-- Actions -->
              <div class="flex flex-col gap-3 sm:flex-row-reverse">
                <button type="submit" disabled={!isValid()} class="btn btn-primary flex-1 gap-2 sm:flex-none">
                  {#if saving}
                    <span class="loading loading-spinner loading-sm"></span>
                    Saving...
                  {:else}
                    <SaveIcon size={16} />
                    Save Changes
                  {/if}
                </button>
                <button type="button" on:click={goBack} class="btn btn-outline flex-1 sm:flex-none" disabled={saving}>
                  <ArrowLeftIcon size={16} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Preview Section -->
        {#if formData.summary && formData.summary.trim().length > 0}
          <div class="card bg-base-200 border-base-300 border">
            <div class="card-body">
              <h3 class="card-title mb-4 text-lg">
                <BookOpenIcon size={20} />
                Preview
              </h3>

              <!-- Tags Preview -->
              {#if tagsInput.trim()}
                <div class="mb-4">
                  <div class="mb-2 flex items-center gap-2">
                    <TagIcon size={16} class="text-base-content/70" />
                    <span class="text-sm font-medium">Tags:</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each tagsInput
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((tag) => tag.length > 0) as tag}
                      <span class="badge badge-outline badge-sm">{tag}</span>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Summary Preview -->
              <div class="max-w-none">
                {#each formData.summary.split('\n\n') as paragraph}
                  {#if paragraph.trim()}
                    <p>{paragraph.replace(/\n/g, ' ')}</p>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
