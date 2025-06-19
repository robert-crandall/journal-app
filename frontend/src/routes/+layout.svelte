<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { updated } from '$app/state';
	import { beforeNavigate } from '$app/navigation';
	import * as icons from 'lucide-svelte';
	import DaisyUITest from '$lib/components/DaisyUITest.svelte';
	import ThemeDebug from '$lib/components/ThemeDebug.svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let moreDropdownOpen = $state(false);
	let userDropdownOpen = $state(false);

	// Handle automatic updates when a new version is detected
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) {
			// Force a full page navigation to apply the update
			location.href = to.url.href;
		}
	});

	onMount(() => {
		auth.init();

		// Watch for automatic updates - reload when a new version is detected
		const checkForUpdates = () => {
			if (updated.current) {
				console.log('New version detected, reloading...');
				// Reload the page to apply the update
				location.reload();
			}
		};

		// Check for updates periodically in case navigation doesn't happen
		const updateInterval = setInterval(checkForUpdates, 5000);

		// Watch for auth state changes and reinitialize theme
		const unsubscribe = auth.subscribe(async (authState) => {
			if (!authState.loading) {
				const isAuthenticated = authState.user !== null;
				await theme.init(isAuthenticated);
			}
		});

		return () => {
			clearInterval(updateInterval);
			unsubscribe();
		};
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

<div class="min-h-screen bg-base-100 text-base-content">
	{#if $auth.loading}
		<div class="flex min-h-screen items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-base-300 border-t-primary"
			></div>
		</div>
	{:else if !$auth.user && !isAuthPage}
		<div
			class="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-200 to-base-300"
		>
			<div class="mx-auto max-w-md px-6 text-center">
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary"
				>
					<svelte:component this={icons.Zap} size={32} class="text-primary-content" />
				</div>
				<h1 class="mb-4 text-4xl font-bold text-base-content">LifeQuest</h1>
				<p class="mb-8 text-lg text-base-content/70">
					Transform your personal growth journey with RPG-style mechanics and AI-powered insights.
				</p>
				<div class="flex flex-col justify-center gap-3 sm:flex-row">
					<a
						href="/login"
						class="rounded-lg border border-transparent bg-primary px-6 py-3 text-sm font-medium text-primary-content transition-colors hover:bg-primary/90"
					>
						Sign In
					</a>
					<a
						href="/register"
						class="rounded-lg border border-primary/30 bg-base-100 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-base-200"
					>
						Get Started
					</a>
				</div>
			</div>
		</div>
	{:else if $auth.user && !isAuthPage && !isHomePage}
		<!-- Atlassian-style Navigation -->
		<div
			class="sticky top-0 z-40 border-b border-base-300 bg-base-100"
			on:click={closeDropdowns}
		>
			<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<!-- Left side: Brand + Main Navigation -->
					<div class="flex items-center space-x-8">
						<!-- Brand -->
						<a
							href="/dashboard"
							class="flex items-center space-x-2 text-xl font-semibold text-base-content transition-colors hover:text-primary"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
							>
								<svelte:component this={icons.Zap} size={16} class="text-primary-content" />
							</div>
							<span>LifeQuest</span>
						</a>

						<!-- Desktop Navigation -->
						<div class="hidden items-center space-x-1 md:flex">
							<a
								href="/dashboard"
								class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/dashboard'
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									class="flex items-center space-x-1 rounded-lg px-3 py-2 text-sm font-medium text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content"
								>
									<span>More</span>
									<svelte:component this={icons.ChevronDown} size={14} />
								</button>
								{#if moreDropdownOpen}
									<div
										class="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg"
										on:click|stopPropagation
									>
										<a
											href="/focuses"
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200 {$page
												.route.id === '/focuses'
												? 'bg-primary/10 text-primary'
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
											class="block px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200 {$page
												.route.id === '/family'
												? 'bg-primary/10 text-primary'
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
											class="block px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200 {$page
												.route.id === '/potions'
												? 'bg-primary/10 text-primary'
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
								class="flex items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-base-200"
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content"
								>
									{$auth.user?.name?.charAt(0).toUpperCase()}
								</div>
								<div class="hidden text-left sm:block">
									<div class="text-sm font-medium text-base-content">
										{$auth.user?.name}
									</div>
								</div>
								<svelte:component
									this={icons.ChevronDown}
									size={14}
									class="text-base-content/50"
								/>
							</button>
							{#if userDropdownOpen}
								<div
									class="absolute top-full right-0 z-50 mt-1 w-48 rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg"
									on:click|stopPropagation
								>
									<a
										href="/settings"
										on:click={closeDropdowns}
										class="block px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200"
									>
										<div class="flex items-center space-x-2">
											<svelte:component this={icons.Settings} size={16} />
											<span>Settings</span>
										</div>
									</a>
									<div class="my-1 border-t border-base-300"></div>
									<button
										on:click={() => {
											handleLogout();
											closeDropdowns();
										}}
										class="block w-full px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error/10"
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
							class="rounded-lg p-2 transition-colors hover:bg-base-200 md:hidden"
							aria-label="Toggle navigation menu"
						>
							<svelte:component
								this={mobileMenuOpen ? icons.X : icons.Menu}
								size={20}
								class="text-base-content/70"
							/>
						</button>
					</div>
				</div>

				<!-- Mobile Navigation Menu -->
				{#if mobileMenuOpen}
					<div class="border-t border-base-300 py-4 md:hidden">
						<div class="space-y-1">
							<a
								href="/dashboard"
								on:click={closeMobileMenu}
								class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.route
									.id === '/dashboard'
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
									? 'bg-primary/10 text-primary'
									: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.BarChart3} size={16} />
									<span>Progress</span>
								</div>
							</a>

							<!-- Mobile More Tools Section -->
							<div class="mt-2 border-t border-base-300 pt-2">
								<div
									class="px-3 py-1 text-xs font-medium tracking-wider text-base-content/50 uppercase"
								>
									Tools
								</div>
								<a
									href="/focuses"
									on:click={closeMobileMenu}
									class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page
										.route.id === '/focuses'
										? 'bg-primary/10 text-primary'
										: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
										? 'bg-primary/10 text-primary'
										: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
										? 'bg-primary/10 text-primary'
										: 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
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
		<main class="flex-1 bg-base-100">
			{@render children()}
		</main>
	{:else}
		{@render children()}
	{/if}
</div>

<!-- Hidden component to force daisyUI classes -->
<DaisyUITest />
<ThemeDebug />
