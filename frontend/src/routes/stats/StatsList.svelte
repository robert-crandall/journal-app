<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { statsApi } from '../../lib/api/stats';
  import type { Stat } from '../../lib/types/stats';

  export let stats: Stat[] = [];
  
  const dispatch = createEventDispatcher<{
    statUpdated: Stat;
    statDeleted: string;
    xpGranted: { statId: string; xp: number };
    levelUp: string;
  }>();

  // State for editing
  let editingStatId: string | null = null;
  let editFormData = { name: '', description: '' };
  let error: string | null = null;
  let loading = false;
  let showingConfirmDelete: string | null = null;

  // State for granting XP
  let grantingXpStatId: string | null = null;
  let xpToGrant = 0;

  // Sort stats by group, then by name
  $: sortedStats = [...stats].sort((a, b) => {
    if (a.groupId === b.groupId) {
      return a.name.localeCompare(b.name);
    }
    return a.groupId && b.groupId ? a.groupId.localeCompare(b.groupId) : 0;
  });

  // Start editing a stat
  function startEdit(stat: Stat) {
    editingStatId = stat.id;
    editFormData = {
      name: stat.name,
      description: stat.description || ''
    };
    error = null;
  }

  // Cancel editing
  function cancelEdit() {
    editingStatId = null;
    editFormData = { name: '', description: '' };
    error = null;
  }

  // Save stat edits
  async function saveEdit(stat: Stat) {
    if (!editFormData.name.trim()) {
      error = 'Name is required';
      return;
    }

    try {
      loading = true;
      const updatedStat = await statsApi.updateStat(stat.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined
      });
      
      dispatch('statUpdated', updatedStat);
      editingStatId = null;
    } catch (e) {
      console.error('Error updating stat:', e);
      error = e instanceof Error ? e.message : 'Failed to update stat';
    } finally {
      loading = false;
    }
  }

  // Delete a stat
  async function deleteStat(statId: string) {
    try {
      loading = true;
      await statsApi.deleteStat(statId);
      dispatch('statDeleted', statId);
      showingConfirmDelete = null;
    } catch (e) {
      console.error('Error deleting stat:', e);
      error = e instanceof Error ? e.message : 'Failed to delete stat';
    } finally {
      loading = false;
    }
  }

  // Start XP grant process
  function startGrantXp(statId: string) {
    grantingXpStatId = statId;
    xpToGrant = 0;
    error = null;
  }

  // Cancel XP grant
  function cancelGrantXp() {
    grantingXpStatId = null;
    xpToGrant = 0;
    error = null;
  }

  // Submit XP grant
  function submitGrantXp(statId: string) {
    if (xpToGrant <= 0) {
      error = 'XP amount must be positive';
      return;
    }
    
    dispatch('xpGranted', { statId, xp: xpToGrant });
    grantingXpStatId = null;
  }

  // Level up a stat
  function levelUp(statId: string) {
    dispatch('levelUp', statId);
  }

  // Calculate XP progress percentage
  function calculateXpProgress(stat: Stat): number {
    if (stat.level === 0) {
      return (stat.xp / 100) * 100; // Base level needs 100 XP
    }
    
    const requiredXp = stat.level * 100; // Each level requires level*100 XP
    return (stat.xp / requiredXp) * 100;
  }
</script>

<div>
  {#if error}
    <div class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="space-y-4">
    {#each sortedStats as stat (stat.id)}
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-4">
          {#if editingStatId === stat.id}
            <!-- Edit Mode -->
            <div class="space-y-4">
              <div class="form-control">
                <label class="label" for="edit-stat-name">
                  <span class="label-text">Name</span>
                </label>
                <input 
                  type="text" 
                  id="edit-stat-name"
                  class="input input-bordered w-full" 
                  bind:value={editFormData.name} 
                  placeholder="Stat name"
                />
              </div>
              
              <div class="form-control">
                <label class="label" for="edit-stat-description">
                  <span class="label-text">Description</span>
                </label>
                <textarea 
                  id="edit-stat-description"
                  class="textarea textarea-bordered" 
                  bind:value={editFormData.description} 
                  placeholder="Stat description"
                ></textarea>
              </div>
              
              <div class="flex justify-end gap-2">
                <button class="btn btn-outline btn-sm" on:click={cancelEdit} disabled={loading}>
                  Cancel
                </button>
                <button class="btn btn-primary btn-sm" on:click={() => saveEdit(stat)} disabled={loading}>
                  {#if loading}
                    <span class="loading loading-spinner loading-xs"></span>
                  {/if}
                  Save
                </button>
              </div>
            </div>
          {:else if grantingXpStatId === stat.id}
            <!-- XP Grant Mode -->
            <div class="space-y-4">
              <h3 class="font-bold">{stat.name}</h3>
              
              <div class="form-control">
                <label class="label" for="xp-amount">
                  <span class="label-text">XP Amount</span>
                </label>
                <input 
                  type="number" 
                  id="xp-amount"
                  class="input input-bordered w-full" 
                  bind:value={xpToGrant} 
                  min="1"
                  placeholder="Enter XP amount"
                />
              </div>
              
              <div class="flex justify-end gap-2">
                <button class="btn btn-outline btn-sm" on:click={cancelGrantXp} disabled={loading}>
                  Cancel
                </button>
                <button class="btn btn-primary btn-sm" on:click={() => submitGrantXp(stat.id)} disabled={loading || xpToGrant <= 0}>
                  {#if loading}
                    <span class="loading loading-spinner loading-xs"></span>
                  {/if}
                  Grant XP
                </button>
              </div>
            </div>
          {:else}
            <!-- View Mode -->
            <div class="flex flex-col">
              <div class="flex justify-between items-center">
                <h3 class="font-bold text-lg">{stat.name}</h3>
                
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-xs" on:click={() => startEdit(stat)}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button class="btn btn-ghost btn-xs text-error" on:click={() => showingConfirmDelete = stat.id}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {#if stat.description}
                <p class="text-sm text-gray-500 mt-1">{stat.description}</p>
              {/if}
              
              <div class="flex justify-between items-center mt-3">
                <div class="text-sm">
                  Level <span class="font-bold">{stat.level}</span>
                </div>
                <div class="text-sm">
                  XP: <span class="font-bold">{stat.xp}</span>
                </div>
              </div>
              
              <div class="mt-2">
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    class="bg-primary h-2.5 rounded-full" 
                    style="width: {Math.min(calculateXpProgress(stat), 100)}%"
                  ></div>
                </div>
              </div>
              
              <div class="flex justify-between mt-4">
                <button class="btn btn-primary btn-sm" on:click={() => startGrantXp(stat.id)}>
                  Grant XP
                </button>
                <button 
                  class="btn btn-outline btn-sm" 
                  on:click={() => levelUp(stat.id)} 
                  disabled={stat.xp < (stat.level * 100)}
                >
                  Level Up
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      {#if showingConfirmDelete === stat.id}
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete Stat</h3>
            <p class="py-4">
              Are you sure you want to delete <strong>{stat.name}</strong>? This action cannot be undone.
            </p>
            <div class="modal-action">
              <button 
                class="btn btn-outline" 
                on:click={() => showingConfirmDelete = null} 
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                class="btn btn-error" 
                on:click={() => deleteStat(stat.id)} 
                disabled={loading}
              >
                {#if loading}
                  <span class="loading loading-spinner loading-xs"></span>
                {/if}
                Delete
              </button>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>
