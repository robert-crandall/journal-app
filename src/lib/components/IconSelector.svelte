<script lang="ts">
  import {
    Dumbbell,
    Brain,
    Heart,
    Zap,
    Target,
    BookOpen,
    Mountain,
    Utensils,
    Bed,
    User,
    Users,
    Briefcase,
    Home,
    Car,
    Palette,
    Music,
    Camera,
    Gamepad2,
    Coffee,
    Flower,
    Shield,
    Star,
    Award,
    TrendingUp,
  } from 'lucide-svelte';

  interface IconOption {
    name: string;
    component: import('svelte').ComponentType;
    category: string;
  }

  let { value = '', onSelect }: { value?: string; onSelect: (iconName: string) => void } = $props();

  const iconOptions: IconOption[] = [
    // Fitness & Health
    { name: 'dumbbell', component: Dumbbell, category: 'Fitness & Health' },
    { name: 'heart', component: Heart, category: 'Fitness & Health' },
    { name: 'utensils', component: Utensils, category: 'Fitness & Health' },
    { name: 'bed', component: Bed, category: 'Fitness & Health' },

    // Mental & Learning
    { name: 'brain', component: Brain, category: 'Mental & Learning' },
    { name: 'book-open', component: BookOpen, category: 'Mental & Learning' },
    { name: 'target', component: Target, category: 'Mental & Learning' },
    { name: 'trending-up', component: TrendingUp, category: 'Mental & Learning' },

    // Personal & Social
    { name: 'user', component: User, category: 'Personal & Social' },
    { name: 'users', component: Users, category: 'Personal & Social' },
    { name: 'home', component: Home, category: 'Personal & Social' },
    { name: 'shield', component: Shield, category: 'Personal & Social' },

    // Work & Career
    { name: 'briefcase', component: Briefcase, category: 'Work & Career' },
    { name: 'zap', component: Zap, category: 'Work & Career' },
    { name: 'award', component: Award, category: 'Work & Career' },
    { name: 'star', component: Star, category: 'Work & Career' },

    // Hobbies & Recreation
    { name: 'mountain', component: Mountain, category: 'Hobbies & Recreation' },
    { name: 'palette', component: Palette, category: 'Hobbies & Recreation' },
    { name: 'music', component: Music, category: 'Hobbies & Recreation' },
    { name: 'camera', component: Camera, category: 'Hobbies & Recreation' },
    { name: 'gamepad-2', component: Gamepad2, category: 'Hobbies & Recreation' },
    { name: 'coffee', component: Coffee, category: 'Hobbies & Recreation' },
    { name: 'flower', component: Flower, category: 'Hobbies & Recreation' },
    { name: 'car', component: Car, category: 'Hobbies & Recreation' },
  ];

  const categories = [...new Set(iconOptions.map((icon) => icon.category))];

  function getIconComponent(iconName: string) {
    const icon = iconOptions.find((option) => option.name === iconName);
    return icon?.component;
  }
</script>

<div class="form-control">
  <span class="label-text mb-2 block font-semibold">Icon</span>

  {#if value}
    {@const SelectedIcon = getIconComponent(value)}
    <div class="bg-base-200 mb-3 flex items-center gap-2 rounded p-2">
      <span class="text-sm">Selected:</span>
      {#if getIconComponent(value)}
        <SelectedIcon size={20} class="text-primary" />
      {/if}
      <span class="font-medium">{value}</span>
      <button type="button" class="btn btn-ghost btn-xs ml-auto" onclick={() => onSelect('')}> Clear </button>
    </div>
  {/if}

  <div class="max-h-64 space-y-4 overflow-y-auto rounded-lg border p-3">
    {#each categories as category (category)}
      <div>
        <h4 class="text-base-content/70 mb-2 text-sm font-medium">{category}</h4>
        <div class="grid grid-cols-6 gap-2">
          {#each iconOptions.filter((icon) => icon.category === category) as icon (icon.name)}
            {@const IconComponent = icon.component}
            <button
              type="button"
              class="btn btn-ghost btn-sm h-12 flex-col p-1"
              class:btn-primary={value === icon.name}
              onclick={() => onSelect(icon.name)}
              title={icon.name}
            >
              <IconComponent size={16} />
              <span class="text-xs leading-none">{icon.name.split('-')[0]}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <div class="label">
    <span class="label-text-alt">Choose an icon that represents this stat</span>
  </div>
</div>
