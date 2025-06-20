<script lang="ts">
	import { theme, availableThemes, type Theme } from '$lib/stores/theme';
	import { auth } from '$lib/stores/auth';
	import * as icons from 'lucide-svelte';

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		showLabels?: boolean;
		columns?: number;
	}

	let { size = 'md', showLabels = true, columns = 4 }: Props = $props();

	// Theme color mapping for preview dots
	const themeColors: Record<string, string[]> = {
		light: ['#ffffff', '#570df8', '#f2f2f2'],
		dark: ['#2a2e37', '#661ae6', '#414558'],
		cupcake: ['#faf7f5', '#65c3c8', '#291334'],
		bumblebee: ['#fffbeb', '#f59e0b', '#181830'],
		emerald: ['#ecfdf5', '#10b981', '#065f46'],
		corporate: ['#ffffff', '#4b6bfb', '#181a2a'],
		synthwave: ['#2d1b3d', '#e779c1', '#58c7f3'],
		retro: ['#fdf4e3', '#ef9995', '#2e282a'],
		cyberpunk: ['#0f0f23', '#ff7598', '#00d9ff'],
		valentine: ['#f8fafc', '#e11d48', '#881337'],
		halloween: ['#1f2937', '#f97316', '#7c2d12'],
		garden: ['#f0fdf4', '#16a34a', '#14532d'],
		forest: ['#1a1a2e', '#16537e', '#0f172a'],
		aqua: ['#f0fdfa', '#06b6d4', '#0e7490'],
		lofi: ['#f5f5f4', '#a8a29e', '#57534e'],
		pastel: ['#fdf2f8', '#ec4899', '#831843'],
		fantasy: ['#f5f3ff', '#8b5cf6', '#581c87'],
		wireframe: ['#ffffff', '#000000', '#e5e5e5'],
		black: ['#000000', '#ffffff', '#404040'],
		luxury: ['#09090b', '#d4af37', '#1c1917'],
		dracula: ['#282a36', '#ff79c6', '#6272a4'],
		cmyk: ['#ffffff', '#0ea5e9', '#ec4899'],
		autumn: ['#fef3c7', '#f59e0b', '#92400e'],
		business: ['#ffffff', '#1e40af', '#1e293b'],
		acid: ['#f0fdf4', '#84cc16', '#365314'],
		lemonade: ['#fffbeb', '#f59e0b', '#92400e'],
		night: ['#0f172a', '#38bdf8', '#1e293b'],
		coffee: ['#451a03', '#d97706', '#92400e'],
		winter: ['#f8fafc', '#0ea5e9', '#0f172a'],
		dim: ['#2a2e37', '#9ca3af', '#374151'],
		nord: ['#2e3440', '#81a1c1', '#4c566a'],
		sunset: ['#fff7ed', '#f97316', '#ea580c']
	};

	async function selectTheme(selectedTheme: Theme) {
		const isAuthenticated = $auth.user !== null;
		await theme.setTheme(selectedTheme, isAuthenticated);
	}

	const sizeClasses = {
		sm: 'p-2 text-xs',
		md: 'p-3 text-sm',
		lg: 'p-4 text-base'
	};

	const iconSizes = {
		sm: 12,
		md: 16,
		lg: 20
	};
</script>

<div class="grid gap-3" style="grid-template-columns: repeat({columns}, minmax(0, 1fr));">
	{#each availableThemes as themeOption}
		<button
			class="relative rounded-lg border-2 transition-all hover:shadow-sm {sizeClasses[size]} {$theme ===
			themeOption.value
				? 'border-primary bg-primary/10'
				: 'border-base-300 hover:border-base-content/20'}"
			onclick={() => selectTheme(themeOption.value)}
			title={themeOption.name}
		>
			{#if showLabels}
				<div class="mb-2 flex items-center space-x-2">
					<div class="text-base-content font-medium truncate">{themeOption.name}</div>
				</div>
			{/if}

			<!-- Theme Preview -->
			<div class="flex justify-center space-x-1">
				{#each themeColors[themeOption.value] || ['#f3f4f6', '#3b82f6', '#1f2937'] as color}
					<div
						class="h-3 w-3 rounded-full border border-black/10"
						style="background-color: {color}"
					></div>
				{/each}
			</div>

			{#if $theme === themeOption.value}
				{@const CheckIcon = icons.Check}
				<div class="absolute top-1 right-1">
					<CheckIcon size={iconSizes[size]} class="text-primary" />
				</div>
			{/if}
		</button>
	{/each}
</div>
