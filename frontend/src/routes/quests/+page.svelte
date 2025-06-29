<script lang="ts">
  import { onMount } from 'svelte'
  import { Plus, Target, Beaker, Calendar, Clock, CheckCircle, AlertCircle, PauseCircle, XCircle } from 'lucide-svelte'
  import { apiSimple } from '$lib/api/client'
  
  let quests: any[] = []
  let experiments: any[] = []
  let loading = true
  let error = ''
  let activeTab: 'quests' | 'experiments' = 'quests'
  
  // Hardcoded user ID for now - in real app this would come from auth
  const userId = 'a0e1f2c3-d4b5-6c7d-8e9f-0a1b2c3d4e5f'
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    loading = true
    error = ''
    
    try {
      // Load quests
      const questsResponse = await fetch(`/api/quests?userId=${userId}`)
      const questsData = await questsResponse.json()
      if (questsData.success) {
        quests = questsData.data.quests || []
      }
      
      // Load experiments  
      const experimentsResponse = await fetch(`/api/experiments?userId=${userId}`)
      const experimentsData = await experimentsResponse.json()
      if (experimentsData.success) {
        experiments = experimentsData.data.experiments || []
      }
    } catch (err) {
      console.error('Error loading data:', err)
      error = 'Failed to load quests and experiments. Please try again.'
    } finally {
      loading = false
    }
  }
  
  function getStatusIcon(status: string) {
    switch (status) {
      case 'active': return CheckCircle
      case 'completed': return CheckCircle
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
</script>

<svelte:head>
  <title>Quests & Experiments</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-4 pb-20">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Quests & Experiments</h1>
    <p class="text-gray-600">Manage your long-term goals and behavioral experiments</p>
  </div>

  <!-- Tab Navigation -->
  <div class="flex bg-gray-100 rounded-lg p-1 mb-6">
    <button
      class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors {activeTab === 'quests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      on:click={() => activeTab = 'quests'}
    >
      <Target size={16} />
      Quests ({quests.length})
    </button>
    <button
      class="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors {activeTab === 'experiments' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
      on:click={() => activeTab = 'experiments'}
    >
      <Beaker size={16} />
      Experiments ({experiments.length})
    </button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex items-center gap-2">
        <AlertCircle size={20} class="text-red-600" />
        <p class="text-red-800">{error}</p>
      </div>
      <button
        class="mt-3 text-red-600 hover:text-red-800 text-sm underline"
        on:click={loadData}
      >
        Try again
      </button>
    </div>
  {:else}
    <!-- Quests Tab -->
    {#if activeTab === 'quests'}
      <div class="space-y-4">
        <!-- Create Quest Button -->
        <div class="flex justify-end">
          <a 
            href="/quests/new?type=quest"
            class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Quest
          </a>
        </div>

        {#if quests.length === 0}
          <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Target size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No quests yet</h3>
            <p class="text-gray-600 mb-4">Quests are long-term goals that generate ongoing tasks</p>
            <a 
              href="/quests/new?type=quest"
              class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Create your first quest
            </a>
          </div>
        {:else}
          <div class="grid gap-4">
            {#each quests as quest}
              <a 
                href="/quests/{quest.id}"
                class="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div class="p-6">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <Target size={20} class="text-blue-600 mt-0.5" />
                      <h3 class="text-lg font-semibold text-gray-900">{quest.title}</h3>
                    </div>
                    <div class="flex items-center gap-2">
                      <svelte:component this={getStatusIcon(quest.status)} size={16} class={getStatusColor(quest.status)} />
                      <span class="text-sm {getStatusColor(quest.status)} capitalize">{quest.status}</span>
                    </div>
                  </div>
                  
                  {#if quest.description}
                    <p class="text-gray-600 mb-4">{quest.description}</p>
                  {/if}
                  
                  {#if quest.goalDescription}
                    <div class="bg-blue-50 rounded-lg p-3 mb-4">
                      <p class="text-sm text-blue-800"><strong>Goal:</strong> {quest.goalDescription}</p>
                    </div>
                  {/if}
                  
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <div class="flex items-center gap-1">
                      <Calendar size={14} />
                      Started: {formatDate(quest.startDate)}
                    </div>
                    {#if quest.endDate}
                      <div class="flex items-center gap-1">
                        <Clock size={14} />
                        {#if quest.status === 'active'}
                          {@const daysLeft = calculateDaysRemaining(quest.endDate)}
                          {#if daysLeft !== null}
                            {#if daysLeft > 0}
                              {daysLeft} days left
                            {:else if daysLeft === 0}
                              Due today
                            {:else}
                              {Math.abs(daysLeft)} days overdue
                            {/if}
                          {/if}
                        {:else}
                          Ended: {formatDate(quest.endDate)}
                        {/if}
                      </div>
                    {/if}
                    
                    {#if quest.progressSummary}
                      <div class="flex items-center gap-1">
                        <CheckCircle size={14} />
                        {quest.progressSummary.completedTasks}/{quest.progressSummary.totalTasks} tasks ({quest.progressSummary.completionRate}%)
                      </div>
                    {/if}
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Experiments Tab -->
    {#if activeTab === 'experiments'}
      <div class="space-y-4">
        <!-- Create Experiment Button -->
        <div class="flex justify-end">
          <a 
            href="/quests/new?type=experiment"
            class="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={16} />
            New Experiment
          </a>
        </div>

        {#if experiments.length === 0}
          <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Beaker size={48} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No experiments yet</h3>
            <p class="text-gray-600 mb-4">Experiments test specific hypotheses over a defined period</p>
            <a 
              href="/quests/new?type=experiment"
              class="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              Create your first experiment
            </a>
          </div>
        {:else}
          <div class="grid gap-4">
            {#each experiments as experiment}
              <a 
                href="/quests/{experiment.id}"
                class="block bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div class="p-6">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <Beaker size={20} class="text-purple-600 mt-0.5" />
                      <h3 class="text-lg font-semibold text-gray-900">{experiment.title}</h3>
                    </div>
                    <div class="flex items-center gap-2">
                      <svelte:component this={getStatusIcon(experiment.status)} size={16} class={getStatusColor(experiment.status)} />
                      <span class="text-sm {getStatusColor(experiment.status)} capitalize">{experiment.status}</span>
                    </div>
                  </div>
                  
                  {#if experiment.description}
                    <p class="text-gray-600 mb-4">{experiment.description}</p>
                  {/if}
                  
                  {#if experiment.hypothesis}
                    <div class="bg-purple-50 rounded-lg p-3 mb-4">
                      <p class="text-sm text-purple-800"><strong>Hypothesis:</strong> {experiment.hypothesis}</p>
                    </div>
                  {/if}
                  
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <div class="flex items-center gap-1">
                      <Calendar size={14} />
                      {experiment.duration} days
                    </div>
                    <div class="flex items-center gap-1">
                      <Clock size={14} />
                      Started: {formatDate(experiment.startDate)}
                    </div>
                    
                    {#if experiment.daysRemaining !== null && experiment.status === 'active'}
                      <div class="flex items-center gap-1">
                        <AlertCircle size={14} />
                        {experiment.daysRemaining} days left
                      </div>
                    {/if}
                    
                    {#if experiment.progressSummary}
                      <div class="flex items-center gap-1">
                        <CheckCircle size={14} />
                        {experiment.progressSummary.completedTasks}/{experiment.progressSummary.totalTasks} tasks ({experiment.progressSummary.completionRate}%)
                      </div>
                    {/if}
                  </div>
                  
                  {#if experiment.results && experiment.status === 'completed'}
                    <div class="mt-4 bg-green-50 rounded-lg p-3">
                      <p class="text-sm text-green-800"><strong>Results:</strong> {experiment.results}</p>
                    </div>
                  {/if}
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
