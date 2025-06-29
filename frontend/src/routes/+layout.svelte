<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeTheme, toggleTheme } from '$lib/stores/theme';
	import { Menu, Sun, Moon, Settings } from 'lucide-svelte';
	import NotificationOverlay from '$lib/components/NotificationOverlay.svelte';

	let { children } = $props();
	let showMobileMenu = $state(false);

	onMount(() => {
		initializeTheme();
	});

	const navigation = [
		{ name: 'Dashboard', href: '/', icon: null },
		{ name: 'Character', href: '/character', icon: null },
		{ name: 'Tasks', href: '/tasks', icon: null },
		{ name: 'Journal', href: '/journal', icon: null },
		{ name: 'Quests', href: '/quests', icon: null },
		{ name: 'Family', href: '/family', icon: null },
	];

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}
</script>

<div class="min-h-screen" style="background-color: rgb(var(--color-background))">
	<!-- Top Navigation -->
	<nav style="background-color: rgb(var(--color-surface)); border-bottom: 1px solid rgb(var(--color-border-subtle))">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<!-- Logo and navigation -->
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<h1 class="text-xl font-bold" style="color: rgb(var(--color-text-primary))">D&D Life</h1>
					</div>
					
					<!-- Desktop navigation -->
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						{#each navigation as item}
							<a
								href={item.href}
								class="inline-flex items-center px-1 pt-1 text-sm font-medium nav-link border-b-2 border-transparent hover-border-primary touch-target"
								style="color: rgb(var(--color-text-secondary))"
							>
								{item.name}
							</a>
						{/each}
					</div>
				</div>

				<!-- Right side actions -->
				<div class="flex items-center space-x-4">
					<!-- Theme toggle -->
					<button
						onclick={toggleTheme}
						class="p-2 rounded-md nav-link touch-target"
						style="color: rgb(var(--color-text-secondary))"
						aria-label="Toggle theme"
					>
						<Sun class="h-5 w-5 dark:hidden" />
						<Moon class="h-5 w-5 hidden dark:block" />
					</button>

					<!-- Settings -->
					<button
						class="p-2 rounded-md nav-link touch-target"
						style="color: rgb(var(--color-text-secondary))"
						aria-label="Settings"
					>
						<Settings class="h-5 w-5" />
					</button>

					<!-- Mobile menu button -->
					<div class="sm:hidden">
						<button
							onclick={toggleMobileMenu}
							class="p-2 rounded-md nav-link touch-target"
							style="color: rgb(var(--color-text-secondary))"
							aria-label="Open main menu"
						>
							<Menu class="h-5 w-5" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if showMobileMenu}
			<div class="sm:hidden">
				<div class="pt-2 pb-3 space-y-1" style="border-top: 1px solid rgb(var(--color-border-subtle))">
					{#each navigation as item}
						<a
							href={item.href}
							class="block pl-3 pr-4 py-2 text-base font-medium nav-link touch-target"
							style="color: rgb(var(--color-text-secondary))"
							onclick={() => showMobileMenu = false}
						>
							{item.name}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main content -->
	<main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
		{@render children()}
	</main>

	<!-- Notification overlay -->
	<NotificationOverlay />
</div>
