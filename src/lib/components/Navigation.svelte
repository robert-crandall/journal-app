<script lang="ts">
  import { page } from '$app/stores';
  import ThemeSelector from './ThemeSelector.svelte';
  import type { User } from '$lib/server/db/schema.js';

  let { user }: { user: User } = $props();
</script>

<div class="navbar bg-primary text-primary-content shadow-lg">
  <div class="flex-1">
    <a href="/dashboard" class="btn btn-ghost text-xl font-bold text-primary-content hover:bg-primary-content/10">Life Quest</a>
  </div>
  <div class="flex-none gap-2">
    <ThemeSelector />
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar text-primary-content hover:bg-primary-content/10" data-testid="user-avatar-button">
        <div class="bg-primary-content text-primary flex w-10 items-center justify-center rounded-full font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <ul class="menu menu-sm dropdown-content bg-base-100 text-base-content rounded-box z-[1] mt-3 w-52 p-2 shadow-lg border border-base-300" data-testid="user-dropdown-menu">
        <li class="menu-title text-base-content">{user.name}</li>
        <li class:disabled={$page.url.pathname === '/dashboard'}>
          <a href="/dashboard" class="text-base-content hover:bg-base-200">Dashboard</a>
        </li>
        <li class:disabled={$page.url.pathname === '/character'}>
          <a href="/character" class="text-base-content hover:bg-base-200">Character</a>
        </li>
        <li class:disabled={$page.url.pathname.startsWith('/stats')}>
          <a href="/stats" class="text-base-content hover:bg-base-200">Stats</a>
        </li>
        <li class:disabled={$page.url.pathname.startsWith('/goals')}>
          <a href="/goals" class="text-base-content hover:bg-base-200">Goals</a>
        </li>
        <li>
          <form method="POST" action="/logout">
            <button type="submit" class="w-full text-left text-base-content hover:bg-base-200">Logout</button>
          </form>
        </li>
      </ul>
    </div>
  </div>
</div>
