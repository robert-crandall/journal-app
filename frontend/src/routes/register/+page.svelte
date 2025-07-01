<script lang="ts">
	import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
	import { onMount } from 'svelte';
	import { AuthGuard } from '$lib/utils/auth-guard';

	// Check if user is already authenticated on mount
	onMount(async () => {
		await AuthGuard.requireGuest('/');
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
