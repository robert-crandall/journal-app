<script lang="ts">
  import type { PageData, ActionData } from './$types.js';
  import { enhance } from '$app/forms';
  import { Plus, Edit2, Clock, Heart, Calendar, Users } from 'lucide-svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showFeedbackForm = $state<string | null>(null);
  let showXpForm = $state<string | null>(null);

  // Form state
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
      showFeedbackForm = null;
      showXpForm = null;

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

    <a href="/family/new" class="btn btn-primary">
      <Plus class="h-4 w-4" />
      Add Family Member
    </a>
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

  <!-- Family Members Grid -->
  {#if data.familyMembers.length === 0}
    <div class="py-12 text-center">
      <Users class="text-base-content/30 mx-auto mb-4 h-16 w-16" />
      <h3 class="text-base-content/70 mb-2 text-xl font-semibold">No family members yet</h3>
      <p class="text-base-content/50 mb-6">Start by adding your family members to track meaningful connections</p>
      <a href="/family/new" class="btn btn-primary">
        <Plus class="h-4 w-4" />
        Add Your First Family Member
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each data.familyMembers as member (member.id)}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <!-- Display Mode -->
            <div class="mb-4 flex items-start justify-between">
              <div>
                <h3 class="card-title text-lg">{member.name}</h3>
                <p class="text-base-content/70 text-sm">{member.relationship}</p>
              </div>

              <div class="dropdown dropdown-end">
                <button tabindex="0" class="btn btn-ghost btn-sm btn-circle" type="button">
                  <Edit2 class="h-4 w-4" />
                </button>
                <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow" role="menu">
                  <li><a href="/family/{member.id}/edit">Edit Details</a></li>
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
            <div class="mb-2">
              <span class="label-text">Did they enjoy the activity?</span>
            </div>
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
