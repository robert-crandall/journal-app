<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';

	// Set page title for SPA mode
	onMount(() => {
		if (browser) {
			document.title = 'Sign In | D&D Life Gamification';
		}
	});
</script>

<svelte:head>
	<title>Sign In | D&D Life Gamification</title>
	<meta name="description" content="Sign in to your D&D life adventure" />
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<LoginForm />
		</div>
	</div>
</div>
