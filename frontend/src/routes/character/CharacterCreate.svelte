<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { characterApi } from '../../lib/api/characters';
  import type { Character } from '../../lib/types/characters';
  import type { CreateCharacterForm as CreateCharacterData } from '../../lib/types/character-form';

  const dispatch = createEventDispatcher<{
    characterCreated: Character;
  }>();

  // Form state
  let formData: CreateCharacterData = {
    name: '',
    backstory: '',
    goals: '',
    motto: '',
  };

  let loading = false;
  let error: string | null = null;

  // Predefined character classes for easier selection
  const predefinedClasses = [
    // RPG-inspired
    'Warrior',
    'Mage',
    'Rogue',
    'Cleric',
    'Paladin',
    'Ranger',
    'Bard',
    'Druid',
    'Monk',
    'Barbarian',
    // Life-inspired
    'Adventurer',
    'Explorer',
    'Family Person',
    'Outdoor Enthusiast',
    'Fitness Enthusiast',
    'Artist',
    'Scholar',
    'Entrepreneur',
    'Community Builder',
    'Custom', // Special option to enable custom input
  ];

  let selectedClass = '';
  let customClass = '';
  let showCustomClass = false;

  // Handle class selection
  function handleClassSelection() {
    if (selectedClass === 'Custom') {
      showCustomClass = true;
      formData = { ...formData, characterClass: customClass };
    } else {
      showCustomClass = false;
      formData = { ...formData, characterClass: selectedClass };
      customClass = '';
    }
  }

  // Handle custom class input
  function handleCustomClassInput() {
    formData = { ...formData, characterClass: customClass };
  }

  // Validate form
  function validateForm(): boolean {
    if (!formData.name.trim()) {
      error = 'Character name is required';
      return false;
    }
    if (formData.name.length > 100) {
      error = 'Character name must be 100 characters or less';
      return false;
    }
    if (formData.characterClass && formData.characterClass.length > 100) {
      error = 'Character class must be 100 characters or less';
      return false;
    }
    if (formData.motto && formData.motto.length > 200) {
      error = 'Motto must be 200 characters or less';
      return false;
    }
    return true;
  }

  // Handle form submission
  async function handleSubmit() {
    error = null;

    if (!validateForm()) {
      return;
    }

    try {
      loading = true;

      // Prepare data - only send non-empty optional fields
      const submitData: CreateCharacterData = {
        name: formData.name.trim(),
      };

      if (formData.characterClass?.trim()) {
        submitData.characterClass = formData.characterClass.trim();
      }

      if (formData.backstory?.trim()) {
        submitData.backstory = formData.backstory.trim();
      }

      if (formData.goals?.trim()) {
        submitData.goals = formData.goals.trim();
      }

      if (formData.motto?.trim()) {
        submitData.motto = formData.motto.trim();
      }

      const character = await characterApi.createCharacter(submitData);
      dispatch('characterCreated', character);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to create character';
      console.error('Error creating character:', e);
    } finally {
      loading = false;
    }
  }
</script>

<!-- Character Creation Form with Material Design -->
<div class="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3 lg:gap-8">
  <!-- Left Column: Form -->
  <div class="lg:col-span-2">
    <div class="card bg-base-100 border-base-300 border shadow-2xl">
      <div class="card-body p-4 sm:p-6 lg:p-8">
        <div class="mb-8 text-center">
          <div class="avatar placeholder mb-4">
            <div class="bg-primary text-primary-content w-16 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="m19 8 2 2-2 2" />
                <path d="m17 10 2 2-2 2" />
              </svg>
            </div>
          </div>
          <h2 class="text-primary mb-2 text-3xl font-bold">Create Your Character</h2>
          <p class="text-base-content/60">Build your alter ego for this gamified journey</p>
        </div>

        {#if error}
          <div class="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-8">
          <!-- Basic Info Section -->
          <div class="space-y-6">
            <h3 class="text-primary border-primary/20 border-b pb-2 text-xl font-semibold">Basic Information</h3>

            <!-- Character Name -->
            <div class="form-control">
              <label class="label" for="name">
                <span class="label-text font-medium">Character Name *</span>
                <span class="label-text-alt text-xs opacity-60">{formData.name.length}/100</span>
              </label>
              <div class="relative">
                <input
                  id="name"
                  type="text"
                  placeholder="What should we call your character?"
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  bind:value={formData.name}
                  maxlength="100"
                  required
                />
                <div class="absolute inset-y-0 right-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-base-content/40"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Character Class -->
            <div class="form-control">
              <label class="label" for="class">
                <span class="label-text font-medium">Character Class</span>
              </label>
              <div class="relative">
                <select
                  id="class"
                  class="select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  bind:value={selectedClass}
                  on:change={handleClassSelection}
                >
                  <option value="">Choose your character archetype</option>
                  {#each predefinedClasses as classOption (classOption)}
                    <option value={classOption}>{classOption}</option>
                  {/each}
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-10 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-base-content/40"
                  >
                    <path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
              </div>
              {#if showCustomClass}
                <div class="mt-3">
                  <input
                    type="text"
                    placeholder="Enter your custom class"
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                    bind:value={customClass}
                    on:input={handleCustomClassInput}
                    maxlength="100"
                    required
                  />
                </div>
              {/if}
            </div>

            <!-- Character Motto -->
            <div class="form-control">
              <label class="label" for="motto">
                <span class="label-text font-medium">Character Motto</span>
                <span class="label-text-alt text-xs opacity-60">{(formData.motto || '').length}/200</span>
              </label>
              <div class="relative">
                <input
                  id="motto"
                  type="text"
                  placeholder="A guiding principle or personal mantra"
                  class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                  bind:value={formData.motto}
                  maxlength="200"
                />
                <div class="absolute inset-y-0 right-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-base-content/40"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Character Story Section -->
          <div class="space-y-6">
            <h3 class="text-primary border-primary/20 border-b pb-2 text-xl font-semibold">Character Story</h3>

            <!-- Backstory -->
            <div class="form-control">
              <label class="label" for="backstory">
                <span class="label-text font-medium">Backstory</span>
              </label>
              <div class="relative">
                <textarea
                  id="backstory"
                  class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                  placeholder="Tell us about your character's background and current situation. What experiences have shaped them? Where are they starting from?"
                  bind:value={formData.backstory}
                ></textarea>
              </div>
            </div>

            <!-- Goals -->
            <div class="form-control">
              <label class="label" for="goals">
                <span class="label-text font-medium">Goals & Aspirations</span>
              </label>
              <div class="relative">
                <textarea
                  id="goals"
                  class="textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                  placeholder="What does your character want to achieve? What are their dreams and aspirations? What would success look like?"
                  bind:value={formData.goals}
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-6">
            <button
              type="submit"
              class="btn btn-primary btn-lg h-16 w-full text-lg shadow-lg transition-all duration-200 hover:scale-[1.02]"
              disabled={loading}
            >
              {#if loading}
                <span class="loading loading-spinner loading-md"></span>
                Creating your character...
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="mr-3"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="m19 8 2 2-2 2" />
                  <path d="m17 10 2 2-2 2" />
                </svg>
                Create My Character
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Right Column: Information Panel -->
  <div class="lg:col-span-1">
    <div class="sticky top-8 space-y-6">
      <!-- Tips Card -->
      <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
        <div class="card-body p-6">
          <h3 class="card-title text-primary flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            Character Creation Tips
          </h3>
          <div class="space-y-4 text-sm">
            <div class="flex gap-3">
              <div class="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
              <p>
                <strong>Name:</strong> Choose something that inspires you or represents your ideal self
              </p>
            </div>
            <div class="flex gap-3">
              <div class="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
              <p><strong>Class:</strong> Pick an archetype that resonates with your life goals</p>
            </div>
            <div class="flex gap-3">
              <div class="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
              <p><strong>Motto:</strong> A short phrase that motivates and guides your character</p>
            </div>
            <div class="flex gap-3">
              <div class="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></div>
              <p><strong>Story:</strong> Background and goals help create a compelling narrative</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Character Classes Info -->
      <div class="card bg-base-100 border-base-300 border">
        <div class="card-body p-6">
          <h3 class="card-title text-secondary flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            Popular Classes
          </h3>
          <div class="space-y-3 text-sm">
            <div>
              <span class="text-primary font-medium">Adventurer:</span>
              <span class="text-base-content/70"> For those who love new experiences</span>
            </div>
            <div>
              <span class="text-primary font-medium">Fitness Enthusiast:</span>
              <span class="text-base-content/70"> Focus on health and physical goals</span>
            </div>
            <div>
              <span class="text-primary font-medium">Scholar:</span>
              <span class="text-base-content/70"> Dedicated to learning and knowledge</span>
            </div>
            <div>
              <span class="text-primary font-medium">Entrepreneur:</span>
              <span class="text-base-content/70"> Building businesses and innovation</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="card bg-accent/10 border-accent/20 border">
        <div class="card-body p-6">
          <h3 class="card-title text-accent flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
            What's Next?
          </h3>
          <div class="space-y-2 text-sm">
            <p class="text-base-content/70">After creating your character, you'll be able to:</p>
            <ul class="text-base-content/60 space-y-1 text-xs">
              <li>• Track your daily progress</li>
              <li>• Set and complete quests</li>
              <li>• Level up your character</li>
              <li>• Unlock achievements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
