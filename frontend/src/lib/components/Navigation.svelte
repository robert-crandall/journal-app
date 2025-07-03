<script lang="ts">
import { authStore, type User } from '$lib/stores/auth';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import ThemeToggle from './ThemeToggle.svelte';

let user: User | null = null;
let token: string | null = null;
let menuOpen = false;

// Close menu on outside click
function handleClickOutside(event: MouseEvent) {
	const menu = document.getElementById('nav-menu');
	const button = document.getElementById('nav-menu-btn');
	if (menuOpen && menu && !menu.contains(event.target as Node) && button && !button.contains(event.target as Node)) {
		menuOpen = false;
	}
}

onMount(() => {
	document.addEventListener('mousedown', handleClickOutside);
	return () => document.removeEventListener('mousedown', handleClickOutside);
});

// Subscribe to auth store
authStore.subscribe((state) => {
	user = state.user;
	token = state.token;
});

// Handle logout
function handleLogout() {
	authStore.clearAuth();
	goto('/');
}
</script>

<header
	class="sticky top-0 z-30 flex items-center justify-between px-6 py-4 shadow-sm bg-indigo-600"
>
	<a
		href="/"
		class="flex items-center gap-2 text-xl font-semibold text-white hover:opacity-90"
	>
		<span>Journal App</span>
	</a>
	<nav class="flex items-center gap-4">
		{#if user}
			<a
				href="/journal"
				class="px-4 py-2 font-medium text-white transition hover:text-indigo-100 hidden md:inline-block"
				>Journal</a
			>
			<a
				href="/challenges"
				class="px-4 py-2 font-medium text-white transition hover:text-indigo-100 hidden md:inline-block"
				>Challenges</a
			>
			<a
				href="/stats"
				class="px-4 py-2 font-medium text-white transition hover:text-indigo-100 hidden md:inline-block"
				>Stats</a
			>
			<!-- Theme toggle before hamburger menu -->
			<ThemeToggle />

			<!-- Hamburger menu button -->
			<button
				id="nav-menu-btn"
				class="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-700 text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-white"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				aria-controls="nav-menu"
				on:click={() => (menuOpen = !menuOpen)}
			>
				{#if !menuOpen}
					<!-- Lucide Menu Icon -->
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
				{:else}
					<!-- Lucide X Icon -->
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				{/if}
			</button>

			<!-- Hamburger menu dropdown -->
			{#if menuOpen}
				<ul
					id="nav-menu"
					class="absolute right-6 top-16 z-40 w-64 rounded-md bg-white py-2 shadow-lg animate-in fade-in slide-in-from-top-2"
					tabindex="-1"
					aria-label="User menu"
				>
					<li class="text-gray-500 border-gray-100 mb-1 border-b px-3 py-2 text-xs">
						Signed in as <span class="text-gray-900 font-semibold">{user.email}</span>
					</li>
					<!-- Mobile navigation links -->
					<li class="md:hidden">
						<a href="/journal" class="hover:bg-gray-50 text-gray-700 flex w-full items-center gap-2 px-4 py-2 text-left">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open text-gray-500">
								<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
								<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
							</svg>
							Journal
						</a>
					</li>
					<li class="md:hidden">
						<a href="/challenges" class="hover:bg-gray-50 text-gray-700 flex w-full items-center gap-2 px-4 py-2 text-left">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target text-gray-500">
								<circle cx="12" cy="12" r="10"/>
								<circle cx="12" cy="12" r="6"/>
								<circle cx="12" cy="12" r="2"/>
							</svg>
							Challenges
						</a>
					</li>
					<li class="md:hidden">
						<a href="/stats" class="hover:bg-gray-50 text-gray-700 flex w-full items-center gap-2 px-4 py-2 text-left">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart text-gray-500">
								<line x1="12" y1="20" x2="12" y2="10"/>
								<line x1="18" y1="20" x2="18" y2="4"/>
								<line x1="6" y1="20" x2="6" y2="16"/>
							</svg>
							Stats
						</a>
					</li>
					<!-- Settings link -->
					<li>
						<a href="/settings" class="hover:bg-gray-50 text-gray-700 flex w-full items-center gap-2 px-4 py-2 text-left">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings text-gray-500">
								<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
							Settings
						</a>
					</li>
					<!-- Logout option -->
					<li>
						<button
							class="hover:bg-gray-50 text-gray-700 group/item flex w-full items-center gap-2 px-4 py-2 text-left"
							on:click={handleLogout}
						>
							<!-- Lucide LogOut Icon -->
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out text-gray-500 group-hover/item:text-red-500"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
							Sign out
						</button>
					</li>
				</ul>
			{/if}
		{:else}
			<!-- Theme toggle for non-authenticated users -->
			<ThemeToggle />
			
			<a
				href="/login"
				class="px-4 py-2 font-medium text-white transition hover:text-indigo-100">Login</a
			>
			<a
				href="/register"
				class="rounded-md bg-white px-5 py-2 font-medium text-indigo-600 shadow-sm transition-all hover:bg-indigo-50"
				>Register</a
			>
		{/if}
	</nav>
</header>
