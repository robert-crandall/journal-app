<script lang="ts">
  import { goto } from '$app/navigation';
  import { familyApi, type CreateFamilyMemberRequest } from '$lib/api/family';
  import { User, Heart, Calendar, Zap, Users, ArrowLeft, Save } from 'lucide-svelte';

  // Form state
  let formData: CreateFamilyMemberRequest = $state({
    name: '',
    relationship: '',
    birthday: '',
    likes: '',
    dislikes: '',
    energyLevel: 5,
    notes: ''
  });

  let loading = $state(false);
  let error = $state<string | null>(null);

  // Form validation
  let isValid = $derived(formData.name.trim() !== '' && formData.relationship.trim() !== '');

  // Character counts
  let nameCount = $derived(formData.name.length);
  let relationshipCount = $derived(formData.relationship.length);
  let likesCount = $derived((formData.likes || '').length);
  let dislikesCount = $derived((formData.dislikes || '').length);

  // Common relationship options
  const relationshipOptions = [
    'Wife',
    'Husband',
    'Partner',
    'Son',
    'Daughter',
    'Eldest Son',
    'Youngest Son',
    'Eldest Daughter',
    'Youngest Daughter',
    'Father',
    'Mother',
    'Brother',
    'Sister',
    'Grandfather',
    'Grandmother',
    'Uncle',
    'Aunt',
    'Cousin',
  ];

  // Energy level options
  const energyLevelOptions = [
    { value: 1, label: 'Very Draining' },
    { value: 2, label: 'Draining' },
    { value: 3, label: 'Slightly Draining' },
    { value: 4, label: 'Neutral' },
    { value: 5, label: 'Balanced' },
    { value: 6, label: 'Slightly Energizing' },
    { value: 7, label: 'Energizing' },
    { value: 8, label: 'Very Energizing' },
    { value: 9, label: 'Highly Energizing' },
    { value: 10, label: 'Extremely Energizing' }
  ];

  // Handle form submission
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      loading = true;
      error = null;

      // Clean up form data - remove empty strings
      const submitData: CreateFamilyMemberRequest = {
        name: formData.name.trim(),
        relationship: formData.relationship.trim(),
        birthday: formData.birthday || undefined,
        likes: (formData.likes || '').trim() || undefined,
        dislikes: (formData.dislikes || '').trim() || undefined,
        energyLevel: formData.energyLevel,
        notes: (formData.notes || '').trim() || undefined,
      };

      await familyApi.createFamilyMember(submitData);
      
      // Redirect to family dashboard on success
      goto('/family');
    } catch (err) {
      console.error('Failed to create family member:', err);
      error = err instanceof Error ? err.message : 'Failed to create family member';
    } finally {
      loading = false;
    }
  }

  // Handle cancel
  function handleCancel() {
    goto('/family');
  }

  // Handle relationship selection
  function selectRelationship(relationship: string) {
    formData.relationship = relationship;
  }

  // Handle energy level selection
  function selectEnergyLevel(level: number) {
    formData.energyLevel = level;
  }
</script>

<svelte:head>
  <title>Add Family Member - Gamified Life</title>
  <meta name="description" content="Add a new family member to nurture meaningful connections" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center gap-4">
        <button onclick={handleCancel} class="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Add Family Member</h1>
          <p class="text-base-content/70 text-lg">Create a profile for someone special in your life</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="grid gap-8 lg:grid-cols-3">
      <!-- Main Form: 2/3 width on desktop -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 border-base-300 border shadow-2xl">
          <div class="card-body p-8">
            <form onsubmit={handleSubmit} class="space-y-8">
              <!-- Basic Information Section -->
              <section>
                <h3 class="text-primary border-primary/20 mb-6 border-b pb-2 text-xl font-semibold">Basic Information</h3>
                
                <div class="grid gap-6 md:grid-cols-2">
                  <!-- Name Field -->
                  <div class="form-control">
                    <label class="label" for="name">
                      <span class="label-text font-medium">Name *</span>
                      <span class="label-text-alt text-xs opacity-60">{nameCount}/50</span>
                    </label>
                    <div class="relative">
                      <input
                        id="name"
                        type="text"
                        placeholder="Their name"
                        class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                        bind:value={formData.name}
                        maxlength="50"
                        required
                      />
                      <div class="absolute inset-y-0 right-3 flex items-center">
                        <User class="text-base-content/40" size="20" />
                      </div>
                    </div>
                  </div>

                  <!-- Relationship Field -->
                  <div class="form-control">
                    <label class="label" for="relationship">
                      <span class="label-text font-medium">Relationship *</span>
                      <span class="label-text-alt text-xs opacity-60">{relationshipCount}/50</span>
                    </label>
                    <div class="relative">
                      <input
                        id="relationship"
                        type="text"
                        placeholder="How they're related to you"
                        class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                        bind:value={formData.relationship}
                        maxlength="50"
                        required
                      />
                      <div class="absolute inset-y-0 right-3 flex items-center">
                        <Users class="text-base-content/40" size="20" />
                      </div>
                    </div>
                    
                    <!-- Relationship Quick Select -->
                    <div class="mt-2">
                      <p class="text-xs text-base-content/60 mb-2">Quick select:</p>
                      <div class="flex flex-wrap gap-1">
                        {#each relationshipOptions as option}
                          <button
                            type="button"
                            class="btn btn-xs btn-outline"
                            onclick={() => selectRelationship(option)}
                          >
                            {option}
                          </button>
                        {/each}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Birthday Field -->
                <div class="form-control">
                  <label class="label" for="birthday">
                    <span class="label-text font-medium">Birthday</span>
                    <span class="label-text-alt text-xs opacity-60">Optional</span>
                  </label>
                  <div class="relative">
                    <input
                      id="birthday"
                      type="date"
                      class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                      bind:value={formData.birthday}
                    />
                    <div class="absolute inset-y-0 right-3 flex items-center">
                      <Calendar class="text-base-content/40" size="20" />
                    </div>
                  </div>
                </div>
              </section>

              <!-- Preferences Section -->
              <section>
                <h3 class="text-primary border-primary/20 mb-6 border-b pb-2 text-xl font-semibold">Preferences</h3>
                
                <div class="space-y-6">
                  <!-- Likes Field -->
                  <div class="form-control">
                    <label class="label" for="likes">
                      <span class="label-text font-medium">Things They Like</span>
                      <span class="label-text-alt text-xs opacity-60">{likesCount}/200</span>
                    </label>
                    <div class="relative">
                      <textarea
                        id="likes"
                        class="textarea textarea-bordered textarea-lg focus:textarea-primary h-24 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                        placeholder="Activities, hobbies, foods, or anything they enjoy... (e.g., playing catch, reading books, ice cream)"
                        bind:value={formData.likes}
                        maxlength="200"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Dislikes Field -->
                  <div class="form-control">
                    <label class="label" for="dislikes">
                      <span class="label-text font-medium">Things They Dislike</span>
                      <span class="label-text-alt text-xs opacity-60">{dislikesCount}/200</span>
                    </label>
                    <div class="relative">
                      <textarea
                        id="dislikes"
                        class="textarea textarea-bordered textarea-lg focus:textarea-primary h-24 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                        placeholder="Activities or things they don't enjoy... (e.g., loud noises, spicy food, long car rides)"
                        bind:value={formData.dislikes}
                        maxlength="200"
                      ></textarea>
                    </div>
                  </div>

                  <!-- Energy Level Field -->
                  <div class="form-control">
                    <label class="label" for="energy-level">
                      <span class="label-text font-medium">Energy Level</span>
                      <span class="label-text-alt text-xs opacity-60">Optional</span>
                    </label>
                    <div class="relative">
                      <select
                        id="energy-level"
                        class="select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]"
                        bind:value={formData.energyLevel}
                      >
                        <option value={5}>Choose their typical energy level...</option>
                        {#each energyLevelOptions as option}
                          <option value={option.value}>{option.value}/10 - {option.label}</option>
                        {/each}
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-10 flex items-center">
                        <Zap class="text-base-content/40" size="20" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Error Display -->
              {#if error}
                <div class="alert alert-error">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{error}</span>
                </div>
              {/if}

              <!-- Action Buttons -->
              <div class="flex gap-4">
                <button
                  type="button"
                  onclick={handleCancel}
                  class="btn btn-outline btn-lg flex-1 transition-all duration-200 hover:scale-[1.02]"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary btn-lg h-16 flex-1 text-lg shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  disabled={!isValid || loading}
                >
                  {#if loading}
                    <span class="loading loading-spinner loading-md"></span>
                    Creating...
                  {:else}
                    <Save size={20} />
                    Create Family Member
                  {/if}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Sidebar: 1/3 width on desktop -->
      <div class="lg:col-span-1">
        <div class="sticky top-8 space-y-6">
          <!-- Help Card -->
          <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
            <div class="card-body p-6">
              <h3 class="text-primary mb-4 font-semibold flex items-center gap-2">
                <Heart size={20} />
                Building Connections
              </h3>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/80">
                  Family profiles help GPT understand each person's unique preferences and suggest meaningful activities.
                </p>
                <p class="text-base-content/80">
                  The more details you provide about their likes and dislikes, the better GPT can tailor connection tasks.
                </p>
              </div>
            </div>
          </div>

          <!-- Tips Card -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">💡 Profile Tips</h3>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/70">
                  <strong>Name:</strong> Use the name you typically call them
                </p>
                <p class="text-base-content/70">
                  <strong>Relationship:</strong> Be specific (e.g., "eldest daughter" vs just "daughter")
                </p>
                <p class="text-base-content/70">
                  <strong>Likes:</strong> Include activities, foods, and interests they enjoy
                </p>
                <p class="text-base-content/70">
                  <strong>Energy Level:</strong> Helps suggest appropriate activities
                </p>
              </div>
            </div>
          </div>

          <!-- Connection Level Info -->
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-6">
              <h3 class="mb-4 font-semibold">🎯 Connection System</h3>
              <div class="space-y-3 text-sm">
                <p class="text-base-content/70">
                  New family members start at Connection Level 1 with 0 XP.
                </p>
                <p class="text-base-content/70">
                  Complete activities and provide feedback to earn Connection XP and level up your relationships.
                </p>
                <p class="text-base-content/70">
                  Higher connection levels unlock deeper interaction suggestions from GPT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
