<script lang="ts">
	import { Award } from 'lucide-svelte';
	import { formatXp } from '$lib/utils/xp';
	
	export let name: string;
	export let level: number = 1;
	export let currentXp: number = 0;
	export let progress: number = 0;
	export let xpToNextLevel: number = 100;
	export let showName: boolean = true;
	export let showProgressBar: boolean = true;
	export let compact: boolean = false;
</script>

<div class={`stat-display ${compact ? 'compact' : ''}`}>
	{#if showName}
		<div class="flex items-center gap-1">
			<Award size={compact ? 14 : 16} />
			<span class="font-medium {compact ? 'text-sm' : ''}">{name}</span>
		</div>
	{/if}
	
	<div class="flex items-center gap-2 mt-1">
		<div class="badge {compact ? 'badge-sm' : ''} badge-primary">Lvl {level}</div>
		<div class={compact ? 'text-xs' : 'text-sm'}>
			{formatXp(currentXp)} XP
		</div>
	</div>
	
	{#if showProgressBar}
		<div class="mt-1">
			<div class="flex justify-between text-xs mb-0.5">
				<span class={compact ? 'text-[10px]' : ''}>Progress</span>
				<span class={compact ? 'text-[10px]' : ''}>{Math.round(progress * 100)}%</span>
			</div>
			<div class="w-full bg-base-300 rounded-full h-1.5">
				<div 
					class="bg-primary h-full rounded-full" 
					style={`width: ${Math.max(2, progress * 100)}%`}>
				</div>
			</div>
			<div class="text-xs text-base-content/60 mt-0.5 text-right {compact ? 'text-[10px]' : ''}">
				{formatXp(xpToNextLevel)} to next level
			</div>
		</div>
	{/if}
</div>

<style>
	.stat-display.compact {
		font-size: 0.875rem;
	}
</style>
