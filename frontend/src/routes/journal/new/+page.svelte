<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { journalApi } from '$lib/api/journal';
  import { ArrowLeft, Save, Sparkles, Calendar, BookOpen } from 'lucide-svelte';

  // Import types from backend
  import type { Journal } from '../../../../../backend/src/types/journals';

  // Reactive state
  let content = $state('');
  let journalDate = $state('');
  let loading = $state(false);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Get date from URL params or default to today
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');

    if (dateParam) {
      journalDate = dateParam;
    } else {
      journalDate = getTodayDateString();
    }

    // Check if a journal already exists for this date
    checkExistingJournal();
  });

  function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  function formatLongDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Check if a journal already exists for the selected date
  async function checkExistingJournal() {
    if (!journalDate) return;

    try {
      loading = true;
      const existingJournal = await journalApi.getJournalByDate(journalDate);

      // If we found an existing journal, redirect to edit mode
      if (existingJournal) {
        goto(`/journal/${existingJournal.id}/edit`);
        return;
      }
    } catch (err) {
      // If no journal exists for this date, that's expected - continue with creation
      if (err instanceof Error && !err.message.includes('No journal found')) {
        console.error('Error checking existing journal:', err);
        error = err.message;
      }
    } finally {
      loading = false;
    }
  }

  // Handle date change
  function handleDateChange() {
    checkExistingJournal();
  }

  // Save the journal entry
  async function saveJournal() {
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

      const newJournal = await journalApi.createJournal({
        content: content.trim(),
        journalDate,
      });

      // Redirect to the journal detail page
      goto(`/journal/${newJournal.id}`);
    } catch (err) {
      console.error('Failed to save journal:', err);

      // Handle specific error case where journal already exists
      if (err instanceof Error && (err as any).existingJournalId) {
        const existingId = (err as any).existingJournalId;
        if (confirm('A journal already exists for this date. Would you like to edit it instead?')) {
          goto(`/journal/${existingId}/edit`);
          return;
        }
      }

      error = err instanceof Error ? err.message : 'Failed to save journal entry';
    } finally {
      saving = false;
    }
  }

  // Cancel and go back
  function cancel() {
    if (content.trim() && !confirm('Are you sure you want to leave? Your changes will be lost.')) {
      return;
    }
    goto('/journal');
  }

  // Auto-save every 30 seconds if there's content
  let autoSaveTimer: NodeJS.Timeout | null = null;
  $effect(() => {
    if (content.trim()) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        // We could implement auto-save as draft here in the future
        console.log('Auto-save timer triggered (not implemented yet)');
      }, 30000);
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  });
</script>

<svelte:head>
  <title>New Journal Entry - Gamified Life</title>
  <meta name="description" content="Write a new journal entry about your day" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-4xl px-4 py-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button onclick={cancel} class="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={18} />
            Back to Journal
          </button>
          <div>
            <h1 class="text-primary text-2xl font-bold">New Journal Entry</h1>
            <p class="text-base-content/70">Write about your day, thoughts, and experiences</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="form-control">
            <label class="label" for="journal-date">
              <span class="label-text text-sm">Date:</span>
            </label>
            <input
              id="journal-date"
              type="date"
              bind:value={journalDate}
              onchange={handleDateChange}
              class="input input-bordered input-sm w-auto"
              max={getTodayDateString()}
            />
          </div>
          <button onclick={saveJournal} class="btn btn-primary gap-2 {saving ? 'loading' : ''}" disabled={saving || !content.trim()}>
            {#if saving}
              <span class="loading loading-spinner loading-sm"></span>
              Saving...
            {:else}
              <Save size={18} />
              Save Entry
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-4xl px-4 py-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Checking for existing entries...</p>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
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
            </div>

            <!-- Writing Area -->
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
          </div>
        </div>
      </div>

      <!-- Sidebar (1/4 width) -->
      <div class="lg:col-span-1">
        <div class="sticky top-8 space-y-6">
          <!-- Writing Tips Card -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 flex items-center gap-2 font-semibold">
                <BookOpen size={18} />
                Writing Prompts
              </h3>
              <div class="space-y-3 text-sm">
                <div class="text-base-content/70">
                  <strong>Reflect on today:</strong>
                  <ul class="mt-1 list-inside list-disc space-y-1">
                    <li>What made you feel proud?</li>
                    <li>What challenged you?</li>
                    <li>What are you grateful for?</li>
                    <li>What did you learn?</li>
                  </ul>
                </div>
                <div class="text-base-content/70">
                  <strong>Current thoughts:</strong>
                  <ul class="mt-1 list-inside list-disc space-y-1">
                    <li>What's occupying your mind?</li>
                    <li>How are you feeling emotionally?</li>
                    <li>What are you looking forward to?</li>
                    <li>Any worries or concerns?</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Analysis Preview -->
          <div class="card from-secondary/10 to-accent/10 border-secondary/20 border bg-gradient-to-br">
            <div class="card-body p-6">
              <h3 class="mb-4 flex items-center gap-2 font-semibold">
                <Sparkles size={18} />
                After You Save
              </h3>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/70">Once you save your entry, you can choose to have it analyzed by AI to:</p>
                <ul class="text-base-content/70 space-y-2">
                  <li class="flex items-center gap-2">
                    <div class="bg-secondary h-2 w-2 flex-shrink-0 rounded-full"></div>
                    Generate a summary and title
                  </li>
                  <li class="flex items-center gap-2">
                    <div class="bg-secondary h-2 w-2 flex-shrink-0 rounded-full"></div>
                    Extract key themes and emotions
                  </li>
                  <li class="flex items-center gap-2">
                    <div class="bg-secondary h-2 w-2 flex-shrink-0 rounded-full"></div>
                    Award experience points to your character stats
                  </li>
                  <li class="flex items-center gap-2">
                    <div class="bg-secondary h-2 w-2 flex-shrink-0 rounded-full"></div>
                    Track your personal growth over time
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">Shortcuts</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/70">Save Entry:</span>
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
</div>

<!-- Keyboard shortcuts -->
<svelte:window
  onkeydown={(e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveJournal();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }}
/>
