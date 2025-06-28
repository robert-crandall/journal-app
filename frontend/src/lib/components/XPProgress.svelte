<script lang="ts">
	import { TrendingUp } from 'lucide-svelte';

	interface Props {
		statName: string;
		currentLevel: number;
		currentXP: number;
		xpForNextLevel: number;
		totalXP: number;
		levelTitle?: string;
		color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
		size?: 'sm' | 'md' | 'lg';
	}

	let {
		statName,
		currentLevel,
		currentXP,
		xpForNextLevel,
		totalXP,
		levelTitle,
		color = 'primary',
		size = 'md'
	}: Props = $props();

	// Calculate progress percentage
	const progressPercent = $derived(Math.round((currentXP / xpForNextLevel) * 100));

	// Size configurations
	const sizeConfig = {
		sm: {
			container: 'p-3',
			title: 'text-sm',
			level: 'text-lg',
			xp: 'text-xs',
			progress: 'h-1.5'
		},
		md: {
			container: 'p-4',
			title: 'text-base',
			level: 'text-xl',
			xp: 'text-sm',
			progress: 'h-2'
		},
		lg: {
			container: 'p-6',
			title: 'text-lg',
			level: 'text-2xl',
			xp: 'text-base',
			progress: 'h-3'
		}
	};

	// Color configurations for progress bars
	const colorConfig = {
		primary: 'bg-primary-500',
		success: 'bg-success-500',
		warning: 'bg-warning-500',
		danger: 'bg-danger-500',
		info: 'bg-info-500'
	};

	const borderConfig = {
		primary: 'card-primary',
		success: 'card-success',
		warning: 'card-warning',
		danger: 'card-danger',
		info: 'card-info'
	};
</script>

<div class="card {borderConfig[color]} {sizeConfig[size].container}">
	<div class="flex justify-between items-start mb-3">
		<div class="flex-1">
			<h3 class="font-semibold {sizeConfig[size].title}" style="color: rgb(var(--color-text-primary))">
				{statName}
			</h3>
			{#if levelTitle}
				<p class="text-xs mt-1 italic" style="color: rgb(var(--color-text-secondary))">
					"{levelTitle}"
				</p>
			{/if}
		</div>
		<div class="text-right">
			<div class="flex items-center gap-1" style="color: rgb(var(--color-text-secondary))">
				<TrendingUp class="h-4 w-4" />
				<span class="font-bold {sizeConfig[size].level}">
					Level {currentLevel}
				</span>
			</div>
		</div>
	</div>

	<!-- Progress bar -->
	<div class="mb-3">
		<div class="flex justify-between items-center mb-1">
			<span class="{sizeConfig[size].xp}" style="color: rgb(var(--color-text-tertiary))">
				{currentXP} / {xpForNextLevel} XP
			</span>
			<span class="{sizeConfig[size].xp}" style="color: rgb(var(--color-text-tertiary))">
				{progressPercent}%
			</span>
		</div>
		<div class="xp-progress {sizeConfig[size].progress}">
			<div
				class="xp-progress-bar"
				style="width: {progressPercent}%; background-color: rgb(var(--color-{color}-500))"
			></div>
		</div>
	</div>

	<!-- Total XP -->
	<div class="text-center {sizeConfig[size].xp}" style="color: rgb(var(--color-text-tertiary))">
		Total XP: {totalXP.toLocaleString()}
	</div>
</div>
