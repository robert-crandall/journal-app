<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { journalApi } from '$lib/api/journal';
  import { ArrowLeft, Save, Sparkles, Calendar, BookOpen, AlertTriangle } from 'lucide-svelte';

  // Import types from backend
  import type { Journal, JournalWithTags } from '../../../../../../backend/src/types/journals';

  // Reactive state
  let journal: JournalWithTags | null = $state(null);
  let content = $state('');
  let journalDate = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let finalizing = $state(false);
  let error = $state<string | null>(null);
  let hasChanges = $state(false);

  // Get journal ID from URL
  let journalId: string;

  onMount(async () => {
    journalId = $page.params.id;
    await loadJournal();
  });

  async function loadJournal() {
    try {
      loading = true;
      error = null;

      const journalData = await journalApi.getJournal(journalId);
      journal = journalData;
      content = journalData.content;
      journalDate = journalData.journalDate;
    } catch (err) {
      console.error('Failed to load journal:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load journal';
    } finally {
      loading = false;
    }
  }

  // Track changes
  $effect(() => {
    if (journal) {
      hasChanges = content !== journal.content || journalDate !== journal.journalDate;
    }
  });

  function formatLongDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Save the journal entry
  async function saveJournal() {
    if (!journal) return;

    if (!content.trim()) {
      error = 'Please write something in your journal entry';
      return;
    }

    if (!journalDate) {
      error = 'Please select a date for your journal entry';
      return;
    }

    try {
      saving = true;
      error = null;

      const updatedJournal = await journalApi.updateJournal(journal.id, {
        content: content.trim(),
        journalDate,
      });

      // Update local state
      journal.content = updatedJournal.content;
      journal.journalDate = updatedJournal.journalDate;
      journal.updatedAt = updatedJournal.updatedAt;

      // Redirect back to view mode
      goto(`/journal/${journal.id}`);
    } catch (err) {
      console.error('Failed to save journal:', err);
      error = err instanceof Error ? err.message : 'Failed to save journal entry';
    } finally {
      saving = false;
    }
  }

  // Save and finalize in one step
  async function saveAndFinalize() {
    if (!journal) return;

    if (!content.trim()) {
      error = 'Please write something in your journal entry';
      return;
    }

    try {
      saving = true;
      finalizing = true;
      error = null;

      // First save the changes
      await journalApi.updateJournal(journal.id, {
        content: content.trim(),
        journalDate,
      });

      // Then finalize
      const finalizedJournal = await journalApi.finalizeJournal({ id: journal.id });

      // Redirect to view the finalized journal
      goto(`/journal/${journal.id}`);
    } catch (err) {
      console.error('Failed to save and finalize journal:', err);
      error = err instanceof Error ? err.message : 'Failed to save and analyze journal entry';
    } finally {
      saving = false;
      finalizing = false;
    }
  }

  // Cancel and go back
  function cancel() {
    if (hasChanges && !confirm('Are you sure you want to leave? Your changes will be lost.')) {
      return;
    }
    goto(`/journal/${journalId}`);
  }

  // Navigate back to journal list
  function goToJournalList() {
    if (hasChanges && !confirm('Are you sure you want to leave? Your changes will be lost.')) {
      return;
    }
    goto('/journal');
  }

  // Auto-save every 30 seconds if there are changes
  let autoSaveTimer: NodeJS.Timeout | null = null;
  $effect(() => {
    if (hasChanges && content.trim()) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        // We could implement auto-save here in the future
        console.log('Auto-save timer triggered (not implemented yet)');
      }, 30000);
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  });
</script>

<svelte:head>
  <title>Edit Journal Entry - Gamified Life</title>
  <meta name="description" content="Edit your journal entry" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  {#if loading}
    <!-- Loading State -->
    <div class="flex min-h-screen items-center justify-center">
      <div class="space-y-4 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60">Loading journal entry...</p>
      </div>
    </div>
  {:else if error && !journal}
    <!-- Error State -->
    <div class="flex min-h-screen items-center justify-center">
      <div class="card bg-base-100 border-base-300 max-w-md border shadow-xl">
        <div class="card-body text-center">
          <div class="alert alert-error">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
          <button onclick={goToJournalList} class="btn btn-primary mt-4">
            <ArrowLeft size={18} />
            Back to Journal
          </button>
        </div>
      </div>
    </div>
  {:else if journal}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-4xl px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button onclick={cancel} class="btn btn-ghost btn-sm gap-2">
              <ArrowLeft size={18} />
              Back to Entry
            </button>
            <div>
              <h1 class="text-primary text-2xl font-bold">Edit Journal Entry</h1>
              <p class="text-base-content/70">
                {journal.title || `Entry for ${formatLongDate(journal.journalDate)}`}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            {#if journal.isFinalized}
              <div class="alert alert-warning px-3 py-2">
                <AlertTriangle size={16} />
                <span class="text-sm">This entry is finalized and read-only</span>
              </div>
            {:else}
              <div class="form-control">
                <label class="label" for="edit-journal-date">
                  <span class="label-text text-sm">Date:</span>
                </label>
                <input
                  id="edit-journal-date"
                  type="date"
                  bind:value={journalDate}
                  class="input input-bordered input-sm w-auto"
                  max={getTodayDateString()}
                  disabled={journal.isFinalized}
                />
              </div>
              <button onclick={saveJournal} class="btn btn-outline gap-2 {saving && !finalizing ? 'loading' : ''}" disabled={saving || !hasChanges}>
                {#if saving && !finalizing}
                  <span class="loading loading-spinner loading-sm"></span>
                  Saving...
                {:else}
                  <Save size={18} />
                  Save
                {/if}
              </button>
              <button onclick={saveAndFinalize} class="btn btn-primary gap-2 {finalizing ? 'loading' : ''}" disabled={saving || !content.trim()}>
                {#if finalizing}
                  <span class="loading loading-spinner loading-sm"></span>
                  Analyzing...
                {:else}
                  <Sparkles size={18} />
                  Save & Analyze
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      {#if error}
        <!-- Error Alert -->
        <div class="alert alert-error mb-6">
          <div class="flex items-center gap-3">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      {/if}

      <!-- Journal Entry Form -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Writing Area (3/4 width) -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <!-- Date Display -->
              <div class="mb-6 flex items-center gap-3">
                <Calendar size={20} class="text-primary" />
                <h2 class="text-xl font-semibold">{formatLongDate(journalDate)}</h2>
                {#if hasChanges}
                  <div class="badge badge-warning">Unsaved Changes</div>
                {/if}
              </div>

              {#if journal.isFinalized}
                <!-- Read-only view for finalized entries -->
                <div class="space-y-4">
                  <div class="alert alert-info">
                    <AlertTriangle size={20} />
                    <div>
                      <h3 class="font-bold">This entry has been analyzed</h3>
                      <div class="text-sm">Finalized entries cannot be edited to preserve the integrity of the AI analysis.</div>
                    </div>
                  </div>
                  <div class="bg-base-200 rounded-lg p-4">
                    <div class="text-base-content/90 leading-relaxed whitespace-pre-wrap">
                      {journal.content}
                    </div>
                  </div>
                </div>
              {:else}
                <!-- Editable writing area -->
                <div class="space-y-4">
                  <label class="form-control">
                    <div class="label">
                      <span class="label-text font-medium">How was your day? What's on your mind?</span>
                      <span class="label-text-alt text-base-content/60">
                        {content.length} characters
                      </span>
                    </div>
                    <textarea
                      bind:value={content}
                      class="textarea textarea-bordered min-h-96 resize-none text-base leading-relaxed"
                      placeholder="Write freely about your day... Include your thoughts, feelings, experiences, challenges, victories, or anything else that comes to mind. This is your space to reflect and process."
                    ></textarea>
                  </label>

                  <!-- Character count and tips -->
                  <div class="text-base-content/60 flex items-center justify-between text-sm">
                    <span>Tip: Write naturally - grammar and structure don't matter here</span>
                    <span class="badge badge-outline">
                      {content.split(/\s+/).filter((word) => word.length > 0).length} words
                    </span>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Sidebar (1/4 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Entry Status -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Entry Status</h3>
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <div class="badge {journal.isFinalized ? 'badge-success' : 'badge-warning'}">
                      {journal.isFinalized ? 'Analyzed' : 'Draft'}
                    </div>
                  </div>
                  {#if journal.isFinalized}
                    <p class="text-base-content/70 text-sm">This entry has been analyzed by AI. To preserve the analysis integrity, editing is disabled.</p>
                  {:else}
                    <p class="text-base-content/70 text-sm">
                      This entry is still a draft. You can edit it and then analyze it with AI to get insights and earn XP.
                    </p>
                    {#if hasChanges}
                      <div class="alert alert-warning px-3 py-2">
                        <AlertTriangle size={16} />
                        <span class="text-sm">You have unsaved changes</span>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>

            <!-- Actions -->
            {#if !journal.isFinalized}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h3 class="mb-4 font-semibold">Actions</h3>
                  <div class="space-y-2">
                    <button
                      onclick={saveJournal}
                      class="btn btn-outline btn-sm w-full gap-2 {saving && !finalizing ? 'loading' : ''}"
                      disabled={saving || !hasChanges}
                    >
                      {#if saving && !finalizing}
                        <span class="loading loading-spinner loading-sm"></span>
                        Saving...
                      {:else}
                        <Save size={16} />
                        Save Changes
                      {/if}
                    </button>
                    <button
                      onclick={saveAndFinalize}
                      class="btn btn-primary btn-sm w-full gap-2 {finalizing ? 'loading' : ''}"
                      disabled={saving || !content.trim()}
                    >
                      {#if finalizing}
                        <span class="loading loading-spinner loading-sm"></span>
                        Analyzing...
                      {:else}
                        <Sparkles size={16} />
                        Save & Analyze
                      {/if}
                    </button>
                    <button onclick={cancel} class="btn btn-ghost btn-sm w-full gap-2">
                      <ArrowLeft size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            {:else}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h3 class="mb-4 font-semibold">Actions</h3>
                  <div class="space-y-2">
                    <button onclick={() => journal && goto(`/journal/${journal.id}`)} class="btn btn-primary btn-sm w-full gap-2">
                      <BookOpen size={16} />
                      View Analysis
                    </button>
                    <button onclick={cancel} class="btn btn-ghost btn-sm w-full gap-2">
                      <ArrowLeft size={16} />
                      Back to Entry
                    </button>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Writing Tips -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 flex items-center gap-2 font-semibold">
                  <BookOpen size={18} />
                  Writing Tips
                </h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">
                    <strong>Be authentic:</strong> Write in your natural voice and style.
                  </p>
                  <p class="text-base-content/70">
                    <strong>Include details:</strong> What did you see, hear, feel, or think?
                  </p>
                  <p class="text-base-content/70">
                    <strong>Reflect on emotions:</strong> How did events make you feel?
                  </p>
                  <p class="text-base-content/70">
                    <strong>Note growth:</strong> What did you learn or accomplish?
                  </p>
                </div>
              </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Shortcuts</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Save:</span>
                    <kbd class="kbd kbd-sm">Ctrl+S</kbd>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/70">Cancel:</span>
                    <kbd class="kbd kbd-sm">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Keyboard shortcuts -->
<svelte:window
  onkeydown={(e) => {
    if (journal && !journal.isFinalized) {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveJournal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    }
  }}
/>
