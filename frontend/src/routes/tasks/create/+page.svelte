<script lang="ts">
  import { goto } from '$app/navigation';
  import { tasksApi, type CreateTaskRequest } from '$lib/api/tasks';
  import { familyApi, type FamilyMember } from '$lib/api/family';
  import { ArrowLeft, Save, Zap, User, Calendar, Repeat } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Form data
  let formData: CreateTaskRequest = $state({
    title: '',
    description: '',
    sourceType: 'manual',
    dueDate: '',
    priority: 5,
    xpReward: 0,
    isRecurring: false,
    recurringType: 'daily'
  });

  // Form state
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state(false);

  // Available options
  let familyMembers: FamilyMember[] = $state([]);

  // Validation state
  let titleError = $state<string | null>(null);

  // Load available options
  onMount(async () => {
    try {
      const familyData = await familyApi.getFamilyMembers();
      familyMembers = familyData;
    } catch (err) {
      console.error('Failed to load form options:', err);
    }
  });

  // Form validation
  function validateForm(): boolean {
    titleError = null;

    if (!formData.title.trim()) {
      titleError = 'Title is required';
      return false;
    }

    if (formData.title.length > 200) {
      titleError = 'Title must be 200 characters or less';
      return false;
    }

    return true;
  }

  // Submit handler
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
      loading = true;
      error = null;

      // Clean up form data
      const taskData: CreateTaskRequest = {
        ...formData,
        description: formData.description?.trim() || undefined,
        dueDate: formData.dueDate || undefined,
        statId: formData.statId || undefined,
        familyMemberId: formData.familyMemberId || undefined,
        xpReward: formData.xpReward || undefined
      };

      // Remove undefined values
      Object.keys(taskData).forEach(key => {
        if (taskData[key as keyof CreateTaskRequest] === undefined) {
          delete taskData[key as keyof CreateTaskRequest];
        }
      });

      await tasksApi.createTask(taskData);
      success = true;
      
      // Redirect after success
      setTimeout(() => {
        goto('/tasks');
      }, 1500);

    } catch (err) {
      console.error('Failed to create task:', err);
      error = err instanceof Error ? err.message : 'Failed to create task';
    } finally {
      loading = false;
    }
  }

  // Handle due date change
  function handleDueDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.dueDate = target.value;
  }

  // Handle recurring days selection (for weekly recurrence)
  let selectedDays = $state<number[]>([]);
  
  function toggleDay(day: number) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter(d => d !== day);
    } else {
      selectedDays = [...selectedDays, day];
    }
    formData.recurringDays = selectedDays.length > 0 ? selectedDays : undefined;
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<svelte:head>
  <title>Create Task - Gamified Life</title>
  <meta name="description" content="Create a new task to organize your daily actions and earn XP" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-center gap-4">
        <button onclick={() => goto('/tasks')} class="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 class="text-primary text-3xl font-bold">Create New Task</h1>
          <p class="text-base-content/70">Add a new task to organize your daily actions</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Form -->
  <div class="mx-auto max-w-4xl px-4 py-8">
    {#if success}
      <!-- Success Message -->
      <div class="alert alert-success mb-8">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Task created successfully! Redirecting...</span>
        </div>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="space-y-8">
        <!-- Basic Information -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body p-8">
            <h2 class="text-xl font-semibold mb-6">Basic Information</h2>
            
            <div class="space-y-6">
              <!-- Title -->
              <div class="form-control">
                <label class="label" for="title">
                  <span class="label-text font-medium">Title *</span>
                  <span class="label-text-alt text-xs opacity-60">{formData.title.length}/200</span>
                </label>
                <input
                  id="title"
                  type="text"
                  bind:value={formData.title}
                  placeholder="Enter task title..."
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02] {titleError ? 'input-error' : ''}"
                  maxlength="200"
                  required
                />
                {#if titleError}
                  <div class="label">
                    <span class="label-text-alt text-error">{titleError}</span>
                  </div>
                {/if}
              </div>

              <!-- Description -->
              <div class="form-control">
                <label class="label" for="description">
                  <span class="label-text font-medium">Description</span>
                  <span class="label-text-alt text-xs opacity-60">{(formData.description || '').length}/500</span>
                </label>
                <textarea
                  id="description"
                  bind:value={formData.description}
                  placeholder="Describe the task (optional)..."
                  class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                  maxlength="500"
                ></textarea>
              </div>

              <!-- Source Type -->
              <div class="form-control">
                <label class="label" for="sourceType">
                  <span class="label-text font-medium">Source Type *</span>
                </label>
                <select
                  id="sourceType"
                  bind:value={formData.sourceType}
                  class="select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  required
                >
                  <option value="manual">Manual (XP-earning)</option>
                  <option value="todo">Todo (Simple reminder)</option>
                  <option value="track_task">Quest/Experiment Task</option>
                  <option value="initiative_task">Project Task</option>
                </select>
                <div class="label">
                  <span class="label-text-alt text-xs opacity-60">
                    Choose the source and purpose of this task
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Settings -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body p-8">
            <h2 class="text-xl font-semibold mb-6">Task Settings</h2>
            
            <div class="grid gap-6 md:grid-cols-2">
              <!-- Priority -->
              <div class="form-control">
                <label class="label" for="priority">
                  <span class="label-text font-medium">Priority</span>
                </label>
                <input
                  id="priority"
                  type="range"
                  bind:value={formData.priority}
                  min="1"
                  max="10"
                  class="range range-primary"
                />
                <div class="flex justify-between text-xs px-2">
                  <span>1 (Low)</span>
                  <span class="font-medium">{formData.priority}</span>
                  <span>10 (High)</span>
                </div>
              </div>

              <!-- Due Date -->
              <div class="form-control">
                <label class="label" for="dueDate">
                  <span class="label-text font-medium flex items-center gap-2">
                    <Calendar size={16} />
                    Due Date
                  </span>
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onchange={handleDueDateChange}
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                />
              </div>

              <!-- XP Reward -->
              {#if formData.sourceType === 'manual'}
                <div class="form-control">
                  <label class="label" for="xpReward">
                    <span class="label-text font-medium flex items-center gap-2">
                      <Zap size={16} />
                      XP Reward
                    </span>
                  </label>
                  <input
                    id="xpReward"
                    type="number"
                    bind:value={formData.xpReward}
                    min="0"
                    max="1000"
                    placeholder="0"
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Family & Recurrence -->
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body p-8">
            <h2 class="text-xl font-semibold mb-6">Additional Options</h2>
            
            <div class="space-y-6">
              <!-- Family Member -->
              {#if familyMembers.length > 0}
                <div class="form-control">
                  <label class="label" for="familyMemberId">
                    <span class="label-text font-medium flex items-center gap-2">
                      <User size={16} />
                      Family Member
                    </span>
                  </label>
                  <select
                    id="familyMemberId"
                    bind:value={formData.familyMemberId}
                    class="select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  >
                    <option value="">Not family-specific</option>
                    {#each familyMembers as member}
                      <option value={member.id}>{member.name}</option>
                    {/each}
                  </select>
                  <div class="label">
                    <span class="label-text-alt text-xs opacity-60">
                      Associate this task with a family member
                    </span>
                  </div>
                </div>
              {/if}

              <!-- Recurring Task -->
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-medium flex items-center gap-2">
                    <Repeat size={16} />
                    Recurring Task
                  </span>
                  <input
                    type="checkbox"
                    bind:checked={formData.isRecurring}
                    class="checkbox checkbox-primary"
                  />
                </label>
              </div>

              {#if formData.isRecurring}
                <!-- Recurring Type -->
                <div class="form-control">
                  <label class="label" for="recurringType">
                    <span class="label-text font-medium">Recurrence Pattern</span>
                  </label>
                  <select
                    id="recurringType"
                    bind:value={formData.recurringType}
                    class="select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <!-- Weekly Days Selection -->
                {#if formData.recurringType === 'weekly'}
                  <div class="form-control">
                    <fieldset>
                      <legend class="label">
                        <span class="label-text font-medium">Days of Week</span>
                      </legend>
                      <div class="flex gap-2">
                      {#each dayNames as dayName, index}
                        <button
                          type="button"
                          onclick={() => toggleDay(index)}
                          class="btn btn-sm {selectedDays.includes(index) ? 'btn-primary' : 'btn-outline'}"
                        >
                          {dayName}
                        </button>
                      {/each}
                      </div>
                    </fieldset>
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        </div>

        <!-- Error Display -->
        {#if error}
          <div class="alert alert-error">
            <div class="flex items-center gap-3">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            type="button"
            onclick={() => goto('/tasks')}
            class="btn btn-outline btn-lg flex-1 md:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            class="btn btn-primary btn-lg flex-1 gap-2"
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
              Creating...
            {:else}
              <Save size={20} />
              Create Task
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>
