<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { familyApi, type FamilyMember } from '$lib/api/family';
  import { Plus, Users, Heart, Calendar, User, Edit3, Trash2, Eye, MessageCircle } from 'lucide-svelte';

  // Reactive state for family data
  let familyMembers: FamilyMember[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load data on component mount
  onMount(async () => {
    await loadFamilyData();
  });

  // Separate function to load family data
  async function loadFamilyData() {
    try {
      loading = true;
      error = null;

      const membersData = await familyApi.getFamilyMembers();
      familyMembers = membersData;
    } catch (err) {
      console.error('Failed to load family members:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load family members';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getFamilyIcon(relationship: string): string {
    const rel = relationship.toLowerCase();
    if (rel.includes('wife') || rel.includes('husband') || rel.includes('spouse') || rel.includes('partner')) return '💑';
    if (rel.includes('son') || rel.includes('daughter') || rel.includes('child')) return '👶';
    if (rel.includes('mother') || rel.includes('mom') || rel.includes('father') || rel.includes('dad')) return '👨‍👩‍👧‍👦';
    if (rel.includes('brother') || rel.includes('sister') || rel.includes('sibling')) return '👫';
    if (rel.includes('grandmother') || rel.includes('grandfather') || rel.includes('grandpa') || rel.includes('grandma')) return '👴';
    return '👤'; // Default person icon
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatLastInteraction(dateString: string | null | undefined): string {
    if (!dateString) return 'No interactions recorded';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  }

  function getConnectionLevel(member: FamilyMember): string {
    return `Level ${member.connectionLevel}`;
  }

  function getConnectionProgress(member: FamilyMember): number {
    // Each level requires 100 XP
    const currentLevelXp = member.connectionXp % 100;
    return (currentLevelXp / 100) * 100;
  }

  // Navigation functions
  function createFamilyMember() {
    goto('/family/create');
  }

  function editFamilyMember(memberId: string) {
    goto(`/family/${memberId}/edit`);
  }

  function viewFamilyMemberDetails(memberId: string) {
    goto(`/family/${memberId}`);
  }

  function viewFeedbackHistory(memberId: string) {
    goto(`/family/${memberId}/feedback`);
  }

  // Family member actions
  async function deleteFamilyMember(member: FamilyMember) {
    if (!confirm(`Are you sure you want to delete "${member.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await familyApi.deleteFamilyMember(member.id);
      await loadFamilyData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete family member:', err);
      error = err instanceof Error ? err.message : 'Failed to delete family member';
    }
  }
</script>

<svelte:head>
  <title>Family - Gamified Life</title>
  <meta name="description" content="Manage your family relationships and track meaningful connections" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Family Dashboard</h1>
          <p class="text-base-content/70 text-lg">Nurture meaningful connections with those who matter most</p>
        </div>
        <div class="flex gap-3">
          <button onclick={createFamilyMember} class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
            <Plus size={20} />
            Add Family Member
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your family...</p>
        </div>
      </div>
    {:else if error}
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
      <!-- Family Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Family Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Family Members Section -->
          {#if familyMembers.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">Family Members</h2>
              <div class="grid gap-6 md:grid-cols-2">
                {#each familyMembers as member}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <div
                    class="card bg-base-100 border-base-300 cursor-pointer border shadow-xl transition-all duration-200 hover:shadow-2xl"
                    role="button"
                    tabindex="0"
                    onclick={() => viewFamilyMemberDetails(member.id)}
                    onkeydown={(e) => e.key === 'Enter' && viewFamilyMemberDetails(member.id)}
                  >
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">
                            {getFamilyIcon(member.relationship)}
                          </div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">{member.name}</h3>
                            <p class="text-base-content/60 text-sm">{member.relationship}</p>
                          </div>
                        </div>

                        <!-- Connection Level Badge -->
                        <div class="badge badge-primary">
                          {getConnectionLevel(member)}
                        </div>
                      </div>

                      <!-- Connection Progress -->
                      <div class="mb-4">
                        <div class="text-base-content/60 mb-1 flex justify-between text-xs">
                          <span>Connection Progress</span>
                          <span>{member.connectionXp} XP</span>
                        </div>
                        <div class="progress progress-primary h-2">
                          <div class="progress-bar" style="width: {getConnectionProgress(member)}%"></div>
                        </div>
                      </div>

                      <!-- Member Details -->
                      <div class="space-y-2 text-sm">
                        {#if member.birthday}
                          <div class="flex items-center gap-2">
                            <Calendar size={14} class="text-base-content/40" />
                            <span>Birthday: {formatDate(member.birthday)}</span>
                          </div>
                        {/if}

                        <div class="flex items-center gap-2">
                          <Heart size={14} class="text-base-content/40" />
                          <span>Last interaction: {formatLastInteraction(member.lastInteractionDate)}</span>
                        </div>

                        {#if member.energyLevel}
                          <div class="flex items-center gap-2">
                            <User size={14} class="text-base-content/40" />
                            <span>Energy: {member.energyLevel}</span>
                          </div>
                        {/if}
                      </div>

                      <!-- Likes/Dislikes -->
                      {#if member.likes || member.dislikes}
                        <div class="mt-4 space-y-1">
                          {#if member.likes}
                            <p class="text-success text-xs">
                              <span class="font-medium">Likes:</span>
                              {member.likes}
                            </p>
                          {/if}
                          {#if member.dislikes}
                            <p class="text-error text-xs">
                              <span class="font-medium">Dislikes:</span>
                              {member.dislikes}
                            </p>
                          {/if}
                        </div>
                      {/if}

                      <!-- Action Buttons -->
                      <!-- svelte-ignore a11y-click-events-have-key-events -->
                      <!-- svelte-ignore a11y-no-static-element-interactions -->
                      <div
                        class="mt-4 flex flex-wrap gap-2"
                        role="button"
                        tabindex="0"
                        onclick={(e) => e.stopPropagation()}
                        onkeydown={(e) => e.stopPropagation()}
                      >
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewFamilyMemberDetails(member.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => editFamilyMember(member.id)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewFeedbackHistory(member.id)}>
                          <MessageCircle size={14} />
                          Feedback
                        </button>
                        <button
                          class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content gap-1"
                          onclick={() => deleteFamilyMember(member)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </section>
          {:else}
            <!-- Empty State -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <Users size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Family Members Added</h3>
                  <p class="text-base-content/60 mb-6">
                    Start building meaningful connections by adding your family members and tracking your interactions with them.
                  </p>
                  <button onclick={createFamilyMember} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Add Your First Family Member
                  </button>
                </div>
              </div>
            </section>
          {/if}
        </div>

        <!-- Sidebar (1/4 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Quick Stats Card -->
            <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="text-primary mb-4 font-semibold">Family Stats</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Total Members:</span>
                    <span class="font-medium">{familyMembers.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Total Connection XP:</span>
                    <span class="font-medium">{familyMembers.reduce((sum, m) => sum + m.connectionXp, 0)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Avg Connection Level:</span>
                    <span class="font-medium">
                      {familyMembers.length > 0 ? (familyMembers.reduce((sum, m) => sum + m.connectionLevel, 0) / familyMembers.length).toFixed(1) : '0'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Recently Interacted:</span>
                    <span class="font-medium">
                      {familyMembers.filter((m) => {
                        if (!m.lastInteractionDate) return false;
                        const days = Math.ceil(Math.abs(new Date().getTime() - new Date(m.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24));
                        return days <= 7;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Connection Tips</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Record likes and dislikes to help GPT suggest meaningful activities.</p>
                  <p class="text-base-content/70">Regular interactions help maintain strong family bonds and increase connection XP.</p>
                  <p class="text-base-content/70">Use the feedback system to track what activities work best with each family member.</p>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={createFamilyMember} class="btn btn-outline btn-sm w-full gap-2">
                    <Plus size={16} />
                    Add Family Member
                  </button>
                  {#if familyMembers.length > 0}
                    <button onclick={() => goto('/family/feedback')} class="btn btn-outline btn-sm w-full gap-2">
                      <MessageCircle size={16} />
                      Recent Feedback
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .progress {
    background-color: rgb(229 231 235 / 0.3);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .progress-bar {
    background-color: hsl(var(--p));
    height: 100%;
    transition: width 0.3s ease;
  }
</style>
