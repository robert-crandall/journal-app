<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, Save, Calendar, Target, Users, Lightbulb, Zap, BookOpen } from 'lucide-svelte';
  import { questsApi } from '$lib/api/quests';
  import { familyApi } from '$lib/api/family';
  import type { CreateQuestRequest, FamilyMember } from '../../../backend/src/types';
  import { onMount } from 'svelte';

  // Form state
  let formData: CreateQuestRequest = {
    title: '',
    description: '',
    type: 'quest',
    startDate: new Date().toISOString().split('T')[0],
    expectedDuration: 7,
    targetMetric: '',
    targetValue: null,
    difficultyLevel: 3,
    familyMemberId: null,
    tags: [],
    expectedXpReward: 50
  };

  // Form validation
  let titleError = '';
  let targetMetricError = '';
  let targetValueError = '';

  // UI state
  let loading = false;
  let error: string | null = null;
  let familyMembers: FamilyMember[] = [];
  let customTag = '';

  // Common quest types for quick selection
  const questTypes = [
    { value: 'quest', label: 'Quest', icon: Target, description: 'A specific challenge or goal to achieve' },
    { value: 'experiment', label: 'Experiment', icon: Lightbulb, description: 'Try something new or test a hypothesis' }
  ];

  // Difficulty levels with descriptions
  const difficultyLevels = [
    { value: 1, label: 'Very Easy', description: 'Minimal effort required', xp: 10 },
    { value: 2, label: 'Easy', description: 'Light challenge', xp: 25 },
    { value: 3, label: 'Medium', description: 'Moderate effort required', xp: 50 },
    { value: 4, label: 'Hard', description: 'Significant challenge', xp: 100 },
    { value: 5, label: 'Very Hard', description: 'Major undertaking', xp: 200 }
  ];

  // Common quest ideas for inspiration
  const questIdeas = [
    { title: 'Read 3 Books This Month', type: 'quest', metric: 'books_read', value: 3, duration: 30 },
    { title: 'Exercise Daily for 2 Weeks', type: 'quest', metric: 'workout_days', value: 14, duration: 14 },
    { title: 'Try Meditation for 7 Days', type: 'experiment', metric: 'meditation_sessions', value: 7, duration: 7 },
    { title: 'Learn 50 New Words', type: 'quest', metric: 'words_learned', value: 50, duration: 21 },
    { title: 'Cook 5 New Recipes', type: 'experiment', metric: 'recipes_tried', value: 5, duration: 14 }
  ];

  onMount(async () => {
    try {
      familyMembers = await familyApi.getFamilyMembers();
    } catch (e) {
      console.error('Failed to load family members:', e);
    }
  });

  // Form validation
  function validateForm(): boolean {
    titleError = '';
    targetMetricError = '';
    targetValueError = '';

    if (!formData.title.trim()) {
      titleError = 'Quest title is required';
      return false;
    }

    if (!formData.targetMetric.trim()) {
      targetMetricError = 'Target metric is required';
      return false;
    }

    if (!formData.targetValue || formData.targetValue <= 0) {
      targetValueError = 'Target value must be greater than 0';
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
      const questData: CreateQuestRequest = {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        familyMemberId: formData.familyMemberId || null
      };

      const quest = await questsApi.createQuest(questData);
      
      // Redirect to quests page
      goto('/quests');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create quest';
    } finally {
      loading = false;
    }
  }

  // Add custom tag
  function addTag() {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      formData.tags = [...formData.tags, customTag.trim()];
      customTag = '';
    }
  }

  // Remove tag
  function removeTag(index: number) {
    formData.tags = formData.tags.filter((_, i) => i !== index);
  }

  // Use quest idea
  function useQuestIdea(idea: typeof questIdeas[0]) {
    formData.title = idea.title;
    formData.type = idea.type as 'quest' | 'experiment';
    formData.targetMetric = idea.metric;
    formData.targetValue = idea.value;
    formData.expectedDuration = idea.duration;
    formData.expectedXpReward = difficultyLevels.find(d => d.value === formData.difficultyLevel)?.xp || 50;
  }

  // Update XP reward based on difficulty
  function updateXpReward() {
    const difficulty = difficultyLevels.find(d => d.value === formData.difficultyLevel);
    if (difficulty) {
      formData.expectedXpReward = difficulty.xp;
    }
  }

  // Handle key press for tag input
  function handleTagKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }
</script>

<svelte:head>
  <title>Create Quest - Journal App</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <div class="mb-8">
    <div class="flex items-center gap-4 mb-4">
      <button onclick={() => goto('/quests')} class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-4 h-4" />
        Back to Quests
      </button>
    </div>
    
    <div class="text-center">
      <h1 class="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
        Create New Quest
      </h1>
      <p class="text-lg opacity-70 max-w-2xl mx-auto">
        Set yourself a challenge or experiment to embark on a new adventure and earn XP along the way!
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Main Form -->
    <div class="lg:col-span-2">
      <form onsubmit={handleSubmit} class="space-y-8">
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-6">
              <Target class="w-6 h-6" />
              Quest Details
            </h2>

            <div class="space-y-6">
              <!-- Quest Type -->
              <div class="form-control">
                <label class="label" for="quest-type">
                  <span class="label-text font-medium">Quest Type</span>
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each questTypes as questType}
                    <label class="cursor-pointer">
                      <input
                        type="radio"
                        name="questType"
                        value={questType.value}
                        bind:group={formData.type}
                        class="sr-only"
                      />
                      <div class="card border-2 transition-all duration-200 {formData.type === questType.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}">
                        <div class="card-body p-4">
                          <div class="flex items-center gap-3">
                            <svelte:component this={questType.icon} class="w-5 h-5 text-primary" />
                            <div>
                              <div class="font-medium">{questType.label}</div>
                              <div class="text-sm opacity-70">{questType.description}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>

              <!-- Title -->
              <div class="form-control">
                <label class="label" for="quest-title">
                  <span class="label-text font-medium">Quest Title</span>
                </label>
                <input
                  id="quest-title"
                  type="text"
                  placeholder="What challenge will you take on?"
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  bind:value={formData.title}
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
                <label class="label" for="quest-description">
                  <span class="label-text font-medium">Description</span>
                </label>
                <textarea
                  id="quest-description"
                  placeholder="Describe your quest in detail..."
                  class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                  bind:value={formData.description}
                  maxlength="500"
                ></textarea>
              </div>

              <!-- Target Metric and Value -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="target-metric">
                    <span class="label-text font-medium">What Will You Track?</span>
                  </label>
                  <input
                    id="target-metric"
                    type="text"
                    placeholder="e.g., books_read, workouts, meditation_minutes"
                    class="input input-bordered focus:input-primary w-full"
                    bind:value={formData.targetMetric}
                    required
                  />
                  {#if targetMetricError}
                    <div class="label">
                      <span class="label-text-alt text-error">{targetMetricError}</span>
                    </div>
                  {/if}
                </div>

                <div class="form-control">
                  <label class="label" for="target-value">
                    <span class="label-text font-medium">Target Value</span>
                  </label>
                  <input
                    id="target-value"
                    type="number"
                    placeholder="How much?"
                    class="input input-bordered focus:input-primary w-full"
                    bind:value={formData.targetValue}
                    min="1"
                    required
                  />
                  {#if targetValueError}
                    <div class="label">
                      <span class="label-text-alt text-error">{targetValueError}</span>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Duration and Difficulty -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="expected-duration">
                    <span class="label-text font-medium">Expected Duration (days)</span>
                  </label>
                  <input
                    id="expected-duration"
                    type="number"
                    class="input input-bordered focus:input-primary w-full"
                    bind:value={formData.expectedDuration}
                    min="1"
                    max="365"
                    required
                  />
                </div>

                <div class="form-control">
                  <label class="label" for="difficulty-level">
                    <span class="label-text font-medium">Difficulty Level</span>
                  </label>
                  <select
                    id="difficulty-level"
                    class="select select-bordered focus:select-primary w-full"
                    bind:value={formData.difficultyLevel}
                    onchange={updateXpReward}
                  >
                    {#each difficultyLevels as level}
                      <option value={level.value}>{level.label} - {level.xp} XP</option>
                    {/each}
                  </select>
                </div>
              </div>

              <!-- Start Date and XP Reward -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label" for="start-date">
                    <span class="label-text font-medium">Start Date</span>
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    class="input input-bordered focus:input-primary w-full"
                    bind:value={formData.startDate}
                    required
                  />
                </div>

                <div class="form-control">
                  <label class="label" for="xp-reward">
                    <span class="label-text font-medium">XP Reward</span>
                  </label>
                  <input
                    id="xp-reward"
                    type="number"
                    class="input input-bordered focus:input-primary w-full"
                    bind:value={formData.expectedXpReward}
                    min="1"
                    max="500"
                    required
                  />
                </div>
              </div>

              <!-- Family Member Assignment -->
              {#if familyMembers.length > 0}
                <div class="form-control">
                  <label class="label" for="family-member">
                    <span class="label-text font-medium">Assign to Family Member (Optional)</span>
                  </label>
                  <select
                    id="family-member"
                    class="select select-bordered focus:select-primary w-full"
                    bind:value={formData.familyMemberId}
                  >
                    <option value={null}>Assign to myself</option>
                    {#each familyMembers as member}
                      <option value={member.id}>{member.name}</option>
                    {/each}
                  </select>
                  <div class="label">
                    <span class="label-text-alt text-xs opacity-60">
                      Choose who will take on this quest
                    </span>
                  </div>
                </div>
              {/if}

              <!-- Tags -->
              <div class="form-control">
                <label class="label" for="custom-tag">
                  <span class="label-text font-medium">Tags</span>
                </label>
                <div class="flex gap-2 mb-2">
                  <input
                    id="custom-tag"
                    type="text"
                    placeholder="Add a tag..."
                    class="input input-bordered focus:input-primary flex-1"
                    bind:value={customTag}
                    onkeypress={handleTagKeyPress}
                  />
                  <button
                    type="button"
                    onclick={addTag}
                    class="btn btn-primary"
                    disabled={!customTag.trim()}
                  >
                    Add
                  </button>
                </div>
                {#if formData.tags.length > 0}
                  <div class="flex flex-wrap gap-2">
                    {#each formData.tags as tag, index}
                      <div class="badge badge-primary gap-2">
                        {tag}
                        <button
                          type="button"
                          onclick={() => removeTag(index)}
                          class="btn btn-ghost btn-xs text-primary-content"
                        >
                          ✕
                        </button>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        {#if error}
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4">
          <button
            type="button"
            onclick={() => goto('/quests')}
            class="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary gap-2"
            disabled={loading}
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
              Creating...
            {:else}
              <Save class="w-4 h-4" />
              Create Quest
            {/if}
          </button>
        </div>
      </form>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Quest Ideas -->
      <div class="card bg-base-100 border-base-300 border shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            <Lightbulb class="w-5 h-5" />
            Quest Ideas
          </h3>
          <div class="space-y-3">
            {#each questIdeas as idea}
              <div class="border border-base-300 rounded-lg p-3 hover:bg-base-200 transition-colors">
                <div class="flex justify-between items-start gap-2">
                  <div class="flex-1">
                    <div class="font-medium text-sm">{idea.title}</div>
                    <div class="text-xs opacity-70 mt-1">
                      {idea.type === 'quest' ? '🎯' : '🧪'} {idea.duration} days · {idea.metric}: {idea.value}
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick={() => useQuestIdea(idea)}
                    class="btn btn-ghost btn-xs"
                  >
                    Use
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div class="card bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 border">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            <BookOpen class="w-5 h-5" />
            Quest Tips
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>Make your quest specific and measurable</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>Choose a realistic timeframe</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>Track progress with meaningful metrics</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>Use experiments to try new things</span>
            </div>
            <div class="flex gap-2">
              <span class="text-primary">•</span>
              <span>Add tags to organize your quests</span>
            </div>
          </div>
        </div>
      </div>

      <!-- XP Guide -->
      <div class="card bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 border">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            <Zap class="w-5 h-5" />
            XP Guide
          </h3>
          <div class="space-y-2 text-sm">
            {#each difficultyLevels as level}
              <div class="flex justify-between">
                <span class="opacity-70">{level.label}:</span>
                <span class="font-medium">{level.xp} XP</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom styles for quest creation form */
  .card {
    transition: all 0.2s ease;
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
  }
</style>
