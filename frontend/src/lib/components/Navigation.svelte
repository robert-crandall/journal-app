<script lang="ts">
  import { authStore, type User } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import ThemeController from './ThemeController.svelte';
  import AvatarDisplay from './AvatarDisplay.svelte';

  let user: User | null = null;
  let token: string | null = null;

  // Subscribe to auth store
  authStore.subscribe((state) => {
    user = state.user;
    token = state.token;
  });

  // Handle logout and close dropdown
  function handleLogout() {
    authStore.clearAuth();
    // Close dropdown by removing the open attribute from details
    const details = document.querySelector('details.dropdown');
    if (details) {
      details.removeAttribute('open');
    }
    goto('/');
  }

  // Close dropdown when navigation link is clicked
  function closeDropdown() {
    const details = document.querySelector('details.dropdown');
    if (details) {
      details.removeAttribute('open');
    }
  }
</script>

<header class="navbar bg-primary text-primary-content border-base-200 sticky top-0 z-30 border-b shadow-sm">
  <div class="navbar-start">
    <a href="/" class="btn btn-ghost text-primary-content text-xl font-semibold">Life Quest</a>
  </div>

  <div class="navbar-end">
    <div class="text-base-content">
      <ThemeController />
    </div>

    {#if user}
      <!-- Desktop navigation links - show most important ones -->
      <div class="hidden lg:flex">
        <a href="/character" class="btn btn-ghost text-primary-content hover:bg-primary/80">Character</a>
        <a href="/journal" class="btn btn-ghost text-primary-content hover:bg-primary/80">Journal</a>
        <a href="/journals" class="btn btn-ghost text-primary-content hover:bg-primary/80">Dashboard</a>
        <a href="/goals" class="btn btn-ghost text-primary-content hover:bg-primary/80">Goals</a>
        <a href="/plans" class="btn btn-ghost text-primary-content hover:bg-primary/80">Plans</a>
        <a href="/quests" class="btn btn-ghost text-primary-content hover:bg-primary/80">Quests</a>
        <a href="/experiments" class="btn btn-ghost text-primary-content hover:bg-primary/80">Experiments</a>
        <a href="/stats" class="btn btn-ghost text-primary-content hover:bg-primary/80">Stats</a>
      </div>

      <!-- User dropdown menu using DaisyUI Method 1 (details/summary) -->
      <details class="dropdown dropdown-end">
        <summary id="nav-menu-btn" class="btn btn-ghost btn-circle" aria-label="Open menu">
          <!-- User Avatar -->
          <AvatarDisplay avatar={user.avatar} name={user.name} size="sm" clickable />
        </summary>

        <ul id="nav-menu" class="dropdown-content menu bg-base-100 rounded-box border-base-200 z-40 w-64 border p-2 shadow" aria-label="User menu">
          <li class="menu-title">
            <span class="text-xs">Signed in as <strong>{user.email}</strong></span>
          </li>
          <div class="divider my-2"></div>

          <!-- Mobile-only: Show additional nav links in user menu -->
          <div class="lg:hidden">
            <li class="menu-title">
              <span class="text-xs">Quick Navigation</span>
            </li>
            <li>
              <a href="/character" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
                >
                Character
              </a>
            </li>
            <li>
              <a href="/journal" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg
                >
                Journal
              </a>
            </li>
            <li>
              <a href="/journals" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  ><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line
                    x1="3"
                    x2="21"
                    y1="10"
                    y2="10"
                  /><path d="m9 16 2 2 4-4" /></svg
                >
                Journal Dashboard
              </a>
            </li>
            <li>
              <a href="/goals" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg
                >
                Goals
              </a>
            </li>
            <li>
              <a href="/plans" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><path d="M9 5H2L5 3h4l3 2" /><path d="M7 3h5l5 2v8c0 1-1 2-2 2H9c-1 0-2-1-2-2Z" /></svg
                >
                Plans
              </a>
            </li>
            <li>
              <a href="/quests" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="9" /></svg
                >
                Quests
              </a>
            </li>
            <li>
              <a href="/experiments" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  ><path
                    d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"
                  /></svg
                >
                Experiments
              </a>
            </li>
            <li>
              <a href="/stats" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg
                >
                Stats
              </a>
            </li>
            <li>
              <a href="/family" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  ><path d="m9 12 2 2 4-4" /><path d="M21 5c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2s.9-2 2-2h14c1.1 0 2 .9 2 2Z" /><path d="M17 17H7l4 4 4-4Z" /></svg
                >
                Family
              </a>
            </li>
            <li>
              <a href="/focus" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" /></svg
                >
                Focus
              </a>
            </li>
            <li>
              <a href="/attributes" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
                >
                Attributes
              </a>
            </li>
            <li>
              <a href="/profile" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
                >
                Profile
              </a>
            </li>
            <div class="divider my-2"></div>
          </div>

          <!-- Desktop: Show secondary nav links in user menu -->
          <div class="hidden lg:block">
            <li class="menu-title">
              <span class="text-xs">More Features</span>
            </li>
            <li>
              <a href="/family" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  ><path d="m9 12 2 2 4-4" /><path d="M21 5c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2s.9-2 2-2h14c1.1 0 2 .9 2 2Z" /><path d="M17 17H7l4 4 4-4Z" /></svg
                >
                Family
              </a>
            </li>
            <li>
              <a href="/focus" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" /></svg
                >
                Focus
              </a>
            </li>
            <li>
              <a href="/attributes" class="text-base-content" on:click={closeDropdown}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
                >
                Attributes
              </a>
            </li>
            <div class="divider my-2"></div>
          </div>

          <li>
            <a href="/profile" class="text-base-content" on:click={closeDropdown}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
              >
              Profile
            </a>
          </li>

          <li>
            <button class="text-error hover:bg-error hover:text-error-content" on:click={handleLogout}>
              <!-- Lucide LogOut Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
                ><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg
              >
              Sign out
            </button>
          </li>
        </ul>
      </details>
    {:else}
      <a href="/login" class="btn btn-ghost text-primary-content hover:bg-primary/80">Login</a>
      <a href="/register" class="btn btn-secondary">Register</a>
    {/if}
  </div>
</header>
