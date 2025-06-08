<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { tasksApi, statsApi, journalsApi, userApi } from '$lib/api';
  import { goto } from '$app/navigation';
  import * as icons from 'lucide-svelte';
  
  // Helper function to get icon component
  function getIconComponent(iconName: string) {
    if (!iconName) return icons.Target;
    
    // Convert kebab-case to PascalCase for Lucide components
    const componentName = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    return (icons as any)[componentName] || icons.Target;
  }
  
  let tasks: any[] = [];
  let dailyTasks: any[] = [];
  let stats: any[] = [];
  let recentJournals: any[] = [];
  let userData: any = null;
  let loading = true;
  let showTaskFeedback = '';
  let showJournalModal = false;
  let journalContent = '';
  let journalMood = '';
  let taskFeedbackData = {
    feedback: '',
    emotionTag: '',
    moodScore: 0
  };
  let saveMessage = '';
  
  onMount(() => {
    // Redirect if not logged in
    const unsubscribe = auth.subscribe((state) => {
      if (!state.user && !state.loading) {
        goto('/login');
      }
    });
    
    async function loadData() {
      try {
        const [tasksData, dailyTasksData, statsData, journalsData, userResponse] = await Promise.all([
          tasksApi.getAll(),
          tasksApi.getDailyTasks(),
          statsApi.getAll(),
          journalsApi.getAll(),
          userApi.getMe()
        ]);
        
        tasks = tasksData.tasks.filter((task: any) => !task.completedAt && task.origin !== 'gpt').slice(0, 5);
        dailyTasks = dailyTasksData.tasks || [];
        stats = statsData.slice(0, 4);
        recentJournals = journalsData.journals.slice(0, 3);
        userData = userResponse.user;
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        loading = false;
      }
    }
    
    loadData();
    
    return unsubscribe;
  });
  
  async function completeTask(taskId: string) {
    try {
      // Find the task to get its stat info before completing
      const taskToComplete = tasks.find(t => t.id === taskId);
      
      await tasksApi.complete(taskId, { status: 'complete' });
      // Refresh tasks
      const tasksData = await tasksApi.getAll();
      tasks = tasksData.tasks.filter((task: any) => !task.completedAt && task.origin !== 'gpt').slice(0, 5);
      
      // If the task has a stat, increment it
      if (taskToComplete?.stat) {
        await statsApi.increment(taskToComplete.stat.id, 1);
        // Refresh stats
        const statsData = await statsApi.getAll();
        stats = statsData.slice(0, 4);
      }
      
      showSaveMessage('Task completed ✓');
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }

  async function completeDailyTask(taskId: string, status: 'complete' | 'skipped' | 'failed') {
    try {
      if (status === 'complete') {
        // Show feedback form for completed tasks
        showTaskFeedback = taskId;
        return;
      }
      
      // For skipped/failed, complete immediately
      await tasksApi.complete(taskId, { status });
      
      // Refresh daily tasks and stats
      await refreshDailyTasks();
      showSaveMessage(`Task ${status} ✓`);
    } catch (error) {
      console.error('Failed to complete daily task:', error);
    }
  }

  async function submitTaskFeedback(taskId: string) {
    try {
      await tasksApi.complete(taskId, {
        status: 'complete',
        feedback: taskFeedbackData.feedback,
        emotionTag: taskFeedbackData.emotionTag,
        moodScore: taskFeedbackData.moodScore > 0 ? taskFeedbackData.moodScore : undefined
      });
      
      // Reset feedback form
      showTaskFeedback = '';
      taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
      
      // Refresh daily tasks and stats
      await refreshDailyTasks();
      showSaveMessage('Task completed ✓');
    } catch (error) {
      console.error('Failed to submit task feedback:', error);
    }
  }

  async function refreshDailyTasks() {
    try {
      const [dailyTasksData, statsData] = await Promise.all([
        tasksApi.getDailyTasks(),
        statsApi.getAll()
      ]);
      
      dailyTasks = dailyTasksData.tasks || [];
      stats = statsData.slice(0, 4);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  async function createJournal() {
    try {
      await journalsApi.create({
        content: journalContent,
        mood: journalMood || undefined
      });
      
      // Reset form and close modal
      journalContent = '';
      journalMood = '';
      showJournalModal = false;
      
      // Refresh journals
      const journalsData = await journalsApi.getAll();
      recentJournals = journalsData.journals.slice(0, 3);
      
      showSaveMessage('Journal entry created ✓');
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  }

  function cancelTaskFeedback() {
    showTaskFeedback = '';
    taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
  }
  
  function showSaveMessage(message: string) {
    saveMessage = message;
    setTimeout(() => saveMessage = '', 3000);
  }

  function closeModal(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      showTaskFeedback = '';
      showJournalModal = false;
      taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
      journalContent = '';
      journalMood = '';
    }
  }
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-neutral-50">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-4">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-sm text-neutral-600">Loading your command center...</p>
      </div>
    </div>
  {:else}
    <!-- Save Message -->
    {#if saveMessage}
      <div class="fixed top-6 right-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg transition-opacity z-50 flex items-center gap-2">
        <svelte:component this={icons.CheckCircle} class="w-4 h-4" />
        {saveMessage}
      </div>
    {/if}

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-6 space-y-8">
      
      <!-- Welcome Hero Section -->
      <section class="text-center space-y-4">
        <div class="flex items-center justify-center gap-4 mb-2">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {(userData?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div class="text-left">
            <h1 class="text-4xl font-bold text-neutral-900">
              Welcome back, {userData?.name || 'User'}! 👋
            </h1>
            <p class="text-lg text-neutral-600 mt-1">
              {#if userData?.className}
                Ready to focus on <span class="font-semibold text-blue-700">{userData.className}</span> today?
              {:else}
                Ready to make today count?
              {/if}
            </p>
          </div>
        </div>
        
        <!-- Quick Overview Stats -->
        <div class="flex justify-center gap-8 text-center">
          <div class="space-y-1">
            <div class="text-3xl font-bold text-blue-600">{dailyTasks.filter(t => !t.completedAt).length}</div>
            <div class="text-sm text-neutral-600">Priority Tasks</div>
          </div>
          <div class="space-y-1">
            <div class="text-3xl font-bold text-green-600">{tasks.length}</div>
            <div class="text-sm text-neutral-600">Active Goals</div>
          </div>
          <div class="space-y-1">
            <div class="text-3xl font-bold text-purple-600">{stats.reduce((sum, stat) => sum + stat.level, 0)}</div>
            <div class="text-sm text-neutral-600">Total Levels</div>
          </div>
        </div>
      </section>

      <!-- Today's Priority -->
      {#if dailyTasks.filter(t => !t.completedAt).length > 0}
        <section class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-neutral-900 flex items-center justify-center gap-2 mb-2">
              <svelte:component this={icons.Zap} class="w-7 h-7 text-yellow-500" />
              Today's Priority
            </h2>
            <p class="text-neutral-600">Focus on what matters most right now</p>
          </div>
          
          <!-- Featured Priority Task -->
          {#each dailyTasks.filter(t => !t.completedAt).slice(0, 1) as task}
            <div class="bg-white rounded-xl border-2 border-blue-200 p-6 mb-6 shadow-sm">
              <div class="text-center mb-4">
                <h3 class="text-xl font-bold text-neutral-900 mb-2">{task.title}</h3>
                {#if task.description}
                  <p class="text-neutral-600 leading-relaxed">{task.description}</p>
                {/if}
                
                <div class="flex justify-center gap-3 mt-4">
                  {#if task.focus}
                    <span class="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                      <svelte:component this={icons.Focus} class="w-4 h-4 inline mr-1" />
                      {task.focus.name}
                    </span>
                  {/if}
                  {#if task.stat}
                    <span class="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">
                      <svelte:component this={icons.TrendingUp} class="w-4 h-4 inline mr-1" />
                      +{task.stat.name}
                    </span>
                  {/if}
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-3 justify-center">
                <button
                  onclick={() => completeDailyTask(task.id, 'complete')}
                  class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  <svelte:component this={icons.Check} class="w-5 h-5" />
                  Complete
                </button>
                <button
                  onclick={() => completeDailyTask(task.id, 'skipped')}
                  class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <svelte:component this={icons.Clock} class="w-4 h-4" />
                  Skip for Now
                </button>
                <button
                  onclick={() => completeDailyTask(task.id, 'failed')}
                  class="bg-neutral-500 hover:bg-neutral-600 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <svelte:component this={icons.X} class="w-4 h-4" />
                  Can't Do Today
                </button>
              </div>
            </div>
          {/each}
          
          <!-- Remaining Priority Tasks Preview -->
          {#if dailyTasks.filter(t => !t.completedAt).length > 1}
            <div class="text-center">
              <p class="text-sm text-neutral-600 mb-3">
                {dailyTasks.filter(t => !t.completedAt).length - 1} more priority task{dailyTasks.filter(t => !t.completedAt).length > 2 ? 's' : ''} waiting
              </p>
              <div class="flex gap-2 justify-center">
                {#each dailyTasks.filter(t => !t.completedAt).slice(1, 4) as task}
                  <div class="bg-white rounded-lg px-4 py-2 text-sm text-neutral-700 border border-blue-200">
                    {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                  </div>
                {/each}
                {#if dailyTasks.filter(t => !t.completedAt).length > 4}
                  <div class="bg-neutral-100 rounded-lg px-4 py-2 text-sm text-neutral-500">
                    +{dailyTasks.filter(t => !t.completedAt).length - 4} more
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </section>
      {:else}
        <!-- All Priority Tasks Complete -->
        <section class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 text-center">
          <div class="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svelte:component this={icons.Trophy} class="w-10 h-10 text-green-600" />
          </div>
          <h2 class="text-2xl font-bold text-green-900 mb-2">🎉 All Priorities Complete!</h2>
          <p class="text-green-700 mb-6">You've conquered today's most important tasks. What's next?</p>
          <div class="flex gap-4 justify-center">
            <button
              onclick={() => showJournalModal = true}
              class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svelte:component this={icons.Edit3} class="w-4 h-4" />
              Reflect & Journal
            </button>
            <a
              href="/tasks"
              class="bg-white border-2 border-green-300 text-green-700 hover:bg-green-50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svelte:component this={icons.Plus} class="w-4 h-4" />
              Set New Goals
            </a>
          </div>
        </section>
      {/if}

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Active Goals & Progress -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Active Goals -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div class="p-6 border-b border-neutral-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svelte:component this={icons.Target} class="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-neutral-900">Active Goals</h2>
                    <p class="text-sm text-neutral-500">{tasks.length} goal{tasks.length !== 1 ? 's' : ''} in progress</p>
                  </div>
                </div>
                <a 
                  href="/tasks" 
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  Manage Goals
                  <svelte:component this={icons.ArrowRight} class="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div class="p-6">
              {#if tasks.length === 0}
                <div class="text-center py-12 space-y-4">
                  <div class="w-16 h-16 bg-neutral-100 rounded-xl mx-auto flex items-center justify-center">
                    <svelte:component this={icons.Target} class="w-8 h-8 text-neutral-400" />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900">Ready to grow?</h3>
                    <p class="text-sm text-neutral-600">Set your first goal to start building momentum</p>
                  </div>
                  <a 
                    href="/tasks" 
                    class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <svelte:component this={icons.Plus} class="w-4 h-4" />
                    Create First Goal
                  </a>
                </div>
              {:else}
                <div class="space-y-4">
                  {#each tasks as task}
                    <div class="border border-neutral-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-md transition-all group">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 space-y-2">
                          <h4 class="font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors">{task.title}</h4>
                          {#if task.description}
                            <p class="text-sm text-neutral-600 leading-relaxed">{task.description}</p>
                          {/if}
                          <div class="flex flex-wrap gap-2">
                            {#if task.focus}
                              <span class="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                                {task.focus.name}
                              </span>
                            {/if}
                            {#if task.stat}
                              <span class="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md font-medium">
                                +{task.stat.name}
                              </span>
                            {/if}
                          </div>
                        </div>
                        <button
                          onclick={() => completeTask(task.id)}
                          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-sm"
                        >
                          <svelte:component this={icons.Check} class="w-4 h-4" />
                          Done
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Your Progress -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div class="p-6 border-b border-neutral-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svelte:component this={icons.TrendingUp} class="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-neutral-900">Your Progress</h2>
                    <p class="text-sm text-neutral-500">Track your growth journey</p>
                  </div>
                </div>
                <a 
                  href="/stats" 
                  class="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  View Details
                  <svelte:component this={icons.ArrowRight} class="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div class="p-6">
              {#if stats.length === 0}
                <div class="text-center py-8 space-y-4">
                  <div class="w-16 h-16 bg-neutral-100 rounded-xl mx-auto flex items-center justify-center">
                    <svelte:component this={icons.TrendingUp} class="w-8 h-8 text-neutral-400" />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900">Start tracking your growth</h3>
                    <p class="text-sm text-neutral-600">Create stats to measure progress in different areas</p>
                  </div>
                  <a 
                    href="/stats" 
                    class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svelte:component this={icons.Plus} class="w-4 h-4" />
                    Create Stats
                  </a>
                </div>
              {:else}
                <div class="grid gap-4 sm:grid-cols-2">
                  {#each stats as stat}
                    <div class="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                      <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svelte:component this={getIconComponent(stat.icon)} class="w-5 h-5 text-purple-600" />
                        </div>
                        <div class="flex-1">
                          <h4 class="font-bold text-neutral-900">{stat.name}</h4>
                          <p class="text-sm text-neutral-600">Level {stat.level}</p>
                        </div>
                        <div class="text-right">
                          <div class="text-xl font-bold text-purple-600">{stat.level}</div>
                        </div>
                      </div>
                      
                      <!-- Mini Progress Bar -->
                      <div class="space-y-1">
                        <div class="bg-neutral-200 h-2 rounded-full overflow-hidden">
                          <div 
                            class="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                            style="width: {Math.min(100, Math.max(0, (stat.xp - ((stat.level - 1) * 100)) / 100 * 100))}%;"
                          ></div>
                        </div>
                        <p class="text-xs text-neutral-500">
                          {Math.min(100, Math.max(0, (stat.xp - ((stat.level - 1) * 100)) / 100 * 100)).toFixed(0)}% to Level {stat.level + 1}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Right Column: Journal & Quick Actions -->
        <div class="space-y-8">
          
          <!-- Recent Journal Entries -->
          <div class="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div class="p-6 border-b border-neutral-100">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svelte:component this={icons.Edit3} class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-neutral-900">Journal</h2>
                    <p class="text-sm text-neutral-500">Your recent thoughts</p>
                  </div>
                </div>
              </div>
              <button
                onclick={() => showJournalModal = true}
                class="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svelte:component this={icons.Edit3} class="w-4 h-4" />
                Write New Entry
              </button>
            </div>
            
            <div class="p-6">
              {#if recentJournals.length === 0}
                <div class="text-center py-8 space-y-4">
                  <div class="w-16 h-16 bg-neutral-100 rounded-xl mx-auto flex items-center justify-center">
                    <svelte:component this={icons.Edit3} class="w-8 h-8 text-neutral-400" />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900">Start journaling</h3>
                    <p class="text-sm text-neutral-600">Capture your thoughts and reflections</p>
                  </div>
                </div>
              {:else}
                <div class="space-y-4">
                  {#each recentJournals as journal}
                    <div class="border border-neutral-200 rounded-lg p-4 hover:border-amber-200 hover:shadow-sm transition-all">
                      <p class="text-sm text-neutral-900 mb-3 leading-relaxed">
                        {journal.content.length > 100 ? journal.content.substring(0, 100) + '...' : journal.content}
                      </p>
                      <div class="flex justify-between items-center">
                        <span class="text-xs text-neutral-500">
                          {new Date(journal.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        {#if journal.mood}
                          <span class="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                            {journal.mood}
                          </span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                  <div class="text-center pt-2">
                    <a 
                      href="/journals" 
                      class="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      View All Entries
                      <svelte:component this={icons.ArrowRight} class="w-4 h-4" />
                    </a>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Quick Navigation -->
          <div class="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 border border-neutral-200">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4 text-center">Quick Actions</h3>
            <div class="space-y-3">
              <a 
                href="/tasks" 
                class="flex items-center gap-3 p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-neutral-200 hover:border-blue-200"
              >
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svelte:component this={icons.Plus} class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div class="font-medium text-neutral-900">Create Goal</div>
                  <div class="text-sm text-neutral-600">Set new objectives</div>
                </div>
              </a>
              <a 
                href="/focuses" 
                class="flex items-center gap-3 p-3 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-neutral-200 hover:border-indigo-200"
              >
                <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svelte:component this={icons.Focus} class="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div class="font-medium text-neutral-900">Focus Areas</div>
                  <div class="text-sm text-neutral-600">Manage priorities</div>
                </div>
              </a>
              <a 
                href="/settings" 
                class="flex items-center gap-3 p-3 bg-white hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-200"
              >
                <div class="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <svelte:component this={icons.Settings} class="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <div class="font-medium text-neutral-900">Settings</div>
                  <div class="text-sm text-neutral-600">Customize profile</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  {/if}
</div>
<!-- Journal Entry Modal -->
{#if showJournalModal}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={closeModal}
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
      <div class="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-t-xl border-b border-neutral-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svelte:component this={icons.Edit3} class="w-5 h-5 text-amber-600" />
            </div>
            <h3 class="text-xl font-bold text-neutral-900">New Journal Entry</h3>
          </div>
          <button 
            onclick={() => showJournalModal = false}
            class="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
          >
            <svelte:component this={icons.X} class="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-semibold text-neutral-800 mb-3">
            What's on your mind today?
          </label>
          <textarea
            bind:value={journalContent}
            placeholder="Share your thoughts, reflections, or experiences..."
            class="w-full min-h-40 p-4 border border-neutral-300 rounded-lg text-sm leading-relaxed resize-y focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-neutral-800 mb-3">
            How are you feeling? <span class="text-sm text-neutral-500 font-normal">(optional)</span>
          </label>
          <select
            bind:value={journalMood}
            class="w-full p-3 border border-neutral-300 rounded-lg text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
          >
            <option value="">Select your mood</option>
            <option value="happy">😊 Happy</option>
            <option value="grateful">🙏 Grateful</option>
            <option value="excited">🤗 Excited</option>
            <option value="calm">😌 Calm</option>
            <option value="reflective">🤔 Reflective</option>
            <option value="anxious">😰 Anxious</option>
            <option value="frustrated">😤 Frustrated</option>
            <option value="tired">😴 Tired</option>
          </select>
        </div>
        
        <div class="flex gap-3 justify-end pt-4 border-t border-neutral-200">
          <button 
            onclick={() => showJournalModal = false}
            class="border border-neutral-300 text-neutral-700 text-sm px-6 py-3 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onclick={createJournal}
            disabled={!journalContent.trim()}
            class="bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-sm px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svelte:component this={icons.Save} class="w-4 h-4" />
            Save Entry
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Task Feedback Modal -->
{#if showTaskFeedback}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={closeModal}
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div class="border-b border-neutral-200 p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-neutral-800">Task Feedback</h3>
          <button 
            onclick={cancelTaskFeedback}
            class="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svelte:component this={icons.X} class="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            How did it go? <span class="text-sm text-neutral-600 font-normal italic">(optional)</span>
          </label>
          <textarea
            bind:value={taskFeedbackData.feedback}
            placeholder="Reflect on your experience..."
            class="w-full min-h-20 p-3 border border-neutral-300 rounded-lg text-sm leading-relaxed resize-y focus:border-blue-500 focus:outline-none transition-colors"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            Emotion Tag <span class="text-sm text-neutral-600 font-normal italic">(optional)</span>
          </label>
          <select
            bind:value={taskFeedbackData.emotionTag}
            class="w-full p-3 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Select an emotion</option>
            <option value="accomplished">Accomplished</option>
            <option value="energized">Energized</option>
            <option value="focused">Focused</option>
            <option value="challenged">Challenged</option>
            <option value="frustrated">Frustrated</option>
            <option value="overwhelmed">Overwhelmed</option>
            <option value="peaceful">Peaceful</option>
            <option value="motivated">Motivated</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            Mood Score (1-10) <span class="text-sm text-neutral-600 font-normal italic">(optional)</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            bind:value={taskFeedbackData.moodScore}
            class="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-neutral-600 mt-1">
            <span>None</span>
            <span>Great (10)</span>
          </div>
          {#if taskFeedbackData.moodScore > 0}
            <p class="text-center text-sm text-neutral-700 mt-2">Score: {taskFeedbackData.moodScore}</p>
          {/if}
        </div>
        
        <div class="flex gap-3 justify-end pt-4">
          <button 
            onclick={cancelTaskFeedback}
            class="border border-neutral-300 text-neutral-700 text-sm px-4 py-2 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onclick={() => submitTaskFeedback(showTaskFeedback)}
            class="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Complete Task
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
