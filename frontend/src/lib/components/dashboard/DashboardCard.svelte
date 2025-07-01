<!-- Dashboard Card component with left border status indicators -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		title?: string;
		status?: 'active' | 'completed' | 'pending' | 'warning' | 'error' | 'neutral';
		href?: string;
		class?: string;
		fullWidth?: boolean;
	}

	let { 
		children, 
		title, 
		status = 'neutral', 
		href, 
		class: className = '',
		fullWidth = false 
	}: Props = $props();

	// Status color mapping based on the design reference
	const statusColors = {
		active: 'var(--color-primary, #3b82f6)',
		completed: 'var(--color-success, #10b981)', 
		pending: 'var(--color-warning, #f59e0b)',
		warning: 'var(--color-warning, #f59e0b)',
		error: 'var(--color-error, #ef4444)',
		neutral: 'var(--color-base-300, #d1d5db)'
	};
</script>

<!-- Use anchor tag if href is provided, div otherwise -->
{#if href}
	<a 
		{href} 
		class="dashboard-card {className}" 
		class:full-width={fullWidth}
		style="--status-color: {statusColors[status]}"
	>
		{#if title}
			<h3 class="card-title">{title}</h3>
		{/if}
		<div class="card-content">
			{@render children()}
		</div>
	</a>
{:else}
	<div 
		class="dashboard-card {className}" 
		class:full-width={fullWidth}
		style="--status-color: {statusColors[status]}"
	>
		{#if title}
			<h3 class="card-title">{title}</h3>
		{/if}
		<div class="card-content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.dashboard-card {
		background: var(--color-base-100, #ffffff);
		border: 1px solid var(--color-base-200, #e5e7eb);
		border-left: 4px solid var(--status-color);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease-in-out;
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.dashboard-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}

	.dashboard-card:active {
		transform: translateY(0);
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}

	.full-width {
		grid-column: 1 / -1;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.card-content {
		color: var(--color-base-content, #1f2937);
		line-height: 1.6;
	}

	/* Touch targets for mobile - 44px minimum */
	@media (max-width: 767px) {
		.dashboard-card {
			min-height: 44px;
			padding: 1.25rem;
		}

		.card-title {
			font-size: 1.125rem;
		}
	}

	/* Focus styles for accessibility */
	.dashboard-card:focus {
		outline: 2px solid var(--color-primary, #3b82f6);
		outline-offset: 2px;
	}

	/* Ensure proper contrast for links */
	a.dashboard-card:visited {
		color: inherit;
	}

	/* iOS Safari optimizations */
	@supports (-webkit-touch-callout: none) {
		.dashboard-card {
			-webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
		}
	}
</style>
