<script lang="ts">
  import { onMount } from 'svelte';
  import { statsApi } from '../../lib/api/stats';
  import { characterApi } from '../../lib/api/characters';
  import StatsList from './StatsList.svelte';
  import StatGroups from './StatGroups.svelte';
  import CreateStatForm from './CreateStatForm.svelte';
  import type { Character } from '../../lib/api/characters';
  import type { Stat, StatGroup, StatTemplate } from '../../lib/types/stats';

  let loading = true;
  let error: string | null = null;
  let character: Character | null = null;
  let stats: Stat[] = [];
  let statGroups: StatGroup[] = [];
  let statTemplates: StatTemplate[] = [];
  let showCreateForm = false;

  onMount(async () => {
    try {
      loading = true;
      // Load character data
      const characterResponse = await characterApi.getCharacter();
      character = characterResponse;
      
      if (character) {
        // Load stats, groups, and templates
        const [statsData, groupsData, templatesData] = await Promise.all([
          statsApi.getStats(),
          statsApi.getStatGroups(),
          statsApi.getStatTemplatesByClass(character.characterClass)
        ]);
        
        stats = statsData;
        statGroups = groupsData;
        statTemplates = templatesData;
      }
    } catch (e) {
      console.error('Error loading stats data:', e);
      error = e instanceof Error ? e.message : 'Failed to load stats data';
    } finally {
      loading = false;
    }
  });

  async function handleStatCreated(event: CustomEvent<Stat>) {
    stats = [...stats, event.detail];
    showCreateForm = false;
  }

  async function handleStatUpdated(event: CustomEvent<Stat>) {
    stats = stats.map(stat => stat.id === event.detail.id ? event.detail : stat);
  }

  async function handleStatDeleted(event: CustomEvent<string>) {
    stats = stats.filter(stat => stat.id !== event.detail);
  }

  async function handleXPGranted(event: CustomEvent<{statId: string, xp: number}>) {
    try {
      const updatedStat = await statsApi.grantXP({
        statId: event.detail.statId,
        xp: event.detail.xp
      });
      
      handleStatUpdated(new CustomEvent<Stat>('statUpdated', { detail: updatedStat }));
    } catch (e) {
      console.error('Error granting XP:', e);
      error = e instanceof Error ? e.message : 'Failed to grant XP';
    }
  }

  async function handleLevelUp(event: CustomEvent<string>) {
    try {
      const updatedStat = await statsApi.levelUp(event.detail);
      handleStatUpdated(new CustomEvent<Stat>('statUpdated', { detail: updatedStat }));
    } catch (e) {
      console.error('Error leveling up stat:', e);
      error = e instanceof Error ? e.message : 'Failed to level up stat';
    }
  }

  async function handleAssignTemplates(selectedTemplateIds: string[]) {
    if (!character) return;
    
    try {
      loading = true;
      const newStats = await statsApi.assignTemplates({
        templateIds: selectedTemplateIds
      });
      
      stats = [...stats, ...newStats];
    } catch (e) {
      console.error('Error assigning templates:', e);
      error = e instanceof Error ? e.message : 'Failed to assign templates';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Character Stats - Journal App</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6 text-center">Stats Management</h1>
  
  {#if error}
    <div class="alert alert-error mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}
  
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if !character}
    <div class="alert alert-warning mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>You need to create a character first before managing stats.</span>
    </div>
  {:else}
    <div class="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title">
              {character.name}'s Stats
              <span class="badge badge-primary">{character.characterClass}</span>
            </h2>
            
            {#if stats.length === 0}
              <div class="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You don't have any stats yet. Create one or assign from recommended templates!</span>
              </div>
            {:else}
              <StatsList 
                {stats} 
                on:statUpdated={handleStatUpdated} 
                on:statDeleted={handleStatDeleted}
                on:xpGranted={handleXPGranted}
                on:levelUp={handleLevelUp}
              />
            {/if}
            
            <div class="card-actions justify-end mt-4">
              <button class="btn btn-primary" on:click={() => showCreateForm = true}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Stat
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <StatGroups 
          {statGroups} 
          {statTemplates} 
          {character}
          on:assignTemplates={(e) => handleAssignTemplates(e.detail)} 
        />
      </div>
    </div>
  {/if}
</div>

{#if showCreateForm}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Create New Stat</h3>
      <CreateStatForm 
        on:statCreated={handleStatCreated} 
        on:cancel={() => showCreateForm = false}
      />
    </div>
  </div>
{/if}
