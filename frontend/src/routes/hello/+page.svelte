<script lang="ts">
	import { onMount } from 'svelte';
	import { helloApi } from '../../lib/api/hello';

	// State variables
	let message = 'Loading...';
	let id = '';
	let timestamp = '';
	let loading = true;
	let error: string | null = null;

	// Load the hello message when component mounts
	onMount(async () => {
		try {
			loading = true;
			const response = await helloApi.getHello();
			message = response.message;
			id = response.id;
			timestamp = response.timestamp;
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to load hello message';
			console.error('Error loading hello:', e);
		} finally {
			loading = false;
		}
	});

	// Format timestamp for display
	function formatDate(isoString: string): string {
		try {
			const date = new Date(isoString);
			return date.toLocaleString();
		} catch {
			return isoString;
		}
	}
</script>

<div class="container mx-auto p-4">
	<div class="mx-auto my-8 max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl">
		<div class="p-8">
			<div class="text-sm font-semibold tracking-wide text-indigo-500 uppercase">
				Authenticated Page
			</div>
			<h1 class="mt-2 text-2xl font-bold">Hello World Example</h1>

			{#if loading}
				<div class="mt-4 flex items-center justify-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-indigo-500 border-l-transparent"
					></div>
					<span class="ml-2">Loading...</span>
				</div>
			{:else if error}
				<div class="mt-4 rounded bg-red-100 p-4 text-red-700">
					<p>Error: {error}</p>
				</div>
			{:else}
				<div class="mt-4 rounded bg-gray-100 p-4">
					<div class="text-lg font-medium">{message}</div>

					<div class="mt-4 text-sm text-gray-600">
						<p class="mb-1"><span class="font-semibold">User ID:</span> {id}</p>
						<p><span class="font-semibold">Timestamp:</span> {formatDate(timestamp)}</p>
					</div>
				</div>

				<div class="mt-6">
					<p class="text-sm text-gray-600">
						This page is protected by JWT authentication. You can only see this content if you're
						logged in.
					</p>
				</div>
			{/if}

			<div class="mt-6">
				<a href="/" class="text-indigo-500 hover:text-indigo-700">← Back to Home</a>
			</div>
		</div>
	</div>
</div>
