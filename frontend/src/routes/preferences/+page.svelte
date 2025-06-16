<script lang="ts">
  import { onMount } from 'svelte';
  import { themeStore, THEMES, type Theme } from '$lib/stores/theme';
  import { journalApi, userPreferencesSchema, type UserPreferencesInput } from '$lib/api/client';
  import { Palette, Bell, Mail, Save, Monitor } from 'lucide-svelte';

  let currentTheme = $derived($themeStore);
  let theme = $state<string>('');
  let accentColor = $state<string>('blue');
  let timezone = $state<string>('UTC');
  let isLoading = $state(true);
  let isSaving = $state(false);
  let errors = $state<Record<string, string>>({});
  let successMessage = $state('');

  onMount(async () => {
    // Set current theme
    theme = currentTheme;
    
    // Load user preferences from API
    try {
      const response = await journalApi.getPreferences();
      if (response.success && response.data) {
        const prefs = response.data;
        if (prefs.theme) {
          theme = prefs.theme;
        }
        if (prefs.accentColor) {
          accentColor = prefs.accentColor;
        }
        if (prefs.timezone) {
          timezone = prefs.timezone;
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      isLoading = false;
    }
  });

  function handleThemeChange(newTheme: Theme) {
    theme = newTheme;
    themeStore.setTheme(newTheme);
  }

  async function handleSubmit() {
    if (isSaving) return;
    
    isSaving = true;
    errors = {};
    successMessage = '';

    try {
      const preferencesData: UserPreferencesInput = {
        theme: theme as UserPreferencesInput['theme'],
        accentColor: accentColor as UserPreferencesInput['accentColor'],
        timezone: timezone || 'UTC'
      };

      // Update preferences
      const response = await journalApi.updatePreferences(preferencesData);
      
      if (response.success) {
        successMessage = 'Preferences saved successfully';
      } else {
        errors.general = response.error || 'Failed to save preferences';
      }
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        error.issues.forEach((issue: any) => {
          errors[issue.path[0]] = issue.message;
        });
      } else {
        errors.general = error.message || 'An unexpected error occurred';
      }
    } finally {
      isSaving = false;
    }
  }

  // Clear messages when user makes changes
  $effect(() => {
    if (theme || accentColor || timezone) {
      successMessage = '';
      errors.general = '';
    }
  });

  // Theme preview data
  const popularThemes: Theme[] = ['light', 'dark', 'cupcake', 'emerald', 'corporate', 'synthwave', 'retro', 'dracula'];
  const allThemes = THEMES;
</script>

<svelte:head>
  <title>Preferences - Journal App</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
  <!-- Theme Selection -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title flex items-center gap-2">
        <Palette size={24} />
        Theme & Appearance
      </h2>
      <p class="text-base-content/70 mb-6">
        Choose a theme that suits your style. Changes apply immediately.
      </p>

      {#if isLoading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else}
        <!-- Popular themes -->
        <div class="mb-6">
          <h3 class="font-semibold mb-3">Popular Themes</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            {#each popularThemes as themeName}
              <button
                class="btn btn-outline justify-start"
                class:btn-active={theme === themeName}
                onclick={() => handleThemeChange(themeName)}
              >
                <div class="w-4 h-4 rounded mr-2" data-theme={themeName} style="background: oklch(var(--p))"></div>
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </button>
            {/each}
          </div>
        </div>

        <!-- All themes -->
        <div class="collapse collapse-arrow bg-base-200">
          <input type="checkbox" />
          <div class="collapse-title text-xl font-medium">
            All Themes ({allThemes.length} available)
          </div>
          <div class="collapse-content">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {#each allThemes as themeName}
                <button
                  class="btn btn-sm btn-outline justify-start"
                  class:btn-active={theme === themeName}
                  onclick={() => handleThemeChange(themeName)}
                >
                  <div class="w-3 h-3 rounded mr-2" data-theme={themeName} style="background: oklch(var(--p))"></div>
                  {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Accent Color Settings -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title flex items-center gap-2">
        <Palette size={24} />
        Accent Color
      </h2>
      <p class="text-base-content/70 mb-6">
        Choose your preferred accent color for the app interface.
      </p>

      {#if isLoading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="form-control">
            <label class="label" for="accentColor">
              <span class="label-text">Accent Color</span>
            </label>
            <select
              id="accentColor"
              class="select select-bordered"
              bind:value={accentColor}
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="pink">Pink</option>
              <option value="indigo">Indigo</option>
              <option value="teal">Teal</option>
            </select>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Timezone Settings -->
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title flex items-center gap-2">
        <Monitor size={24} />
        Timezone
      </h2>
      <p class="text-base-content/70 mb-6">
        Set your local timezone for accurate timestamps and scheduling.
      </p>

      {#if isLoading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="form-control">
            <label class="label" for="timezone">
              <span class="label-text">Timezone</span>
            </label>
            <input
              id="timezone"
              type="text"
              placeholder="UTC"
              class="input input-bordered"
              bind:value={timezone}
            />
            <div class="label">
              <span class="label-text-alt text-base-content/60">
                Enter your timezone (e.g., UTC, America/New_York, Europe/London)
              </span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Save Changes -->
  {#if !isLoading}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- Success message -->
        {#if successMessage}
          <div class="alert alert-success mb-4">
            <span>{successMessage}</span>
          </div>
        {/if}

        <!-- General error -->
        {#if errors.general}
          <div class="alert alert-error mb-4">
            <span>{errors.general}</span>
          </div>
        {/if}

        <button
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={isSaving}
        >
          {#if isSaving}
            <span class="loading loading-spinner loading-sm"></span>
            Saving...
          {:else}
            <Save size={20} />
            Save Preferences
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
