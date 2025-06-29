<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { ArrowLeft, Target, Beaker, Calendar, Clock, CheckCircle, AlertCircle, PauseCircle, XCircle, Edit, Play, Pause, Square, Trophy, Settings } from 'lucide-svelte'
  
  let questOrExperiment: any = null
  let tasks: any[] = []
  let loading = true
  let error = ''
  let actionLoading = false
  
  // Hardcoded user ID for now - in real app this would come from auth
  const userId = 'a0e1f2c3-d4b5-6c7d-8e9f-0a1b2c3d4e5f'
  
  $: id = $page.params.id
  $: isQuest = questOrExperiment?.type !== 'experiment'
  $: isExperiment = questOrExperiment?.type === 'experiment'
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    loading = true
    error = ''
    
    try {
      // Try to load as quest first
      let response = await fetch(`/api/quests/${id}?userId=${userId}`)
      let data = await response.json()
      
      if (data.success) {
        questOrExperiment = { ...data.data.quest, type: 'quest' }
      } else {
        // Try as experiment
        response = await fetch(`/api/experiments/${id}?userId=${userId}`)
        data = await response.json()
        
        if (data.success) {
          questOrExperiment = { ...data.data.experiment, type: 'experiment' }
        } else {
          error = 'Quest or experiment not found'
          return
        }
      }
      
      // Load associated tasks
      if (questOrExperiment) {
        const tasksResponse = await fetch(`/api/tasks?userId=${userId}&source=${isQuest ? 'quest' : 'experiment'}&sourceId=${id}`)
        const tasksData = await tasksResponse.json()
        
        if (tasksData.success) {
          tasks = tasksData.data || []
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      error = 'Failed to load data. Please try again.'
    } finally {
      loading = false
    }
  }
  
  async function updateStatus(newStatus: string) {
    actionLoading = true
    error = ''
    
    try {
      const endpoint = isQuest ? `/api/quests/${id}` : `/api/experiments/${id}`
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          status: newStatus
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        questOrExperiment = { 
          ...questOrExperiment, 
          status: newStatus,
          ...(newStatus === 'completed' && { completedAt: new Date().toISOString() })
        }
      } else {
        error = result.error || 'Failed to update status'
      }
    } catch (err) {
      console.error('Error updating status:', err)
      error = 'Failed to update status. Please try again.'
    } finally {
      actionLoading = false
    }
  }
  
  function getStatusIcon(status: string) {
    switch (status) {
      case 'active': return Play
      case 'completed': return Trophy
      case 'paused': return PauseCircle
      case 'abandoned': return XCircle
      default: return AlertCircle
    }
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'paused': return 'text-yellow-600'
      case 'abandoned': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  function formatDate(dateString: string | null) {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString()
  }
  
  function calculateDaysRemaining(endDate: string | null) {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  function getActionButtons(status: string) {
    switch (status) {
      case 'active':
        return [
          { label: 'Pause', action: 'paused', icon: Pause, color: 'yellow' },
          { label: 'Complete', action: 'completed', icon: Trophy, color: 'green' },
          { label: 'Abandon', action: 'abandoned', icon: Square, color: 'red' }
        ]
      case 'paused':
        return [
          { label: 'Resume', action: 'active', icon: Play, color: 'blue' },
          { label: 'Complete', action: 'completed', icon: Trophy, color: 'green' },
          { label: 'Abandon', action: 'abandoned', icon: Square, color: 'red' }
        ]
      case 'completed':
      case 'abandoned':
        return []
      default:
        return []
    }
  }
</script>

<svelte:head>
  <title>{questOrExperiment?.title || 'Loading...'}</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 pb-20">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>
  {:else if error && !questOrExperiment}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2">
        <AlertCircle size={20} class="text-red-600" />
        <p class="text-red-800">{error}</p>
      </div>
      <button
        class="mt-3 text-red-600 hover:text-red-800 text-sm underline"
        on:click={() => goto('/quests')}
      >
        Back to Quests & Experiments
      </button>
    </div>
  {:else if questOrExperiment}
    <!-- Header -->
    <div class="flex items-start gap-4 mb-6">
      <button
        on:click={() => goto('/quests')}
        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mt-1"
      >
        <ArrowLeft size={20} />
      </button>
      
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          {#if isQuest}
            <Target size={32} class="text-blue-600" />
          {:else}
            <Beaker size={32} class="text-purple-600" />
          {/if}
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{questOrExperiment.title}</h1>
            <div class="flex items-center gap-2 mt-1">
              <svelte:component this={getStatusIcon(questOrExperiment.status)} size={16} class={getStatusColor(questOrExperiment.status)} />
              <span class="text-sm {getStatusColor(questOrExperiment.status)} capitalize font-medium">
                {questOrExperiment.status}
              </span>
              <span class="text-gray-300">•</span>
              <span class="text-sm text-gray-500">
                {isQuest ? 'Quest' : 'Experiment'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Edit Button -->
      <button
        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Edit"
      >
        <Settings size={20} />
      </button>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    <!-- Description -->
    {#if questOrExperiment.description}
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Description</h2>
        <p class="text-gray-700">{questOrExperiment.description}</p>
      </div>
    {/if}

    <!-- Goal or Hypothesis -->
    {#if questOrExperiment.goalDescription || questOrExperiment.hypothesis}
      <div class="bg-{isQuest ? 'blue' : 'purple'}-50 rounded-lg border border-{isQuest ? 'blue' : 'purple'}-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-{isQuest ? 'blue' : 'purple'}-900 mb-3">
          {isQuest ? 'Goal' : 'Hypothesis'}
        </h2>
        <p class="text-{isQuest ? 'blue' : 'purple'}-800">
          {questOrExperiment.goalDescription || questOrExperiment.hypothesis}
        </p>
      </div>
    {/if}

    <!-- Timeline & Progress -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Timeline -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <Calendar size={16} class="text-gray-400" />
            <div>
              <span class="text-sm text-gray-500">Started:</span>
              <span class="ml-2 text-gray-900">{formatDate(questOrExperiment.startDate)}</span>
            </div>
          </div>
          
          {#if questOrExperiment.endDate}
            <div class="flex items-center gap-3">
              <Clock size={16} class="text-gray-400" />
              <div>
                <span class="text-sm text-gray-500">
                  {questOrExperiment.status === 'completed' ? 'Completed:' : 'Due:'}
                </span>
                <span class="ml-2 text-gray-900">{formatDate(questOrExperiment.endDate)}</span>
              </div>
            </div>
          {/if}
          
          {#if isExperiment && questOrExperiment.duration}
            <div class="flex items-center gap-3">
              <Clock size={16} class="text-gray-400" />
              <div>
                <span class="text-sm text-gray-500">Duration:</span>
                <span class="ml-2 text-gray-900">{questOrExperiment.duration} days</span>
              </div>
            </div>
          {/if}
          
          {#if questOrExperiment.status === 'active' && questOrExperiment.endDate}
            {@const daysLeft = calculateDaysRemaining(questOrExperiment.endDate)}
            {#if daysLeft !== null}
              <div class="flex items-center gap-3">
                <AlertCircle size={16} class="text-orange-500" />
                <div>
                  <span class="text-sm text-gray-500">Time remaining:</span>
                  <span class="ml-2 text-gray-900">
                    {#if daysLeft > 0}
                      {daysLeft} days
                    {:else if daysLeft === 0}
                      Due today
                    {:else}
                      {Math.abs(daysLeft)} days overdue
                    {/if}
                  </span>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Progress -->
      {#if questOrExperiment.progressSummary}
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Tasks Completed</span>
                <span>{questOrExperiment.progressSummary.completedTasks}/{questOrExperiment.progressSummary.totalTasks}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-{isQuest ? 'blue' : 'purple'}-600 h-2 rounded-full transition-all duration-300"
                  style="width: {questOrExperiment.progressSummary.completionRate}%"
                ></div>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                {questOrExperiment.progressSummary.completionRate}% complete
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Results (for completed experiments) -->
    {#if isExperiment && questOrExperiment.results && questOrExperiment.status === 'completed'}
      <div class="bg-green-50 rounded-lg border border-green-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-green-900 mb-3">Results</h2>
        <p class="text-green-800">{questOrExperiment.results}</p>
      </div>
    {/if}

    <!-- Action Buttons -->
    {#if questOrExperiment.status !== 'completed' && questOrExperiment.status !== 'abandoned'}
      <div class="flex gap-3 mb-6">
        {#each getActionButtons(questOrExperiment.status) as button}
          <button
            on:click={() => updateStatus(button.action)}
            disabled={actionLoading}
            class="flex items-center gap-2 px-4 py-2 bg-{button.color}-600 hover:bg-{button.color}-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <svelte:component this={button.icon} size={16} />
            {button.label}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Associated Tasks -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Associated Tasks</h2>
      
      {#if tasks.length === 0}
        <div class="text-center py-8 text-gray-500">
          <p>No tasks yet for this {isQuest ? 'quest' : 'experiment'}</p>
          <p class="text-sm mt-1">Tasks will be generated automatically based on your {isQuest ? 'goal' : 'hypothesis'}</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each tasks as task}
            <div class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div class="flex-shrink-0">
                {#if task.status === 'completed'}
                  <CheckCircle size={20} class="text-green-600" />
                {:else if task.status === 'skipped'}
                  <XCircle size={20} class="text-red-600" />
                {:else}
                  <div class="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                {/if}
              </div>
              
              <div class="flex-1">
                <h3 class="font-medium text-gray-900 {task.status === 'completed' || task.status === 'skipped' ? 'line-through text-gray-500' : ''}">{task.title}</h3>
                {#if task.description}
                  <p class="text-sm text-gray-600 mt-1">{task.description}</p>
                {/if}
                {#if task.estimatedXp}
                  <p class="text-xs text-blue-600 mt-1">{task.estimatedXp} XP</p>
                {/if}
              </div>
              
              <div class="text-sm text-gray-500">
                {#if task.dueDate}
                  Due: {formatDate(task.dueDate)}
                {:else}
                  No due date
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
