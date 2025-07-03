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
	<title>Dashboard | Journal App</title>
</svelte:head>

<div class="flex flex-col">
	<!-- Main content -->
	<main class="flex flex-1 flex-col">
		{#if user}
			<!-- Logged-in Dashboard View -->
			<section class="mx-auto w-full max-w-7xl">
				<div class="mb-8">
					<h1 class="text-base-content mb-2 text-3xl font-bold">Your Dashboard</h1>
					<p class="text-base-content/70 text-lg">Today's progress at a glance</p>
				</div>

				<!-- Dashboard Grid Layout -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<!-- Active Quest Card -->
					<div class="col-span-1 md:col-span-2 lg:col-span-2">
						<div
							class="bg-base-100 border-primary rounded-lg border-l-4 p-6 shadow-lg transition-all hover:shadow-xl"
						>
							<h2 class="text-primary mb-4 text-xl font-bold">Active Quest</h2>

							<div class="mb-4">
								<h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
									2 weeks of Daily walks
								</h3>
								<p class="mb-3 text-gray-700 dark:text-gray-300">
									Simple daily walks to boost your mood and energy levels.
								</p>

								<div class="bg-base-200 mb-4 rounded-lg p-4">
									<h4 class="text-base-content mb-2 font-medium">Protocol:</h4>
									<ul class="text-base-content/70 ml-5 list-disc space-y-1">
										<li>Walk a mile before work</li>
										<li>Optional: Resistance training during day</li>
									</ul>
								</div>
							</div>

							<div class="mt-6 flex items-center justify-between">
								<span class="font-medium text-gray-600 dark:text-gray-400">1 day remaining</span>
								<a href="#" class="btn btn-primary bg-primary gap-2">
									View Details
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
										class="lucide lucide-arrow-right"
										><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
									>
								</a>
							</div>
						</div>
					</div>

					<!-- Today's Journal Card -->
					<div class="col-span-1">
						<div
							class="bg-base-100 border-warning flex h-full flex-col rounded-lg border-l-4 p-6 shadow-lg transition-all hover:shadow-xl"
						>
							<h2 class="text-primary mb-4 text-xl font-bold">Today's Journal</h2>

							<div class="mb-4">
								<span
									class="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
								>
									weekly
								</span>
								<p class="text-gray-700 dark:text-gray-300">How did today go?</p>
							</div>

							<div class="mt-auto">
								<a href="#" class="btn btn-primary gap-2">
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
										class="lucide lucide-pencil"
										><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path
											d="m15 5 4 4"
										/></svg
									>
									Write Entry
								</a>
							</div>
						</div>
					</div>

					<!-- Today's Challenges -->
					<div class="col-span-1">
						<div
							class="bg-base-100 border-success rounded-lg border-l-4 p-6 shadow-lg transition-all hover:shadow-xl"
						>
							<h2 class="text-primary mb-4 text-xl font-bold">Today's Challenges</h2>

							<div class="mb-4">
								<h3 class="mb-1 font-medium text-gray-600 dark:text-gray-400">Dexterity</h3>
								<div class="bg-base-200 rounded border-l-4 border-emerald-500 p-4">
									<h4 class="text-base-content font-medium">Mile walk</h4>
									<p class="text-base-content/60 my-1 text-sm">Completed a mile walk before work</p>
									<div class="mt-3">
										<div class="flex items-center justify-between">
											<span class="text-xs text-gray-500 dark:text-gray-400">Progress</span>
											<span class="text-xs font-medium text-gray-700 dark:text-gray-300"
												>0 / 12 +50 XP</span
											>
										</div>
										<div class="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
											<div class="h-full rounded-full bg-emerald-500" style="width: 0%"></div>
										</div>
									</div>
								</div>
							</div>

							<div class="mt-4 text-center">
								<button class="text-primary hover:text-primary/80 font-medium">Complete</button>
							</div>
						</div>
					</div>

					<!-- Your Stats -->
					<div class="col-span-1 md:col-span-2 lg:col-span-3">
						<div
							class="bg-base-100 border-primary rounded-lg border border-l-4 p-6 shadow-lg transition-all hover:shadow-xl"
						>
							<div class="mb-6 flex items-center justify-between">
								<h2 class="text-primary text-xl font-bold">Your Stats</h2>
								<a href="#" class="text-primary hover:text-primary/80 text-sm font-medium"
									>View All →</a
								>
							</div>

							<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								<!-- Physical Health Stat -->
								<div class="border-primary bg-base-200 rounded border-l-4 p-4">
									<h3 class="text-base-content font-medium">Physical Health</h3>
									<p class="text-base-content/60 mt-1 text-sm">Level 3</p>
									<p class="text-base-content/60 mt-2 text-xs">
										Consistent movement, energizing meals, and good sleep will give me the energy to
										thrive
									</p>
									<div class="mt-3">
										<div class="flex items-center justify-between">
											<span class="text-xs text-gray-500 dark:text-gray-400">XP</span>
											<span class="text-xs font-medium text-gray-700 dark:text-gray-300"
												>268 / 300</span
											>
										</div>
										<div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
											<div class="h-full rounded-full bg-indigo-600" style="width: 89%"></div>
										</div>
									</div>
								</div>

								<!-- Stillness Stat -->
								<div class="bg-base-200 rounded border-l-4 border-purple-500 p-4">
									<h3 class="text-base-content font-medium">Stillness</h3>
									<p class="text-base-content/60 mt-1 text-sm">Level 1</p>
									<p class="text-base-content/60 mt-2 text-xs">
										The ability to walk with my thoughts, to resist the squirrel in my head.
									</p>
									<div class="mt-3">
										<div class="flex items-center justify-between">
											<span class="text-xs text-gray-500 dark:text-gray-400">XP</span>
											<span class="text-xs font-medium text-gray-700 dark:text-gray-300"
												>333 / 100</span
											>
										</div>
										<div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
											<div class="h-full rounded-full bg-purple-500" style="width: 100%"></div>
										</div>
									</div>
								</div>

								<!-- Nourishment Stat -->
								<div class="bg-base-200 rounded border-l-4 border-emerald-500 p-4">
									<h3 class="text-base-content font-medium">Nourishment</h3>
									<p class="text-base-content/60 mt-1 text-sm">Level 1</p>
									<p class="text-base-content/60 mt-2 text-xs">I eat the right foods for my life</p>
									<div class="mt-3">
										<div class="flex items-center justify-between">
											<span class="text-xs text-gray-500 dark:text-gray-400">XP</span>
											<span class="text-xs font-medium text-gray-700 dark:text-gray-300"
												>280 / 100</span
											>
										</div>
										<div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
											<div class="h-full rounded-full bg-emerald-500" style="width: 100%"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		{:else}
			<!-- Landing Page View -->
			<section
				class="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-12 md:flex-row"
			>
				<!-- Left side content -->
				<div class="max-w-xl flex-1">
					<h1 class="mb-4 text-5xl leading-tight font-bold text-gray-900 dark:text-gray-50">
						<span class="text-indigo-600 dark:text-indigo-400"> Journal App </span>
					</h1>
					<p class="mb-8 text-xl text-gray-700 dark:text-gray-300">
						Track your habits, progress, and personal growth through guided journaling and
						challenges.
					</p>
					<div class="flex items-center gap-4">
						<a
							href="/register"
							class="flex items-center gap-2 rounded bg-indigo-600 px-8 py-3 font-medium text-white shadow transition-all hover:bg-indigo-700"
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
							class="rounded border border-gray-200 bg-white px-8 py-3 font-medium text-gray-800 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
						>
							Login
						</a>
					</div>

					<!-- Feature badges -->
					<div class="mt-8 flex flex-wrap gap-3">
						<div class="bg-primary/10 text-primary rounded-md px-3 py-1 text-xs">
							Journal Tracking
						</div>
						<div class="bg-primary/20 text-primary rounded-md px-3 py-1 text-xs">Challenges</div>
						<div class="bg-success/10 text-success rounded-md px-3 py-1 text-xs">
							Stats & Progress
						</div>
						<div class="bg-warning/10 text-warning rounded-md px-3 py-1 text-xs">Dark Mode</div>
					</div>
				</div>

				<!-- Right side illustration/image -->
				<div class="flex flex-1 items-center justify-center">
					<div class="relative aspect-square w-full max-w-sm">
						<!-- Abstract shapes for visual interest -->
						<div
							class="absolute top-0 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl"
						></div>
						<div
							class="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-400/10 blur-2xl"
						></div>

						<!-- App mockup -->
						<div
							class="border-base-200 bg-base-100 relative z-10 flex h-full w-full flex-col overflow-hidden rounded border shadow-lg"
						>
							<!-- Mockup header -->
							<div class="border-base-200 bg-primary flex h-14 items-center gap-3 border-b px-4">
								<div class="bg-error h-3 w-3 rounded-full"></div>
								<div class="bg-warning h-3 w-3 rounded-full"></div>
								<div class="bg-success h-3 w-3 rounded-full"></div>
								<div class="bg-primary/80 ml-4 h-5 flex-1 rounded-full"></div>
							</div>

							<!-- Dashboard mockup content -->
							<div class="flex flex-1 flex-col gap-3 p-4">
								<div class="bg-base-200 h-6 w-1/3 rounded"></div>
								<div class="mt-2 grid grid-cols-2 gap-2">
									<div class="border-primary bg-base-200 col-span-2 h-24 rounded border-l-4"></div>
									<div class="border-warning bg-base-200 h-20 rounded border-l-4"></div>
									<div class="border-success bg-base-200 h-20 rounded border-l-4"></div>
								</div>
								<div class="bg-base-200 mt-2 h-4 w-1/4 rounded"></div>
								<div class="bg-base-200 mt-1 h-4 w-3/4 rounded"></div>
								<div class="mt-3 grid grid-cols-3 gap-2">
									<div class="border-primary bg-base-200 h-10 rounded border-l-4"></div>
									<div class="border-secondary bg-base-200 h-10 rounded border-l-4"></div>
									<div class="border-success bg-base-200 h-10 rounded border-l-4"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		{/if}
	</main>
</div>
