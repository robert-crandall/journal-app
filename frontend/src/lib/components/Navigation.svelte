<script lang="ts">
	import { authStore, type User } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let user: User | null = null;
	let token: string | null = null;

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
	class="border-base-200/60 bg-base-100 bg-base-100/90 sticky top-0 z-30 flex items-center justify-between border-b px-6 py-3 shadow-sm backdrop-blur-sm"
>
	<a
		href="/"
		class="text-base-content flex items-center gap-2 text-xl font-semibold hover:opacity-80"
	>
		<span class="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent"
			>Auth Template</span
		>
	</a>
	<nav class="flex items-center gap-4">
		{#if user}
			<!-- Main navigation links when authenticated -->
			<a
				href="/hello"
				class="text-base-content px-4 py-2 font-medium transition hover:text-blue-600"
				>Hello World</a
			>

			<div class="group relative">
				<button
					class="hover:bg-base-200 text-base-content flex items-center gap-2 rounded-full px-4 py-2 font-medium transition"
				>
					<span class="font-medium">{user.name}</span>
					<div
						class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-medium text-white uppercase"
					>
						{user.name[0]}
					</div>
					<svg
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-chevron-down"><path d="m6 9 3 3 3-3" /></svg
					>
				</button>
				<ul
					class="bg-base-100 border-base-200 pointer-events-none absolute right-0 z-10 mt-2 w-52 translate-y-2 rounded-xl border py-1.5 opacity-0 shadow-lg transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100"
				>
					<li class="text-base-content/60 border-base-200 mb-1 border-b px-3 py-2 text-xs">
						Signed in as <span class="text-base-content font-semibold">{user.email}</span>
					</li>
					<li>
						<button
							class="hover:bg-base-200 text-base-content group/item flex w-full items-center gap-2 px-4 py-2 text-left"
							on:click={handleLogout}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-base-content/70 group-hover/item:text-red-500"
								><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline
									points="16 17 21 12 16 7"
								></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg
							>
							Sign out
						</button>
					</li>
				</ul>
			</div>
		{:else}
			<a
				href="/login"
				class="text-base-content px-4 py-2 font-medium transition hover:text-blue-600">Login</a
			>
			<a
				href="/register"
				class="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 px-5 py-2 font-medium text-white shadow-sm transition-all hover:scale-105 hover:shadow active:scale-95"
				>Register</a
			>
		{/if}
	</nav>
</header>
