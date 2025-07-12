<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { familyApi, type FamilyMember, type UpdateFamilyMemberRequest } from '$lib/api/family';
  import AvatarUpload from '$lib/components/AvatarUpload.svelte';
  import { User, Heart, Calendar, Users, ArrowLeft, Save } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';

  // Get the family member ID from the route params
  let memberId: string = $page.params.id;

  // Form state
  let formData: UpdateFamilyMemberRequest = $state({
    name: '',
    relationship: '',
    birthday: '',
    likes: '',
    dislikes: '',
    notes: '',
    avatar: undefined,
  });

  let originalMember: FamilyMember | null = $state(null);
  let loading = $state(false);
  let loadingData = $state(true);
  let avatarUploading = $state(false);
  let error = $state<string | null>(null);

  // Form validation
  let isValid = $derived(formData.name && formData.name.trim() !== '' && formData.relationship && formData.relationship.trim() !== '');

  // Character counts
  let nameCount = $derived((formData.name || '').length);
  let relationshipCount = $derived((formData.relationship || '').length);
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

  // Load existing family member data
  onMount(async () => {
    await loadFamilyMember();
  });

  async function loadFamilyMember() {
    try {
      loadingData = true;
      error = null;

      const member = await familyApi.getFamilyMember(memberId);
      originalMember = member;

      // Populate form with existing data
      formData = {
        name: member.name,
        relationship: member.relationship,
        birthday: member.birthday || '',
        likes: member.likes || '',
        dislikes: member.dislikes || '',
        notes: member.notes || '',
        avatar: member.avatar || undefined,
      };
    } catch (err) {
      console.error('Failed to load family member:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load family member';
    } finally {
      loadingData = false;
    }
  }

  // Handle avatar upload
  async function handleAvatarUpload(event: CustomEvent<string>) {
    try {
      avatarUploading = true;
      const avatar = event.detail;

      // Update avatar immediately via API
      const updatedMember = await familyApi.updateFamilyMemberAvatar(memberId, avatar);

      // Update form data and original member
      formData.avatar = avatar;
      if (originalMember) {
        originalMember.avatar = avatar;
      }
    } catch (err) {
      console.error('Failed to update avatar:', err);
      error = err instanceof Error ? err.message : 'Failed to update avatar';
    } finally {
      avatarUploading = false;
    }
  }

  async function handleAvatarRemove() {
    try {
      avatarUploading = true;

      // Remove avatar via API
      const updatedMember = await familyApi.updateFamilyMemberAvatar(memberId, null);

      // Update form data and original member
      formData.avatar = undefined;
      if (originalMember) {
        originalMember.avatar = null;
      }
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      error = err instanceof Error ? err.message : 'Failed to remove avatar';
    } finally {
      avatarUploading = false;
    }
  }

  // Handle form submission
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!isValid) return;

    try {
      loading = true;
      error = null;

      // Clean up form data - remove empty strings, only send changed fields
      const submitData: UpdateFamilyMemberRequest = {};

      if (formData.name && formData.name.trim() !== originalMember?.name) {
        submitData.name = formData.name.trim();
      }
      if (formData.relationship && formData.relationship.trim() !== originalMember?.relationship) {
        submitData.relationship = formData.relationship.trim();
      }
      if (formData.birthday !== originalMember?.birthday) {
        submitData.birthday = formData.birthday || undefined;
      }
      if ((formData.likes || '') !== (originalMember?.likes || '')) {
        submitData.likes = (formData.likes || '').trim() || undefined;
      }
      if ((formData.dislikes || '') !== (originalMember?.dislikes || '')) {
        submitData.dislikes = (formData.dislikes || '').trim() || undefined;
      }
      // Note: Avatar is handled separately via the avatar upload/remove functions

      await familyApi.updateFamilyMember(memberId, submitData);

      // Redirect to family member detail on success
      goto(`/family/${memberId}`);
    } catch (err) {
      console.error('Failed to update family member:', err);
      error = err instanceof Error ? err.message : 'Failed to update family member';
    } finally {
      loading = false;
    }
  }

  // Handle cancel
  function handleCancel() {
    goto(`/family/${memberId}`);
  }

  // Handle relationship selection
  function selectRelationship(relationship: string) {
    formData.relationship = relationship;
  }
</script>

<svelte:head>
  <title>Edit {originalMember?.name || 'Family Member'} - Gamified Life</title>
  <meta name="description" content="Edit family member profile to maintain meaningful connections" />
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
          <h1 class="text-primary mb-2 text-4xl font-bold">
            Edit {originalMember?.name || 'Family Member'}
          </h1>
          <p class="text-base-content/70 text-lg">Update profile information to nurture better connections</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    {#if loadingData}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading family member...</p>
        </div>
      </div>
    {:else if error && !originalMember}
      <!-- Error State -->
      <div class="alert alert-error mx-auto max-w-md">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      </div>
    {:else}
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Main Form: 2/3 width on desktop -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 border-base-300 border shadow-2xl">
            <div class="card-body p-8">
              <form onsubmit={handleSubmit} class="space-y-8">
                <!-- Basic Information Section -->
                <section>
                  <h3 class="text-primary border-primary/20 mb-6 border-b pb-2 text-xl font-semibold">Basic Information</h3>

                  <!-- Avatar Upload Section -->
                  <div class="mb-6 flex justify-center">
                    <div class="form-control">
                      <div class="label justify-center">
                        <span class="label-text font-medium">Avatar</span>
                      </div>
                      <AvatarUpload
                        currentAvatar={formData.avatar}
                        userName={formData.name || ''}
                        size="large"
                        loading={avatarUploading}
                        disabled={loading || loadingData}
                        on:upload={handleAvatarUpload}
                        on:remove={handleAvatarRemove}
                      />
                    </div>
                  </div>

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
                        <p class="text-base-content/60 mb-2 text-xs">Quick select:</p>
                        <div class="flex flex-wrap gap-1">
                          {#each relationshipOptions as option}
                            <button type="button" class="btn btn-xs btn-outline" onclick={() => selectRelationship(option)}>
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
                      Updating...
                    {:else}
                      <Save size={20} />
                      Update Family Member
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
            <!-- Current Info Card -->
            {#if originalMember}
              <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
                <div class="card-body p-6">
                  <h3 class="text-primary mb-4 flex items-center gap-2 font-semibold">
                    <Heart size={20} />
                    Current Profile
                  </h3>
                  <div class="space-y-2 text-sm">
                    <p><strong>Connection Level:</strong> {originalMember.connectionLevel}</p>
                    <p><strong>Connection XP:</strong> {originalMember.connectionXp}</p>
                    <p><strong>Created:</strong> {formatDateTime(originalMember.createdAt)}</p>
                    {#if originalMember.lastInteractionDate}
                      <p><strong>Last Interaction:</strong> {formatDateTime(originalMember.lastInteractionDate)}</p>
                    {/if}
                  </div>
                </div>
              </div>
            {/if}

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Update Tips</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">
                    <strong>Preferences:</strong> Keep likes and dislikes updated to get better GPT suggestions
                  </p>
                  <p class="text-base-content/70">
                    <strong>Energy Level:</strong> Adjust based on how their personality has changed
                  </p>
                  <p class="text-base-content/70">
                    <strong>Relationship:</strong> Update if their role in your life has evolved
                  </p>
                </div>
              </div>
            </div>

            <!-- Connection History -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">📈 Connection Progress</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Updates to preferences will improve future GPT suggestions for meaningful activities.</p>
                  <p class="text-base-content/70">Connection XP and level are preserved when updating profile information.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
