<script lang="ts">
	import { Target, Trophy, Star, ArrowUp, Activity } from 'lucide-svelte';

	type StatCardProps = {
		name: string;
		level: number;
		currentXP: number;
		totalXP: number;
		nextLevelXP: number;
		title: string;
		category?: string;
		onLevelUp?: () => void;
		canLevelUp?: boolean;
	};

	let {
		name,
		level,
		currentXP,
		totalXP,
		nextLevelXP,
		title,
		category = 'general',
		onLevelUp,
		canLevelUp = false
	}: StatCardProps = $props();

	// Color coding based on stat categories
	const categoryColors = {
		physical: 'success', // Green for physical activities
		mental: 'info', // Blue for mental/learning activities
		social: 'warning', // Orange for social connections
		adventure: 'primary', // Purple/indigo for adventure
		family: 'danger', // Red/pink for family time
		creativity: 'warning', // Orange for creative pursuits
		health: 'success', // Green for health-related
		career: 'info', // Blue for career development
		general: 'neutral' // Gray for general stats
	};

	// Determine category from stat name if not provided
	const inferCategory = (statName: string): string => {
		const name = statName.toLowerCase();
		if (name.includes('physical') || name.includes('fitness') || name.includes('exercise')) return 'physical';
		if (name.includes('mental') || name.includes('learning') || name.includes('skill') || name.includes('career')) return 'mental';
		if (name.includes('social') || name.includes('community')) return 'social';
		if (name.includes('adventure') || name.includes('travel') || name.includes('exploration')) return 'adventure';
		if (name.includes('family') || name.includes('relationship')) return 'family';
		if (name.includes('creativity') || name.includes('art') || name.includes('creative')) return 'creativity';
		if (name.includes('health') || name.includes('wellness')) return 'health';
		if (name.includes('career') || name.includes('work') || name.includes('professional')) return 'career';
		return 'general';
	};

	const actualCategory = category === 'general' ? inferCategory(name) : category;
	const colorScheme = categoryColors[actualCategory as keyof typeof categoryColors] || 'neutral';

	// Calculate progress percentage
	const progressPercentage = Math.round((currentXP / nextLevelXP) * 100);
	
	// Determine if close to level up (85%+ progress)
	const closeToLevelUp = progressPercentage >= 85;

	// Get appropriate icon for category
	const getCategoryIcon = (cat: string) => {
		switch (cat) {
			case 'physical': case 'health': return Activity;
			case 'adventure': return Target;
			case 'mental': case 'career': return Star;
			case 'family': case 'social': case 'creativity': return Trophy;
			default: return Target;
		}
	};

	const CategoryIcon = getCategoryIcon(actualCategory);
</script>

<div 
	class="card stat-card"
	class:stat-card-levelup={canLevelUp}
	class:stat-card-close={closeToLevelUp && !canLevelUp}
	style:border-left-color="rgb(var(--color-{colorScheme}-500))"
>
	<div class="flex justify-between items-start mb-3">
		<div class="flex items-start space-x-3">
			<div 
				class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
				style:background-color="rgb(var(--color-{colorScheme}-100))"
			>
				<CategoryIcon 
					class="h-5 w-5" 
					style="color: rgb(var(--color-{colorScheme}-600))" 
				/>
			</div>
			<div class="flex-1">
				<h3 class="font-semibold text-base" style="color: rgb(var(--color-text-primary))">
					{name}
				</h3>
				<p class="text-sm italic" style="color: rgb(var(--color-text-tertiary))">
					"{title}"
				</p>
			</div>
		</div>
		<div class="text-right">
			<div class="flex items-center space-x-2">
				{#if canLevelUp}
					<button 
						onclick={onLevelUp}
						class="btn btn-success btn-sm"
						title="Level up available!"
					>
						<ArrowUp class="h-3 w-3 mr-1" />
						Level Up!
					</button>
				{/if}
				<div class="flex items-center">
					<Trophy class="h-4 w-4 mr-1" style="color: rgb(var(--color-{colorScheme}-500))" />
					<span class="font-medium text-lg" style="color: rgb(var(--color-text-primary))">
						{level}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Progress Section -->
	<div class="mb-3">
		<div class="flex justify-between text-sm mb-2">
			<span style="color: rgb(var(--color-text-secondary))">
				{currentXP} / {nextLevelXP} XP
			</span>
			<span 
				class:font-medium={closeToLevelUp}
				style="color: rgb(var(--color-{closeToLevelUp ? colorScheme : 'text-secondary'}-{closeToLevelUp ? '600' : ''}))"
			>
				{progressPercentage}%
			</span>
		</div>
		<div class="xp-progress">
			<div 
				class="xp-progress-bar transition-all duration-300"
				class:xp-progress-pulse={canLevelUp}
				style:width="{progressPercentage}%"
				style:background-color="rgb(var(--color-{colorScheme}-500))"
			></div>
		</div>
	</div>

	<!-- Stats Footer -->
	<div class="flex justify-between items-center text-xs">
		<span style="color: rgb(var(--color-text-tertiary))">
			Total XP: {totalXP.toLocaleString()}
		</span>
		<span 
			class="px-2 py-1 rounded text-xs font-medium"
			style:background-color="rgb(var(--color-{colorScheme}-100))"
			style:color="rgb(var(--color-{colorScheme}-700))"
		>
			{actualCategory}
		</span>
	</div>
</div>

<style>
	.stat-card {
		transition: all 0.2s ease;
		border-left: 4px solid;
	}

	.stat-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stat-card-levelup {
		animation: glow 2s ease-in-out infinite alternate;
		border-left-width: 6px;
	}

	.stat-card-close {
		border-left-width: 5px;
	}

	.xp-progress {
		width: 100%;
		height: 8px;
		background-color: rgb(var(--color-neutral-200));
		border-radius: 4px;
		overflow: hidden;
	}

	.xp-progress-bar {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.xp-progress-pulse {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes glow {
		from {
			box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
		}
		to {
			box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.6);
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>
