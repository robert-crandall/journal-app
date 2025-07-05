<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import type { LayoutData } from './$types.js';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
</script>

{#if data?.user}
	<Navigation user={data.user} />
{/if}

{@render children()}
