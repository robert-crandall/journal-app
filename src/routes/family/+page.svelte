<script lang="ts">
  import type { PageData, ActionData } from './$types.js';
  import { enhance } from '$app/forms';
  import { Plus, Edit2, Clock, Heart, UserPlus, Calendar, Users } from 'lucide-svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showCreateForm = $state(false);
  let editingMember = $state<string | null>(null);
  let showFeedbackForm = $state<string | null>(null);
  let showXpForm = $state<string | null>(null);

  // Form state
  let createForm = $state({
    name: '',
    relationship: '',
    birthday: '',
    likes: '',
    dislikes: '',
    energyLevel: '',
  });

  let editForm = $state({
    name: '',
    relationship: '',
    birthday: '',
    likes: '',
    dislikes: '',
    energyLevel: '',
  });

  let feedbackForm = $state({
    liked: true,
    notes: '',
  });

  let xpForm = $state({
    source: 'task' as 'task' | 'journal',
    xp: 10,
    comment: '',
  });

  // Reset forms when needed
  $effect(() => {
    if (form?.success) {
      showCreateForm = false;
      editingMember = null;
      showFeedbackForm = null;
      showXpForm = null;

      // Reset forms
      createForm = {
        name: '',
        relationship: '',
        birthday: '',
        likes: '',
        dislikes: '',
        energyLevel: '',
      };

      feedbackForm = {
        liked: true,
        notes: '',
      };

      xpForm = {
        source: 'task',
        xp: 10,
        comment: '',
      };
    }
  });

  function startEdit(member: (typeof data.familyMembers)[0]) {
    editingMember = member.id;
    editForm = {
      name: member.name,
      relationship: member.relationship,
      birthday: member.birthday ? new Date(member.birthday).toISOString().split('T')[0] : '',
      likes: member.likes?.join(', ') || '',
      dislikes: member.dislikes?.join(', ') || '',
      energyLevel: member.energyLevel || '',
    };
  }

  function cancelEdit() {
    editingMember = null;
  }

  function formatLastInteraction(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  function getInteractionStatusColor(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'text-success';
    if (diffDays <= 3) return 'text-warning';
    return 'text-error';
  }

  const energyLevelOptions = [
    { value: 'active', label: 'Active' },
    { value: 'creative', label: 'Creative' },
    { value: 'low-key', label: 'Low-key' },
    { value: 'adventurous', label: 'Adventurous' },
    { value: 'quiet', label: 'Quiet' },
    { value: 'social', label: 'Social' },
  ];
</script>

<svelte:head>
  <title>Family - Journal App</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-6">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-base-content flex items-center gap-3 text-3xl font-bold">
        <Users class="text-primary h-8 w-8" />
        Family Members
      </h1>
      <p class="text-base-content/70 mt-2">Manage your family connections and track meaningful interactions</p>
    </div>

    <button type="button" onclick={() => (showCreateForm = true)} class="btn btn-primary">
      <Plus class="h-4 w-4" />
      Add Family Member
    </button>
  </div>

  {#if form?.error}
    <div class="alert alert-error mb-6">
      <span>{form.error}</span>
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success mb-6">
      <span>Action completed successfully!</span>
    </div>
  {/if}

  <!-- Create Form Modal -->
  {#if showCreateForm}
    <div class="modal modal-open">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="mb-4 text-lg font-bold">Add New Family Member</h3>

        <form method="POST" action="?/create" use:enhance>
          <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="form-control">
              <label class="label" for="create-name">
                <span class="label-text">Name *</span>
              </label>
              <input id="create-name" name="name" type="text" class="input input-bordered" bind:value={createForm.name} required />
            </div>

            <div class="form-control">
              <label class="label" for="create-relationship">
                <span class="label-text">Relationship *</span>
              </label>
              <input
                id="create-relationship"
                name="relationship"
                type="text"
                class="input input-bordered"
                placeholder="e.g., eldest son, wife, daughter"
                bind:value={createForm.relationship}
                required
              />
            </div>

            <div class="form-control">
              <label class="label" for="create-birthday">
                <span class="label-text">Birthday</span>
              </label>
              <input id="create-birthday" name="birthday" type="date" class="input input-bordered" bind:value={createForm.birthday} />
            </div>

            <div class="form-control">
              <label class="label" for="create-energyLevel">
                <span class="label-text">Energy Level</span>
              </label>
              <select id="create-energyLevel" name="energyLevel" class="select select-bordered" bind:value={createForm.energyLevel}>
                <option value="">Select energy level</option>
                {#each energyLevelOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="form-control mb-4">
            <label class="label" for="create-likes">
              <span class="label-text">Likes (comma-separated)</span>
            </label>
            <textarea
              id="create-likes"
              name="likes"
              class="textarea textarea-bordered"
              placeholder="physical activity, drawing, music"
              bind:value={createForm.likes}
            ></textarea>
          </div>

          <div class="form-control mb-6">
            <label class="label" for="create-dislikes">
              <span class="label-text">Dislikes (comma-separated)</span>
            </label>
            <textarea
              id="create-dislikes"
              name="dislikes"
              class="textarea textarea-bordered"
              placeholder="loud noises, spicy food"
              bind:value={createForm.dislikes}
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" onclick={() => (showCreateForm = false)}> Cancel </button>
            <button type="submit" class="btn btn-primary">
              <UserPlus class="h-4 w-4" />
              Add Family Member
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Family Members Grid -->
  {#if data.familyMembers.length === 0}
    <div class="py-12 text-center">
      <Users class="text-base-content/30 mx-auto mb-4 h-16 w-16" />
      <h3 class="text-base-content/70 mb-2 text-xl font-semibold">No family members yet</h3>
      <p class="text-base-content/50 mb-6">Start by adding your family members to track meaningful connections</p>
      <button type="button" onclick={() => (showCreateForm = true)} class="btn btn-primary">
        <Plus class="h-4 w-4" />
        Add Your First Family Member
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.familyMembers as member (member.id)}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            {#if editingMember === member.id}
              <!-- Edit Form -->
              <form method="POST" action="?/update" use:enhance>
                <input type="hidden" name="familyMemberId" value={member.id} />

                <div class="form-control mb-3">
                  <input name="name" type="text" class="input input-bordered input-sm" bind:value={editForm.name} required />
                </div>

                <div class="form-control mb-3">
                  <input name="relationship" type="text" class="input input-bordered input-sm" bind:value={editForm.relationship} required />
                </div>

                <div class="form-control mb-3">
                  <input name="birthday" type="date" class="input input-bordered input-sm" bind:value={editForm.birthday} />
                </div>

                <div class="form-control mb-3">
                  <select name="energyLevel" class="select select-bordered select-sm" bind:value={editForm.energyLevel}>
                    <option value="">Energy level</option>
                    {#each energyLevelOptions as option (option.value)}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="form-control mb-3">
                  <textarea name="likes" class="textarea textarea-bordered textarea-sm" placeholder="Likes" bind:value={editForm.likes}></textarea>
                </div>

                <div class="form-control mb-4">
                  <textarea name="dislikes" class="textarea textarea-bordered textarea-sm" placeholder="Dislikes" bind:value={editForm.dislikes}></textarea>
                </div>

                <div class="flex gap-2">
                  <button type="submit" class="btn btn-primary btn-sm flex-1"> Save </button>
                  <button type="button" class="btn btn-ghost btn-sm" onclick={cancelEdit}> Cancel </button>
                </div>
              </form>
            {:else}
              <!-- Display Mode -->
              <div class="mb-4 flex items-start justify-between">
                <div>
                  <h3 class="card-title text-lg">{member.name}</h3>
                  <p class="text-base-content/70 text-sm">{member.relationship}</p>
                </div>

                <div class="dropdown dropdown-end">
                  <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                    <Edit2 class="h-4 w-4" />
                  </label>
                  <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                    <li><button onclick={() => startEdit(member)}>Edit Details</button></li>
                    <li><button onclick={() => (showFeedbackForm = member.id)}>Add Feedback</button></li>
                    <li><button onclick={() => (showXpForm = member.id)}>Add XP</button></li>
                    <li>
                      <form method="POST" action="?/updateInteraction" use:enhance>
                        <input type="hidden" name="familyMemberId" value={member.id} />
                        <button type="submit">Update Interaction</button>
                      </form>
                    </li>
                    <li>
                      <form
                        method="POST"
                        action="?/delete"
                        use:enhance
                        onsubmit={(e) => {
                          if (!confirm('Are you sure you want to delete this family member?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="familyMemberId" value={member.id} />
                        <button type="submit" class="text-error">Delete</button>
                      </form>
                    </li>
                  </ul>
                </div>
              </div>

              {#if member.birthday}
                <div class="mb-2 flex items-center gap-2">
                  <Calendar class="text-base-content/50 h-4 w-4" />
                  <span class="text-sm">{new Date(member.birthday).toLocaleDateString()}</span>
                </div>
              {/if}

              {#if member.energyLevel}
                <div class="badge badge-outline mb-3">{member.energyLevel}</div>
              {/if}

              <div class="mb-3 flex items-center gap-2">
                <Clock class={`h-4 w-4 ${getInteractionStatusColor(member.lastInteraction.toString())}`} />
                <span class="text-sm">Last interaction: {formatLastInteraction(member.lastInteraction.toString())}</span>
              </div>

              {#if member.likes && member.likes.length > 0}
                <div class="mb-2">
                  <p class="text-success mb-1 text-xs font-semibold">Likes:</p>
                  <div class="flex flex-wrap gap-1">
                    {#each member.likes as like (like)}
                      <span class="badge badge-success badge-sm">{like}</span>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if member.dislikes && member.dislikes.length > 0}
                <div class="mb-3">
                  <p class="text-error mb-1 text-xs font-semibold">Dislikes:</p>
                  <div class="flex flex-wrap gap-1">
                    {#each member.dislikes as dislike (dislike)}
                      <span class="badge badge-error badge-sm">{dislike}</span>
                    {/each}
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Feedback Form Modal -->
  {#if showFeedbackForm}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="mb-4 text-lg font-bold">Add Task Feedback</h3>

        <form method="POST" action="?/addFeedback" use:enhance>
          <input type="hidden" name="familyMemberId" value={showFeedbackForm} />

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Did they enjoy the activity?</span>
            </label>
            <div class="flex gap-4">
              <label class="label cursor-pointer">
                <input type="radio" name="liked" value="true" class="radio" bind:group={feedbackForm.liked} />
                <span class="label-text ml-2">Yes</span>
              </label>
              <label class="label cursor-pointer">
                <input type="radio" name="liked" value="false" class="radio" bind:group={feedbackForm.liked} />
                <span class="label-text ml-2">No</span>
              </label>
            </div>
          </div>

          <div class="form-control mb-6">
            <label class="label" for="feedback-notes">
              <span class="label-text">Notes</span>
            </label>
            <textarea
              id="feedback-notes"
              name="notes"
              class="textarea textarea-bordered"
              placeholder="How did the activity go? Any observations?"
              bind:value={feedbackForm.notes}
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" onclick={() => (showFeedbackForm = null)}> Cancel </button>
            <button type="submit" class="btn btn-primary">
              <Heart class="h-4 w-4" />
              Add Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- XP Form Modal -->
  {#if showXpForm}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="mb-4 text-lg font-bold">Add Connection XP</h3>

        <form method="POST" action="?/addConnectionXp" use:enhance>
          <input type="hidden" name="familyMemberId" value={showXpForm} />

          <div class="form-control mb-4">
            <label class="label" for="xp-source">
              <span class="label-text">Source</span>
            </label>
            <select id="xp-source" name="source" class="select select-bordered" bind:value={xpForm.source}>
              <option value="task">Task</option>
              <option value="journal">Journal</option>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label" for="xp-amount">
              <span class="label-text">XP Amount</span>
            </label>
            <input id="xp-amount" name="xp" type="number" class="input input-bordered" min="1" bind:value={xpForm.xp} required />
          </div>

          <div class="form-control mb-6">
            <label class="label" for="xp-comment">
              <span class="label-text">Comment</span>
            </label>
            <textarea id="xp-comment" name="comment" class="textarea textarea-bordered" placeholder="What did you do together?" bind:value={xpForm.comment}
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" onclick={() => (showXpForm = null)}> Cancel </button>
            <button type="submit" class="btn btn-primary"> Add XP </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
