<script lang="ts">
	import { onMount } from 'svelte';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import { AuthGuard } from '$lib/utils/auth-guard';

	// Check if user is already authenticated on mount
	onMount(async () => {
		await AuthGuard.requireGuest('/');
	});
</script>

<svelte:head>
	<title>Sign In</title>
	<meta name="description" content="Sign in to your account" />
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<LoginForm />
		</div>
	</div>
</div>
