<script lang="ts">
	// Skeleton props
	export let variant: 'text' | 'circle' | 'rectangle' | 'avatar' | 'button' | 'card' = 'text';
	export let lines: number = 1; // For text variant
	export let width: string = '100%';
	export let height: string = '1rem';
	export let rounded: boolean = false;
	export let animate: boolean = true;

	// Additional classes
	export let className: string = '';

	// Build skeleton classes
	$: skeletonClasses = [
		'skeleton',
		animate && 'animate-pulse',
		rounded && 'rounded-full',
		className
	]
		.filter(Boolean)
		.join(' ');

	// Generate lines for text skeleton
	$: textLines = Array.from({ length: lines }, (_, i) => i);
</script>

{#if variant === 'text'}
	<div class="space-y-2">
		{#each textLines as line, index}
			<div
				class={skeletonClasses}
				style="width: {index === lines - 1 ? '75%' : width}; height: {height};"
				aria-hidden="true"
			></div>
		{/each}
	</div>
{:else if variant === 'circle'}
	<div
		class="{skeletonClasses} rounded-full"
		style="width: {width}; height: {height};"
		aria-hidden="true"
	></div>
{:else if variant === 'avatar'}
	<div class="{skeletonClasses} h-12 w-12 rounded-full" aria-hidden="true"></div>
{:else if variant === 'button'}
	<div class="{skeletonClasses} h-10 rounded-lg" style="width: {width};" aria-hidden="true"></div>
{:else if variant === 'card'}
	<div class="skeleton-card animate-pulse">
		<div class="skeleton mb-4 h-48 w-full rounded-t-lg"></div>
		<div class="space-y-3 px-4 pb-4">
			<div class="skeleton h-6 w-3/4 rounded"></div>
			<div class="skeleton h-4 w-full rounded"></div>
			<div class="skeleton h-4 w-5/6 rounded"></div>
		</div>
	</div>
{:else}
	<!-- Rectangle variant -->
	<div class={skeletonClasses} style="width: {width}; height: {height};" aria-hidden="true"></div>
{/if}

<style>
	/* Skeleton base styles */
	:global(.skeleton) {
		background: linear-gradient(
			90deg,
			oklch(var(--b2)) 25%,
			oklch(var(--b3)) 50%,
			oklch(var(--b2)) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.375rem;
	}

	/* Pulse animation */
	:global(.skeleton.animate-pulse) {
		animation: skeleton-pulse 2s ease-in-out infinite;
	}

	@keyframes skeleton-pulse {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Card skeleton container */
	.skeleton-card {
		background: oklch(var(--b1));
		border-radius: 0.5rem;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Dark theme adjustments */
	:global([data-theme='dark'] .skeleton) {
		background: linear-gradient(
			90deg,
			oklch(var(--b3)) 25%,
			oklch(var(--b2)) 50%,
			oklch(var(--b3)) 75%
		);
		background-size: 200% 100%;
	}
</style>
