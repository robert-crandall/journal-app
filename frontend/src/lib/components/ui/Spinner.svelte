<script lang="ts">
	// Loading spinner props
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let color:
		| 'primary'
		| 'secondary'
		| 'accent'
		| 'neutral'
		| 'info'
		| 'success'
		| 'warning'
		| 'error' = 'primary';
	export let variant: 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity' = 'spinner';

	// Additional classes
	export let className: string = '';

	// Build loading classes
	$: loadingClasses = [
		'loading',
		`loading-${variant}`,
		`loading-${size}`,
		`text-${color}`,
		className
	]
		.filter(Boolean)
		.join(' ');
</script>

<span class={loadingClasses} aria-label="Loading..." role="status" {...$$restProps}></span>

<style>
	/* Custom loading animations */
	:global(.loading) {
		display: inline-block;
	}

	/* Size variations */
	:global(.loading-xs) {
		width: 1rem;
		height: 1rem;
	}

	:global(.loading-sm) {
		width: 1.25rem;
		height: 1.25rem;
	}

	:global(.loading-md) {
		width: 1.5rem;
		height: 1.5rem;
	}

	:global(.loading-lg) {
		width: 2rem;
		height: 2rem;
	}

	:global(.loading-xl) {
		width: 3rem;
		height: 3rem;
	}
</style>
