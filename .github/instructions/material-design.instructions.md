---
description: Clean Material Dashboard design principles and component patterns for desktop-first responsive interfaces
applyTo: '**/*.{js,ts,css}'
---

# Clean Material Dashboard Guidelines

This document outlines our "Clean Material Dashboard" design system - a modern productivity interface that combines Material Design 3 principles with clean dashboard aesthetics, optimized for desktop-first responsive web applications.

## Design Philosophy

### Target User & Aesthetic

- **Primary User**: INTJ personality who prefers clean, efficient interfaces over flashy designs
- **Core Philosophy**: Minimalist productivity interface with maximum information density
- **Visual Style**: "Clean Material Dashboard" - elevated cards, subtle gradients, semantic colors
- **Inspiration**: Modern productivity apps like Linear, Notion, Google Workspace

### Key Design Characteristics

1. **Elevated Card-Based Layout** - Content feels like it floats above the background
2. **Subtle Gradient Accents** - Soft color washes for visual hierarchy without distraction  
3. **Desktop-First Grid System** - Makes full use of wide screens with intelligent sidebars
4. **Micro-Interactions** - Gentle hover effects and transitions that feel responsive
5. **Semantic Color System** - Colors have meaning (primary for actions, accent for progress, etc.)

## Layout Patterns

### Goals Dashboard Layout (4-Column Grid)

```svelte
<div class="bg-base-200 min-h-screen">
  <!-- Header with gradient accent -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Goals Dashboard</h1>
          <p class="text-base-content/70 text-lg">Define and track your personal objectives</p>
        </div>
        <button class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
          <Plus size={20} />
          Create Goal
        </button>
      </div>
    </div>
  </div>

  <!-- Main content area -->
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="grid gap-8 lg:grid-cols-4">
      <!-- Goals grid: 3/4 width -->
      <div class="lg:col-span-3">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Goal cards -->
        </div>
      </div>

      <!-- Contextual sidebar: 1/4 width -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Stats, tips, actions -->
      </div>
    </div>
  </div>
</div>
```

### Form Layout (2/3 + 1/3 Split)

```svelte
<div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
  <!-- Main form: 2/3 width -->
  <div class="lg:col-span-2">
    <div class="card bg-base-100 border-base-300 border shadow-2xl">
      <div class="card-body p-8">
        <!-- Form content -->
      </div>
    </div>
  </div>

  <!-- Contextual sidebar: 1/3 width -->
  <div class="lg:col-span-1">
    <div class="sticky top-8 space-y-6">
      <!-- Tips, preview, related info -->
    </div>
  </div>
</div>
```

## Component Patterns

### Elevated Cards

```svelte
<!-- Primary information card with gradient -->
<div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
  <div class="card-body p-6">
    <!-- Important content -->
  </div>
</div>

<!-- Standard content card -->
<div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
  <div class="card-body p-6">
    <!-- Regular content -->
  </div>
</div>
```

### Interactive Buttons

```svelte
<!-- Primary action with lift effect -->
<button class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
  <Icon size={20} />
  Action Text
</button>

<!-- Secondary action -->
<button class="btn btn-outline btn-lg gap-2 transition-all duration-200 hover:scale-105">
  Content
</button>
```

### Form Components

```svelte
<!-- Material-style input with subtle focus scaling -->
<div class="form-control">
  <label class="label" for="input-id">
    <span class="label-text font-medium">Field Label *</span>
    <span class="label-text-alt text-xs opacity-60">0/100</span>
  </label>
  <input
    id="input-id"
    type="text"
    placeholder="Clear, helpful placeholder text"
    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
    bind:value={formData.field}
    maxlength="100"
    required
  />
</div>
```

## Color & Visual System

### Semantic Color Usage

- **Primary (`text-primary`, `btn-primary`)**: Main actions, headers, key interactive elements
- **Secondary (`text-secondary`)**: Edit modes, secondary actions, supporting elements  
- **Accent (`text-accent`)**: Progress indicators, achievements, highlights
- **Base Content (`text-base-content`)**: Regular text with opacity variations for hierarchy
- **Error**: Validation errors, destructive actions

### Background Hierarchy

```svelte
<!-- Page background: subtle contrast -->
<div class="bg-base-200 min-h-screen">

<!-- Card backgrounds: clean content areas -->
<div class="bg-base-100">

<!-- Accent gradients: gentle visual emphasis -->
<div class="from-primary/10 to-secondary/10 bg-gradient-to-br">
```

### Micro-Interactions

```svelte
<!-- Form focus: subtle scale increase -->
class="focus:scale-[1.02] transition-all duration-200"

<!-- Button hover: gentle lift effect -->
class="hover:scale-105 transition-all duration-200"

<!-- Card hover: enhanced elevation -->
class="hover:shadow-2xl transition-all duration-200"
```

## Information Architecture

### Content Hierarchy

1. **Page Headers**: Large titles with descriptive subtitles
2. **Section Separation**: Clean borders and spacing
3. **Card Organization**: Related content grouped in elevated containers
4. **Contextual Sidebars**: Supporting information without main content clutter
5. **Progressive Disclosure**: Important info visible, details accessible

### Responsive Strategy

- **Desktop First**: Optimize for 1200px+ screens with multi-column layouts
- **Tablet Adaptation**: Stack columns vertically, maintain card structure
- **Mobile Optimization**: Single column, full-width components, touch-friendly sizing

## Implementation Guidelines

### DO:

- **Maximize Desktop Real Estate**: Use full screen width with intelligent sidebars
- **Create Visual Hierarchy**: Use elevation, color, and spacing to guide attention
- **Implement Gentle Interactions**: Subtle hover effects that feel responsive
- **Group Related Content**: Use cards to create clear content boundaries
- **Provide Contextual Information**: Use sidebars for tips, stats, and related data

### DON'T:

- **Center Narrow Content**: Avoid wasting desktop screen space
- **Overuse Animations**: Keep interactions subtle and purposeful
- **Mix Visual Styles**: Maintain consistency in elevation, spacing, and color usage
- **Hide Important Information**: Make key actions and data easily discoverable
- **Create Jarring Transitions**: All animations should feel smooth and natural

## Example Implementations

### Goals Dashboard ✅
- 4-column responsive grid layout
- Elevated goal cards with hover effects
- Contextual sidebar with stats and actions
- Gradient header with clear hierarchy
- Semantic color usage throughout

### Character Forms ✅
- 2/3 + 1/3 column split for desktop
- Material-style form components
- Live preview and contextual tips
- Section-based organization
- Micro-animations on focus/hover

## Style References

This design system creates what can be called:
- **"Clean Material Dashboard"**
- **"Modern Productivity Interface"** 
- **"Elevated Card Interface"**
- **"Desktop-First Material Design"**

The aesthetic prioritizes clarity, efficiency, and professional appearance over flashy visual effects - perfect for productivity applications where users need to focus on content and tasks rather than interface decoration.
