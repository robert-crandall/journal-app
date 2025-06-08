<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as icons from 'lucide-svelte';
	import { pwaManager } from '$lib/pwa';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let moreDropdownOpen = $state(false);
	let userDropdownOpen = $state(false);

	onMount(() => {
		auth.init();

		// Initialize PWA manager (registers service worker)
		// This happens automatically when the module is imported

		// Watch for auth state changes and reinitialize theme
		const unsubscribe = auth.subscribe(async (authState) => {
			if (!authState.loading) {
				const isAuthenticated = authState.user !== null;
				await theme.init(isAuthenticated);
			}
		});

		return unsubscribe;
	});

	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function toggleMoreDropdown() {
		moreDropdownOpen = !moreDropdownOpen;
		userDropdownOpen = false;
	}

	function toggleUserDropdown() {
		userDropdownOpen = !userDropdownOpen;
		moreDropdownOpen = false;
	}

	function closeDropdowns() {
		moreDropdownOpen = false;
		userDropdownOpen = false;
	}

	// Check if current route is auth page
	const isAuthPage = $derived($page.route.id === '/login' || $page.route.id === '/register');
	const isHomePage = $derived($page.route.id === '/');
</script>

<svelte:head>
	<title>Life Quest</title>
	<meta name="description" content="Personal growth powered by GPT and role-playing mechanics" />
</svelte:head>

<div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
	{#if $auth.loading}
		<div class="flex min-h-screen items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400"
			></div>
		</div>
	{:else if !$auth.user && !isAuthPage}
		<div
			class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
		>
			<div class="mx-auto max-w-md px-6 text-center">
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500"
				>
					<svelte:component this={icons.Zap} size={32} class="text-white" />
				</div>
				<h1 class="mb-4 text-4xl font-bold text-neutral-900 dark:text-white">LifeQuest</h1>
				<p class="mb-8 text-lg text-neutral-600 dark:text-neutral-300">
					Transform your personal growth journey with RPG-style mechanics and AI-powered insights.
				</p>
				<div class="flex flex-col justify-center gap-3 sm:flex-row">
					<a
						href="/login"
						class="rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						Sign In
					</a>
					<a
						href="/register"
						class="rounded-lg border border-blue-300 bg-white px-6 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-400 dark:bg-neutral-800 dark:text-blue-400 dark:hover:bg-neutral-700"
					>
						Get Started
					</a>
				</div>
			</div>
		</div>
	{:else if $auth.user && !isAuthPage && !isHomePage}
		<!-- Atlassian-style Navigation -->
		<div
			class="sticky top-0 z-40 border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
			on:click={closeDropdowns}
		>
			<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<!-- Left side: Brand + Main Navigation -->
					<div class="flex items-center space-x-8">
						<!-- Brand -->
						<a
							href="/dashboard"
							class="flex items-center space-x-2 text-xl font-semibold text-neutral-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500"
							>
								<svelte:component this={icons.Zap} size={16} class="text-white" />
							</div>
							<span>LifeQuest</span>
						</a>

						<!-- Desktop Navigation -->
						<div class="hidden items-center space-x-1 md:flex">
							<a
								href="/dashboard"
								class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/dashboard'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.Home} size={16} />
									<span>Dashboard</span>
								</div>
							</a>
							<a
								href="/tasks"
								class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/tasks'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.CheckSquare} size={16} />
									<span>Tasks</span>
								</div>
							</a>
							<a
								href="/adhoc-tasks"
								class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/adhoc-tasks'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.Zap} size={16} />
									<span>Anytime</span>
								</div>
							</a>
							<a
								href="/journals"
								class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/journals'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.BookOpen} size={16} />
									<span>Journal</span>
								</div>
							</a>
							<a
								href="/stats"
								class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/stats'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.BarChart3} size={16} />
									<span>Progress</span>
								</div>
							</a>

							<!-- More Tools Dropdown -->
							<div class="relative">
								<button
									on:click|stopPropagation={toggleMoreDropdown}
									class="flex items-center space-x-1 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
								>
									<span>More</span>
									<svelte:component this={icons.ChevronDown} size={14} />
								</button>
								{#if moreDropdownOpen}
									<div
										class="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
										on:click|stopPropagation
									>
										<a
											href="/focuses"
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700 {$page
												.route.id === '/focuses'
												? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
												: ''}"
										>
											<div class="flex items-center space-x-2">
												<svelte:component this={icons.Target} size={16} />
												<span>Focuses</span>
											</div>
										</a>
										<a
											href="/family"
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700 {$page
												.route.id === '/family'
												? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
												: ''}"
										>
											<div class="flex items-center space-x-2">
												<svelte:component this={icons.Users} size={16} />
												<span>Family</span>
											</div>
										</a>
										<a
											href="/potions"
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700 {$page
												.route.id === '/potions'
												? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
												: ''}"
										>
											<div class="flex items-center space-x-2">
												<svelte:component this={icons.Beaker} size={16} />
												<span>Potions</span>
											</div>
										</a>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Right side: User Menu + Mobile Toggle -->
					<div class="flex items-center space-x-2">
						<!-- User Menu -->
						<div class="relative">
							<button
								on:click|stopPropagation={toggleUserDropdown}
								class="flex items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-blue-500"
								>
									{$auth.user?.name?.charAt(0).toUpperCase()}
								</div>
								<div class="hidden text-left sm:block">
									<div class="text-sm font-medium text-neutral-900 dark:text-white">
										{$auth.user?.name}
									</div>
								</div>
								<svelte:component
									this={icons.ChevronDown}
									size={14}
									class="text-neutral-500 dark:text-neutral-400"
								/>
							</button>
							{#if userDropdownOpen}
								<div
									class="absolute top-full right-0 z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
									on:click|stopPropagation
								>
									<a
										href="/settings"
										on:click={closeDropdowns}
										class="block px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
									>
										<div class="flex items-center space-x-2">
											<svelte:component this={icons.Settings} size={16} />
											<span>Settings</span>
										</div>
									</a>
									<div class="my-1 border-t border-neutral-200 dark:border-neutral-700"></div>
									<button
										on:click={() => {
											handleLogout();
											closeDropdowns();
										}}
										class="block w-full px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
									>
										<div class="flex items-center space-x-2">
											<svelte:component this={icons.LogOut} size={16} />
											<span>Sign Out</span>
										</div>
									</button>
								</div>
							{/if}
						</div>

						<!-- Mobile Menu Toggle -->
						<button
							on:click={toggleMobileMenu}
							class="rounded-lg p-2 transition-colors hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-700"
							aria-label="Toggle navigation menu"
						>
							<svelte:component
								this={mobileMenuOpen ? icons.X : icons.Menu}
								size={20}
								class="text-neutral-700 dark:text-neutral-300"
							/>
						</button>
					</div>
				</div>

				<!-- Mobile Navigation Menu -->
				{#if mobileMenuOpen}
					<div class="border-t border-neutral-200 py-4 md:hidden dark:border-neutral-700">
						<div class="space-y-1">
							<a
								href="/dashboard"
								on:click={closeMobileMenu}
								class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/dashboard'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.Home} size={16} />
									<span>Dashboard</span>
								</div>
							</a>
							<a
								href="/tasks"
								on:click={closeMobileMenu}
								class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/tasks'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.CheckSquare} size={16} />
									<span>Tasks</span>
								</div>
							</a>
							<a
								href="/adhoc-tasks"
								on:click={closeMobileMenu}
								class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/adhoc-tasks'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.Zap} size={16} />
									<span>Anytime</span>
								</div>
							</a>
							<a
								href="/journals"
								on:click={closeMobileMenu}
								class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/journals'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.BookOpen} size={16} />
									<span>Journal</span>
								</div>
							</a>
							<a
								href="/stats"
								on:click={closeMobileMenu}
								class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/stats'
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
									: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.BarChart3} size={16} />
									<span>Progress</span>
								</div>
							</a>

							<!-- Mobile More Tools Section -->
							<div class="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
								<div
									class="px-3 py-1 text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400"
								>
									Tools
								</div>
								<a
									href="/focuses"
									on:click={closeMobileMenu}
									class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page
										.route.id === '/focuses'
										? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
										: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
								>
									<div class="flex items-center space-x-3">
										<svelte:component this={icons.Target} size={16} />
										<span>Focuses</span>
									</div>
								</a>
								<a
									href="/family"
									on:click={closeMobileMenu}
									class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page
										.route.id === '/family'
										? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
										: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
								>
									<div class="flex items-center space-x-3">
										<svelte:component this={icons.Users} size={16} />
										<span>Family</span>
									</div>
								</a>
								<a
									href="/potions"
									on:click={closeMobileMenu}
									class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page
										.route.id === '/potions'
										? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
										: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'}"
								>
									<div class="flex items-center space-x-3">
										<svelte:component this={icons.Beaker} size={16} />
										<span>Potions</span>
									</div>
								</a>
							</div>
						</div>
					</div>
				{/if}
			</nav>
		</div>

		<!-- Main Content Area -->
		<main class="flex-1 bg-neutral-50 dark:bg-neutral-900">
			{@render children()}
		</main>
	{:else}
		{@render children()}
	{/if}
</div>
