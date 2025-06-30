<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import { authApi } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';

	let loading = false;
	let error: string | null = null;

	// Handle login
	async function handleLogin(
		event: CustomEvent<{ email: string; password: string; rememberMe: boolean }>
	) {
		const { email, password, rememberMe } = event.detail;
		loading = true;
		error = null;

		try {
			const response = await authApi.login({ email, password, rememberMe });

			// Store the token and user data
			authStore.setAuth(response.user, response.token);

			// Redirect to dashboard or home page
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In</title>
	<meta name="description" content="Sign in to your account" />
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<LoginForm {loading} {error} on:login={handleLogin} />
		</div>
	</div>
</div>
