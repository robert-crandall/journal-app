<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import type { LayoutData } from './$types.js';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

{#if data?.user}
	<Navigation user={data.user} />
{/if}

{@render children()}
