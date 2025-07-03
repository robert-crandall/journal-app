<script lang="ts">
	import { onMount } from 'svelte';
	import { helloApi } from '../../lib/api/hello';

	// State variables
	let message = 'Loading...';
	let id = '';
	let timestamp = '';
	let loading = true;
	let error: string | null = null;

	// Load the hello message when component mounts
	onMount(async () => {
		try {
			loading = true;
			const response = await helloApi.getHello();
			message = response.message;
			id = response.id;
			timestamp = response.timestamp;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to load hello message';
			console.error('Error loading hello:', e);
		} finally {
			loading = false;
		}
	});

	// Format timestamp for display
	function formatDate(isoString: string): string {
		try {
			const date = new Date(isoString);
			return date.toLocaleString();
		} catch {
			return isoString;
		}
	}
</script>

<div class="min-h-screen">
	<main class="container mx-auto p-4">
		<div class="hero">
			<div class="hero-content text-center">
				<div class="max-w-md">
					<div class="badge badge-primary mb-4">Authenticated Page</div>
					<h1 class="mb-6 text-3xl font-bold">Hello World Example</h1>

					{#if loading}
						<div class="card bg-base-100 mb-6 shadow-xl">
							<div class="card-body items-center">
								<span class="loading loading-spinner loading-lg text-primary"></span>
								<p>Loading...</p>
							</div>
						</div>
					{:else if error}
						<div class="alert alert-error mb-6">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 shrink-0 stroke-current"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Error: {error}</span>
						</div>
					{:else}
						<div class="card bg-base-100 mb-6 shadow-xl">
							<div class="card-body">
								<h2 class="card-title justify-center text-xl">{message}</h2>

								<div class="stats stats-vertical lg:stats-horizontal mt-4 shadow">
									<div class="stat">
										<div class="stat-title">User ID</div>
										<div class="stat-value text-lg">{id}</div>
									</div>
									<div class="stat">
										<div class="stat-title">Timestamp</div>
										<div class="stat-value text-sm">{formatDate(timestamp)}</div>
									</div>
								</div>

								<div class="alert alert-info mt-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="h-6 w-6 shrink-0 stroke-current"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<span
										>This page is protected by JWT authentication. You can only see this content if
										you're logged in.</span
									>
								</div>
							</div>
						</div>
					{/if}

					<div class="card-actions justify-center">
						<a href="/" class="btn btn-outline">
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
							>
								<path d="m12 19-7-7 7-7" />
								<path d="M19 12H5" />
							</svg>
							Back to Home
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- DaisyUI Components Showcase -->
		<div class="divider text-2xl font-bold">DaisyUI Components Showcase</div>

		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Buttons Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Buttons</h3>
					<div class="space-y-2">
						<button class="btn btn-primary btn-sm">Primary</button>
						<button class="btn btn-secondary btn-sm">Secondary</button>
						<button class="btn btn-accent btn-sm">Accent</button>
						<button class="btn btn-outline btn-sm">Outline</button>
					</div>
				</div>
			</div>

			<!-- Badges Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Badges</h3>
					<div class="flex flex-wrap gap-2">
						<div class="badge badge-primary">Primary</div>
						<div class="badge badge-secondary">Secondary</div>
						<div class="badge badge-accent">Accent</div>
						<div class="badge badge-ghost">Ghost</div>
					</div>
				</div>
			</div>

			<!-- Progress Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Progress</h3>
					<progress class="progress progress-primary w-full" value="32" max="100"></progress>
					<progress class="progress progress-secondary w-full" value="70" max="100"></progress>
					<progress class="progress progress-accent w-full" value="90" max="100"></progress>
				</div>
			</div>

			<!-- Loading Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Loading States</h3>
					<div class="flex gap-2">
						<span class="loading loading-spinner loading-xs"></span>
						<span class="loading loading-dots loading-sm"></span>
						<span class="loading loading-ring loading-md"></span>
						<span class="loading loading-ball loading-lg"></span>
					</div>
				</div>
			</div>

			<!-- Alerts Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Alerts</h3>
					<div class="alert alert-success alert-outline">
						<span class="text-xs">Success message!</span>
					</div>
					<div class="alert alert-warning alert-outline">
						<span class="text-xs">Warning message!</span>
					</div>
				</div>
			</div>

			<!-- Form Elements Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h3 class="card-title">Form Elements</h3>
					<div class="form-control">
						<input type="text" placeholder="Input field" class="input input-bordered input-sm" />
					</div>
					<div class="form-control">
						<select class="select select-bordered select-sm">
							<option>Option 1</option>
							<option>Option 2</option>
						</select>
					</div>
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-2">
							<input type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
							<span class="label-text text-sm">Checkbox</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
