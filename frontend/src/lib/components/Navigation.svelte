<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { goto } from '$app/navigation';
	import { Menu, X, Sun, Moon } from 'lucide-svelte';

	let { onLogout = () => {} }: { onLogout?: () => void } = $props();

	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	async function toggleTheme() {
		const newTheme = $theme === 'light' ? 'dark' : 'light';
		await theme.setTheme(newTheme, $auth.user !== null);
	}

	const navigationItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: '🏠' },
		{ href: '/tasks', label: 'Tasks', icon: '✅' },
		{ href: '/journals', label: 'Journal', icon: '📖' },
		{ href: '/stats', label: 'Progress', icon: '📊' }
	];

	const secondaryItems = [
		{ href: '/focuses', label: 'Focuses', icon: '🎯' },
		{ href: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
		{ href: '/potions', label: 'Potions', icon: '🧪' }
	];

	function isActiveRoute(href: string): boolean {
		return $page.route.id === href;
	}
</script>

<header class="bg-theme shadow-md border-b border-theme">
	<nav class="container mx-auto px-4 py-3 flex items-center justify-between">
		<!-- Mobile: Hamburger on left -->
		<button 
			class="md:hidden p-2 hover:bg-theme-secondary rounded-md transition-colors text-theme" 
			aria-label="Open menu"
			onclick={toggleMobileMenu}
		>
			{#if mobileMenuOpen}
				<X size={20} />
			{:else}
				<Menu size={20} />
			{/if}
		</button>

		<!-- Brand -->
		<a 
			href="/dashboard" 
			class="text-lg font-semibold text-theme hover:text-theme-primary transition-colors"
		>
			Life Quest
		</a>

		<!-- Desktop Menu -->
		<ul class="hidden md:flex space-x-6 text-sm font-medium">
			{#each navigationItems as item}
				<li>
					<a 
						href={item.href} 
						class="px-3 py-2 rounded-md transition-colors {isActiveRoute(item.href) 
							? 'text-theme-primary border-b-2 border-blue-500' 
							: 'text-theme hover:text-theme-primary'}"
					>
						{item.label}
					</a>
				</li>
			{/each}
			
			<!-- More dropdown for desktop -->
			<li class="relative group">
				<button class="px-3 py-2 text-theme-muted hover:text-theme-primary transition-colors">
					More
				</button>
				<div class="absolute top-full right-0 mt-2 w-48 bg-theme shadow-xl rounded-md border border-theme opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
					<div class="p-2 space-y-1">
						{#each secondaryItems as item}
							<a 
								href={item.href} 
								class="block px-3 py-2 text-sm rounded-md hover:bg-theme-secondary transition-colors {isActiveRoute(item.href) 
									? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
									: 'text-theme-muted'}"
							>
								{item.icon} {item.label}
							</a>
						{/each}
					</div>
				</div>
			</li>
		</ul>

		<!-- Right side: Theme toggle + User menu -->
		<div class="flex items-center space-x-3">
			<!-- Theme toggle -->
			<button 
				onclick={toggleTheme}
				class="p-2 hover:bg-theme-secondary rounded-md transition-colors text-theme"
				aria-label="Toggle theme"
			>
				{#if $theme === 'light'}
					<Moon size={18} />
				{:else}
					<Sun size={18} />
				{/if}
			</button>

			<!-- User menu -->
			<div class="relative group">
				<button 
					class="w-8 h-8 rounded-full bg-theme-primary text-white flex items-center justify-center font-medium text-sm hover:bg-theme-primary-dark transition-colors"
					aria-label="User menu"
				>
					{$auth.user?.name?.charAt(0).toUpperCase()}
				</button>
				<div class="absolute top-full right-0 mt-3 w-52 bg-theme shadow-xl rounded-md border border-theme opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
					<div class="p-2">
						<div class="px-3 py-2 border-b border-theme mb-2">
							<span class="text-sm font-medium text-theme">{$auth.user?.name}</span>
						</div>
						<a 
							href="/settings" 
							class="block px-3 py-2 text-sm text-theme hover:bg-theme-secondary rounded-md transition-colors"
						>
							Settings
						</a>
						<button 
							onclick={onLogout} 
							class="block w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="md:hidden bg-theme border-t border-theme">
			<div class="px-4 py-4 space-y-2">
				{#each navigationItems as item}
					<a 
						href={item.href} 
						onclick={closeMobileMenu}
						class="block px-3 py-2 text-sm rounded-md transition-colors {isActiveRoute(item.href) 
							? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300' 
							: 'text-theme hover:bg-theme-secondary'}"
					>
						{item.icon} {item.label}
					</a>
				{/each}
				
				<hr class="my-2 border-theme">
				
				{#each secondaryItems as item}
					<a 
						href={item.href} 
						onclick={closeMobileMenu}
						class="block px-3 py-2 text-sm rounded-md transition-colors {isActiveRoute(item.href) 
							? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300' 
							: 'text-theme-muted hover:bg-theme-secondary'}"
					>
						{item.icon} {item.label}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</header>
