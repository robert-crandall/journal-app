<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getFamilyMember, deleteFamilyMember } from '$lib/api/family.js';
  import type { FamilyMember } from '$lib/api/family.js';
  import AvatarDisplay from '$lib/components/AvatarDisplay.svelte';
  import { Calendar, Edit3, Trash2, User, Heart, MessageCircle, ArrowLeft, TrendingUp, Clock, Star } from 'lucide-svelte';
  import { formatDate, formatDateTime } from '$lib/utils/date';

  // State
  let familyMember = $state<FamilyMember | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let deletingMember = $state(false);

  const memberId = $derived($page.params.id);

  // Load family member data
  onMount(async () => {
    if (!memberId) {
      error = 'Family member ID is required';
      loading = false;
      return;
    }

    try {
      familyMember = await getFamilyMember(memberId);
    } catch (err) {
      console.error('Failed to load family member:', err);
      error = 'Failed to load family member. Please try again.';
    } finally {
      loading = false;
    }
  });

  // Handle delete
  async function handleDelete() {
    if (!familyMember || !confirm('Are you sure you want to delete this family member? This action cannot be undone.')) {
      return;
    }

    deletingMember = true;
    try {
      await deleteFamilyMember(familyMember.id);
      goto('/family');
    } catch (err) {
      console.error('Failed to delete family member:', err);
      error = 'Failed to delete family member. Please try again.';
    } finally {
      deletingMember = false;
    }
  }

  // Utility functions
  function getRelationshipIcon(relationship: string) {
    const icons = {
      parent: User,
      child: User,
      sibling: User,
      spouse: Heart,
      friend: MessageCircle,
      colleague: User,
      mentor: Star,
      other: User,
    };
    return icons[relationship as keyof typeof icons] || User;
  }

  function getRelationshipColor(relationship: string) {
    const colors = {
      parent: 'text-primary',
      child: 'text-success',
      sibling: 'text-secondary',
      spouse: 'text-error',
      friend: 'text-warning',
      colleague: 'text-base-content',
      mentor: 'text-accent',
      other: 'text-base-content/60',
    };
    return colors[relationship as keyof typeof colors] || 'text-base-content/60';
  }

  // Note: formatDate function removed - now using utility from $lib/utils/date
  // For birthday fields, use formatDate() utility
  // For datetime fields like createdAt, use formatDateTime() utility
</script>

<svelte:head>
  <title>
    {familyMember ? `${familyMember.name} - Family` : 'Loading - Family'} | Journal App
  </title>
</svelte:head>

<div class="from-primary/5 to-secondary/5 min-h-screen bg-gradient-to-br">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- Header -->
    <header class="mb-8">
      <div class="mb-4 flex items-center gap-4">
        <button onclick={() => goto('/family')} class="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content gap-2" aria-label="Back to family">
          <ArrowLeft size={16} />
          Back to Family
        </button>
      </div>

      {#if loading}
        <div class="flex items-center gap-3">
          <div class="skeleton h-8 w-8 rounded-full"></div>
          <div class="skeleton h-8 w-48"></div>
        </div>
      {:else if familyMember}
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <AvatarDisplay avatar={familyMember.avatar} name={familyMember.name} size="lg" />
            <div>
              <h1 class="text-base-content mb-2 text-3xl font-bold">
                {familyMember.name}
              </h1>
              <div class="text-base-content/70 flex items-center gap-4 text-sm">
                {#if familyMember}
                  {@const RelationshipIcon = getRelationshipIcon(familyMember.relationship)}
                  <div class="flex items-center gap-1">
                    <RelationshipIcon size={16} class={getRelationshipColor(familyMember.relationship)} />
                    <span class="capitalize">{familyMember.relationship}</span>
                  </div>
                {/if}
                <div class="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Added {familyMember ? formatDateTime(familyMember.createdAt) : ''}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              onclick={() => familyMember && goto(`/family/${familyMember.id}/edit`)}
              class="btn btn-outline btn-sm gap-2"
              aria-label="Edit family member"
              disabled={!familyMember}
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onclick={handleDelete}
              disabled={deletingMember || !familyMember}
              class="btn btn-error btn-outline btn-sm gap-2"
              aria-label="Delete family member"
            >
              {#if deletingMember}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <Trash2 size={16} />
              {/if}
              Delete
            </button>
          </div>
        </div>
      {/if}
    </header>

    {#if error}
      <div class="alert alert-error mb-6">
        <span>{error}</span>
      </div>
    {/if}

    {#if loading}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Profile skeleton -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="skeleton mb-4 h-6 w-32"></div>
              <div class="space-y-3">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-3/4"></div>
                <div class="skeleton h-4 w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats skeleton -->
        <div>
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="skeleton mb-4 h-6 w-24"></div>
              <div class="space-y-4">
                <div class="skeleton h-16 w-full"></div>
                <div class="skeleton h-16 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else if familyMember}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Profile Information -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h2 class="card-title mb-4 flex items-center gap-2 text-xl">
                <User size={20} />
                Profile Information
              </h2>

              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 class="text-base-content/70 mb-1 font-medium">Name</h4>
                  <p class="text-base-content">{familyMember.name}</p>
                </div>

                <div>
                  <h4 class="text-base-content/70 mb-1 font-medium">Relationship</h4>
                  {#if familyMember}
                    {@const RelationshipIcon = getRelationshipIcon(familyMember.relationship)}
                    <div class="flex items-center gap-2">
                      <RelationshipIcon size={16} class={getRelationshipColor(familyMember.relationship)} />
                      <span class="capitalize">{familyMember.relationship}</span>
                    </div>
                  {/if}
                </div>

                <div>
                  <h4 class="text-base-content/70 mb-1 font-medium">Connection Level</h4>
                  <div class="flex items-center gap-2">
                    <span class="text-primary font-bold">{familyMember.connectionLevel}/10</span>
                    <div class="flex-1">
                      <progress class="progress progress-primary w-full max-w-32" value={familyMember.connectionLevel} max="10"></progress>
                    </div>
                  </div>
                </div>
              </div>

              {#if familyMember.notes}
                <div class="mt-6">
                  <h4 class="text-base-content/70 mb-2 font-medium">Notes</h4>
                  <div class="bg-base-200 rounded-lg p-4">
                    <p class="text-base-content whitespace-pre-wrap">{familyMember.notes}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Interaction History -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h2 class="card-title mb-4 flex items-center gap-2 text-xl">
                <MessageCircle size={20} />
                Recent Interactions
              </h2>

              <div class="py-8 text-center">
                <MessageCircle size={48} class="text-base-content/30 mx-auto mb-4" />
                <p class="text-base-content/70 mb-4">No interactions recorded yet</p>
                <p class="text-base-content/50 text-sm">Start tracking your interactions to see them here</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h3 class="card-title mb-4 flex items-center gap-2 text-lg">
                <TrendingUp size={18} />
                Quick Stats
              </h3>

              <div class="space-y-4">
                <div class="stat bg-primary/10 rounded-lg p-4">
                  <div class="stat-title text-xs">Connection Progress</div>
                  <div class="stat-value text-primary text-2xl">
                    {familyMember.connectionLevel}/10
                  </div>
                  <div class="stat-desc">
                    <progress class="progress progress-primary w-full" value={familyMember.connectionLevel} max="10"></progress>
                  </div>
                </div>

                <div class="stat bg-secondary/10 rounded-lg p-4">
                  <div class="stat-title text-xs">Member Since</div>
                  <div class="stat-value text-secondary text-lg">
                    {formatDateTime(familyMember.createdAt)}
                  </div>
                  <div class="stat-desc flex items-center gap-1">
                    <Clock size={12} />
                    Added to family
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h3 class="card-title mb-4 text-lg">Quick Actions</h3>

              <div class="space-y-3">
                <button
                  onclick={() => familyMember && goto(`/family/${familyMember.id}/edit`)}
                  class="btn btn-outline w-full justify-start gap-2"
                  disabled={!familyMember}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>

                <button class="btn btn-outline w-full justify-start gap-2" disabled>
                  <MessageCircle size={16} />
                  Record Interaction
                  <div class="badge badge-xs">Coming Soon</div>
                </button>

                <button onclick={handleDelete} disabled={deletingMember} class="btn btn-error btn-outline w-full justify-start gap-2">
                  {#if deletingMember}
                    <span class="loading loading-spinner loading-xs"></span>
                  {:else}
                    <Trash2 size={16} />
                  {/if}
                  Delete Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
