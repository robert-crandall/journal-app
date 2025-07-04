---
description: Material Design 3 principles and component patterns for desktop-first responsive forms
applyTo: "frontend/**/*.{js,ts,svelte}"
---

# Material Design 3 (Material You) Guidelines

This document outlines our implementation of Material Design 3 principles adapted for desktop-first responsive web applications using Tailwind CSS and DaisyUI.

## Core Design Principles

### 1. Desktop-First Responsive Layout
- **Primary Layout**: Optimize for desktop screens (1200px+) first
- **Grid System**: Use CSS Grid with responsive breakpoints
- **Sidebars**: Utilize desktop space with informational sidebars and context panels
- **Mobile Adaptation**: Stack layouts vertically on smaller screens

### 2. Material Design 3 Form Components

#### Input Fields (Material Design Style)
```svelte
<!-- Standard Material Input Pattern -->
<div class="form-control">
  <label class="label" for="input-id">
    <span class="label-text font-medium">Field Label *</span>
    <span class="label-text-alt text-xs opacity-60">0/100</span>
  </label>
  <div class="relative">
    <input
      id="input-id"
      type="text"
      placeholder="Descriptive placeholder text"
      class="input input-bordered input-lg w-full transition-all duration-200 focus:input-primary focus:scale-[1.02]"
      bind:value={formData.field}
      maxlength="100"
      required
    />
    <!-- Icon positioned inside input -->
    <div class="absolute inset-y-0 right-3 flex items-center">
      <svg class="text-base-content/40" width="20" height="20">
        <!-- Icon SVG -->
      </svg>
    </div>
  </div>
</div>
```

#### Textarea Fields
```svelte
<div class="form-control">
  <label class="label" for="textarea-id">
    <span class="label-text font-medium">Field Label</span>
  </label>
  <div class="relative">
    <textarea
      id="textarea-id"
      class="textarea textarea-bordered textarea-lg h-32 w-full resize-none transition-all duration-200 focus:textarea-primary focus:scale-[1.02]"
      placeholder="Detailed placeholder explaining what to write here..."
      bind:value={formData.field}
    ></textarea>
  </div>
</div>
```

#### Select Dropdowns
```svelte
<div class="form-control">
  <label class="label" for="select-id">
    <span class="label-text font-medium">Selection Label *</span>
  </label>
  <div class="relative">
    <select
      id="select-id"
      class="select select-bordered select-lg w-full transition-all duration-200 focus:select-primary focus:scale-[1.02]"
      bind:value={selectedValue}
      required
    >
      <option value="">Choose an option...</option>
      <!-- Options -->
    </select>
    <div class="absolute inset-y-0 right-10 flex items-center pointer-events-none">
      <svg class="text-base-content/40" width="20" height="20">
        <!-- Icon SVG -->
      </svg>
    </div>
  </div>
</div>
```

### 3. Material Design Layout Patterns

#### Two-Column Form Layout
```svelte
<div class="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
  <!-- Main Content: 2/3 width on desktop -->
  <div class="lg:col-span-2">
    <div class="card bg-base-100 shadow-2xl border border-base-300">
      <div class="card-body p-8">
        <!-- Form content -->
      </div>
    </div>
  </div>
  
  <!-- Sidebar: 1/3 width on desktop -->
  <div class="lg:col-span-1">
    <div class="sticky top-8 space-y-6">
      <!-- Contextual information panels -->
    </div>
  </div>
</div>
```

#### Four-Column View Layout (Character View)
```svelte
<div class="grid lg:grid-cols-4 gap-8">
  <!-- Profile Sidebar: 1/4 width -->
  <div class="lg:col-span-1">
    <div class="card sticky top-8">
      <!-- Character profile -->
    </div>
  </div>
  
  <!-- Main Content: 3/4 width -->
  <div class="lg:col-span-3 space-y-8">
    <!-- Detailed content -->
  </div>
</div>
```

### 4. Material Design Visual Elements

#### Section Headers
```svelte
<h3 class="text-xl font-semibold text-primary border-b border-primary/20 pb-2">
  Section Title
</h3>
```

#### Elevated Cards with Gradients
```svelte
<!-- Primary Information Card -->
<div class="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
  <div class="card-body p-6">
    <!-- Content -->
  </div>
</div>

<!-- Standard Content Card -->
<div class="card bg-base-100 shadow-xl border border-base-300">
  <div class="card-body p-6">
    <!-- Content -->
  </div>
</div>
```

#### Avatar Components
```svelte
<!-- Character Avatar -->
<div class="avatar placeholder mb-6">
  <div class="bg-primary text-primary-content rounded-full w-24">
    <span class="text-3xl font-bold">
      {character.name.charAt(0).toUpperCase()}
    </span>
  </div>
</div>

<!-- Action Avatar (for forms) -->
<div class="avatar placeholder mb-4">
  <div class="bg-primary text-primary-content rounded-full w-16">
    <svg width="32" height="32">
      <!-- Icon SVG -->
    </svg>
  </div>
</div>
```

#### Material Buttons
```svelte
<!-- Primary Action Button -->
<button
  type="submit"
  class="btn btn-primary btn-lg w-full h-16 text-lg transition-all duration-200 hover:scale-[1.02] shadow-lg"
  disabled={loading}
>
  <!-- Button content -->
</button>

<!-- Secondary Actions -->
<button class="btn btn-outline btn-lg gap-2 transition-all duration-200 hover:scale-105">
  <!-- Button content -->
</button>
```

### 5. Interactive Animations

#### Micro-interactions
- **Form Focus**: `focus:scale-[1.02]` - Subtle scale on focus
- **Button Hover**: `hover:scale-105` - Lift effect on hover
- **Transitions**: `transition-all duration-200` - Smooth state changes

#### Loading States
```svelte
{#if loading}
  <span class="loading loading-spinner loading-md"></span>
  Loading text...
{:else}
  <!-- Normal content -->
{/if}
```

### 6. Information Architecture

#### Contextual Sidebars
- **Tips & Guidance**: Help users understand form fields
- **Live Preview**: Show real-time updates as users type
- **Related Information**: Provide context without cluttering main form
- **Progress Indicators**: Show what comes next

#### Content Hierarchy
1. **Page Header**: Large title with description
2. **Section Headers**: Clear separation of form sections
3. **Field Labels**: Descriptive and consistent
4. **Helper Text**: Contextual guidance
5. **Character Counts**: For limited fields

### 7. Responsive Behavior

#### Breakpoint Strategy
- **Desktop First**: Design for `lg:` (1024px+) screens primarily
- **Tablet**: Stack columns vertically on medium screens
- **Mobile**: Single column with full-width components

#### Grid Transformations
```svelte
<!-- Desktop: 3-column, Tablet/Mobile: 1-column -->
<div class="grid lg:grid-cols-3 gap-8">

<!-- Desktop: 4-column, Tablet/Mobile: 1-column -->
<div class="grid lg:grid-cols-4 gap-8">
```

### 8. Color and Theming

#### Color Semantic Usage
- **Primary**: Main actions, headers, key elements
- **Secondary**: Edit modes, secondary actions
- **Accent**: Progress, achievements, highlights
- **Base Content**: Regular text with opacity variations
- **Error**: Validation errors, destructive actions

#### Background Patterns
- **Page Background**: `bg-base-200` - Subtle contrast
- **Card Background**: `bg-base-100` - Clean content areas
- **Gradient Accents**: `from-primary/10 to-secondary/10` - Subtle highlights

## Implementation Examples

### Character Creation Form
✅ **Implemented Features:**
- Desktop-first 2/3 + 1/3 column layout
- Material Design form components with icons
- Contextual sidebar with tips and information
- Micro-animations and focus states
- Section-based form organization
- Live character count feedback

### Character View Page
✅ **Implemented Features:**
- Desktop-first 1/4 + 3/4 column layout
- Character profile sidebar with avatar
- Content cards with proper elevation
- Action buttons with hover effects
- Progress and stats visualization
- Edit mode with live preview

## Best Practices

### DO:
- Use the full width of desktop screens effectively
- Provide contextual information in sidebars
- Implement smooth micro-animations
- Use semantic color meanings consistently
- Group related form fields in sections
- Provide helpful placeholder text and guidance

### DON'T:
- Center narrow forms in the middle of wide screens
- Add redundant labels. A title and helper text are sufficient
- Overuse icons that don't add value
- Hide helpful information to save space
- Use jarring transitions or animations
- Mix different visual styles within the same component
- Create forms that are too wide for comfortable reading
- Forget to test on mobile devices

## Future Enhancements

Consider implementing:
- Progressive disclosure for complex forms
- Step-by-step wizards for longer processes
- Auto-save functionality with visual feedback
- Advanced validation with inline error messages
- Dark mode optimizations
- Accessibility improvements (ARIA labels, keyboard navigation)

This design system creates a modern, desktop-friendly interface that makes efficient use of screen real estate while maintaining excellent usability across all device sizes.
