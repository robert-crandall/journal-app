<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Search } from 'lucide-svelte';
  import { journalStore } from '$lib/stores/journal';
  import JournalCard from '$lib/components/JournalCard.svelte';
  import { goto } from '$app/navigation';
  import type { JournalEntry } from '$lib/api/client';
  
  let searchQuery = $state('');
  
  // Subscribe to store
  let state = $state({
    entries: [] as JournalEntry[],
    loading: false,
    error: null as string | null
  });
  
  journalStore.subscribe(storeState => {
    state = {
      entries: storeState.entries,
      loading: storeState.isLoading,
      error: storeState.error
    };
  });
  
  onMount(() => {
    journalStore.load();
  });
  
  let filteredEntries = $derived(() => {
    let entries = state.entries;
    
    // Filter by search query
    if (searchQuery) {
      entries = entries.filter((entry: JournalEntry) => 
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return entries;
  });
  
  function handleCreateEntry() {
    goto('/journal/new');
  }
</script>

<svelte:head>
  <title>Journal - Journal App</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Journal</h1>
    <button 
      class="btn btn-primary"
      onclick={handleCreateEntry}
      aria-label="Create new journal entry"
    >
      <Plus size={20} />
      New Entry
    </button>
  </div>
  
  <!-- Search -->
  <div class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body">
      <div class="form-control">
        <label class="input input-bordered flex items-center gap-2">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search journal entries..."
            bind:value={searchQuery}
            class="grow"
          />
        </label>
      </div>
    </div>
  </div>
  
  <!-- Journal Entries List -->
  {#if state.loading}
    <div class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if state.error}
    <div class="alert alert-error">
      <span>{state.error}</span>
    </div>
  {:else if filteredEntries.length === 0}
    <div class="text-center py-12">
      <p class="text-lg text-base-content/70 mb-4">
        {searchQuery 
          ? 'No journal entries match your search.' 
          : 'No journal entries yet. Create your first entry to get started!'}
      </p>
      {#if !searchQuery}
        <button class="btn btn-primary" onclick={handleCreateEntry}>
          <Plus size={20} />
          Create Your First Entry
        </button>
      {/if}
    </div>
  {:else}
    <div class="grid gap-4">
      {#each filteredEntries as entry (entry.id)}
        <JournalCard {entry} />
      {/each}
    </div>
  {/if}
</div>
