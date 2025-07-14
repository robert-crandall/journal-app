<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SearchIcon, FilterIcon, CalendarIcon, TagIcon, XIcon } from 'lucide-svelte';

  export let searchTerm = '';
  export let statusFilter: 'all' | 'draft' | 'in_review' | 'complete' = 'all';
  export let selectedTags: string[] = [];
  export let dateFrom = '';
  export let dateTo = '';
  export let availableTags: Array<{ id: string; name: string }> = [];

  const dispatch = createEventDispatcher();

  let showFilters = false;

  function handleSearchInput() {
    dispatch('search');
  }

  function handleFilterChange() {
    dispatch('filter');
  }

  function handleStatusChange(status: typeof statusFilter) {
    statusFilter = status;
    handleFilterChange();
  }

  function toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      selectedTags = selectedTags.filter((id) => id !== tagId);
    } else {
      selectedTags = [...selectedTags, tagId];
    }
    handleFilterChange();
  }

  function clearTag(tagId: string) {
    selectedTags = selectedTags.filter((id) => id !== tagId);
    handleFilterChange();
  }

  function clearAllFilters() {
    searchTerm = '';
    statusFilter = 'all';
    selectedTags = [];
    dateFrom = '';
    dateTo = '';
    handleFilterChange();
  }

  function handleDateChange() {
    handleFilterChange();
  }

  $: hasActiveFilters = searchTerm.trim() || statusFilter !== 'all' || selectedTags.length > 0 || dateFrom || dateTo;
  $: selectedTagNames = selectedTags.map((id) => availableTags.find((tag) => tag.id === id)?.name).filter(Boolean);
</script>

<div class="card bg-base-200">
  <div class="card-body p-4">
    <!-- Search Bar -->
    <div class="flex flex-col gap-4 lg:flex-row">
      <div class="flex-1">
        <div class="form-control">
          <div class="input-group">
            <span class="bg-base-300 border-base-300">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              placeholder="Search journals by title, content, or synopsis..."
              class="input input-bordered flex-1"
              bind:value={searchTerm}
              on:input={handleSearchInput}
            />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn btn-outline btn-sm gap-2" class:btn-active={showFilters} on:click={() => (showFilters = !showFilters)}>
          <FilterIcon size={16} />
          Filters
          {#if hasActiveFilters}
            <div class="badge badge-primary badge-xs">!</div>
          {/if}
        </button>

        {#if hasActiveFilters}
          <button class="btn btn-ghost btn-sm" on:click={clearAllFilters} title="Clear all filters">
            <XIcon size={16} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Active Filters Display -->
    {#if selectedTagNames.length > 0}
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="text-base-content/70 text-sm">Tags:</span>
        {#each selectedTagNames as tagName, index}
          <button class="badge badge-primary gap-1" on:click={() => clearTag(selectedTags[index])}>
            {tagName}
            <XIcon size={12} />
          </button>
        {/each}
      </div>
    {/if}

    <!-- Expanded Filters -->
    {#if showFilters}
      <div class="border-base-300 mt-4 space-y-4 border-t pt-4">
        <!-- Status Filter -->
        <div class="form-control">
          <fieldset>
            <legend class="label-text mb-2 font-medium">Status</legend>
            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-sm"
                class:btn-primary={statusFilter === 'all'}
                class:btn-outline={statusFilter !== 'all'}
                on:click={() => handleStatusChange('all')}
              >
                All
              </button>
              <button
                class="btn btn-sm"
                class:btn-primary={statusFilter === 'draft'}
                class:btn-outline={statusFilter !== 'draft'}
                on:click={() => handleStatusChange('draft')}
              >
                Draft
              </button>
              <button
                class="btn btn-sm"
                class:btn-warning={statusFilter === 'in_review'}
                class:btn-outline={statusFilter !== 'in_review'}
                on:click={() => handleStatusChange('in_review')}
              >
                In Review
              </button>
              <button
                class="btn btn-sm"
                class:btn-success={statusFilter === 'complete'}
                class:btn-outline={statusFilter !== 'complete'}
                on:click={() => handleStatusChange('complete')}
              >
                Complete
              </button>
            </div>
          </fieldset>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control">
            <label class="label">
              <span class="label-text flex items-center gap-2 font-medium">
                <CalendarIcon size={16} />
                From Date
              </span>
            </label>
            <input type="date" class="input input-bordered" bind:value={dateFrom} on:change={handleDateChange} />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text flex items-center gap-2 font-medium">
                <CalendarIcon size={16} />
                To Date
              </span>
            </label>
            <input type="date" class="input input-bordered" bind:value={dateTo} on:change={handleDateChange} />
          </div>
        </div>

        <!-- Tags Filter -->
        {#if availableTags.length > 0}
          <div class="form-control">
            <label class="label">
              <span class="label-text flex items-center gap-2 font-medium">
                <TagIcon size={16} />
                Content Tags
              </span>
            </label>
            <div class="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {#each availableTags as tag}
                <button
                  class="btn btn-sm"
                  class:btn-primary={selectedTags.includes(tag.id)}
                  class:btn-outline={!selectedTags.includes(tag.id)}
                  on:click={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
