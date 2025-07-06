<script lang="ts">
  import type { ActionData } from './$types.js';
  import { enhance } from '$app/forms';
  import { ArrowLeft, UserPlus } from 'lucide-svelte';

  let { form }: { form: ActionData } = $props();

  const energyLevelOptions = [
    { value: 'active', label: 'Active - High energy, loves physical activities' },
    { value: 'creative', label: 'Creative - Enjoys arts, crafts, building' },
    { value: 'low-key', label: 'Low-key - Prefers quiet, calm activities' },
    { value: 'social', label: 'Social - Thrives with group activities' },
    { value: 'independent', label: 'Independent - Prefers solo activities' },
  ];

  // Form state for preserving values on error
  let formValues = $state({
    name: form?.values?.name || '',
    relationship: form?.values?.relationship || '',
    birthday: form?.values?.birthday || '',
    energyLevel: form?.values?.energyLevel || '',
    likes: form?.values?.likes || '',
    dislikes: form?.values?.dislikes || '',
  });
</script>

<svelte:head>
  <title>Add Family Member - Journal App</title>
</svelte:head>

<div class="container mx-auto max-w-4xl p-6">
  <!-- Header -->
  <div class="mb-8 flex items-center gap-4">
    <a href="/family" class="btn btn-ghost btn-sm">
      <ArrowLeft class="h-4 w-4" />
      Back to Family
    </a>
    <div>
      <h1 class="text-primary text-3xl font-bold">Add Family Member</h1>
      <p class="text-base-content/70">Create a new family member profile</p>
    </div>
  </div>

  <!-- Error Message -->
  {#if form?.error}
    <div class="alert alert-error mb-6">
      <span>{form.error}</span>
    </div>
  {/if}

  <!-- Main Form -->
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
    <!-- Form Column -->
    <div class="lg:col-span-2">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-center gap-2">
            <UserPlus class="text-primary h-5 w-5" />
            <h2 class="card-title">Family Member Details</h2>
          </div>

          <form method="POST" use:enhance>
            <!-- Basic Information -->
            <div class="mb-6">
              <h3 class="mb-4 text-lg font-semibold">Basic Information</h3>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="form-control">
                  <label class="label" for="name">
                    <span class="label-text font-medium">Name *</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    class="input input-bordered"
                    placeholder="Enter family member's name"
                    bind:value={formValues.name}
                    required
                  />
                  <div class="text-base-content/60 mt-1 text-xs">The name you'll use to identify this family member</div>
                </div>

                <div class="form-control">
                  <label class="label" for="relationship">
                    <span class="label-text font-medium">Relationship *</span>
                  </label>
                  <input
                    id="relationship"
                    name="relationship"
                    type="text"
                    class="input input-bordered"
                    placeholder="e.g., eldest son, wife, daughter"
                    bind:value={formValues.relationship}
                    required
                  />
                  <div class="text-base-content/60 mt-1 text-xs">How this person relates to you</div>
                </div>

                <div class="form-control">
                  <label class="label" for="birthday">
                    <span class="label-text font-medium">Birthday</span>
                  </label>
                  <input id="birthday" name="birthday" type="date" class="input input-bordered" bind:value={formValues.birthday} />
                  <div class="text-base-content/60 mt-1 text-xs">Optional: Used for birthday reminders</div>
                </div>

                <div class="form-control">
                  <label class="label" for="energyLevel">
                    <span class="label-text font-medium">Energy Level</span>
                  </label>
                  <select id="energyLevel" name="energyLevel" class="select select-bordered" bind:value={formValues.energyLevel}>
                    <option value="">Select energy level</option>
                    {#each energyLevelOptions as option (option.value)}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                  <div class="text-base-content/60 mt-1 text-xs">Helps plan appropriate activities</div>
                </div>
              </div>
            </div>

            <!-- Preferences -->
            <div class="mb-6">
              <h3 class="mb-4 text-lg font-semibold">Preferences</h3>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="form-control">
                  <label class="label" for="likes">
                    <span class="label-text font-medium">Likes</span>
                  </label>
                  <textarea
                    id="likes"
                    name="likes"
                    class="textarea textarea-bordered"
                    placeholder="e.g., reading, soccer, ice cream"
                    bind:value={formValues.likes}
                    rows="3"
                  ></textarea>
                  <div class="text-base-content/60 mt-1 text-xs">Separate multiple items with commas</div>
                </div>

                <div class="form-control">
                  <label class="label" for="dislikes">
                    <span class="label-text font-medium">Dislikes</span>
                  </label>
                  <textarea
                    id="dislikes"
                    name="dislikes"
                    class="textarea textarea-bordered"
                    placeholder="e.g., loud noises, vegetables, homework"
                    bind:value={formValues.dislikes}
                    rows="3"
                  ></textarea>
                  <div class="text-base-content/60 mt-1 text-xs">Separate multiple items with commas</div>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end gap-4">
              <a href="/family" class="btn btn-ghost">Cancel</a>
              <button type="submit" class="btn btn-primary">
                <UserPlus class="h-4 w-4" />
                Add Family Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="lg:col-span-1">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg">Tips</h3>
          <div class="space-y-4 text-sm">
            <div>
              <h4 class="text-primary font-semibold">Relationship Examples</h4>
              <p class="text-base-content/70">Be specific: "eldest son", "youngest daughter", "wife", "mother-in-law"</p>
            </div>

            <div>
              <h4 class="text-primary font-semibold">Energy Levels</h4>
              <p class="text-base-content/70">This helps plan activities that match their personality and preferences</p>
            </div>

            <div>
              <h4 class="text-primary font-semibold">Preferences</h4>
              <p class="text-base-content/70">Track what they enjoy and avoid to plan better interactions and activities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
