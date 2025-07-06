<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getFamilyMember, deleteFamilyMember } from '$lib/api/family.js';
  import type { FamilyMember } from '$lib/api/family.js';
  import { 
    Calendar, 
    Edit3, 
    Trash2, 
    User, 
    Heart, 
    MessageCircle,
    ArrowLeft,
    TrendingUp,
    Clock,
    Star
  } from 'lucide-svelte';

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
      other: User
    };
    return icons[relationship as keyof typeof icons] || User;
  }

  function getRelationshipColor(relationship: string) {
    const colors = {
      parent: 'text-blue-600',
      child: 'text-green-600',
      sibling: 'text-purple-600',
      spouse: 'text-red-600',
      friend: 'text-yellow-600',
      colleague: 'text-gray-600',
      mentor: 'text-indigo-600',
      other: 'text-slate-600'
    };
    return colors[relationship as keyof typeof colors] || 'text-slate-600';
  }

  function getEnergyColor(energy: number) {
    if (energy >= 8) return 'text-green-600';
    if (energy >= 6) return 'text-yellow-600';
    if (energy >= 4) return 'text-orange-600';
    return 'text-red-600';
  }

  function getEnergyLabel(energy: number) {
    if (energy >= 8) return 'Energizing';
    if (energy >= 6) return 'Positive';
    if (energy >= 4) return 'Neutral';
    return 'Draining';
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>
    {familyMember ? `${familyMember.name} - Family` : 'Loading - Family'} | Journal App
  </title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <button
          onclick={() => goto('/family')}
          class="btn btn-ghost btn-sm gap-2 text-slate-600 hover:text-slate-800"
          aria-label="Back to family"
        >
          <ArrowLeft size={16} />
          Back to Family
        </button>
      </div>
      
      {#if loading}
        <div class="flex items-center gap-3">
          <div class="skeleton w-8 h-8 rounded-full"></div>
          <div class="skeleton h-8 w-48"></div>
        </div>
      {:else if familyMember}
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-16 h-16">
                <span class="text-2xl font-bold">
                  {familyMember.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-slate-800 mb-2">
                {familyMember.name}
              </h1>
              <div class="flex items-center gap-4 text-sm text-slate-600">
                {#if familyMember}
                  {@const RelationshipIcon = getRelationshipIcon(familyMember.relationship)}
                  <div class="flex items-center gap-1">
                    <RelationshipIcon 
                      size={16} 
                      class={getRelationshipColor(familyMember.relationship)}
                    />
                    <span class="capitalize">{familyMember.relationship}</span>
                  </div>
                {/if}
                <div class="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Added {familyMember ? formatDate(familyMember.createdAt) : ''}</span>
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile skeleton -->
        <div class="lg:col-span-2">
          <div class="card bg-white shadow-sm">
            <div class="card-body">
              <div class="skeleton h-6 w-32 mb-4"></div>
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
          <div class="card bg-white shadow-sm">
            <div class="card-body">
              <div class="skeleton h-6 w-24 mb-4"></div>
              <div class="space-y-4">
                <div class="skeleton h-16 w-full"></div>
                <div class="skeleton h-16 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else if familyMember}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Profile Information -->
          <div class="card bg-white shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-xl mb-4 flex items-center gap-2">
                <User size={20} />
                Profile Information
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="font-medium text-slate-600 mb-1">Name</h4>
                  <p class="text-slate-800">{familyMember.name}</p>
                </div>
                
                <div>
                  <h4 class="font-medium text-slate-600 mb-1">Relationship</h4>
                  {#if familyMember}
                    {@const RelationshipIcon = getRelationshipIcon(familyMember.relationship)}
                    <div class="flex items-center gap-2">
                      <RelationshipIcon 
                        size={16} 
                        class={getRelationshipColor(familyMember.relationship)}
                      />
                      <span class="capitalize">{familyMember.relationship}</span>
                    </div>
                  {/if}
                </div>
                
                <div>
                  <h4 class="font-medium text-slate-600 mb-1">Energy Level</h4>
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1">
                      <span class={`font-bold ${getEnergyColor(familyMember.energyLevel)}`}>
                        {familyMember.energyLevel}/10
                      </span>
                      <span class={`text-sm ${getEnergyColor(familyMember.energyLevel)}`}>
                        ({getEnergyLabel(familyMember.energyLevel)})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 class="font-medium text-slate-600 mb-1">Connection Level</h4>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-600">{familyMember.connectionLevel}/10</span>
                    <div class="flex-1">
                      <progress 
                        class="progress progress-primary w-full max-w-32" 
                        value={familyMember.connectionLevel} 
                        max="10"
                      ></progress>
                    </div>
                  </div>
                </div>
              </div>
              
              {#if familyMember.notes}
                <div class="mt-6">
                  <h4 class="font-medium text-slate-600 mb-2">Notes</h4>
                  <div class="bg-slate-50 rounded-lg p-4">
                    <p class="text-slate-700 whitespace-pre-wrap">{familyMember.notes}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Interaction History -->
          <div class="card bg-white shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-xl mb-4 flex items-center gap-2">
                <MessageCircle size={20} />
                Recent Interactions
              </h2>
              
              <div class="text-center py-8">
                <MessageCircle size={48} class="mx-auto text-slate-300 mb-4" />
                <p class="text-slate-500 mb-4">No interactions recorded yet</p>
                <p class="text-sm text-slate-400">
                  Start tracking your interactions to see them here
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <div class="card bg-white shadow-sm">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4 flex items-center gap-2">
                <TrendingUp size={18} />
                Quick Stats
              </h3>
              
              <div class="space-y-4">
                <div class="stat bg-blue-50 rounded-lg p-4">
                  <div class="stat-title text-xs">Connection Progress</div>
                  <div class="stat-value text-2xl text-blue-600">
                    {familyMember.connectionLevel}/10
                  </div>
                  <div class="stat-desc">
                    <progress 
                      class="progress progress-primary w-full" 
                      value={familyMember.connectionLevel} 
                      max="10"
                    ></progress>
                  </div>
                </div>
                
                <div class="stat bg-green-50 rounded-lg p-4">
                  <div class="stat-title text-xs">Energy Impact</div>
                  <div class={`stat-value text-2xl ${getEnergyColor(familyMember.energyLevel)}`}>
                    {getEnergyLabel(familyMember.energyLevel)}
                  </div>
                  <div class="stat-desc">{familyMember.energyLevel}/10 rating</div>
                </div>
                
                <div class="stat bg-purple-50 rounded-lg p-4">
                  <div class="stat-title text-xs">Member Since</div>
                  <div class="stat-value text-lg text-purple-600">
                    {formatDate(familyMember.createdAt)}
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
          <div class="card bg-white shadow-sm">
            <div class="card-body">
              <h3 class="card-title text-lg mb-4">Quick Actions</h3>
              
              <div class="space-y-3">
                <button
                  onclick={() => familyMember && goto(`/family/${familyMember.id}/edit`)}
                  class="btn btn-outline w-full gap-2 justify-start"
                  disabled={!familyMember}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
                
                <button
                  class="btn btn-outline w-full gap-2 justify-start"
                  disabled
                >
                  <MessageCircle size={16} />
                  Record Interaction
                  <div class="badge badge-xs">Coming Soon</div>
                </button>
                
                <button
                  onclick={handleDelete}
                  disabled={deletingMember}
                  class="btn btn-error btn-outline w-full gap-2 justify-start"
                >
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
