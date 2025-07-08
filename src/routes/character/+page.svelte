<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { PageData, ActionData } from './$types.js';
  import { markdownToHtml } from '$lib/markdown.js';
  import { Edit, Trash2, ArrowLeft } from 'lucide-svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Form state
  let characterClass = $state('');
  let backstory = $state('');
  let motto = $state('');
  let goals = $state('');
  let isSubmitting = $state(false);
  let showEditForm = $state(false);

  // Initialize form values from user data
  $effect(() => {
    if (!characterClass && !backstory && !motto && !goals) {
      characterClass = data.user.characterClass || '';
      backstory = data.user.backstory || '';
      motto = data.user.motto || '';
      goals = data.user.goals || '';
    }
  });

  // Handle form submission results
  $effect(() => {
    if (form?.success) {
      showEditForm = false;
      console.log('Form submission successful');
    } else if (form?.error) {
      characterClass = form.characterClass || characterClass;
      backstory = form.backstory || backstory;
      motto = form.motto || motto;
      goals = form.goals || goals;
      console.log('Form submission failed:', form.error);
    }
  });

  const suggestedClasses = ['Ranger', 'Warrior', 'Mage', 'Monk', 'Paladin', 'Rogue', 'Bard', 'Cleric', 'Druid', 'Barbarian'];

  // Navigation tabs
  const navTabs = [
    { label: 'Character', href: '/character', active: $page.url.pathname === '/character' },
    { label: 'Stats', href: '/stats', active: $page.url.pathname.startsWith('/stats') },
    { label: 'Goals', href: '/goals', active: $page.url.pathname.startsWith('/goals') },
    { label: 'Family', href: '/family', active: $page.url.pathname.startsWith('/family') }
  ];
</script>

<svelte:head>
  <title>Character Profile - Life Quest</title>
</svelte:head>

<!-- Dark background with gradient -->
<div class="min-h-screen bg-gradient-to-br from-base-300 to-base-100">
  <!-- Top Navigation Tabs -->
  <div class="bg-primary/10 border-b border-primary/20">
    <div class="container mx-auto px-4">
      <div class="flex justify-center">
        <div class="tabs tabs-boxed bg-transparent gap-2 p-4">
          {#each navTabs as tab}
            <a
              href={tab.href}
              class="tab {tab.active ? 'tab-active bg-primary text-primary-content' : 'text-base-content/70 hover:text-base-content'}"
            >
              {tab.label}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Character System Badge -->
  <div class="flex justify-center pt-6">
    <div class="badge badge-primary badge-lg">Character System</div>
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-8">
    <!-- Page Title -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">Your Character</h1>
      <p class="text-base-content/70">Create and manage your character to start your gamified life journey</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-center gap-4 mb-8">
      <button
        onclick={() => showEditForm = !showEditForm}
        class="btn btn-primary"
      >
        <Edit size={16} />
        Edit Character
      </button>
      <button class="btn btn-error btn-outline">
        <Trash2 size={16} />
        Delete Character
      </button>
    </div>

    <!-- Character Card and Content -->
    <div class="space-y-8 max-w-6xl mx-auto">
      <!-- Top Row: Character Overview and Character Progress (side by side) -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Character Avatar Card -->
        <div class="card bg-gradient-to-br from-base-300 to-base-200 shadow-xl">
          <div class="card-body text-center">
            <!-- Avatar -->
            <div class="avatar mb-3">
              <div class="w-20 h-20 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold mx-auto">
                {data.user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <!-- Character Name -->
            <h2 class="card-title text-xl justify-center">{data.user.name}</h2>
            
            <!-- Character Class -->
            <div class="badge badge-primary badge-lg">{data.user.characterClass || 'Ranger'}</div>
            
            <!-- Creation Date -->
            <p class="text-xs text-base-content/60 mt-2">
              Created<br />
              <span class="font-mono">7/7/2025</span>
            </p>
            
            <!-- Current Level -->
            <p class="text-xs text-base-content/60">
              Current Level<br />
              <span class="text-xl font-bold">1</span>
            </p>
            
            <!-- Motto -->
            {#if data.user.motto}
              <div class="mt-3 p-2 bg-base-300/50 rounded-lg">
                <p class="text-xs italic text-primary">"{data.user.motto}"</p>
                <p class="text-xs text-base-content/60 mt-1">Your motto</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Character Progress -->
        <div class="card bg-gradient-to-br from-base-300 to-base-200 shadow-xl">
          <div class="card-body">
            <h3 class="card-title text-info flex items-center gap-2 text-lg">
              <span class="w-3 h-3 bg-info rounded-sm"></span>
              Character Progress
            </h3>
            
            <!-- Progress Stats -->
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-primary">0</div>
                <div class="text-xs text-base-content/60">Quests Completed</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-secondary">0</div>
                <div class="text-xs text-base-content/60">Experience Points</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-accent">0</div>
                <div class="text-xs text-base-content/60">Achievements</div>
              </div>
            </div>
            
            <div class="text-center text-sm text-base-content/60 mt-4">
              Start completing quests to see your character's progress!
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Backstory and Goals & Aspirations (side by side) -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Backstory Section -->
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-error flex items-center gap-2">
              <span class="w-3 h-3 bg-error rounded-sm"></span>
              Backstory
            </h3>
            {#if data.user.backstory}
              <div class="prose prose-sm max-w-none">
                {@html markdownToHtml(data.user.backstory)}
              </div>
            {:else}
              <p class="text-base-content/60 italic">No backstory set yet.</p>
            {/if}
          </div>
        </div>

        <!-- Goals & Aspirations -->
        <div class="card bg-base-100 shadow-xl border border-base-300">
          <div class="card-body">
            <h3 class="card-title text-success flex items-center gap-2">
              <span class="w-3 h-3 bg-success rounded-sm"></span>
              Goals & Aspirations
            </h3>
            {#if data.user.goals}
              <div class="prose prose-sm max-w-none">
                {@html markdownToHtml(data.user.goals)}
              </div>
            {:else}
              <div class="space-y-3 text-sm">
                <div class="flex items-start gap-2">
                  <span class="text-primary">•</span>
                  <span>Set up your character goals to get started</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-primary">•</span>
                  <span>Define your personal aspirations</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-primary">•</span>
                  <span>Track your progress over time</span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Back to Home Button -->
    <div class="flex justify-center mt-8">
      <a href="/dashboard" class="btn btn-outline gap-2">
        <ArrowLeft size={16} />
        Back to Home
      </a>
    </div>
  </div>
</div>

<!-- Edit Form Modal -->
{#if showEditForm}
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Edit Character</h3>
      
      <form
        method="POST"
        action="?/update"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            isSubmitting = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <!-- Character Class -->
        <div class="form-control">
          <label for="characterClass" class="label">
            <span class="label-text font-semibold">Character Class</span>
            <span class="label-text-alt text-error">Required</span>
          </label>
          <input
            type="text"
            id="characterClass"
            name="characterClass"
            bind:value={characterClass}
            placeholder="e.g., Ranger, Warrior, or create your own..."
            class="input input-bordered w-full"
          />
          <!-- Class Suggestions -->
          <div class="flex flex-wrap gap-2 mt-2">
            {#each suggestedClasses as suggestedClass (suggestedClass)}
              <button type="button" class="btn btn-xs btn-outline" onclick={() => (characterClass = suggestedClass)}>
                {suggestedClass}
              </button>
            {/each}
          </div>
        </div>

        <!-- Personal Motto -->
        <div class="form-control">
          <label for="motto" class="label">
            <span class="label-text font-semibold">Personal Motto</span>
          </label>
          <input
            type="text"
            id="motto"
            name="motto"
            bind:value={motto}
            placeholder="e.g., Code less. Climb more."
            class="input input-bordered w-full"
          />
        </div>

        <!-- Backstory -->
        <div class="form-control">
          <label for="backstory" class="label">
            <span class="label-text font-semibold">Backstory</span>
          </label>
          <textarea
            id="backstory"
            name="backstory"
            bind:value={backstory}
            placeholder="Tell your story..."
            class="textarea textarea-bordered h-24 w-full"
            rows="3"
          ></textarea>
        </div>

        <!-- Personal Goals -->
        <div class="form-control">
          <label for="goals" class="label">
            <span class="label-text font-semibold">Personal Goals</span>
          </label>
          <textarea
            id="goals"
            name="goals"
            bind:value={goals}
            placeholder="What are your goals?"
            class="textarea textarea-bordered h-24 w-full"
            rows="3"
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" onclick={() => showEditForm = false}>Cancel</button>
          <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Character'}
          </button>
        </div>
      </form>
    </div>
    <button class="modal-backdrop" onclick={() => showEditForm = false} aria-label="Close modal"></button>
  </div>
{/if}
