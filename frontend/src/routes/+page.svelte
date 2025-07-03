<script lang="ts">
	import { authStore, type User } from '$lib/stores/auth';
	import Navigation from '$lib/components/Navigation.svelte';

	let user: User | null = null;
	let token: string | null = null;
	let loading = false;

	// Subscribe to auth store
	authStore.subscribe((state) => {
		user = state.user;
		token = state.token;
		loading = state.loading;
	});
</script>

<svelte:head>
	<title>Home | Auth Template</title>
</svelte:head>

<div class="from-base-100 to-base-200/30 flex min-h-screen flex-col bg-gradient-to-br">
	<!-- Main content -->
	<main class="flex flex-1 flex-col items-center justify-center px-6 py-20">
		{#if user}
			<!-- Logged-in View -->
			<section class="flex w-full max-w-2xl flex-col items-center">
				<div class="mb-8 text-center">
					<h1
						class="mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent"
					>
						Welcome back, {user.name}!
					</h1>
					<p class="text-base-content/70 max-w-lg text-xl">
						You're successfully logged in to your account.
					</p>
				</div>

				<div
					class="bg-base-100 border-base-200/60 w-full overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm"
				>
					<div class="flex flex-col gap-4 p-6">
						<div class="flex items-center gap-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl font-bold text-white uppercase"
							>
								{user.name[0]}
							</div>
							<div>
								<h2 class="text-2xl font-bold">{user.name}</h2>
								<p class="text-base-content/70">{user.email}</p>
							</div>
						</div>

						<div class="border-base-200 mt-4 border-t pt-4">
							<h3 class="text-base-content/50 mb-3 text-sm font-semibold uppercase">
								Account Information
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="bg-base-200/50 rounded-lg p-4">
									<span class="text-base-content/60 mb-1 block text-xs">Username</span>
									<span class="font-medium">{user.name}</span>
								</div>
								<div class="bg-base-200/50 rounded-lg p-4">
									<span class="text-base-content/60 mb-1 block text-xs">Email</span>
									<span class="font-medium">{user.email}</span>
								</div>
								<div class="bg-base-200/50 rounded-lg p-4">
									<span class="text-base-content/60 mb-1 block text-xs">Status</span>
									<div class="flex items-center gap-2">
										<div class="h-2 w-2 rounded-full bg-green-500"></div>
										<span class="font-medium">Active</span>
									</div>
								</div>
								<div class="bg-base-200/50 rounded-lg p-4">
									<span class="text-base-content/60 mb-1 block text-xs">Joined</span>
									<span class="font-medium">{new Date().toLocaleDateString()}</span>
								</div>
							</div>

							<div class="mt-6 flex justify-center">
								<a
									href="/hello"
									class="flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 px-6 py-2 font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow active:scale-95"
								>
									<span>View Hello World Example</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="lucide lucide-external-link"
										><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline
											points="15 3 21 3 21 9"
										/><line x1="10" x2="21" y1="14" y2="3" /></svg
									>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		{:else}
			<!-- Landing Page View -->
			<section
				class="flex w-full max-w-5xl flex-col items-center justify-between gap-12 md:flex-row"
			>
				<!-- Left side content -->
				<div class="max-w-xl flex-1">
					<h1 class="mb-4 text-5xl leading-tight font-bold">
						<span
							class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
						>
							Modern Auth Template
						</span>
					</h1>
					<p class="text-base-content/80 mb-8 text-xl">
						A sleek SvelteKit application with user authentication powered by Hono backend. The
						perfect starting point for your next project.
					</p>
					<div class="flex items-center gap-4">
						<a
							href="/register"
							class="flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
						>
							<span>Get Started</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-arrow-right"
								><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
							>
						</a>
						<a
							href="/login"
							class="bg-base-100 border-base-300 text-base-content rounded-full border px-8 py-3 font-medium shadow-sm transition-all hover:border-blue-400 hover:shadow"
						>
							Login
						</a>
					</div>

					<!-- Feature badges -->
					<div class="mt-8 flex flex-wrap gap-3">
						<div class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">Type-Safe</div>
						<div class="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800">
							SvelteKit
						</div>
						<div class="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
							Hono Backend
						</div>
						<div class="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">JWT Auth</div>
					</div>
				</div>

				<!-- Right side illustration/image -->
				<div class="flex flex-1 items-center justify-center">
					<div class="relative aspect-square w-full max-w-sm">
						<!-- Abstract shapes for visual interest -->
						<div
							class="absolute top-0 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl"
						></div>
						<div
							class="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-500/10 blur-2xl"
						></div>

						<!-- App mockup -->
						<div
							class="border-base-200/60 bg-base-100 relative z-10 flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl"
						>
							<!-- Mockup header -->
							<div class="border-base-200 bg-base-100 flex h-14 items-center gap-3 border-b px-4">
								<div class="h-3 w-3 rounded-full bg-red-400"></div>
								<div class="h-3 w-3 rounded-full bg-yellow-400"></div>
								<div class="h-3 w-3 rounded-full bg-green-400"></div>
								<div class="bg-base-200 ml-4 h-5 flex-1 rounded-full"></div>
							</div>

							<!-- Mockup content -->
							<div class="flex flex-1 flex-col gap-3 p-4">
								<div class="bg-base-200 h-8 w-3/4 rounded-lg"></div>
								<div class="bg-base-200 h-4 w-1/2 rounded-lg"></div>
								<div class="bg-base-200 h-4 w-2/3 rounded-lg"></div>
								<div class="mt-4 flex gap-2">
									<div class="h-10 w-1/2 rounded-lg bg-blue-500"></div>
									<div class="bg-base-200 h-10 w-1/4 rounded-lg"></div>
								</div>
								<div class="bg-base-200 mt-4 flex-1 rounded-lg"></div>
							</div>
						</div>
					</div>
				</div>
			</section>
		{/if}
	</main>
</div>
