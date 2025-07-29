<script lang="ts">
  import { onMount } from 'svelte';
  import { characterApi } from '../../lib/api/characters';
  import { userAttributesApi } from '../../lib/api/user-attributes';
  import type { Character } from '../../lib/types/characters';
  import { characterStore } from '../../lib/stores/character';
  import CharacterCreate from './CharacterCreate.svelte';
  import CharacterView from './CharacterView.svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { UserIcon, Sparkles } from 'lucide-svelte';

  // State variables
  let character: Character | null = null;
  let loading = true;
  let error: string | null = null;
  let deduplicating = false;
  let deduplicationResult: string | null = null;

  // Subscribe to character store
  characterStore.subscribe((state) => {
    character = state.character;
    loading = state.loading;
    error = state.error;
  });

  // Load character when component mounts
  onMount(async () => {
    await loadCharacter();
  });

  // Load character from API
  async function loadCharacter() {
    try {
      characterStore.setLoading(true);
      const fetchedCharacter = await characterApi.getCharacter();
      characterStore.setCharacter(fetchedCharacter);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load character';
      characterStore.setError(errorMessage);
      console.error('Error loading character:', e);
    }
  }

  // Handle character creation success
  function handleCharacterCreated(event: CustomEvent<Character>) {
    characterStore.setCharacter(event.detail);
  }

  // Handle character updated
  function handleCharacterUpdated(event: CustomEvent<Character>) {
    characterStore.setCharacter(event.detail);
  }

  // Handle character deleted
  function handleCharacterDeleted() {
    characterStore.setCharacter(null);
  }

  // Handle GPT deduplication
  async function handleGPTDeduplication() {
    try {
      deduplicating = true;
      deduplicationResult = null;
      
      const result = await userAttributesApi.deduplicateAttributes('gpt');
      
      if (result.removedCount > 0) {
        deduplicationResult = `✨ GPT deduplication complete! Removed ${result.removedCount} duplicate attributes out of ${result.beforeCount} total (${result.processedCount} processed).`;
      } else {
        deduplicationResult = `✅ No duplicate attributes found. Your ${result.beforeCount} attributes are already well-organized!`;
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to deduplicate attributes';
      deduplicationResult = `❌ Error: ${errorMessage}`;
      console.error('Error deduplicating attributes:', e);
    } finally {
      deduplicating = false;
    }
  }
</script>

<svelte:head>
  <title>Character - Journal App</title>
</svelte:head>

{#if loading}
  <div class="flex min-h-[400px] items-center justify-center">
    <div class="text-center">
      <span class="loading loading-spinner loading-lg text-primary mb-4"></span>
      <p class="text-lg">Loading character...</p>
    </div>
  </div>
{:else if error}
  <div class="mx-auto max-w-md">
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="font-bold">Error Loading Character</h3>
        <div class="text-xs">{error}</div>
      </div>
      <button class="btn btn-sm btn-outline" on:click={loadCharacter}> Try Again </button>
    </div>
  </div>
{:else if character}
  <CharacterView {character} on:characterUpdated={handleCharacterUpdated} on:characterDeleted={handleCharacterDeleted} />
  
  <!-- GPT Deduplication Section -->
  <div class="mt-8 max-w-2xl mx-auto">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-primary" />
          AI-Powered Attribute Cleanup
        </h2>
        <p class="text-sm text-base-content/70 mb-4">
          Use GPT to intelligently deduplicate and organize your discovered character attributes while preserving your manually-defined ones.
        </p>
        
        <div class="card-actions justify-start">
          <button 
            class="btn btn-primary gap-2" 
            class:loading={deduplicating}
            disabled={deduplicating}
            on:click={handleGPTDeduplication}
          >
            {#if deduplicating}
              <span class="loading loading-spinner loading-sm"></span>
              Analyzing attributes...
            {:else}
              <Sparkles class="w-4 h-4" />
              Clean up attributes with AI
            {/if}
          </button>
        </div>
        
        {#if deduplicationResult}
          <div class="mt-4">
            <div class="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm">{deduplicationResult}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <CharacterCreate on:characterCreated={handleCharacterCreated} />
{/if}
