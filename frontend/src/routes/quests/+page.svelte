<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { questsApi } from '$lib/api/quests';
  import type { QuestResponse } from '$lib/types/quest';
  import { formatDateTime } from '$lib/utils/date';
  import { Target, Plus, Search, Eye, Edit3, Calendar, Clock, CheckCircle, PauseCircle, AlertCircle } from 'lucide-svelte';

  let quests: QuestResponse[] = [];
  let isLoading = true;
  let error = '';
  let searchQuery = '';
  let statusFilter: 'all' | 'active' | 'completed' | 'archived' = 'all';

  onMount(async () => {
    await loadQuests();
  });

  async function loadQuests() {
    try {
      isLoading = true;
      error = '';
      quests = await questsApi.getUserQuests();
    } catch (err) {
      console.error('Failed to load quests:', err);
      error = err instanceof Error ? err.message : 'Failed to load quests';
    } finally {
      isLoading = false;
    }
  }

  // Filter quests based on search and status
  $: filteredQuests = quests.filter((quest) => {
    const matchesSearch = searchQuery === '' || 
      quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quest.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'active':
        return 'badge-primary';
      case 'completed':
        return 'badge-success';
      case 'archived':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  }

  function getQuestIcon(quest: QuestResponse) {
    if (quest.status === 'completed') return CheckCircle;
    if (quest.status === 'archived') return PauseCircle;
    return Target;
  }

  function getDaysRemaining(quest: QuestResponse): number | null {
    if (!quest.endDate) return null;
    const now = new Date();
    const end = new Date(quest.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
</script>

<svelte:head>
  <title>Quests - Life Journal</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-4 space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-3xl font-bold">Quests</h1>
      <p class="text-base-content/60 mt-1">Track your life adventures and achievements</p>
    </div>
    <a href="/quests/new" class="btn btn-primary">
      <Plus class="w-4 h-4" />
      New Quest
    </a>
  </div>
  <!-- Search and Filters -->
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body p-4">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="form-control">
            <div class="input-group">
              <span class="bg-base-200">
                <Search class="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search quests..."
                class="input input-bordered w-full"
                bind:value={searchQuery}
              />
            </div>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="form-control">
          <select class="select select-bordered" bind:value={statusFilter}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex justify-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="alert alert-error">
      <AlertCircle class="w-5 h-5" />
      <span>{error}</span>
      <button class="btn btn-sm btn-ghost" on:click={loadQuests}>
        Try Again
      </button>
    </div>
  {:else if filteredQuests.length === 0}
    <!-- Empty State -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body text-center py-12">
        <Target class="w-16 h-16 mx-auto text-base-300 mb-4" />
        {#if quests.length === 0}
          <h3 class="text-xl font-semibold mb-2">No quests yet</h3>
          <p class="text-base-content/60 mb-4">
            Start your first quest to track your life adventures and achievements.
          </p>
          <a href="/quests/new" class="btn btn-primary">
            <Plus class="w-4 h-4" />
            Create Your First Quest
          </a>
        {:else}
          <h3 class="text-xl font-semibold mb-2">No quests found</h3>
          <p class="text-base-content/60 mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <button 
            class="btn btn-outline" 
            on:click={() => { searchQuery = ''; statusFilter = 'all'; }}
          >
            Clear Filters
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Quest Cards -->
    <div class="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {#each filteredQuests as quest (quest.id)}
        <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="card-body p-6">
            <!-- Quest Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-3 flex-1">
                <div class="text-primary">
                  <svelte:component this={getQuestIcon(quest)} class="w-6 h-6" />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-lg leading-tight">
                    <a href="/quests/{quest.id}" class="link link-hover">
                      {quest.title}
                    </a>
                  </h3>
                  {#if quest.summary}
                    <p class="text-sm text-base-content/60 mt-1 line-clamp-2">
                      {quest.summary}
                    </p>
                  {/if}
                </div>
              </div>
              <div class="badge {getStatusBadgeClass(quest.status)} badge-sm">
                {quest.status}
              </div>
            </div>

            <!-- Quest Dates -->
            <div class="flex flex-wrap gap-4 text-sm text-base-content/60 mb-4">
              <div class="flex items-center gap-1">
                <Calendar class="w-4 h-4" />
                <span>Started {formatDateTime(quest.startDate).split(' ')[0]}</span>
              </div>
              {#if quest.endDate}
                {@const daysRemaining = getDaysRemaining(quest)}
                <div class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  {#if quest.status === 'completed'}
                    <span>Completed {formatDateTime(quest.endDate).split(' ')[0]}</span>
                  {:else if daysRemaining !== null}
                    {#if daysRemaining > 0}
                      <span>{daysRemaining} days remaining</span>
                    {:else if daysRemaining === 0}
                      <span class="text-warning">Due today</span>
                    {:else}
                      <span class="text-error">{Math.abs(daysRemaining)} days overdue</span>
                    {/if}
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Quest Reflection -->
            {#if quest.reflection}
              <div class="text-sm text-base-content/60 mb-4">
                <strong>Reflection:</strong> {quest.reflection}
              </div>
            {/if}

            <!-- Actions -->
            <div class="card-actions justify-end mt-4 pt-4 border-t border-base-200">
              <a href="/quests/{quest.id}" class="btn btn-sm btn-outline">
                <Eye class="w-4 h-4" />
                View
              </a>
              <a href="/quests/{quest.id}/edit" class="btn btn-sm btn-primary">
                <Edit3 class="w-4 h-4" />
                Edit
              </a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
