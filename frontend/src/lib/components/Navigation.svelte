<script lang="ts">
	import { authStore, type User } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import ThemeController from './ThemeController.svelte';

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
</script>

<header class="navbar bg-base-100 border-base-200 sticky top-0 z-30 border-b shadow-sm">
	<div class="navbar-start">
		<a href="/" class="btn btn-ghost text-gradient text-xl font-semibold"> Auth Template </a>
	</div>

	<div class="navbar-end">
		<ThemeController />

		{#if user}
			<a href="/hello" class="btn btn-ghost">Hello World</a>

			<!-- User dropdown menu using DaisyUI Method 1 (details/summary) -->
			<details class="dropdown dropdown-end">
				<summary id="nav-menu-btn" class="btn btn-ghost btn-circle avatar" aria-label="Open menu">
					<!-- Lucide Menu Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-5 w-5"
						><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line
							x1="4"
							y1="18"
							x2="20"
							y2="18"
						/></svg
					>
				</summary>

				<ul
					id="nav-menu"
					class="dropdown-content menu bg-base-100 rounded-box border-base-200 z-40 w-64 border p-2 shadow"
					aria-label="User menu"
				>
					<li class="menu-title">
						<span class="text-xs">Signed in as <strong>{user.email}</strong></span>
					</li>
					<div class="divider my-2"></div>
					<li>
						<button
							class="text-error hover:bg-error hover:text-error-content"
							on:click={handleLogout}
						>
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
								><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
									points="16 17 21 12 16 7"
								/><line x1="21" y1="12" x2="9" y2="12" /></svg
							>
							Sign out
						</button>
					</li>
				</ul>
			</details>
		{:else}
			<a href="/login" class="btn btn-ghost">Login</a>
			<a href="/register" class="btn btn-primary">Register</a>
		{/if}
	</div>
</header>
