<script lang="ts">
	import type { ComponentType } from 'svelte';

	// Button variants and sizes
	export let variant:
		| 'primary'
		| 'secondary'
		| 'accent'
		| 'neutral'
		| 'ghost'
		| 'outline'
		| 'error'
		| 'warning'
		| 'success'
		| 'info' = 'primary';
	export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let loading: boolean = false;
	export let wide: boolean = false;
	export let circle: boolean = false;
	export let square: boolean = false;
	export let block: boolean = false;
	export let glass: boolean = false;

	// Icon support
	export let icon: ComponentType | null = null;
	export let iconRight: ComponentType | null = null;
	export let iconSize: number = 16;

	// Button element or link
	export let href: string | null = null;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let target: string | null = null;

	// Additional classes
	export let className: string = '';

	// Build button classes
	$: buttonClasses = [
		'btn',
		`btn-${variant}`,
		`btn-${size}`,
		loading && 'loading',
		disabled && 'btn-disabled',
		wide && 'btn-wide',
		circle && 'btn-circle',
		square && 'btn-square',
		block && 'btn-block',
		glass && 'glass',
		className
	]
		.filter(Boolean)
		.join(' ');

	// Content has icon spacing
	$: hasIcon = icon || iconRight || loading;
	$: hasContent = $$slots.default;
</script>

{#if href}
	<a {href} {target} class={buttonClasses} class:gap-2={hasIcon && hasContent} {...$$restProps}>
		{#if icon && !loading}
			<svelte:component this={icon} size={iconSize} />
		{/if}

		{#if loading}
			<span class="loading loading-spinner loading-{size}"></span>
		{/if}

		{#if hasContent}
			<slot />
		{/if}

		{#if iconRight && !loading}
			<svelte:component this={iconRight} size={iconSize} />
		{/if}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class={buttonClasses}
		class:gap-2={hasIcon && hasContent}
		{...$$restProps}
	>
		{#if icon && !loading}
			<svelte:component this={icon} size={iconSize} />
		{/if}

		{#if loading}
			<span class="loading loading-spinner loading-{size}"></span>
		{/if}

		{#if hasContent}
			<slot />
		{/if}

		{#if iconRight && !loading}
			<svelte:component this={iconRight} size={iconSize} />
		{/if}
	</button>
{/if}

<style>
	/* Custom button enhancements */
	:global(.btn) {
		transition: all 0.2s ease-in-out;
	}

	:global(.btn:not(.btn-disabled):hover) {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.btn:not(.btn-disabled):active) {
		transform: translateY(0);
	}

	/* Touch device optimizations */
	@media (hover: none) and (pointer: coarse) {
		:global(.btn:not(.btn-disabled):hover) {
			transform: none;
			box-shadow: none;
		}

		:global(.btn:not(.btn-disabled):active) {
			transform: scale(0.98);
		}
	}
</style>
