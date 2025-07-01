<!-- Task 5.1: Dashboard layout with responsive grid system -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		class?: string;
		mainContent?: Snippet;
		secondaryContent?: Snippet;
		tertiaryContent?: Snippet;
		quaternaryContent?: Snippet;
	}

	let {
		title,
		subtitle,
		class: className = '',
		mainContent,
		secondaryContent,
		tertiaryContent,
		quaternaryContent
	}: Props = $props();
</script>

<div class="dashboard-layout {className}">
	{#if title}
		<header class="dashboard-header">
			<h1 class="dashboard-title">{title}</h1>
			{#if subtitle}
				<p class="dashboard-subtitle">{subtitle}</p>
			{/if}
		</header>
	{/if}

	<main class="dashboard-grid">
		<div class="dashboard-card-main">
			{#if mainContent}
				{@render mainContent()}
			{/if}
		</div>

		<div class="dashboard-card-secondary">
			{#if secondaryContent}
				{@render secondaryContent()}
			{/if}
		</div>

		<div class="dashboard-card-tertiary">
			{#if tertiaryContent}
				{@render tertiaryContent()}
			{/if}
		</div>

		<div class="dashboard-card-quaternary">
			{#if quaternaryContent}
				{@render quaternaryContent()}
			{/if}
		</div>
	</main>
</div>

<style>
	.dashboard-layout {
		min-height: 100vh;
		background-color: var(--color-base-100, #ffffff);
		padding: 1rem;
	}

	.dashboard-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.dashboard-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-base-content, #1f2937);
		margin-bottom: 0.5rem;
	}

	.dashboard-subtitle {
		font-size: 1.125rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin: 0;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.dashboard-card-main,
	.dashboard-card-secondary,
	.dashboard-card-tertiary,
	.dashboard-card-quaternary {
		/* Ensure cards fill their grid areas */
		min-height: 200px;
	}

	/* Mobile First - iOS Safari optimized */
	@media (min-width: 768px) {
		.dashboard-layout {
			padding: 2rem;
		}

		.dashboard-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 2rem;
		}

		.dashboard-title {
			font-size: 3rem;
		}
	}

	@media (min-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: repeat(2, 1fr);
			grid-template-areas:
				'main main'
				'secondary tertiary'
				'quaternary quaternary';
		}

		.dashboard-card-main {
			grid-area: main;
		}

		.dashboard-card-secondary {
			grid-area: secondary;
		}

		.dashboard-card-tertiary {
			grid-area: tertiary;
		}

		.dashboard-card-quaternary {
			grid-area: quaternary;
		}
	}

	@media (min-width: 1280px) {
		.dashboard-layout {
			padding: 3rem;
		}

		.dashboard-grid {
			gap: 2.5rem;
		}
	}

	/* iOS Safari specific optimizations */
	@supports (-webkit-touch-callout: none) {
		.dashboard-layout {
			/* Handle iOS safe areas */
			padding-top: max(1rem, env(safe-area-inset-top));
			padding-bottom: max(1rem, env(safe-area-inset-bottom));
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
		}
	}
</style>
