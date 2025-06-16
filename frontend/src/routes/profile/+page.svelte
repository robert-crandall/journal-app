<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { journalApi, updateProfileSchema, type UpdateProfileInput } from '$lib/api/client';
  import { User, Mail, Save } from 'lucide-svelte';

  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let isLoading = $state(false);
  let isSaving = $state(false);
  let errors = $state<Record<string, string>>({});
  let successMessage = $state('');

  let user = $derived($authStore.user);

  onMount(() => {
    if (user) {
      firstName = user.firstName || '';
      lastName = user.lastName || '';
      email = user.email;
    }
  });

  async function handleSubmit() {
    if (isSaving) return;
    
    isSaving = true;
    errors = {};
    successMessage = '';

    try {
      const profileData: UpdateProfileInput = {};
      
      // Only include changed fields
      if (firstName !== user?.firstName) {
        profileData.firstName = firstName;
      }
      if (lastName !== user?.lastName) {
        profileData.lastName = lastName;
      }

      // Skip if no changes
      if (Object.keys(profileData).length === 0) {
        successMessage = 'No changes to save';
        return;
      }

      // Validate form data
      const validatedData = updateProfileSchema.parse(profileData);
      
      // Update profile
      const response = await journalApi.updateProfile(validatedData);
      
      if (response.success && response.data) {
        // Update auth store
        authStore.updateUser(response.data);
        successMessage = 'Profile updated successfully';
      } else {
        errors.general = response.error || 'Failed to update profile';
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
      isSaving = false;
    }
  }

  // Clear messages when user starts typing
  $effect(() => {
    if (firstName || lastName || email) {
      successMessage = '';
      errors.general = '';
    }
  });
</script>

<svelte:head>
  <title>Profile - Journal App</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex items-center gap-4 mb-6">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content rounded-full w-16">
            <span class="text-xl">{user?.firstName?.[0]?.toUpperCase() || user?.lastName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>
          </div>
        </div>
        <div>
          <h1 class="text-2xl font-bold">Profile Settings</h1>
          <p class="text-base-content/70">Manage your account information</p>
        </div>
      </div>

      {#if isLoading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else}
        <form onsubmit={handleSubmit}>
          <!-- First Name -->
          <div class="form-control">
            <label class="label" for="firstName">
              <span class="label-text flex items-center gap-2">
                <User size={16} />
                First Name
              </span>
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              class="input input-bordered"
              class:input-error={errors.firstName}
              bind:value={firstName}
            />
            {#if errors.firstName}
              <div class="label">
                <span class="label-text-alt text-error">{errors.firstName}</span>
              </div>
            {/if}
          </div>

          <!-- Last Name -->
          <div class="form-control">
            <label class="label" for="lastName">
              <span class="label-text flex items-center gap-2">
                <User size={16} />
                Last Name
              </span>
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              class="input input-bordered"
              class:input-error={errors.lastName}
              bind:value={lastName}
            />
            {#if errors.lastName}
              <div class="label">
                <span class="label-text-alt text-error">{errors.lastName}</span>
              </div>
            {/if}
          </div>

          <!-- Email -->
          <div class="form-control mt-4">
            <label class="label" for="email">
              <span class="label-text flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              class="input input-bordered"
              class:input-error={errors.email}
              bind:value={email}
              required
            />
            {#if errors.email}
              <div class="label">
                <span class="label-text-alt text-error">{errors.email}</span>
              </div>
            {/if}
          </div>

          <!-- Success message -->
          {#if successMessage}
            <div class="alert alert-success mt-4">
              <span>{successMessage}</span>
            </div>
          {/if}

          <!-- General error -->
          {#if errors.general}
            <div class="alert alert-error mt-4">
              <span>{errors.general}</span>
            </div>
          {/if}

          <!-- Submit button -->
          <div class="form-control mt-6">
            <button
              type="submit"
              class="btn btn-primary"
              disabled={isSaving}
            >
              {#if isSaving}
                <span class="loading loading-spinner loading-sm"></span>
                Saving...
              {:else}
                <Save size={20} />
                Save Changes
              {/if}
            </button>
          </div>
        </form>

        <!-- Additional Info -->
        <div class="divider mt-8"></div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-base-content/70">Member since</span>
            <span class="text-sm">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm text-base-content/70">Member since</span>
            <span class="text-sm">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
