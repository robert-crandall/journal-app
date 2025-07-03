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

<div class="min-h-screen">
	<!-- Main content -->
	<main class="container mx-auto p-4">
		<div class="flex flex-1 flex-col items-center justify-center py-20">
			{#if user}
				<!-- Logged-in View -->
				<section class="flex w-full max-w-2xl flex-col items-center">
					<div class="hero-content mb-8 text-center">
						<div>
							<h1 class="text-gradient mb-3 text-4xl font-bold">
								Welcome back, {user.name}!
							</h1>
							<p class="text-base-content/70 max-w-lg text-xl">
								You're successfully logged in to your account.
							</p>
						</div>
					</div>

					<div class="card bg-base-100 w-full shadow-xl">
						<div class="card-body">
							<div class="mb-4 flex items-center gap-4">
								<div class="avatar placeholder">
									<div class="bg-primary text-primary-content h-16 w-16 rounded-full">
										<span class="text-2xl font-bold">{user.name[0]}</span>
									</div>
								</div>
								<div>
									<h2 class="card-title text-2xl">{user.name}</h2>
									<p class="text-base-content/70">{user.email}</p>
								</div>
							</div>

							<div class="divider"></div>

							<h3 class="text-base-content/50 mb-3 text-sm font-semibold uppercase">
								Account Information
							</h3>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="stat bg-base-200/50 rounded-lg">
									<div class="stat-title text-xs">Username</div>
									<div class="stat-value text-lg">{user.name}</div>
								</div>
								<div class="stat bg-base-200/50 rounded-lg">
									<div class="stat-title text-xs">Email</div>
									<div class="stat-value text-lg">{user.email}</div>
								</div>
								<div class="stat bg-base-200/50 rounded-lg">
									<div class="stat-title text-xs">Status</div>
									<div class="stat-value flex items-center gap-2 text-lg">
										<span class="badge badge-success badge-sm"></span>
										Active
									</div>
								</div>
								<div class="stat bg-base-200/50 rounded-lg">
									<div class="stat-title text-xs">Joined</div>
									<div class="stat-value text-lg">{new Date().toLocaleDateString()}</div>
								</div>
							</div>

							<div class="card-actions mt-6 justify-center">
								<a href="/hello" class="btn btn-primary btn-wide">
									View Hello World Example
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
										class="h-4 w-4"
									>
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
										<polyline points="15 3 21 3 21 9" />
										<line x1="10" x2="21" y1="14" y2="3" />
									</svg>
								</a>
							</div>
						</div>
					</div>
				</section>
			{:else}
				<!-- Landing Page View -->
				<section class="hero">
					<div class="hero-content max-w-5xl flex-col lg:flex-row-reverse">
						<!-- Right side illustration/image -->
						<div class="flex flex-1 items-center justify-center">
							<div class="mockup-browser bg-base-300 max-w-sm border">
								<div class="mockup-browser-toolbar">
									<div class="input">auth-template.dev</div>
								</div>
								<div class="bg-base-200 flex justify-center">
									<div class="flex w-full flex-col gap-3 p-4">
										<div class="skeleton h-8 w-3/4"></div>
										<div class="skeleton h-4 w-1/2"></div>
										<div class="skeleton h-4 w-2/3"></div>
										<div class="mt-4 flex gap-2">
											<div class="btn btn-primary btn-sm flex-1">Get Started</div>
											<div class="btn btn-outline btn-sm">Login</div>
										</div>
										<div class="skeleton mt-4 h-32 w-full"></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Left side content -->
						<div class="max-w-xl flex-1">
							<h1 class="mb-4 text-5xl leading-tight font-bold">
								<span class="text-gradient"> Modern Auth Template </span>
							</h1>
							<p class="text-base-content/80 mb-8 text-xl">
								A sleek SvelteKit application with user authentication powered by Hono backend. The
								perfect starting point for your next project.
							</p>

							<div class="mb-8 flex items-center gap-4">
								<a href="/register" class="btn btn-primary btn-lg">
									Get Started
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
										class="h-4 w-4"
									>
										<path d="M5 12h14" />
										<path d="m12 5 7 7-7 7" />
									</svg>
								</a>
								<a href="/login" class="btn btn-outline btn-lg"> Login </a>
							</div>

							<!-- Feature badges -->
							<div class="flex flex-wrap gap-3">
								<div class="badge badge-primary">Type-Safe</div>
								<div class="badge badge-secondary">SvelteKit</div>
								<div class="badge badge-accent">Hono Backend</div>
								<div class="badge badge-success">JWT Auth</div>
							</div>
						</div>
					</div>
				</section>
			{/if}
		</div>
	</main>
</div>
