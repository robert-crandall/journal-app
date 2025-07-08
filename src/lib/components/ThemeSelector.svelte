<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon, Settings } from 'lucide-svelte';

  type Theme = 'light' | 'dark' | 'auto';
  let currentTheme = $state<Theme>('auto');

  function setTheme(theme: Theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    applyTheme();
  }

  function applyTheme() {
    const html = document.documentElement;

    if (currentTheme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      html.setAttribute('data-theme', currentTheme);
    }
  }

  onMount(() => {
    // Load saved theme or default to auto
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme = savedTheme;
    }

    applyTheme();

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (currentTheme === 'auto') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn btn-ghost btn-circle text-primary-content hover:bg-primary-content/10" data-testid="theme-selector-button">
    {#if currentTheme === 'light'}
      <Sun class="h-5 w-5" />
    {:else if currentTheme === 'dark'}
      <Moon class="h-5 w-5" />
    {:else}
      <Settings class="h-5 w-5" />
    {/if}
  </div>
  <ul class="dropdown-content menu bg-base-100 text-base-content rounded-box z-[2] w-32 p-2 shadow-lg border border-base-300" data-testid="theme-selector-dropdown">
    <li>
      <button onclick={() => setTheme('light')} class="flex items-center gap-2 text-base-content hover:bg-base-200" class:active={currentTheme === 'light'}>
        <Sun class="h-4 w-4" />
        Light
      </button>
    </li>
    <li>
      <button onclick={() => setTheme('dark')} class="flex items-center gap-2 text-base-content hover:bg-base-200" class:active={currentTheme === 'dark'}>
        <Moon class="h-4 w-4" />
        Dark
      </button>
    </li>
    <li>
      <button onclick={() => setTheme('auto')} class="flex items-center gap-2 text-base-content hover:bg-base-200" class:active={currentTheme === 'auto'}>
        <Settings class="h-4 w-4" />
        Auto
      </button>
    </li>
  </ul>
</div>
