<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X } from 'lucide-svelte';
	import Button from './Button.svelte';

	// Modal props
	export let open: boolean = false;
	export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
	export let closable: boolean = true;
	export let closeOnBackdrop: boolean = true;
	export let closeOnEscape: boolean = true;

	// Additional classes
	export let className: string = '';

	const dispatch = createEventDispatcher<{
		close: void;
		open: void;
	}>();

	// Handle close events
	function handleClose() {
		if (closable) {
			open = false;
			dispatch('close');
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === event.currentTarget) {
			handleClose();
		}
	}

	// Handle escape key
	function handleEscape(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape') {
			event.preventDefault();
			handleClose();
		}
	}

	// Build modal classes
	$: modalClasses = ['modal', open && 'modal-open', className].filter(Boolean).join(' ');

	$: boxClasses = [
		'modal-box',
		size === 'sm' && 'max-w-sm',
		size === 'md' && 'max-w-2xl',
		size === 'lg' && 'max-w-4xl',
		size === 'xl' && 'max-w-6xl',
		size === 'full' && 'max-w-none w-11/12 h-5/6'
	]
		.filter(Boolean)
		.join(' ');

	// Watch for open changes
	$: if (open) {
		dispatch('open');
		// Focus management and body scroll lock could be added here
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'hidden';
		}
	} else {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	}
</script>

<!-- Modal backdrop and container -->
{#if open}
	<div
		class={modalClasses}
		onclick={handleBackdropClick}
		onkeydown={handleEscape}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class={boxClasses}>
			<!-- Close button -->
			{#if closable}
				<Button
					variant="ghost"
					size="sm"
					circle
					icon={X}
					iconSize={16}
					onclick={handleClose}
					className="btn-circle absolute right-2 top-2"
					aria-label="Close modal"
				/>
			{/if}

			<!-- Modal header -->
			{#if $$slots.header}
				<div class="modal-header mb-4">
					<slot name="header" />
				</div>
			{/if}

			<!-- Modal content -->
			<div class="modal-content">
				<slot />
			</div>

			<!-- Modal footer/actions -->
			{#if $$slots.footer}
				<div class="modal-action mt-6">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Modal enhancements */
	:global(.modal) {
		transition: all 0.2s ease-in-out;
	}

	:global(.modal-box) {
		transition: all 0.2s ease-in-out;
		position: relative;
	}

	/* Smooth backdrop fade */
	:global(.modal-open) {
		backdrop-filter: blur(4px);
	}

	/* Modal header styling */
	.modal-header :global(h2),
	.modal-header :global(h3) {
		margin: 0;
		font-weight: 600;
	}

	/* Ensure proper z-index stacking */
	:global(.modal) {
		z-index: 1000;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		:global(.modal-box) {
			margin: 1rem;
			max-height: calc(100vh - 2rem);
			overflow-y: auto;
		}
	}
</style>
