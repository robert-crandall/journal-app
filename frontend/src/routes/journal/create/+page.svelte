<script lang="ts">
  import { goto } from '$app/navigation';
  import { journalApi, type CreateJournalEntryRequest } from '$lib/api/journal';
  import { ArrowLeft, Save, BookOpen } from 'lucide-svelte';

  // Form data
  let formData: CreateJournalEntryRequest = $state({
    rawContent: '',
    questId: undefined
  });

  // Form state
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state(false);

  // Validation state
  let contentError = $state<string | null>(null);

  // Form validation
  function validateForm(): boolean {
    contentError = null;

    if (!formData.rawContent.trim()) {
      contentError = 'Content is required';
      return false;
    }

    if (formData.rawContent.length > 5000) {
      contentError = 'Content must be 5000 characters or less';
      return false;
    }

    return true;
  }

  // Submit handler
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
      loading = true;
      error = null;

      // Clean up form data
      const entryData: CreateJournalEntryRequest = {
        rawContent: formData.rawContent.trim(),
        questId: formData.questId || undefined
      };

      await journalApi.createJournalEntry(entryData);
      success = true;
      
      // Clear draft after successful save
      clearDraft();
      
      // Redirect after success
      setTimeout(() => {
        goto('/journal');
      }, 1500);

    } catch (err) {
      console.error('Failed to create journal entry:', err);
      error = err instanceof Error ? err.message : 'Failed to create journal entry';
    } finally {
      loading = false;
    }
  }

  // Auto-save draft to localStorage
  function saveDraft() {
    if (formData.rawContent.trim()) {
      localStorage.setItem('journal-draft', formData.rawContent);
    }
  }

  // Load draft from localStorage
  function loadDraft() {
    const draft = localStorage.getItem('journal-draft');
    if (draft) {
      formData.rawContent = draft;
    }
  }

  // Clear draft
  function clearDraft() {
    localStorage.removeItem('journal-draft');
  }

  // Load draft on mount
  import { onMount } from 'svelte';
  onMount(() => {
    loadDraft();
  });
</script>

<svelte:head>
  <title>New Journal Entry - Gamified Life</title>
  <meta name="description" content="Write a new journal entry and reflect on your experiences" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center gap-4">
        <button onclick={() => goto('/journal')} class="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 class="text-primary text-3xl font-bold">New Journal Entry</h1>
          <p class="text-base-content/70">Reflect on your day and experiences</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Form -->
  <div class="mx-auto max-w-4xl px-4 py-8">
    {#if success}
      <!-- Success Message -->
      <div class="alert alert-success mb-8">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Journal entry created successfully! Redirecting...</span>
        </div>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="space-y-8">
        <!-- Writing Area -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body p-8">
            <div class="mb-6 flex items-center gap-3">
              <BookOpen size={24} class="text-primary" />
              <h2 class="text-xl font-semibold">Your Journal Entry</h2>
            </div>
            
            <div class="form-control">
              <label class="label" for="content">
                <span class="label-text font-medium">What's on your mind today?</span>
                <span class="label-text-alt text-xs opacity-60">{formData.rawContent.length}/5000</span>
              </label>
              <textarea
                id="content"
                bind:value={formData.rawContent}
                oninput={saveDraft}
                placeholder="Write freely about your day, thoughts, experiences, challenges, or anything that comes to mind..."
                class="textarea textarea-bordered textarea-lg focus:textarea-primary min-h-96 w-full resize-none transition-all duration-200 focus:scale-[1.01] {contentError ? 'textarea-error' : ''}"
                maxlength="5000"
                required
              ></textarea>
              {#if contentError}
                <div class="label">
                  <span class="label-text-alt text-error">{contentError}</span>
                </div>
              {:else}
                <div class="label">
                  <span class="label-text-alt text-xs opacity-60">
                    Write as much or as little as you'd like. Your thoughts are automatically saved as you type.
                  </span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Writing Tips -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body p-6">
            <h3 class="mb-4 font-semibold">💡 Writing Prompts</h3>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <h4 class="text-sm font-medium">Reflection Questions:</h4>
                <ul class="space-y-1 text-sm text-base-content/70">
                  <li>• What went well today?</li>
                  <li>• What challenges did I face?</li>
                  <li>• What did I learn?</li>
                  <li>• How do I feel right now?</li>
                </ul>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm font-medium">Growth Areas:</h4>
                <ul class="space-y-1 text-sm text-base-content/70">
                  <li>• What could I improve tomorrow?</li>
                  <li>• What am I grateful for?</li>
                  <li>• What progress did I make?</li>
                  <li>• What relationships matter most?</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Draft Management -->
        {#if formData.rawContent.trim()}
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold">Draft Saved</h3>
                  <p class="text-sm text-base-content/60">Your entry is automatically saved as you write</p>
                </div>
                <button
                  type="button"
                  onclick={() => { formData.rawContent = ''; clearDraft(); }}
                  class="btn btn-ghost btn-sm"
                >
                  Clear Draft
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Error Display -->
        {#if error}
          <div class="alert alert-error">
            <div class="flex items-center gap-3">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            type="button"
            onclick={() => goto('/journal')}
            class="btn btn-outline btn-lg flex-1 md:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.rawContent.trim()}
            class="btn btn-primary btn-lg flex-1 gap-2"
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
              Saving...
            {:else}
              <Save size={20} />
              Save Entry
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>
