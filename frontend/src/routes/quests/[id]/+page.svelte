<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { questsApi } from '$lib/api/quests';
  import type { QuestWithExperimentsAndJournalsResponse } from '$lib/types/quest';
  import { formatDateTime } from '$lib/utils/date';
  import { 
    Target, 
    ArrowLeft, 
    Edit3, 
    Calendar, 
    Clock, 
    CheckCircle,
    PauseCircle,
    Award,
    BookOpen,
    Beaker,
    TrendingUp,
    AlertCircle
  } from 'lucide-svelte';

  let questId: string;
  let quest: QuestWithExperimentsAndJournalsResponse | null = null;
  let isLoading = true;
  let error = '';

  $: questId = $page.params.id;

  onMount(async () => {
    if (questId) {
      await loadQuest();
    }
  });

  async function loadQuest() {
    try {
      isLoading = true;
      error = '';
      quest = await questsApi.getQuestWithDetails(questId);
    } catch (err) {
      console.error('Failed to load quest:', err);
      error = err instanceof Error ? err.message : 'Failed to load quest';
    } finally {
      isLoading = false;
    }
  }

  function getQuestIcon(quest: QuestWithExperimentsAndJournalsResponse) {
    if (quest.status === 'completed') return CheckCircle;
    if (quest.status === 'archived') return PauseCircle;
    return Target;
  }

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

  function getDaysRemaining(quest: QuestWithExperimentsAndJournalsResponse): number | null {
    if (!quest.endDate) return null;
    const now = new Date();
    const end = new Date(quest.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function getTotalXp(quest: QuestWithExperimentsAndJournalsResponse): number {
    return quest.xpByStats.reduce((total, stat) => (total) + stat.totalXp, 0);
  }
</script>

<svelte:head>
  <title>{quest ? quest.title : 'Quest'} - Life Journal</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-4 space-y-6">
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
      <button class="btn btn-sm btn-ghost" on:click={loadQuest}>
        Try Again
      </button>
    </div>
  {:else if quest}
    <!-- Page Header -->
    <div class="flex items-center gap-4 mb-6">
      <button 
        class="btn btn-ghost btn-sm" 
        on:click={() => goto('/quests')}
      >
        <ArrowLeft class="w-4 h-4" />
        Back to Quests
      </button>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <svelte:component this={getQuestIcon(quest)} class="w-8 h-8 text-primary" />
          <h1 class="text-3xl font-bold">{quest.title}</h1>
          <div class="badge {getStatusBadgeClass(quest.status)}">
            {quest.status}
          </div>
        </div>
        {#if quest.summary}
          <p class="text-base-content/60">{quest.summary}</p>
        {/if}
      </div>
      <a href="/quests/{quest.id}/edit" class="btn btn-primary">
        <Edit3 class="w-4 h-4" />
        Edit Quest
      </a>
    </div>

    <!-- Quest Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total XP -->
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-primary">
          <Award class="w-8 h-8" />
        </div>
        <div class="stat-title">Total XP</div>
        <div class="stat-value text-primary">{getTotalXp(quest).toLocaleString()}</div>
        <div class="stat-desc">Experience earned</div>
      </div>

      <!-- Linked Experiments -->
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-secondary">
          <Beaker class="w-8 h-8" />
        </div>
        <div class="stat-title">Experiments</div>
        <div class="stat-value text-secondary">{quest.experiments.length}</div>
        <div class="stat-desc">Connected experiments</div>
      </div>

      <!-- Linked Journals -->
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-accent">
          <BookOpen class="w-8 h-8" />
        </div>
        <div class="stat-title">Journal Entries</div>
        <div class="stat-value text-accent">{quest.journals.length}</div>
        <div class="stat-desc">Linked entries</div>
      </div>

      <!-- Stats Sources -->
      <div class="stat bg-base-100 shadow-sm rounded-lg">
        <div class="stat-figure text-info">
          <TrendingUp class="w-8 h-8" />
        </div>
        <div class="stat-title">Stats Sources</div>
        <div class="stat-value text-info">{quest.xpByStats.length}</div>
        <div class="stat-desc">Data sources</div>
      </div>
    </div>

    <!-- Quest Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Quest Information -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Quest Details</h2>
            <div class="space-y-4">
              <!-- Dates -->
              <div class="flex flex-wrap gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <Calendar class="w-4 h-4 text-base-content/60" />
                  <span class="text-base-content/60">Started:</span>
                  <span class="font-medium">{formatDateTime(quest.startDate).split(' ')[0]}</span>
                </div>
                {#if quest.endDate}
                  {@const daysRemaining = getDaysRemaining(quest)}
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4 text-base-content/60" />
                    <span class="text-base-content/60">
                      {quest.status === 'completed' ? 'Completed:' : 'Due:'}
                    </span>
                    <span class="font-medium">{formatDateTime(quest.endDate).split(' ')[0]}</span>
                    {#if quest.status !== 'completed' && daysRemaining !== null}
                      {#if daysRemaining > 0}
                        <span class="badge badge-info badge-sm">{daysRemaining} days left</span>
                      {:else if daysRemaining === 0}
                        <span class="badge badge-warning badge-sm">Due today</span>
                      {:else}
                        <span class="badge badge-error badge-sm">{Math.abs(daysRemaining)} days overdue</span>
                      {/if}
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- Reflection -->
              {#if quest.reflection}
                <div>
                  <h3 class="font-medium mb-2">Reflection</h3>
                  <p class="text-base-content/70">{quest.reflection}</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Linked Experiments -->
        {#if quest.experiments.length > 0}
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h2 class="card-title flex items-center gap-2">
                <Beaker class="w-5 h-5" />
                Linked Experiments
              </h2>
              <div class="space-y-3">
                {#each quest.experiments as experiment}
                  <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div class="flex-1">
                      <a 
                        href="/experiments/{experiment.id}" 
                        class="font-medium link link-hover"
                      >
                        {experiment.title}
                      </a>
                      {#if experiment.description}
                        <p class="text-sm text-base-content/60 mt-1">{experiment.description}</p>
                      {/if}
                      <div class="text-xs text-base-content/50 mt-1">
                        {formatDateTime(experiment.startDate).split(' ')[0]} - {formatDateTime(experiment.endDate).split(' ')[0]}
                      </div>
                    </div>
                    {#if experiment.status}
                      <div class="badge badge-sm">
                        {experiment.status}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- Linked Journals -->
        {#if quest.journals.length > 0}
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h2 class="card-title flex items-center gap-2">
                <BookOpen class="w-5 h-5" />
                Linked Journal Entries
              </h2>
              <div class="space-y-3">
                {#each quest.journals as journal}
                  <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div class="flex-1">
                      <a 
                        href="/journal/{journal.id}" 
                        class="font-medium link link-hover"
                      >
                        {journal.title || 'Journal Entry'}
                      </a>
                      {#if journal.synopsis}
                        <p class="text-sm text-base-content/60 mt-1">{journal.synopsis}</p>
                      {/if}
                      <div class="text-xs text-base-content/50 mt-1">
                        {formatDateTime(journal.date).split(' ')[0]}
                      </div>
                    </div>
                    <div class="badge badge-sm">
                      {journal.linkedType}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- XP Breakdown -->
        {#if quest.xpByStats.length > 0}
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h3 class="card-title flex items-center gap-2">
                <TrendingUp class="w-5 h-5" />
                XP Breakdown
              </h3>
              <div class="space-y-3">
                {#each quest.xpByStats as stat}
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium">{stat.statName}</span>
                    <span class="text-sm font-bold text-primary">{stat.totalXp.toLocaleString()} XP</span>
                  </div>
                {/each}
              </div>
              <div class="divider my-2"></div>
              <div class="flex justify-between items-center font-bold">
                <span>Total</span>
                <span class="text-primary">{getTotalXp(quest).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Quick Actions -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h3 class="card-title">Quick Actions</h3>
            <div class="space-y-2">
              <a href="/quests/{quest.id}/edit" class="btn btn-outline btn-sm w-full justify-start">
                <Edit3 class="w-4 h-4" />
                Edit Quest
              </a>
              <a href="/experiments/new?questId={quest.id}" class="btn btn-outline btn-sm w-full justify-start">
                <Beaker class="w-4 h-4" />
                Link New Experiment
              </a>
              <a href="/journal/new?questId={quest.id}" class="btn btn-outline btn-sm w-full justify-start">
                <BookOpen class="w-4 h-4" />
                Add Journal Entry
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Quest Not Found -->
    <div class="text-center py-12">
      <Target class="w-16 h-16 mx-auto text-base-300 mb-4" />
      <h2 class="text-xl font-semibold mb-2">Quest not found</h2>
      <p class="text-base-content/60 mb-4">
        The quest you're looking for doesn't exist or you don't have access to it.
      </p>
      <a href="/quests" class="btn btn-primary">
        <ArrowLeft class="w-4 h-4" />
        Back to Quests
      </a>
    </div>
  {/if}
</div>
