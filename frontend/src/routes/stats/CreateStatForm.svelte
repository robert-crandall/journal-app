<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { statsApi } from '../../lib/api/stats';
  import type { Stat, StatGroup } from '../../lib/types/stats';

  export let statGroups: StatGroup[] = [];
  
  const dispatch = createEventDispatcher<{
    statCreated: Stat;
    cancel: void;
  }>();
  
  let formData = {
    name: '',
    description: '',
    groupId: '',
    isCustom: true
  };
  
  let loading = false;
  let error: string | null = null;
  
  async function handleSubmit() {
    if (!formData.name.trim()) {
      error = 'Name is required';
      return;
    }
    
    try {
      loading = true;
      const newStat = await statsApi.createStat({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        groupId: formData.groupId || undefined,
        isCustom: formData.isCustom
      });
      
      dispatch('statCreated', newStat);
    } catch (e) {
      console.error('Error creating stat:', e);
      error = e instanceof Error ? e.message : 'Failed to create stat';
    } finally {
      loading = false;
    }
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  {#if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}
  
  <div class="form-control">
    <label class="label" for="stat-name">
      <span class="label-text">Name <span class="text-error">*</span></span>
    </label>
    <input 
      type="text" 
      id="stat-name"
      class="input input-bordered w-full" 
      bind:value={formData.name} 
      placeholder="e.g., Strength, Wisdom, Programming"
      required
    />
  </div>
  
  <div class="form-control">
    <label class="label" for="stat-description">
      <span class="label-text">Description</span>
    </label>
    <textarea 
      id="stat-description"
      class="textarea textarea-bordered" 
      bind:value={formData.description} 
      placeholder="Describe what actions or activities earn XP for this stat"
      rows="3"
    ></textarea>
    <div class="label">
      <span class="label-text-alt">Example: "Earn XP by completing workouts or physical activities"</span>
    </div>
  </div>
  
  <div class="form-control">
    <label class="label" for="stat-group">
      <span class="label-text">Stat Group</span>
    </label>
    <select id="stat-group" class="select select-bordered w-full" bind:value={formData.groupId}>
      <option value="">-- No Group --</option>
      {#each statGroups as group (group.id)}
        <option value={group.id}>{group.name}</option>
      {/each}
    </select>
  </div>
  
  <div class="form-control">
    <label class="label cursor-pointer justify-start gap-3">
      <input type="checkbox" class="checkbox" bind:checked={formData.isCustom} />
      <span class="label-text">This is a custom stat</span>
    </label>
  </div>
  
  <div class="modal-action">
    <button type="button" class="btn btn-outline" on:click={handleCancel} disabled={loading}>
      Cancel
    </button>
    <button type="submit" class="btn btn-primary" disabled={loading}>
      {#if loading}
        <span class="loading loading-spinner loading-sm"></span>
      {/if}
      Create Stat
    </button>
  </div>
</form>
