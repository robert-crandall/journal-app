<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';

	// Set page title for SPA mode
	onMount(() => {
		if (browser) {
			document.title = 'Create Account | D&D Life Gamification';
		}
	});
</script>

<svelte:head>
	<title>Create Account | D&D Life Gamification</title>
	<meta name="description" content="Create your account to start your D&D life adventure" />
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<RegisterForm />
		</div>
	</div>
</div>
