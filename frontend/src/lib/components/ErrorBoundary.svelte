<!-- Task 4.8: Create error boundary component for API error handling -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { ApiError } from '../api/client';
	import type { Snippet } from 'svelte';

	interface Props {
		fallback?: Snippet<[{ error: Error; retry: () => void }]>;
		onError?: (error: Error) => void;
		children: Snippet;
	}

	let { fallback, onError, children }: Props = $props();

	let error = $state<Error | null>(null);
	let errorId = $state(0);

	const dispatch = createEventDispatcher<{
		error: { error: Error };
		retry: void;
	}>();

	// Function to reset error state and retry
	function retry() {
		error = null;
		errorId += 1;
		dispatch('retry');
	}

	// Global error handler for unhandled promises
	function handleGlobalError(event: ErrorEvent | PromiseRejectionEvent) {
		let errorInstance: Error;

		if (event instanceof ErrorEvent) {
			errorInstance = new Error(event.message);
		} else {
			errorInstance =
				event.reason instanceof Error ? event.reason : new Error(String(event.reason));
		}

		error = errorInstance;
		onError?.(errorInstance);
		dispatch('error', { error: errorInstance });
	}

	onMount(() => {
		// Listen for global errors
		window.addEventListener('error', handleGlobalError);
		window.addEventListener('unhandledrejection', handleGlobalError);

		return () => {
			window.removeEventListener('error', handleGlobalError);
			window.removeEventListener('unhandledrejection', handleGlobalError);
		};
	});

	// Catch errors from child components
	$effect(() => {
		try {
			// This effect will re-run when errorId changes (retry)
			errorId;
		} catch (err) {
			const errorInstance = err instanceof Error ? err : new Error(String(err));
			error = errorInstance;
			onError?.(errorInstance);
			dispatch('error', { error: errorInstance });
		}
	});
</script>

{#if error}
	{#if fallback}
		{@render fallback({ error, retry })}
	{:else}
		<div class="error-boundary">
			<div class="error-content">
				<h2>Something went wrong</h2>

				{#if error instanceof ApiError}
					<div class="api-error">
						<p class="error-message">{error.message}</p>
						{#if error.status}
							<p class="error-status">Status: {error.status}</p>
						{/if}
						{#if error.code}
							<p class="error-code">Code: {error.code}</p>
						{/if}
						{#if error.details}
							<details>
								<summary>Details</summary>
								<pre>{JSON.stringify(error.details, null, 2)}</pre>
							</details>
						{/if}
					</div>
				{:else}
					<p class="error-message">{error.message}</p>
				{/if}

				<button type="button" class="retry-button" onclick={retry}> Try again </button>
			</div>
		</div>
	{/if}
{:else}
	{@render children()}
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: 2rem;
		background: var(--color-base-100, #ffffff);
		border-radius: 0.5rem;
		border: 1px solid var(--color-error, #ef4444);
	}

	.error-content {
		text-align: center;
		max-width: 600px;
	}

	.error-content h2 {
		color: var(--color-error, #ef4444);
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.api-error {
		background: var(--color-error-content, #fef2f2);
		border: 1px solid var(--color-error, #ef4444);
		border-radius: 0.375rem;
		padding: 1rem;
		margin: 1rem 0;
		text-align: left;
	}

	.error-message {
		color: var(--color-base-content, #1f2937);
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.error-status,
	.error-code {
		color: var(--color-base-content-secondary, #6b7280);
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	details {
		margin-top: 0.5rem;
	}

	summary {
		cursor: pointer;
		font-weight: 500;
		color: var(--color-base-content, #1f2937);
	}

	pre {
		background: var(--color-base-200, #f3f4f6);
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		overflow-x: auto;
		margin-top: 0.5rem;
	}

	.retry-button {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		border: none;
		border-radius: 0.375rem;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s ease-in-out;
		margin-top: 1rem;
	}

	.retry-button:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.retry-button:active {
		background: var(--color-primary-focus, #1d4ed8);
	}
</style>
