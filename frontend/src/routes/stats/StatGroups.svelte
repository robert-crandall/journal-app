<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { StatGroup, StatTemplate } from '../../lib/types/stats';
  import type { Character } from '../../lib/api/characters';
  
  export let statGroups: StatGroup[] = [];
  export let statTemplates: StatTemplate[] = [];
  export let character: Character;

  const dispatch = createEventDispatcher<{
    assignTemplates: string[];
  }>();
  
  let selectedTemplateIds: string[] = [];
  let showingTemplates = false;
  let loading = false;
  
  // Group templates by their group
  $: templatesByGroup = statTemplates.reduce((acc, template) => {
    const groupId = template.groupId || 'other';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(template);
    return acc;
  }, {} as Record<string, StatTemplate[]>);
  
  // Get group name by ID
  function getGroupName(groupId: string): string {
    const group = statGroups.find(g => g.id === groupId);
    return group ? group.name : 'Other';
  }
  
  // Toggle template selection
  function toggleTemplate(templateId: string) {
    if (selectedTemplateIds.includes(templateId)) {
      selectedTemplateIds = selectedTemplateIds.filter(id => id !== templateId);
    } else {
      selectedTemplateIds = [...selectedTemplateIds, templateId];
    }
  }
  
  // Assign selected templates
  function assignSelectedTemplates() {
    if (selectedTemplateIds.length === 0) return;
    
    loading = true;
    dispatch('assignTemplates', selectedTemplateIds);
    selectedTemplateIds = [];
    showingTemplates = false;
    loading = false;
  }
</script>

<div class="space-y-6">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Stat Groups</h2>
      
      {#if statGroups.length === 0}
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No stat groups available</span>
        </div>
      {:else}
        <div class="space-y-2">
          {#each statGroups as group (group.id)}
            <div class="bg-base-200 p-3 rounded-lg">
              <h3 class="font-semibold text-md">{group.name}</h3>
              {#if group.description}
                <p class="text-sm text-gray-500 mt-1">{group.description}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Recommended Stats</h2>
      
      <div class="alert alert-info mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>These stats are recommended for your character class: <strong>{character.characterClass}</strong></span>
      </div>
      
      {#if statTemplates.length === 0}
        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>No recommended stats available for {character.characterClass}</span>
        </div>
      {:else}
        <button class="btn btn-primary w-full" on:click={() => showingTemplates = true}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Assign Recommended Stats
        </button>
      {/if}
    </div>
  </div>
</div>

{#if showingTemplates}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Select Stats to Add</h3>
      
      <div class="space-y-4">
        {#each Object.entries(templatesByGroup) as [groupId, templates]}
          <div class="bg-base-200 p-3 rounded-lg">
            <h3 class="font-semibold text-md mb-2">{getGroupName(groupId)}</h3>
            
            <div class="space-y-2">
              {#each templates as template (template.id)}
                <div class="form-control">
                  <label class="label cursor-pointer justify-start gap-3">
                    <input 
                      type="checkbox" 
                      class="checkbox checkbox-primary"
                      checked={selectedTemplateIds.includes(template.id)} 
                      on:change={() => toggleTemplate(template.id)}
                    />
                    <div>
                      <span class="label-text font-medium">{template.name}</span>
                      {#if template.description}
                        <p class="text-xs text-gray-500">{template.description}</p>
                      {/if}
                    </div>
                  </label>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <div class="modal-action">
        <button 
          class="btn btn-outline" 
          on:click={() => { showingTemplates = false; selectedTemplateIds = []; }} 
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          on:click={assignSelectedTemplates} 
          disabled={loading || selectedTemplateIds.length === 0}
        >
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
          {/if}
          Assign Selected Stats
        </button>
      </div>
    </div>
  </div>
{/if}
