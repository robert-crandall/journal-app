<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { journalApi, userContextSchema, type UserContextInput } from '$lib/api/client';
  import { User, Briefcase, Heart, Target, Clock, Save } from 'lucide-svelte';

  let age = $state<number | undefined>(undefined);
  let occupation = $state('');
  let interests = $state<string[]>([]);
  let goals = $state<string[]>([]);
  let timezone = $state('');
  let isLoading = $state(false);
  let errors = $state<Record<string, string>>({});

  // Interest and goal input states
  let interestInput = $state('');
  let goalInput = $state('');

  // Detect user's timezone
  if (typeof window !== 'undefined') {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function addInterest() {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      interests = [...interests, interestInput.trim()];
      interestInput = '';
    }
  }

  function removeInterest(interest: string) {
    interests = interests.filter(i => i !== interest);
  }

  function addGoal() {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      goals = [...goals, goalInput.trim()];
      goalInput = '';
    }
  }

  function removeGoal(goal: string) {
    goals = goals.filter(g => g !== goal);
  }

  async function handleSubmit() {
    if (isLoading) return;
    
    isLoading = true;
    errors = {};

    try {
      const contexts: UserContextInput[] = [];
      
      if (age) contexts.push({ key: 'age', values: [age.toString()] });
      if (occupation) contexts.push({ key: 'occupation', values: [occupation] });
      if (interests.length > 0) contexts.push({ key: 'interests', values: interests });
      if (goals.length > 0) contexts.push({ key: 'goals', values: goals });
      if (timezone) contexts.push({ key: 'timezone', values: [timezone] });

      // Update user context
      const response = await journalApi.updateContext(contexts);
      
      if (response.success) {
        // Redirect to home or preferences
        goto('/');
      } else {
        errors.general = response.error || 'Failed to save context';
      }
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        error.issues.forEach((issue: any) => {
          errors[issue.path[0]] = issue.message;
        });
      } else {
        errors.general = error.message || 'An unexpected error occurred';
      }
    } finally {
      isLoading = false;
    }
  }

  function handleSkip() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Set Up Your Context - Journal App</title>
</svelte:head>

<div class="min-h-[70vh] flex items-center justify-center">
  <div class="card w-full max-w-2xl bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold">Tell Us About Yourself</h1>
        <p class="text-base-content/70 mt-2">
          Help your AI coach provide personalized guidance by sharing some context about yourself.
          This information helps create more meaningful conversations.
        </p>
      </div>

      <form onsubmit={handleSubmit}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Age -->
          <div class="form-control">
            <label class="label" for="age">
              <span class="label-text flex items-center gap-2">
                <User size={16} />
                Age
              </span>
            </label>
            <input
              id="age"
              type="number"
              min="13"
              max="120"
              placeholder="Your age"
              class="input input-bordered"
              class:input-error={errors.age}
              bind:value={age}
            />
            {#if errors.age}
              <div class="label">
                <span class="label-text-alt text-error">{errors.age}</span>
              </div>
            {/if}
          </div>

          <!-- Occupation -->
          <div class="form-control">
            <label class="label" for="occupation">
              <span class="label-text flex items-center gap-2">
                <Briefcase size={16} />
                Occupation
              </span>
            </label>
            <input
              id="occupation"
              type="text"
              placeholder="What do you do for work?"
              class="input input-bordered"
              class:input-error={errors.occupation}
              bind:value={occupation}
            />
            {#if errors.occupation}
              <div class="label">
                <span class="label-text-alt text-error">{errors.occupation}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Interests -->
        <div class="form-control mt-6">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Heart size={16} />
              Interests & Hobbies
            </span>
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Add an interest..."
              class="input input-bordered flex-1"
              bind:value={interestInput}
              onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            />
            <button
              type="button"
              class="btn btn-outline"
              onclick={addInterest}
              disabled={!interestInput.trim()}
            >
              Add
            </button>
          </div>
          
          {#if interests.length > 0}
            <div class="flex flex-wrap gap-2 mt-3">
              {#each interests as interest}
                <div class="badge badge-primary gap-2">
                  {interest}
                  <button
                    type="button"
                    class="btn btn-xs btn-circle btn-ghost"
                    onclick={() => removeInterest(interest)}
                  >
                    ×
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Goals -->
        <div class="form-control mt-6">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Target size={16} />
              Goals & Aspirations
            </span>
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Add a goal..."
              class="input input-bordered flex-1"
              bind:value={goalInput}
              onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
            />
            <button
              type="button"
              class="btn btn-outline"
              onclick={addGoal}
              disabled={!goalInput.trim()}
            >
              Add
            </button>
          </div>
          
          {#if goals.length > 0}
            <div class="flex flex-wrap gap-2 mt-3">
              {#each goals as goal}
                <div class="badge badge-secondary gap-2">
                  {goal}
                  <button
                    type="button"
                    class="btn btn-xs btn-circle btn-ghost"
                    onclick={() => removeGoal(goal)}
                  >
                    ×
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Timezone -->
        <div class="form-control mt-6">
          <label class="label" for="timezone">
            <span class="label-text flex items-center gap-2">
              <Clock size={16} />
              Timezone
            </span>
          </label>
          <input
            id="timezone"
            type="text"
            class="input input-bordered"
            class:input-error={errors.timezone}
            bind:value={timezone}
            readonly
          />
          <div class="label">
            <span class="label-text-alt">Automatically detected from your browser</span>
          </div>
        </div>

        <!-- General error -->
        {#if errors.general}
          <div class="alert alert-error mt-6">
            <span>{errors.general}</span>
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            type="button"
            class="btn btn-ghost flex-1"
            onclick={handleSkip}
          >
            Skip for Now
          </button>
          
          <button
            type="submit"
            class="btn btn-primary flex-1"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-sm"></span>
              Saving...
            {:else}
              <Save size={20} />
              Save Context
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
