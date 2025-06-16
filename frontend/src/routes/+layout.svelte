<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { themeStore } from '$lib/stores/theme';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Menu, Sun, Moon, Settings, LogOut, User } from 'lucide-svelte';

  let { children } = $props();
  
  let isAuthenticated = $derived($authStore.isAuthenticated);
  let user = $derived($authStore.user);
  let currentTheme = $derived($themeStore);
  let isLoading = $derived($authStore.isLoading);
  
  // Protected routes that require authentication
  const protectedRoutes = ['/profile', '/context', '/preferences'];
  const authRoutes = ['/login', '/register', '/forgot-password'];
  
  onMount(() => {
    // Initialize stores
    themeStore.init();
    authStore.init();
  });

  // Redirect logic
  $effect(() => {
    if (!isLoading) {
      const currentPath = $page.url.pathname;
      
      if (!isAuthenticated && protectedRoutes.some(route => currentPath.startsWith(route))) {
        goto('/login');
      } else if (isAuthenticated && authRoutes.includes(currentPath)) {
        goto('/');
      }
    }
  });

  async function handleLogout() {
    await authStore.logout();
    goto('/');
  }

  function toggleTheme() {
    themeStore.toggle();
  }
</script>

<div class="min-h-screen bg-base-100">
  <!-- Navigation -->
  <div class="navbar bg-base-100 border-b border-base-300">
    <div class="navbar-start">
      <div class="dropdown lg:hidden">
        <div tabindex="0" role="button" class="btn btn-ghost">
          <Menu size={20} />
        </div>
        <ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
          <li><a href="/">Home</a></li>
          {#if isAuthenticated}
            <li><a href="/profile">Profile</a></li>
            <li><a href="/context">Context</a></li>
            <li><a href="/preferences">Preferences</a></li>
          {/if}
        </ul>
      </div>
      <a href="/" class="btn btn-ghost text-xl">Journal App</a>
    </div>

    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        <li><a href="/">Home</a></li>
        {#if isAuthenticated}
          <li><a href="/profile">Profile</a></li>
          <li><a href="/context">Context</a></li>
          <li><a href="/preferences">Preferences</a></li>
        {/if}
      </ul>
    </div>

    <div class="navbar-end">
      <!-- Theme toggle -->
      <button class="btn btn-ghost btn-circle" onclick={toggleTheme}>
        {#if currentTheme === 'light'}
          <Moon size={20} />
        {:else}
          <Sun size={20} />
        {/if}
      </button>

      {#if isAuthenticated && user}
        <!-- User menu -->
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <User size={20} />
          </div>
          <ul class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li class="menu-title">
              <span>{user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.email}</span>
            </li>
            <li><a href="/profile"><User size={16} class="inline" /> Profile</a></li>
            <li><a href="/preferences"><Settings size={16} class="inline" /> Preferences</a></li>
            <li><button onclick={handleLogout}><LogOut size={16} class="inline" /> Logout</button></li>
          </ul>
        </div>
      {:else if !isLoading}
        <!-- Auth buttons -->
        <div class="flex gap-2">
          <a href="/login" class="btn btn-ghost">Login</a>
          <a href="/register" class="btn btn-primary">Sign Up</a>
        </div>
      {/if}
    </div>
  </div>

  <!-- Main content -->
  <main class="container mx-auto px-4 py-8">
    {#if isLoading}
      <div class="flex justify-center items-center min-h-[50vh]">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    {:else}
      {@render children()}
    {/if}
  </main>
</div>
