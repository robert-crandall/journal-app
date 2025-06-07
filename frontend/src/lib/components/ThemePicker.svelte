<script lang="ts">
	import { theme, availableThemes, type Theme } from '$lib/stores/theme';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	onMount(() => {
		// Initialize theme on mount - pass authentication state
		const isAuthenticated = $auth.user !== null;
		theme.init(isAuthenticated);
	});

	async function selectTheme(selectedTheme: Theme) {
		const isAuthenticated = $auth.user !== null;
		await theme.setTheme(selectedTheme, isAuthenticated);
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (dropdownRef && !dropdownRef.contains(target)) {
			isOpen = false;
		}
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="theme-picker dropdown dropdown-end" bind:this={dropdownRef}>
	<button 
		class="btn btn-ghost btn-circle" 
		onclick={toggleDropdown}
		aria-label="Change theme"
		aria-expanded={isOpen}
		aria-haspopup="true"
		title="Change theme"
	>
		<svg
			class="w-5 h-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z"
			></path>
		</svg>
	</button>
	
	{#if isOpen}
		<div 
			class="dropdown-content z-[1] mt-3 max-h-80 w-72 overflow-y-auto rounded-box bg-base-100 shadow-xl border border-base-300"
			role="menu"
			aria-label="Theme selection"
		>
			<div class="p-4">
				<h3 class="text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H4zm4 14a1 1 0 100-2 1 1 0 000 2zm-3-9a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path>
					</svg>
					Choose Theme
				</h3>
				<div class="grid grid-cols-1 gap-1">
					{#each availableThemes as themeOption}
						<button
							class="theme-item btn btn-ghost justify-start p-3 h-auto transition-all duration-200"
							class:btn-active={$theme === themeOption.value}
							onclick={() => selectTheme(themeOption.value)}
							data-theme={themeOption.value}
							role="menuitem"
							aria-label="Select {themeOption.name} theme"
						>
							<div class="flex items-center gap-3 w-full">
								<div class="flex gap-1 flex-shrink-0">
									<div class="bg-primary w-2 h-4 rounded transition-colors duration-200"></div>
									<div class="bg-secondary w-2 h-4 rounded transition-colors duration-200"></div>
									<div class="bg-accent w-2 h-4 rounded transition-colors duration-200"></div>
									<div class="bg-neutral w-2 h-4 rounded transition-colors duration-200"></div>
								</div>
								<span class="text-sm font-medium text-left flex-grow">{themeOption.name}</span>
								{#if $theme === themeOption.value}
									<div class="ml-auto flex-shrink-0">
										<svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
										</svg>
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
				<div class="mt-3 pt-3 border-t border-base-300">
					<p class="text-xs text-base-content/70 text-center">
						Theme preference is saved locally
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.theme-item[data-theme] {
		color: oklch(var(--bc));
	}
	
	.theme-item[data-theme]:hover {
		background-color: oklch(var(--b2));
		transform: translateY(-1px);
	}
	
	.theme-item[data-theme]:active {
		transform: translateY(0);
	}
	
	.theme-item.btn-active {
		background-color: oklch(var(--p) / 0.1);
		color: oklch(var(--pc));
		border-color: oklch(var(--p) / 0.2);
	}
	
	.dropdown-content {
		animation: fadeInScale 0.2s ease-out;
	}
	
	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
