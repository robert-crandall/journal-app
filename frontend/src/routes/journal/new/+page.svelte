<script lang="ts">
  import { ArrowLeft, Save } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { journalStore } from '$lib/stores/journal';
  import type { CreateJournalEntryInput } from '$lib/api/client';
  
  let loading = $state(false);
  let error = $state('');
  
  // Form fields
  let title = $state('');
  let content = $state('');
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!content.trim()) {
      error = 'Content is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const entryData: CreateJournalEntryInput = {
        title: title.trim() || undefined,
        content: content.trim()
      };
      
      await journalStore.create(entryData);
      goto('/journal');
    } catch (err) {
      error = 'Failed to create journal entry';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    goto('/journal');
  }
  
  // Auto-save functionality (optional)
  let autoSaveTimer: number | null = null;
  
  function scheduleAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Auto-save after 2 seconds of inactivity
    autoSaveTimer = window.setTimeout(() => {
      if (content.trim()) {
        // Could implement draft saving here
        console.log('Auto-saving draft...');
      }
    }, 2000);
  }
  
  // Schedule auto-save when content changes
  $effect(() => {
    if (content) {
      scheduleAutoSave();
    }
  });
</script>

<svelte:head>
  <title>New Journal Entry - Journal App</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="flex items-center gap-4 mb-6">
    <button 
      class="btn btn-ghost btn-sm"
      onclick={handleCancel}
      aria-label="Go back to journal"
    >
      <ArrowLeft size={20} />
    </button>
    <h1 class="text-3xl font-bold">New Journal Entry</h1>
  </div>
  
  {#if error}
    <div class="alert alert-error mb-6">
      <span>{error}</span>
    </div>
  {/if}
  
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <form onsubmit={handleSubmit}>
        <!-- Title -->
        <div class="form-control mb-4">
          <label class="label" for="title">
            <span class="label-text">Title (optional)</span>
          </label>
          <input 
            id="title"
            type="text"
            class="input input-bordered w-full"
            bind:value={title}
            placeholder="Enter a title for your journal entry"
            disabled={loading}
          />
        </div>
        
        <!-- Content -->
        <div class="form-control mb-6">
          <label class="label" for="content">
            <span class="label-text">Content *</span>
          </label>
          <textarea 
            id="content"
            class="textarea textarea-bordered w-full min-h-96"
            bind:value={content}
            placeholder="What's on your mind? Write about your day, thoughts, feelings, or anything else..."
            required
            disabled={loading}
            rows="20"
          ></textarea>
          <div class="label">
            <span class="label-text-alt">{content.length} characters</span>
            <span class="label-text-alt">Markdown supported</span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button 
            type="button"
            class="btn btn-ghost"
            onclick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="btn btn-primary"
            disabled={loading || !content.trim()}
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              <Save size={16} />
            {/if}
            Save Entry
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  .min-h-96 {
    min-height: 24rem;
  }
</style>
