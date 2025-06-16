<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { dashboardStore } from '$lib/stores/dashboard';
  import { goto } from '$app/navigation';
  import { 
    Calendar, 
    CheckSquare, 
    BookOpen, 
    Plus, 
    Clock, 
    TrendingUp,
    AlertCircle,
    ArrowRight 
  } from 'lucide-svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import JournalCard from '$lib/components/JournalCard.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  let isAuthenticated = $derived($authStore.isAuthenticated);
  let user = $derived($authStore.user);
  let dashboard = $derived($dashboardStore);

  onMount(async () => {
    if (!isAuthenticated) {
      goto('/login');
      return;
    }
    
    await dashboardStore.load();
  });

  function handleCreateTask() {
    goto('/tasks/new');
  }

  function handleCreateJournalEntry() {
    goto('/journal/new');
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
</script>

<svelte:head>
  <title>Dashboard - Journal App</title>
  <meta name="description" content="Your personal dashboard for tracking progress and staying organized." />
</svelte:head>

<div class="container mx-auto px-4 py-6">
  {#if dashboard.isLoading}
    <div class="flex justify-center items-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if dashboard.error}
    <div class="alert alert-error">
      <AlertCircle size={20} />
      <span>Failed to load dashboard: {dashboard.error}</span>
      <button class="btn btn-sm" onclick={() => dashboardStore.load()}>Retry</button>
    </div>
  {:else if dashboard.data}
    <!-- Welcome Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-3xl font-bold text-base-content">
            {dashboard.data.welcome.message}
          </h1>
          <div class="flex items-center gap-2 text-base-content/70 mt-2">
            <Calendar size={16} />
            <span>{dashboard.data.welcome.date.formatted}</span>
          </div>
        </div>
        <div class="hidden sm:flex gap-2">
          <button class="btn btn-primary" onclick={handleCreateTask}>
            <Plus size={16} />
            New Task
          </button>
          <button class="btn btn-secondary" onclick={handleCreateJournalEntry}>
            <Plus size={16} />
            New Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total Tasks"
        value={dashboard.data.tasks.stats.total}
        icon={CheckSquare}
        color="primary"
      />
      <StatCard
        title="Completed"
        value={dashboard.data.tasks.stats.completed}
        icon={TrendingUp}
        color="success"
      />
      <StatCard
        title="Overdue"
        value={dashboard.data.tasks.stats.overdue}
        icon={AlertCircle}
        color="error"
      />
      <StatCard
        title="Journal Entries"
        value={dashboard.data.journal.stats.total}
        icon={BookOpen}
        color="info"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Upcoming Tasks -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title flex items-center gap-2">
                <Clock size={20} />
                Upcoming Tasks
              </h2>
              <a href="/tasks" class="btn btn-ghost btn-sm">
                View All
                <ArrowRight size={16} />
              </a>
            </div>
            
            {#if dashboard.data.tasks.upcoming.length > 0}
              <div class="space-y-3">
                {#each dashboard.data.tasks.upcoming as task (task.id)}
                  <TaskCard {task} showActions={true} />
                {/each}
              </div>
            {:else}
              <div class="text-center py-8 text-base-content/50">
                <CheckSquare size={48} class="mx-auto mb-4 opacity-50" />
                <p>No upcoming tasks</p>
                <button class="btn btn-sm btn-primary mt-2" onclick={handleCreateTask}>
                  Create your first task
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Recent Journal Entries -->
      <div>
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title flex items-center gap-2">
                <BookOpen size={20} />
                Recent Entries
              </h2>
              <a href="/journal" class="btn btn-ghost btn-sm">
                View All
                <ArrowRight size={16} />
              </a>
            </div>
            
            {#if dashboard.data.journal.recent.length > 0}
              <div class="space-y-3">
                {#each dashboard.data.journal.recent as entry (entry.id)}
                  <JournalCard {entry} compact={true} />
                {/each}
              </div>
            {:else}
              <div class="text-center py-8 text-base-content/50">
                <BookOpen size={48} class="mx-auto mb-4 opacity-50" />
                <p>No journal entries yet</p>
                <button class="btn btn-sm btn-secondary mt-2" onclick={handleCreateJournalEntry}>
                  Write your first entry
                </button>
              </div>
            {/if}
          </div>
        </div>

        <!-- Quick Actions - Mobile -->
        <div class="mt-6 sm:hidden">
          <div class="flex flex-col gap-2">
            <button class="btn btn-primary" onclick={handleCreateTask}>
              <Plus size={16} />
              New Task
            </button>
            <button class="btn btn-secondary" onclick={handleCreateJournalEntry}>
              <Plus size={16} />
              New Journal Entry
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Insights -->
    <div class="mt-8">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title mb-4">This Week's Progress</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="stat">
              <div class="stat-title">Tasks Completed</div>
              <div class="stat-value text-success">{dashboard.data.tasks.stats.completed}</div>
              <div class="stat-desc">
                {dashboard.data.tasks.stats.pending} remaining
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Journal Entries</div>
              <div class="stat-value text-info">{dashboard.data.journal.stats.thisWeek}</div>
              <div class="stat-desc">
                This week
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Completion Rate</div>
              <div class="stat-value text-primary">
                {dashboard.data.tasks.stats.total > 0 
                  ? Math.round((dashboard.data.tasks.stats.completed / dashboard.data.tasks.stats.total) * 100)
                  : 0}%
              </div>
              <div class="stat-desc">
                Overall progress
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
