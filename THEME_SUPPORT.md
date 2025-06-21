# DaisyUI Theme Support

The journal app now supports all DaisyUI themes! Here's what's been added:

## Available Themes

All 33 DaisyUI themes are now supported:
- **Light themes**: light, cupcake, bumblebee, emerald, corporate, retro, valentine, garden, aqua, lofi, pastel, fantasy, wireframe, cmyk, autumn, business, acid, lemonade, winter, nord, sunset
- **Dark themes**: dark, synthwave, halloween, forest, black, luxury, dracula, night, coffee, dim
- **Auto**: Automatically switches between light and dark based on system preference

## Usage

### Theme Store

```typescript
import { theme, availableThemes } from '$lib/stores/theme';

// Get current theme
const currentTheme = $theme;

// Set a theme
await theme.setTheme('dracula', isAuthenticated);

// Initialize theme (usually in layout)
await theme.init(isAuthenticated);
```

### Theme Picker Component

A reusable theme picker component is available:

```svelte
<script>
  import ThemePicker from '$lib/components/ThemePicker.svelte';
</script>

<!-- Basic usage -->
<ThemePicker />

<!-- Customized -->
<ThemePicker size="sm" columns={6} showLabels={false} />
```

### Settings Page

The settings page now shows all available themes in a responsive grid with:
- Theme previews
- Descriptive icons
- Responsive layout (1-4 columns based on screen size)
- Proper theme persistence (localStorage + backend sync)

## Technical Details

### CSS Configuration

All themes are configured in `app.css`:

```css
@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark,
    cupcake,
    /* ... all other themes ... */
    sunset;
}
```

### Dark Mode Handling

The theme system automatically applies Tailwind's `dark` class for themes that are considered dark:

- **Dark themes**: dark, synthwave, halloween, forest, black, luxury, dracula, night, coffee, dim
- **Light themes**: All others

This ensures proper compatibility with custom Tailwind dark mode styles.

### Backend Integration

- Themes are stored in the backend preferences system
- Offline support via localStorage fallback
- Automatic sync when user is authenticated

## Examples

### Quick Theme Switching in Debug Mode

The `ThemeDebug` component now includes quick access to popular themes:

```svelte
<ThemeDebug /> <!-- Shows current theme state + quick theme buttons -->
```

### Custom Theme Integration

You can easily add custom theme handling:

```typescript
import { theme } from '$lib/stores/theme';

// Listen to theme changes
theme.subscribe((currentTheme) => {
  console.log('Theme changed to:', currentTheme);
  // Custom logic here
});
```

The theme system is fully type-safe and includes all the new themes in the TypeScript definitions.
