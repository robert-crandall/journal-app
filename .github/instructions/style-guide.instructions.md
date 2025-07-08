---
description: Comprehensive style guide for the journal app UI design
applyTo: '**/*.{js,ts,svelte,css}'
---

# Journal App Style Guide

## Brand Identity

### Colors

#### Primary Color Palette
- **Primary**: `oklch(0.637 0.237 25.331)` - A rich blue that serves as the primary brand color
- **Secondary**: `oklch(0.637 0.237 330)` - A vibrant purple for accent elements
- **Accent**: `oklch(0.7 0.2 140)` - A refreshing green for highlights and success indicators

#### Color Shades
The app uses a consistent shade system for the primary brand colors:
- Brand-50 to Brand-900: Varying shades from lightest to darkest
- Primary content (text on primary): `oklch(0.98 0.01 25.331)`
- Secondary content (text on secondary): `oklch(0.98 0.01 330)`
- Accent content (text on accent): `oklch(0.98 0.01 140)`

#### Semantic Colors
- **Success**: Used for completed actions and positive indicators
- **Warning**: Used for alerts and important notices
- **Error**: Used for errors and destructive actions
- **Base-content**: Primary text color that adapts to light/dark modes

### Typography

#### Font Family
- **Primary Font**: 'Inter', system-ui, sans-serif
  - Used throughout the application with optimization for readability
  - Applied with antialiasing: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

#### Font Sizes
- **Headings**:
  - H1: `text-4xl` (2.25rem) - Page titles
  - H2: `text-3xl` (1.875rem) - Section headings
  - H3: `text-2xl` (1.5rem) - Card titles
  - H4: `text-xl` (1.25rem) - Component headings
  - H5: `text-lg` (1.125rem) - Subsection headings

- **Body Text**:
  - Regular: `text-base` (1rem)
  - Small: `text-sm` (0.875rem)
  - Extra Small: `text-xs` (0.75rem)

#### Font Weights
- **Bold**: `font-bold` - Used for headings, titles, and emphasis
- **Semibold**: `font-semibold` - Used for subheadings and important UI elements
- **Medium**: `font-medium` - Used for labels and semi-emphasized text
- **Regular**: Default weight for body text

## UI Components

### Gradients

#### Gradient Text
- The app uses gradient text for eye-catching titles and important headings
- Implementation: 
  ```css
  .text-gradient {
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-image: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  }
  ```
- Used primarily on landing page and key feature headings

#### Gradient Backgrounds
- Used for card backgrounds to create visual hierarchy
- Common patterns:
  - Header backgrounds: `from-primary/10 to-secondary/10 bg-gradient-to-br`
  - Info cards: `from-secondary/10 to-accent/10 bg-gradient-to-br`
  - Highlight containers: `from-accent/10 to-primary/10 bg-gradient-to-r`
- The transparency values (e.g., `/10`) create subtle, non-distracting gradients

### Cards & Containers

#### Card Styling
- **Standard Card**: `card bg-base-100 border-base-300 border shadow-xl`
- **Gradient Card**: `card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br`
- **Card Body Padding**: `p-6` (Desktop), `p-4` (Mobile)

#### Container Widths
- **Page Container**: `max-w-7xl mx-auto px-4`
- **Content Container**: `max-w-6xl mx-auto`
- **Narrow Container**: `max-w-2xl mx-auto`

### Buttons

#### Button Variations
- **Primary Button**: `btn btn-primary` - Main actions
- **Secondary Button**: `btn btn-secondary` - Alternative actions
- **Outline Button**: `btn btn-outline` - Secondary actions
- **Error Button**: `btn btn-error` - Destructive actions

#### Button Sizes
- **Large**: `btn-lg` - Primary page actions
- **Default**: Default size for most buttons
- **Small**: `btn-sm` - Compact UI areas

#### Button Enhancements
- **Hover Effects**: `transition-all duration-200 hover:scale-105` - Subtle enlargement
- **Icon + Text**: Use gap-2 to space icons and text: `gap-2`
- **Loading State**: Include loading spinner: `<span class="loading loading-spinner loading-sm"></span>`

### Forms

#### Input Styling
- **Text Input**: `input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]`
- **Textarea**: `textarea textarea-bordered textarea-lg focus:textarea-primary h-32 w-full resize-none transition-all duration-200 focus:scale-[1.02]`
- **Select**: `select select-bordered select-lg focus:select-primary w-full transition-all duration-200 focus:scale-[1.02]`
- **Checkbox**: `checkbox checkbox-primary`

#### Form Layout
- **Label**: `<span class="label-text font-medium">Label Text</span>`
- **Character Counter**: `<span class="label-text-alt text-xs opacity-60">0/100</span>`
- **Form Control**: `form-control` with labels and inputs grouped together
- **Form Groups**: Separated with `space-y-6` for visual separation

### Icons

- **Icon Size**: Consistent sizing based on context
  - Navigation: 20px to 24px
  - Button icons: 16px to 18px
  - Small indicators: 12px to 14px
- **Icon Placement**: Centered within containers using flex layout
- **Icon Style**: Line icons from Lucide icon set with consistent stroke-width

## Layout & Spacing

### Grid System
- **Page Layout**: Often uses `grid grid-cols-1 lg:grid-cols-3 gap-8` or similar
- **Content/Sidebar**: Content takes 2/3, sidebar takes 1/3 on desktop
- **Card Grids**: `grid grid-cols-1 md:grid-cols-2 gap-4` for responsive card layouts

### Spacing Scale
- Based on the Tailwind CSS spacing scale
- Commonly used values:
  - Extra small: `gap-2` (0.5rem)
  - Small: `gap-4` (1rem)
  - Medium: `gap-6` (1.5rem)
  - Large: `gap-8` (2rem)

### Whitespace Usage
- **Section Spacing**: `py-8` vertical padding between major sections
- **Card Internal Spacing**: `p-6` or `p-8` depending on content density
- **Form Field Spacing**: `space-y-6` between form fields
- **Button Groups**: `gap-4` between buttons in a group
- **List Items**: `space-y-3` between list items

## Responsive Design

### Breakpoints
- **Small (sm)**: 640px
- **Medium (md)**: 768px
- **Large (lg)**: 1024px
- **Extra Large (xl)**: 1280px
- **2X Large (2xl)**: 1536px

### Container Adaptations
- **Container Padding**: `px-4` on all screen sizes
- **Container Width**: 100% on small/medium screens, fixed widths on larger screens

### Mobile Optimizations
- **Stack Layouts**: Multi-column layouts stack vertically on mobile
- **Reduced Padding**: `p-4 sm:p-6 lg:p-8` - Progressive padding increases
- **Button Adaptations**: Full-width buttons on mobile: `w-full md:w-auto`

## Animation & Effects

### Shadows
- **Standard Shadow**: `shadow-xl` - For raised cards and components
- **Hover Shadow**: `shadow-2xl` - Enhanced shadow on hover

### Transitions
- **Hover Transitions**: `transition-all duration-200 hover:scale-[1.02]`
- **Loading Transitions**: Smooth fades between loading and loaded states
- **Animation Class**: `.hover-lift` for elements that slightly rise on hover

### Progress Indicators
- **Loading Spinners**: `<span class="loading loading-spinner loading-lg text-primary"></span>`
- **Progress Bars**: Gradient backgrounds with percentage indicators
- **Skeleton Loading**: Used for content placeholders

## Special Components

### Avatar Components
- **Avatar Styling**: `avatar placeholder`
- **Avatar Sizes**: `w-16 rounded-full` (large), `w-12 rounded-full` (medium)
- **Avatar Content**: Initials or icons centered within

### Badges
- **Standard Badge**: `badge badge-primary`
- **Small Badge**: `badge badge-xs`
- **Badge with Icon**: `badge gap-2` with small icon

### Status Indicators
- **Active Status**: Green dot with "Active" text
- **Progress Status**: Progress bars with percentage
- **Level Indicators**: Numbered or icon badges

## Design Best Practices

1. **Consistent Spacing**: Maintain consistent spacing within and between components
2. **Color Hierarchy**: Use primary color for main actions, secondary/accent for supporting elements
3. **Typography Scale**: Follow the established type scale for consistent text sizing
4. **Responsive Considerations**: Test all components across screen sizes
5. **Animation Subtlety**: Keep animations subtle and purposeful
6. **Gradient Usage**: Use gradients sparingly for emphasis
7. **Whitespace Utilization**: Embrace whitespace to improve readability and focus
8. **Shadow Consistency**: Apply shadows consistently to maintain depth hierarchy
