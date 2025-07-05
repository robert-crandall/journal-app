<script lang="ts">
  import { Plus, X, Edit2 } from 'lucide-svelte';

  interface Activity {
    description: string;
    suggestedXp: number;
  }

  let {
    value = {},
    onUpdate,
  }: {
    value?: Record<string, Activity[]>;
    onUpdate: (activities: Record<string, Activity[]>) => void;
  } = $props();

  let activities = $state<Record<string, Activity[]>>(value || {});
  let newCategoryName = $state('');
  let editingCategory = $state<string | null>(null);
  let editingCategoryName = $state('');

  // Common activity categories for suggestions
  const suggestedCategories = [
    'Daily Habits',
    'Exercise & Fitness',
    'Learning & Education',
    'Work & Career',
    'Social & Relationships',
    'Creative & Hobbies',
    'Health & Wellness',
    'Personal Growth',
    'Skills & Abilities',
    'Goals & Projects',
  ];

  function addCategory() {
    if (!newCategoryName.trim()) return;

    const categoryName = newCategoryName.trim();
    if (activities[categoryName]) return; // Category already exists

    activities[categoryName] = [];
    newCategoryName = '';
    onUpdate(activities);
  }

  function removeCategory(categoryName: string) {
    delete activities[categoryName];
    activities = { ...activities };
    onUpdate(activities);
  }

  function addActivity(categoryName: string) {
    if (!activities[categoryName]) {
      activities[categoryName] = [];
    }
    activities[categoryName].push({ description: '', suggestedXp: 10 });
    activities = { ...activities };
    onUpdate(activities);
  }

  function removeActivity(categoryName: string, index: number) {
    activities[categoryName].splice(index, 1);
    if (activities[categoryName].length === 0) {
      delete activities[categoryName];
    }
    activities = { ...activities };
    onUpdate(activities);
  }

  function updateActivity(categoryName: string, index: number, field: 'description' | 'suggestedXp', value: string | number) {
    if (activities[categoryName] && activities[categoryName][index]) {
      if (field === 'description') {
        activities[categoryName][index][field] = value as string;
      } else {
        activities[categoryName][index][field] = value as number;
      }
      activities = { ...activities };
      onUpdate(activities);
    }
  }

  function startEditingCategory(categoryName: string) {
    editingCategory = categoryName;
    editingCategoryName = categoryName;
  }

  function saveEditingCategory() {
    if (!editingCategory || !editingCategoryName.trim()) return;

    const newName = editingCategoryName.trim();
    if (newName !== editingCategory && activities[newName]) {
      // Category with new name already exists
      return;
    }

    if (newName !== editingCategory) {
      activities[newName] = activities[editingCategory];
      delete activities[editingCategory];
      activities = { ...activities };
    }

    editingCategory = null;
    editingCategoryName = '';
    onUpdate(activities);
  }

  function cancelEditingCategory() {
    editingCategory = null;
    editingCategoryName = '';
  }

  // Sync with external value changes
  $effect(() => {
    if (value !== activities) {
      activities = value || {};
    }
  });
</script>

<div class="form-control">
  <span class="label-text mb-2 block font-semibold">Example Activities</span>
  <p class="text-base-content/70 mb-4 text-sm">
    Organize activities into categories. This helps provide context when sending data to GPT for personalized recommendations.
  </p>

  <div class="space-y-4">
    <!-- Add New Category -->
    <div class="card bg-base-200">
      <div class="card-body p-4">
        <h3 class="mb-3 text-sm font-medium">Add Category</h3>
        <div class="flex gap-2">
          <input
            type="text"
            class="input input-bordered input-sm flex-1"
            placeholder="Category name (e.g., Daily Habits)"
            bind:value={newCategoryName}
            onkeydown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button type="button" class="btn btn-primary btn-sm" onclick={addCategory}>
            <Plus size={16} />
          </button>
        </div>

        <!-- Suggested Categories -->
        <div class="mt-3">
          <p class="text-base-content/60 mb-2 text-xs">Suggestions:</p>
          <div class="flex flex-wrap gap-1">
            {#each suggestedCategories.filter((cat) => !activities[cat]) as category (category)}
              <button
                type="button"
                class="badge badge-outline badge-sm hover:badge-primary cursor-pointer"
                onclick={() => {
                  newCategoryName = category;
                  addCategory();
                }}
              >
                {category}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Categories -->
    {#each Object.entries(activities) as [categoryName, categoryActivities] (categoryName)}
      <div class="card bg-base-100 border">
        <div class="card-body p-4">
          <!-- Category Header -->
          <div class="mb-3 flex items-center justify-between">
            {#if editingCategory === categoryName}
              <div class="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  bind:value={editingCategoryName}
                  onkeydown={(e) => e.key === 'Enter' && saveEditingCategory()}
                />
                <button type="button" class="btn btn-ghost btn-sm" onclick={saveEditingCategory}>✓</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick={cancelEditingCategory}>✕</button>
              </div>
            {:else}
              <div class="flex items-center gap-2">
                <h3 class="font-medium">{categoryName}</h3>
                <button type="button" class="btn btn-ghost btn-xs" onclick={() => startEditingCategory(categoryName)}>
                  <Edit2 size={12} />
                </button>
              </div>
              <button type="button" class="btn btn-error btn-sm" onclick={() => removeCategory(categoryName)}>
                <X size={16} />
              </button>
            {/if}
          </div>

          <!-- Activities -->
          <div class="space-y-2">
            {#each categoryActivities as activity, activityIndex (activityIndex)}
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  class="input input-bordered input-sm flex-1"
                  placeholder="Activity description"
                  value={activity.description}
                  oninput={(e) => updateActivity(categoryName, activityIndex, 'description', (e.target as HTMLInputElement)?.value || '')}
                />
                <input
                  type="number"
                  class="input input-bordered input-sm w-20"
                  placeholder="XP"
                  min="1"
                  max="100"
                  value={activity.suggestedXp}
                  oninput={(e) => updateActivity(categoryName, activityIndex, 'suggestedXp', parseInt((e.target as HTMLInputElement)?.value || '10') || 10)}
                />
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => removeActivity(categoryName, activityIndex)}>
                  <X size={16} />
                </button>
              </div>
            {/each}

            <!-- Add Activity Button -->
            <button type="button" class="btn btn-ghost btn-sm w-full justify-start" onclick={() => addActivity(categoryName)}>
              <Plus size={16} />
              Add Activity
            </button>
          </div>
        </div>
      </div>
    {/each}

    <!-- Empty State -->
    {#if Object.keys(activities).length === 0}
      <div class="card bg-base-200">
        <div class="card-body p-6 text-center">
          <p class="text-base-content/60 mb-2">No activity categories yet</p>
          <p class="text-base-content/40 text-sm">Add categories to organize example activities for this stat</p>
        </div>
      </div>
    {/if}
  </div>

  <div class="label">
    <span class="label-text-alt"> These examples help GPT understand what activities contribute to this stat and suggest appropriate XP awards </span>
  </div>
</div>
