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
    // Additional Fitness & Health
    Activity,
    Bike,
    Timer,
    Apple,
    Pill,
    Stethoscope,
    Weight,
    // Additional Mental & Learning
    GraduationCap,
    Lightbulb,
    BookMarked,
    PenTool,
    Calculator,
    Microscope,
    Trophy,
    // Additional Personal & Social
    Baby,
    MessageCircle,
    Phone,
    Mail,
    Calendar,
    Clock,
    // Additional Work & Career
    Laptop,
    Presentation,
    FileText,
    Folder,
    Rocket,
    Building,
    DollarSign,
    // Additional Hobbies & Recreation
    Plane,
    MapPin,
    Tent,
    Fish,
    TreePine,
    Waves,
    Sun,
    Snowflake,
    // Creative & Arts
    Brush,
    Scissors,
    Mic,
    Guitar,
    Film,
    Image,
    Sparkles,
    // Technology & Gaming
    Smartphone,
    Monitor,
    Keyboard,
    Mouse,
    Headphones,
    Wifi,
    Battery,
    // Food & Cooking
    ChefHat,
    Soup,
    Cookie,
    Wine,
    IceCream,
    Pizza,
    // Animals & Nature
    Dog,
    Cat,
    Bird,
    Leaf,
    Sprout,
    Bug,
    // Transportation
    Train,
    Ship,
    Bus,
    // Tools & Objects
    Hammer,
    Wrench,
    Key,
    Lock,
    Gift,
    Book,
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
    { name: 'activity', component: Activity, category: 'Fitness & Health' },
    { name: 'bike', component: Bike, category: 'Fitness & Health' },
    { name: 'timer', component: Timer, category: 'Fitness & Health' },
    { name: 'apple', component: Apple, category: 'Fitness & Health' },
    { name: 'utensils', component: Utensils, category: 'Fitness & Health' },
    { name: 'pill', component: Pill, category: 'Fitness & Health' },
    { name: 'stethoscope', component: Stethoscope, category: 'Fitness & Health' },
    { name: 'weight', component: Weight, category: 'Fitness & Health' },
    { name: 'bed', component: Bed, category: 'Fitness & Health' },

    // Mental & Learning
    { name: 'brain', component: Brain, category: 'Mental & Learning' },
    { name: 'book-open', component: BookOpen, category: 'Mental & Learning' },
    { name: 'graduation-cap', component: GraduationCap, category: 'Mental & Learning' },
    { name: 'lightbulb', component: Lightbulb, category: 'Mental & Learning' },
    { name: 'target', component: Target, category: 'Mental & Learning' },
    { name: 'trending-up', component: TrendingUp, category: 'Mental & Learning' },
    { name: 'book-marked', component: BookMarked, category: 'Mental & Learning' },
    { name: 'pen-tool', component: PenTool, category: 'Mental & Learning' },
    { name: 'calculator', component: Calculator, category: 'Mental & Learning' },
    { name: 'microscope', component: Microscope, category: 'Mental & Learning' },
    { name: 'trophy', component: Trophy, category: 'Mental & Learning' },
    { name: 'book', component: Book, category: 'Mental & Learning' },

    // Personal & Social
    { name: 'user', component: User, category: 'Personal & Social' },
    { name: 'users', component: Users, category: 'Personal & Social' },
    { name: 'home', component: Home, category: 'Personal & Social' },
    { name: 'shield', component: Shield, category: 'Personal & Social' },
    { name: 'baby', component: Baby, category: 'Personal & Social' },
    { name: 'user-heart', component: User, category: 'Personal & Social' },
    { name: 'message-circle', component: MessageCircle, category: 'Personal & Social' },
    { name: 'phone', component: Phone, category: 'Personal & Social' },
    { name: 'mail', component: Mail, category: 'Personal & Social' },
    { name: 'calendar', component: Calendar, category: 'Personal & Social' },
    { name: 'clock', component: Clock, category: 'Personal & Social' },

    // Work & Career
    { name: 'briefcase', component: Briefcase, category: 'Work & Career' },
    { name: 'zap', component: Zap, category: 'Work & Career' },
    { name: 'award', component: Award, category: 'Work & Career' },
    { name: 'star', component: Star, category: 'Work & Career' },
    { name: 'laptop', component: Laptop, category: 'Work & Career' },
    { name: 'presentation-chart', component: Presentation, category: 'Work & Career' },
    { name: 'file-text', component: FileText, category: 'Work & Career' },
    { name: 'folder', component: Folder, category: 'Work & Career' },
    { name: 'rocket', component: Rocket, category: 'Work & Career' },
    { name: 'building', component: Building, category: 'Work & Career' },
    { name: 'dollar-sign', component: DollarSign, category: 'Work & Career' },

    // Hobbies & Recreation
    { name: 'mountain', component: Mountain, category: 'Hobbies & Recreation' },
    { name: 'palette', component: Palette, category: 'Hobbies & Recreation' },
    { name: 'music', component: Music, category: 'Hobbies & Recreation' },
    { name: 'camera', component: Camera, category: 'Hobbies & Recreation' },
    { name: 'gamepad-2', component: Gamepad2, category: 'Hobbies & Recreation' },
    { name: 'coffee', component: Coffee, category: 'Hobbies & Recreation' },
    { name: 'car', component: Car, category: 'Hobbies & Recreation' },
    { name: 'plane', component: Plane, category: 'Hobbies & Recreation' },
    { name: 'map-pin', component: MapPin, category: 'Hobbies & Recreation' },
    { name: 'tent', component: Tent, category: 'Hobbies & Recreation' },
    { name: 'fish', component: Fish, category: 'Hobbies & Recreation' },
    { name: 'tree-pine', component: TreePine, category: 'Hobbies & Recreation' },
    { name: 'waves', component: Waves, category: 'Hobbies & Recreation' },

    // Creative & Arts
    { name: 'brush', component: Brush, category: 'Creative & Arts' },
    { name: 'scissors', component: Scissors, category: 'Creative & Arts' },
    { name: 'mic', component: Mic, category: 'Creative & Arts' },
    { name: 'guitar', component: Guitar, category: 'Creative & Arts' },
    { name: 'film', component: Film, category: 'Creative & Arts' },
    { name: 'image', component: Image, category: 'Creative & Arts' },
    { name: 'sparkles', component: Sparkles, category: 'Creative & Arts' },
    { name: 'flower', component: Flower, category: 'Creative & Arts' },

    // Technology & Gaming
    { name: 'smartphone', component: Smartphone, category: 'Technology & Gaming' },
    { name: 'monitor', component: Monitor, category: 'Technology & Gaming' },
    { name: 'keyboard', component: Keyboard, category: 'Technology & Gaming' },
    { name: 'mouse', component: Mouse, category: 'Technology & Gaming' },
    { name: 'headphones', component: Headphones, category: 'Technology & Gaming' },
    { name: 'wifi', component: Wifi, category: 'Technology & Gaming' },
    { name: 'battery', component: Battery, category: 'Technology & Gaming' },

    // Food & Cooking
    { name: 'chef-hat', component: ChefHat, category: 'Food & Cooking' },
    { name: 'soup', component: Soup, category: 'Food & Cooking' },
    { name: 'cookie', component: Cookie, category: 'Food & Cooking' },
    { name: 'wine', component: Wine, category: 'Food & Cooking' },
    { name: 'ice-cream', component: IceCream, category: 'Food & Cooking' },
    { name: 'pizza', component: Pizza, category: 'Food & Cooking' },

    // Animals & Nature
    { name: 'dog', component: Dog, category: 'Animals & Nature' },
    { name: 'cat', component: Cat, category: 'Animals & Nature' },
    { name: 'bird', component: Bird, category: 'Animals & Nature' },
    { name: 'leaf', component: Leaf, category: 'Animals & Nature' },
    { name: 'sprout', component: Sprout, category: 'Animals & Nature' },
    { name: 'bug', component: Bug, category: 'Animals & Nature' },
    { name: 'sun', component: Sun, category: 'Animals & Nature' },
    { name: 'snowflake', component: Snowflake, category: 'Animals & Nature' },

    // Transportation
    { name: 'train', component: Train, category: 'Transportation' },
    { name: 'ship', component: Ship, category: 'Transportation' },
    { name: 'bus', component: Bus, category: 'Transportation' },
    { name: 'bicycle', component: Bike, category: 'Transportation' },

    // Tools & Objects
    { name: 'hammer', component: Hammer, category: 'Tools & Objects' },
    { name: 'wrench', component: Wrench, category: 'Tools & Objects' },
    { name: 'key', component: Key, category: 'Tools & Objects' },
    { name: 'lock', component: Lock, category: 'Tools & Objects' },
    { name: 'gift', component: Gift, category: 'Tools & Objects' },
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
