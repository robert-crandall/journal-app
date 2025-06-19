<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import * as icons from 'lucide-svelte';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	onMount(() => {
		// Redirect if already logged in
		const unsubscribe = auth.subscribe((state) => {
			if (state.user && !state.loading) {
				goto('/dashboard');
			}
		});

		return unsubscribe;
	});

	async function handleLogin(event: Event) {
		event.preventDefault();
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		const result = await auth.login(email, password);

		loading = false;

		if (result.success) {
			goto('/dashboard');
		} else {
			error = result.error || 'Login failed';
		}
	}
</script>

<svelte:head>
	<title>Sign In - LifeQuest</title>
	<meta name="description" content="Sign in to continue your personal growth journey" />
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-blue-950 dark:to-purple-950"
>
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div
				class="bg-primary dark:bg-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
			>
				<svelte:component this={icons.Zap} size={32} class="text-primary-content" />
			</div>
			<h1 class="text-base-content dark:text-primary-content mb-2 text-3xl font-bold">
				Welcome back
			</h1>
			<p class="text-base-content/70 dark:text-neutral-300">
				Continue your personal growth journey
			</p>
		</div>

		<!-- Login Form -->
		<div
			class="border-base-300 bg-base-100 rounded-xl border p-8 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
		>
			<form on:submit={handleLogin} class="space-y-6">
				<!-- Email Field -->
				<div>
					<label
						for="email"
						class="text-base-content/80 mb-2 block text-sm font-medium dark:text-neutral-300"
					>
						Email address
					</label>
					<input
						id="email"
						type="email"
						placeholder="Enter your email"
						class="border-base-300 bg-base-100 text-base-content dark:text-primary-content w-full rounded-lg border px-3 py-2 placeholder-neutral-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</div>

				<!-- Password Field -->
				<div>
					<label
						for="password"
						class="text-base-content/80 mb-2 block text-sm font-medium dark:text-neutral-300"
					>
						Password
					</label>
					<input
						id="password"
						type="password"
						placeholder="Enter your password"
						class="border-base-300 bg-base-100 text-base-content dark:text-primary-content w-full rounded-lg border px-3 py-2 placeholder-neutral-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
						bind:value={password}
						required
						autocomplete="current-password"
					/>
				</div>

				<!-- Error Alert -->
				{#if error}
					<div
						class="border-error/20 bg-error/10 rounded-lg border p-4 dark:border-red-800 dark:bg-red-900/30"
					>
						<div class="flex items-center space-x-2">
							<svelte:component
								this={icons.AlertCircle}
								size={16}
								class="text-red-500 dark:text-red-400"
							/>
							<span class="text-error text-sm dark:text-red-300">{error}</span>
						</div>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={loading}
					class="bg-primary text-primary-content hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary w-full rounded-lg border border-transparent px-4 py-3 text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-neutral-800"
				>
					{#if loading}
						<div class="flex items-center justify-center space-x-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
							></div>
							<span>Signing in...</span>
						</div>
					{:else}
						Sign in
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="border-base-300 w-full border-t dark:border-neutral-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span
						class="bg-base-100 text-base-content/60 dark:text-base-content/50 px-2 dark:bg-neutral-800"
					>
						Don't have an account?
					</span>
				</div>
			</div>

			<!-- Sign Up Link -->
			<div class="text-center">
				<a
					href="/register"
					class="text-info hover:text-primary text-sm font-medium transition-colors dark:text-blue-400 dark:hover:text-blue-300"
				>
					Create an account
				</a>
			</div>
		</div>
	</div>
</div>
