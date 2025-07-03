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

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Logo at the top -->
		<div class="mb-8 text-center">
			<a href="/" class="inline-flex items-center gap-2 text-2xl font-bold">
				<span class="from-brand-500 to-secondary-500 bg-gradient-to-r bg-clip-text text-transparent"
					>Auth Template</span
				>
			</a>
		</div>

		<!-- Card with login form -->
		<div
			class="bg-base-100 border-base-200/60 overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm"
		>
			<LoginForm {loading} {error} on:login={handleLogin} />
		</div>
	</div>
</div>
