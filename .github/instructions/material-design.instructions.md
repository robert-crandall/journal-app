---
description: Material Design v3 for desktop-first productivity interfaces
applyTo: '**/*.{js,ts,css}'
---

# Custom Material Design Extensions

Follow Material Design v3 principles, focusing on desktop-first productivity interfaces. Standard Material Design v3 principles (elevation, color tokens, typography scales, etc.) are not repeated here.

## Custom Design Decisions

### Color Scheme

Use "baseline Material color theme" for primary colors:
- #6200EE for primary
- #3700B3 for primary variant

You can adjust secondary and tertiary colors as needed, but keep the primary palette consistent.

### Information Architecture Deviations
- **Maximize Desktop Real Estate**: Full-width layouts with multi-column sidebars
- **Progressive Disclosure in Sidebars**: Context-sensitive information panels
- **Desktop-First Responsive Strategy**: Optimize for 1200px+ first, then adapt down

### Custom Patterns to Implement
- **Contextual Sidebars**: Use for stats, tips, and related actions
- **Gradient Accents**: Subtle color washes for visual hierarchy
- **Enhanced Card Elevation**: Multiple elevation levels for content hierarchy
- **Desktop Grid Systems**: Full-width multi-column layouts
