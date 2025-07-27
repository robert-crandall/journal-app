<script lang="ts">
  import { onMount } from 'svelte';
  import { characterApi } from '../../lib/api/characters';
  import type { Character } from '../../lib/types/characters';
  import { characterStore } from '../../lib/stores/character';
  import CharacterCreate from './CharacterCreate.svelte';
  import CharacterView from './CharacterView.svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { UserIcon } from 'lucide-svelte';

  // State variables
  let character: Character | null = null;
  let loading = true;
  let error: string | null = null;

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
{:else}
  <CharacterCreate on:characterCreated={handleCharacterCreated} />
{/if}
