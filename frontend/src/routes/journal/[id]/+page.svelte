<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft, Save, Trash2, Edit } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { journalStore } from '$lib/stores/journal';
  import type { JournalEntry, UpdateJournalEntryInput } from '$lib/api/client';
  
  let entryId = $derived($page.params.id);
  
  let loading = $state(false);
  let error = $state('');
  let entry: JournalEntry | null = $state(null);
  let isEditing = $state(false);
  
  // Form fields
  let title = $state('');
  let content = $state('');
  
  onMount(async () => {
    if (entryId) {
      loading = true;
      try {
        entry = await journalStore.getById(entryId);
        if (entry) {
          title = entry.title || '';
          content = entry.content;
        } else {
          error = 'Journal entry not found';
        }
      } catch (err) {
        error = 'Failed to load journal entry';
        console.error(err);
      } finally {
        loading = false;
      }
    }
  });
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!content.trim()) {
      error = 'Content is required';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const entryData: UpdateJournalEntryInput = {
        title: title.trim() || undefined,
        content: content.trim()
      };
      
      await journalStore.update(entryId, entryData);
      isEditing = false;
      
      // Reload the entry to get the updated data
      entry = await journalStore.getById(entryId);
    } catch (err) {
      error = 'Failed to update journal entry';
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }
    
    loading = true;
    try {
      await journalStore.delete(entryId);
      goto('/journal');
    } catch (err) {
      error = 'Failed to delete journal entry';
      console.error(err);
      loading = false;
    }
  }
  
  function handleCancel() {
    if (isEditing) {
      // Reset form to original values
      title = entry?.title || '';
      content = entry?.content || '';
      isEditing = false;
      error = '';
    } else {
      goto('/journal');
    }
  }
  
  function startEditing() {
    isEditing = true;
  }
  
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>{entry?.title || 'Journal Entry'} - Journal App</title>
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
    <h1 class="text-3xl font-bold">
      {isEditing ? 'Edit Journal Entry' : 'Journal Entry'}
    </h1>
  </div>
  
  {#if error}
    <div class="alert alert-error mb-6">
      <span>{error}</span>
    </div>
  {/if}
  
  {#if loading && !entry}
    <div class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if entry}
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        {#if isEditing}
          <!-- Edit Form -->
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
                placeholder="Write your journal entry content..."
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
            <div class="flex justify-between">
              <button 
                type="button"
                class="btn btn-error"
                onclick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={16} />
                Delete
              </button>
              
              <div class="flex gap-2">
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
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        {:else}
          <!-- View Mode -->
          <div class="flex justify-between items-start mb-6">
            <div>
              {#if entry.title}
                <h2 class="text-2xl font-bold mb-2">{entry.title}</h2>
              {/if}
              <div class="text-sm text-base-content/70">
                <p>Created: {formatDate(entry.createdAt)}</p>
                {#if entry.updatedAt !== entry.createdAt}
                  <p>Updated: {formatDate(entry.updatedAt)}</p>
                {/if}
              </div>
            </div>
            
            <div class="flex gap-2">
              <button 
                class="btn btn-primary btn-sm"
                onclick={startEditing}
              >
                <Edit size={16} />
                Edit
              </button>
            </div>
          </div>
          
          <!-- Content Display -->
          <div class="prose max-w-none">
            <div class="whitespace-pre-wrap text-base-content">
              {entry.content}
            </div>
          </div>
          
          <!-- Bottom Actions -->
          <div class="flex justify-end mt-8 pt-4 border-t border-base-300">
            <button 
              class="btn btn-error btn-outline btn-sm"
              onclick={handleDelete}
            >
              <Trash2 size={16} />
              Delete Entry
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-lg text-base-content/70">Journal entry not found.</p>
      <button class="btn btn-primary mt-4" onclick={() => goto('/journal')}>
        Back to Journal
      </button>
    </div>
  {/if}
</div>

<style>
  .min-h-96 {
    min-height: 24rem;
  }
</style>
