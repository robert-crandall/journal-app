<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Home, User, BookOpen, Target, Users, Settings, Moon, Sun } from 'lucide-svelte';

	let { children } = $props();

	// Initialize theme on mount
	onMount(() => {
		// Theme initialization is handled in the store
	});

	const navigation = [
		{ name: 'Dashboard', href: '/', icon: Home },
		{ name: 'Character', href: '/character', icon: User },
		{ name: 'Journal', href: '/journal', icon: BookOpen },
		{ name: 'Quests', href: '/quests', icon: Target },
		{ name: 'Family', href: '/family', icon: Users },
		{ name: 'Settings', href: '/settings', icon: Settings }
	];

	// Helper function to check if route is active
	function isActive(href: string, pathname: string): boolean {
		return href === '/' ? pathname === '/' : pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-background">
	<!-- Mobile header -->
	<header class="lg:hidden bg-card border-b border-border">
		<div class="flex items-center justify-between px-4 py-3">
			<h1 class="text-lg font-semibold text-foreground">Life Quest</h1>
			<button 
				onclick={() => theme.toggle()}
				class="p-2 rounded-lg hover:bg-muted transition-colors"
				aria-label="Toggle theme"
			>
				{#if $theme === 'dark'}
					<Sun class="w-5 h-5" />
				{:else}
					<Moon class="w-5 h-5" />
				{/if}
			</button>
		</div>
	</header>

	<!-- Desktop sidebar -->
	<aside class="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border">
		<div class="p-6">
			<div class="flex items-center justify-between mb-8">
				<h1 class="text-xl font-bold text-foreground">Life Quest</h1>
				<button 
					onclick={() => theme.toggle()}
					class="p-2 rounded-lg hover:bg-muted transition-colors"
					aria-label="Toggle theme"
				>
					{#if $theme === 'dark'}
						<Sun class="w-5 h-5" />
					{:else}
						<Moon class="w-5 h-5" />
					{/if}
				</button>
			</div>
			
			<nav class="space-y-1">
				{#each navigation as item}
					{@const IconComponent = item.icon}
					<a 
						href={item.href}
						class="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors group"
						class:bg-primary={isActive(item.href, $page.url.pathname)}
						class:text-primary-foreground={isActive(item.href, $page.url.pathname)}
						class:text-foreground={!isActive(item.href, $page.url.pathname)}
					>
						<IconComponent class="w-5 h-5 mr-3" />
						{item.name}
					</a>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Main content -->
	<main class="lg:ml-64">
		<div class="p-4 lg:p-8">
			{@render children()}
		</div>
	</main>

	<!-- Mobile navigation -->
	<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
		<div class="flex">
			{#each navigation.slice(0, 5) as item}
				{@const IconComponent = item.icon}
				<a 
					href={item.href}
					class="flex-1 flex flex-col items-center py-2 px-1 text-xs"
					class:text-primary={isActive(item.href, $page.url.pathname)}
					class:text-muted-foreground={!isActive(item.href, $page.url.pathname)}
				>
					<IconComponent class="w-5 h-5 mb-1" />
					<span class="truncate">{item.name}</span>
				</a>
			{/each}
		</div>
	</nav>

	<!-- Mobile navigation padding -->
	<div class="lg:hidden h-16"></div>
</div>
