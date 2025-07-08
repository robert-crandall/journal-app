---
description: Clean Material Dashboard design principles and component patterns for desktop-first responsive interfaces
applyTo: '**/*.{js,ts,css}'
---

# Clean Material Dashboard Guidelines

This document outlines our "Clean Material Dashboard" design system - a modern productivity interface that combines Material Design 3 principles with clean dashboard aesthetics, optimized for desktop-first responsive web applications.

## Design Philosophy

### Color Scheme

- **Primary**: `#6200ea` (deep purple)

### Key Design Characteristics

1. **Elevated Card-Based Layout** - Content feels like it floats above the background
2. **Subtle Gradient Accents** - Soft color washes for visual hierarchy without distraction  
3. **Desktop-First Grid System** - Makes full use of wide screens with intelligent sidebars
4. **Micro-Interactions** - Gentle hover effects and transitions that feel responsive
5. **Semantic Color System** - Colors have meaning (primary for actions, accent for progress, etc.)
6. **Material-Style Components** - Inputs, buttons, and cards follow Material Design principles
7. **Bold Color Choices** - Use of dark purple as a base color with complementary accents
8. **Whitespace and Typography** - Generous spacing and large, readable fonts for clarity
9. **Responsive Design** - Adapts gracefully to different screen sizes, maintaining usability
10. **Contextual Sidebars** - Provide additional information without cluttering main content

## Layout Patterns

### Goals Dashboard Layout (4-Column Grid)
  - Header with gradient accent
  - Main content area
    - Goals grid: 3/4 width
      - Goal cards
    - Contextual sidebar: 1/4 width
      - Stats, tips, actions

### Form Layout (2/3 + 1/3 Split)

- Main form: 2/3 width
  - Form content (Material-style inputs, buttons)
- Contextual sidebar: 1/3 width
  - Tips, preview, related info

## Component Patterns

### Elevated Cards

- Primary information card with gradient
  - Important content
- Standard content card, different color than background
  - Regular content

### Interactive Buttons

- Primary action with lift effect
- Secondary action without lift

### Form Components

- Material-style input with subtle focus scaling

## Color & Visual System

### Semantic Color Usage

- **Primary (`text-primary`, `btn-primary`)**: Main actions, headers, key interactive elements
- **Secondary (`text-secondary`)**: Edit modes, secondary actions, supporting elements  
- **Accent (`text-accent`)**: Progress indicators, achievements, highlights
- **Base Content (`text-base-content`)**: Regular text with opacity variations for hierarchy
- **Error**: Validation errors, destructive actions

### Background Hierarchy

- Page background: subtle contrast
- Card backgrounds: clean content areas
- Accent gradients: gentle visual emphasis

### Micro-Interactions

- Form focus: subtle scale increase
- Button hover: gentle lift effect
- Card hover: enhanced elevation

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
