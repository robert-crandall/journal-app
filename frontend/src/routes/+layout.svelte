<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as icons from 'lucide-svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let moreDropdownOpen = $state(false);
	let userDropdownOpen = $state(false);

	onMount(() => {
		auth.init();
		
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
		<div class="flex items-center justify-center min-h-screen">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400"></div>
		</div>
	{:else if !$auth.user && !isAuthPage}
		<div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center">
			<div class="text-center max-w-md mx-auto px-6">
				<div class="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
					<svelte:component this={icons.Zap} size={32} class="text-white" />
				</div>
				<h1 class="text-4xl font-bold text-neutral-900 dark:text-white mb-4">LifeQuest</h1>
				<p class="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
					Transform your personal growth journey with RPG-style mechanics and AI-powered insights.
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<a href="/login" class="px-6 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
						Sign In
					</a>
					<a href="/register" class="px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors">
						Get Started
					</a>
				</div>
			</div>
		</div>
	{:else if $auth.user && !isAuthPage && !isHomePage}
		<!-- Atlassian-style Navigation -->
		<div class="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-40" on:click={closeDropdowns}>
			<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between h-16">
					<!-- Left side: Brand + Main Navigation -->
					<div class="flex items-center space-x-8">
						<!-- Brand -->
						<a href="/dashboard" class="flex items-center space-x-2 text-xl font-semibold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
							<div class="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
								<svelte:component this={icons.Zap} size={16} class="text-white" />
							</div>
							<span>LifeQuest</span>
						</a>

						<!-- Desktop Navigation -->
						<div class="hidden md:flex items-center space-x-1">
							<a 
								href="/dashboard" 
								class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/dashboard' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.Home} size={16} />
									<span>Dashboard</span>
								</div>
							</a>
							<a 
								href="/tasks" 
								class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/tasks' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.CheckSquare} size={16} />
									<span>Tasks</span>
								</div>
							</a>
							<a 
								href="/adhoc-tasks" 
								class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/adhoc-tasks' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.Zap} size={16} />
									<span>Anytime</span>
								</div>
							</a>
							<a 
								href="/journals" 
								class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/journals' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-2">
									<svelte:component this={icons.BookOpen} size={16} />
									<span>Journal</span>
								</div>
							</a>
							<a 
								href="/stats" 
								class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/stats' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
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
									class="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center space-x-1"
								>
									<span>More</span>
									<svelte:component this={icons.ChevronDown} size={14} />
								</button>
								{#if moreDropdownOpen}
									<div class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-50" on:click|stopPropagation>
										<a 
											href="/focuses" 
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors {$page.route.id === '/focuses' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}"
										>
											<div class="flex items-center space-x-2">
												<svelte:component this={icons.Target} size={16} />
												<span>Focuses</span>
											</div>
										</a>
										<a 
											href="/family" 
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors {$page.route.id === '/family' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}"
										>
											<div class="flex items-center space-x-2">
												<svelte:component this={icons.Users} size={16} />
												<span>Family</span>
											</div>
										</a>
										<a 
											href="/potions" 
											on:click={closeDropdowns}
											class="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors {$page.route.id === '/potions' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}"
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
								class="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
							>
								<div class="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
									{$auth.user?.name?.charAt(0).toUpperCase()}
								</div>
								<div class="hidden sm:block text-left">
									<div class="text-sm font-medium text-neutral-900 dark:text-white">{$auth.user?.name}</div>
								</div>
								<svelte:component this={icons.ChevronDown} size={14} class="text-neutral-500 dark:text-neutral-400" />
							</button>
							{#if userDropdownOpen}
								<div class="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-50" on:click|stopPropagation>
									<a 
										href="/settings" 
										on:click={closeDropdowns}
										class="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
									>
										<div class="flex items-center space-x-2">
											<svelte:component this={icons.Settings} size={16} />
											<span>Settings</span>
										</div>
									</a>
									<div class="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
									<button 
										on:click={() => { handleLogout(); closeDropdowns(); }}
										class="w-full text-left block px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
							class="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
							aria-label="Toggle navigation menu"
						>
							<svelte:component this={mobileMenuOpen ? icons.X : icons.Menu} size={20} class="text-neutral-700 dark:text-neutral-300" />
						</button>
					</div>
				</div>

				<!-- Mobile Navigation Menu -->
				{#if mobileMenuOpen}
					<div class="md:hidden border-t border-neutral-200 dark:border-neutral-700 py-4">
						<div class="space-y-1">
							<a 
								href="/dashboard" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/dashboard' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.Home} size={16} />
									<span>Dashboard</span>
								</div>
							</a>
							<a 
								href="/tasks" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/tasks' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.CheckSquare} size={16} />
									<span>Tasks</span>
								</div>
							</a>
							<a 
								href="/adhoc-tasks" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/adhoc-tasks' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.Zap} size={16} />
									<span>Anytime</span>
								</div>
							</a>
							<a 
								href="/journals" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/journals' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.BookOpen} size={16} />
									<span>Journal</span>
								</div>
							</a>
							<a 
								href="/stats" 
								on:click={closeMobileMenu}
								class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/stats' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
							>
								<div class="flex items-center space-x-3">
									<svelte:component this={icons.BarChart3} size={16} />
									<span>Progress</span>
								</div>
							</a>

							<!-- Mobile More Tools Section -->
							<div class="pt-2 border-t border-neutral-200 dark:border-neutral-700 mt-2">
								<div class="px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tools</div>
								<a 
									href="/focuses" 
									on:click={closeMobileMenu}
									class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/focuses' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
								>
									<div class="flex items-center space-x-3">
										<svelte:component this={icons.Target} size={16} />
										<span>Focuses</span>
									</div>
								</a>
								<a 
									href="/family" 
									on:click={closeMobileMenu}
									class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/family' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
								>
									<div class="flex items-center space-x-3">
										<svelte:component this={icons.Users} size={16} />
										<span>Family</span>
									</div>
								</a>
								<a 
									href="/potions" 
									on:click={closeMobileMenu}
									class="block px-3 py-2 text-sm font-medium rounded-lg transition-colors {$page.route.id === '/potions' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'}"
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
