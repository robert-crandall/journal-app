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

<main class="hero min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="card bg-base-100 w-full max-w-md shadow-xl">
			<div class="card-body">
				<!-- Logo at the top -->
				<div class="mb-4 text-center">
					<a href="/" class="btn btn-ghost text-gradient text-2xl font-bold"> Auth Template </a>
				</div>

				<LoginForm {loading} {error} on:login={handleLogin} />
			</div>
		</div>
	</div>
</main>
