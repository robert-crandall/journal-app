<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { Plus, Target, Beaker, ArrowLeft, Calendar, Clock, Save } from 'lucide-svelte'
  
  let type: 'quest' | 'experiment' = 'quest'
  let title = ''
  let description = ''
  let goalDescription = '' // For quests
  let hypothesis = '' // For experiments  
  let duration = 7 // For experiments (days)
  let startDate = ''
  let endDate = ''
  let loading = false
  let error = ''
  
  // Hardcoded user ID for now - in real app this would come from auth
  const userId = 'a0e1f2c3-d4b5-6c7d-8e9f-0a1b2c3d4e5f'
  
  onMount(() => {
    // Get type from URL params
    const urlType = $page.url.searchParams.get('type')
    if (urlType === 'experiment') {
      type = 'experiment'
    }
    
    // Set default start date to today
    const today = new Date()
    startDate = today.toISOString().split('T')[0]
    
    // Set default end date to 7 days from now for experiments
    if (type === 'experiment') {
      const defaultEnd = new Date(today)
      defaultEnd.setDate(defaultEnd.getDate() + duration)
      endDate = defaultEnd.toISOString().split('T')[0]
    }
  })
  
  // Update end date when duration changes for experiments
  $: if (type === 'experiment' && startDate && duration) {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + duration)
    endDate = end.toISOString().split('T')[0]
  }
  
  async function handleSubmit() {
    if (!title.trim()) {
      error = 'Title is required'
      return
    }
    
    if (type === 'experiment' && !hypothesis.trim()) {
      error = 'Hypothesis is required for experiments'
      return
    }
    
    if (type === 'experiment' && duration < 1) {
      error = 'Duration must be at least 1 day'
      return
    }
    
    loading = true
    error = ''
    
    try {
      const endpoint = type === 'quest' ? '/api/quests' : '/api/experiments'
      const data: any = {
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString()
      }
      
      if (type === 'quest') {
        data.goalDescription = goalDescription.trim() || undefined
        if (endDate) {
          data.endDate = new Date(endDate).toISOString()
        }
      } else {
        data.hypothesis = hypothesis.trim()
        data.duration = duration
        if (endDate) {
          data.endDate = new Date(endDate).toISOString()
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Redirect to the quest/experiment detail page
        const item = type === 'quest' ? result.data.quest : result.data.experiment
        goto(`/quests/${item.id}`)
      } else {
        error = result.error || `Failed to create ${type}`
      }
    } catch (err) {
      console.error(`Error creating ${type}:`, err)
      error = `Failed to create ${type}. Please try again.`
    } finally {
      loading = false
    }
  }
  
  function handleCancel() {
    goto('/quests')
  }
</script>

<svelte:head>
  <title>New {type === 'quest' ? 'Quest' : 'Experiment'}</title>
</svelte:head>

<div class="max-w-2xl mx-auto p-4 pb-20">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-6">
    <button
      on:click={handleCancel}
      class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <ArrowLeft size={20} />
    </button>
    <div class="flex items-center gap-2">
      {#if type === 'quest'}
        <Target size={24} class="text-blue-600" />
      {:else}
        <Beaker size={24} class="text-purple-600" />
      {/if}
      <h1 class="text-2xl font-bold text-gray-900">
        New {type === 'quest' ? 'Quest' : 'Experiment'}
      </h1>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-800">{error}</p>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Title -->
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
        Title *
      </label>
      <input
        id="title"
        type="text"
        bind:value={title}
        placeholder={type === 'quest' ? 'Complete 30 outdoor adventures' : '7-day morning meditation routine'}
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
        Description
      </label>
      <textarea
        id="description"
        bind:value={description}
        placeholder={type === 'quest' ? 'Explore new hiking trails, try rock climbing, go camping...' : 'Test whether consistent morning meditation improves focus and mood throughout the day'}
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </div>

    {#if type === 'quest'}
      <!-- Goal Description for Quests -->
      <div>
        <label for="goalDescription" class="block text-sm font-medium text-gray-700 mb-2">
          Goal Description
        </label>
        <textarea
          id="goalDescription"
          bind:value={goalDescription}
          placeholder="Become more adventurous and connected with nature"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
        <p class="text-sm text-gray-500 mt-1">
          What do you hope to achieve with this quest?
        </p>
      </div>
    {:else}
      <!-- Hypothesis for Experiments -->
      <div>
        <label for="hypothesis" class="block text-sm font-medium text-gray-700 mb-2">
          Hypothesis *
        </label>
        <textarea
          id="hypothesis"
          bind:value={hypothesis}
          placeholder="Morning meditation will increase my focus score by 20% and reduce afternoon fatigue"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        ></textarea>
        <p class="text-sm text-gray-500 mt-1">
          What specific outcome do you expect from this experiment?
        </p>
      </div>

      <!-- Duration for Experiments -->
      <div>
        <label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
          Duration (days) *
        </label>
        <div class="flex items-center gap-4">
          <input
            id="duration"
            type="number"
            bind:value={duration}
            min="1"
            max="365"
            class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <span class="text-sm text-gray-500">
            {duration === 1 ? '1 day' : `${duration} days`}
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          How long should this experiment run?
        </p>
      </div>
    {/if}

    <!-- Date Range -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Start Date -->
      <div>
        <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
          Start Date *
        </label>
        <div class="relative">
          <Calendar size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            id="startDate"
            type="date"
            bind:value={startDate}
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <!-- End Date -->
      <div>
        <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
          End Date {type === 'experiment' ? '(auto-calculated)' : '(optional)'}
        </label>
        <div class="relative">
          <Clock size={16} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            id="endDate"
            type="date"
            bind:value={endDate}
            disabled={type === 'experiment'}
            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {type === 'experiment' ? 'bg-gray-50 text-gray-500' : ''}"
          />
        </div>
        {#if type === 'quest'}
          <p class="text-sm text-gray-500 mt-1">
            Leave blank for open-ended quest
          </p>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 pt-6">
      <button
        type="button"
        on:click={handleCancel}
        class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        disabled={loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading || !title.trim() || (type === 'experiment' && !hypothesis.trim())}
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2 {type === 'quest' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if loading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Creating...
        {:else}
          <Save size={16} />
          Create {type === 'quest' ? 'Quest' : 'Experiment'}
        {/if}
      </button>
    </div>
  </form>
</div>
