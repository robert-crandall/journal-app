<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { usersApi } from '$lib/api/users';
  import AvatarUpload from '$lib/components/AvatarUpload.svelte';
  
  let profileData = {
    name: '',
    email: '',
    avatar: null as string | null
  };
  
  let loading = false;
  let saving = false;
  let message = '';
  let isError = false;

  // Load current user data
  onMount(async () => {
    const user = $authStore.user;
    if (user) {
      profileData = {
        name: user.name,
        email: user.email,
        avatar: user.avatar
      };
    }
  });

  async function handleSubmit() {
    if (saving) return;
    
    saving = true;
    message = '';
    isError = false;

    try {
      const updatedUser = await usersApi.updateProfile({
        name: profileData.name,
        email: profileData.email,
        avatar: profileData.avatar || undefined
      });

      // Update the auth store with new user data
      authStore.updateUser(updatedUser);
      
      message = 'Profile updated successfully!';
      isError = false;
    } catch (error) {
      console.error('Failed to update profile:', error);
      message = error instanceof Error ? error.message : 'Failed to update profile';
      isError = true;
    } finally {
      saving = false;
    }
  }

  async function handleAvatarUpload(event: CustomEvent<string>) {
    if (saving) return;
    
    profileData.avatar = event.detail;
    
    // Automatically save avatar update
    saving = true;
    message = '';
    isError = false;

    try {
      const updatedUser = await usersApi.updateAvatar(event.detail);
      authStore.updateUser(updatedUser);
      profileData.avatar = updatedUser.avatar;
      
      message = 'Avatar updated successfully!';
      isError = false;
    } catch (error) {
      console.error('Failed to update avatar:', error);
      message = error instanceof Error ? error.message : 'Failed to update avatar';
      isError = true;
      
      // Revert avatar change on error
      const user = $authStore.user;
      if (user) {
        profileData.avatar = user.avatar;
      }
    } finally {
      saving = false;
    }
  }

  async function handleAvatarRemove() {
    if (saving) return;
    
    saving = true;
    message = '';
    isError = false;

    try {
      const updatedUser = await usersApi.updateAvatar(null);
      authStore.updateUser(updatedUser);
      profileData.avatar = null;
      
      message = 'Avatar removed successfully!';
      isError = false;
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      message = error instanceof Error ? error.message : 'Failed to remove avatar';
      isError = true;
    } finally {
      saving = false;
    }
  }

  // Check if profile data has changed
  $: hasChanges = $authStore.user && (
    profileData.name !== $authStore.user.name ||
    profileData.email !== $authStore.user.email
  );
</script>

<svelte:head>
  <title>Profile - Journal App</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-8">
  <div class="card bg-base-100 border-base-300 border shadow-xl">
    <div class="card-body p-8">
      <h1 class="card-title text-3xl font-bold mb-6 text-center">
        <span class="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Profile Settings
        </span>
      </h1>

      <!-- Avatar Section -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold mb-4">Profile Picture</h2>
        <div class="flex justify-center">
          <AvatarUpload
            currentAvatar={profileData.avatar}
            userName={profileData.name}
            size="large"
            loading={saving}
            on:upload={handleAvatarUpload}
            on:remove={handleAvatarRemove}
          />
        </div>
      </div>

      <!-- Profile Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <!-- Name Field -->
        <div class="form-control">
          <label class="label" for="name">
            <span class="label-text font-medium">Name</span>
          </label>
          <input
            id="name"
            type="text"
            bind:value={profileData.name}
            class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
            placeholder="Your full name"
            required
            disabled={saving}
          />
        </div>

        <!-- Email Field -->
        <div class="form-control">
          <label class="label" for="email">
            <span class="label-text font-medium">Email</span>
          </label>
          <input
            id="email"
            type="email"
            bind:value={profileData.email}
            class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
            placeholder="your.email@example.com"
            required
            disabled={saving}
          />
        </div>

        <!-- Submit Button -->
        <div class="form-control">
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full gap-2 transition-all duration-200 hover:scale-105"
            disabled={saving || !hasChanges}
          >
            {#if saving}
              <span class="loading loading-spinner loading-sm"></span>
              Saving...
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Update Profile
            {/if}
          </button>
        </div>
      </form>

      <!-- Status Message -->
      {#if message}
        <div class="alert {isError ? 'alert-error' : 'alert-success'} mt-6">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if isError}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            {/if}
          </svg>
          {message}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .text-gradient {
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
</style>
