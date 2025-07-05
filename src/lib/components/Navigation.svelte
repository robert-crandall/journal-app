<script lang="ts">
	import { page } from '$app/stores';
	import ThemeSelector from './ThemeSelector.svelte';
	import type { User } from '$lib/server/db/schema.js';

	let { user }: { user: User } = $props();
</script>

<div class="navbar bg-base-100 shadow-lg">
	<div class="flex-1">
		<a href="/dashboard" class="btn btn-ghost text-xl">Journal App</a>
	</div>
	<div class="flex-none gap-2">
		<ThemeSelector />
		<div class="dropdown dropdown-end">
			<div
				tabindex="0"
				role="button"
				class="btn btn-ghost btn-circle avatar"
				data-testid="user-avatar-button"
			>
				<div
					class="bg-primary text-primary-content flex w-10 items-center justify-center rounded-full"
				>
					{user.name.charAt(0).toUpperCase()}
				</div>
			</div>
			<ul
				class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
				data-testid="user-dropdown-menu"
			>
				<li class="menu-title">{user.name}</li>
				<li class:disabled={$page.url.pathname === '/dashboard'}>
					<a href="/dashboard">Dashboard</a>
				</li>
				<li class:disabled={$page.url.pathname === '/character'}>
					<a href="/character">Character</a>
				</li>
				<li class:disabled={$page.url.pathname.startsWith('/stats')}>
					<a href="/stats">Stats</a>
				</li>
				<li>
					<form method="POST" action="/logout">
						<button type="submit" class="w-full text-left">Logout</button>
					</form>
				</li>
			</ul>
		</div>
	</div>
</div>
