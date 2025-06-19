<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import * as icons from 'lucide-svelte';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
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

	async function handleRegister(event: Event) {
		event.preventDefault();
		if (!name || !email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		const result = await auth.register(email, password, name);

		loading = false;

		if (result.success) {
			goto('/dashboard');
		} else {
			error = result.error || 'Registration failed';
		}
	}
</script>

<svelte:head>
	<title>Sign Up - LifeQuest</title>
	<meta name="description" content="Create your account and begin your personal growth journey" />
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-blue-950 dark:to-purple-950"
>
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary dark:bg-primary"
			>
				<svelte:component this={icons.Zap} size={32} class="text-primary-content" />
			</div>
			<h1 class="mb-2 text-3xl font-bold text-base-content dark:text-primary-content">Start your quest</h1>
			<p class="text-base-content/70 dark:text-neutral-300">
				Transform your personal growth with RPG-style mechanics and AI insights
			</p>
		</div>

		<!-- Registration Form -->
		<div
			class="rounded-xl border border-base-300 bg-base-100 p-8 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
		>
			<form on:submit={handleRegister} class="space-y-6">
				<!-- Name Field -->
				<div>
					<label
						for="name"
						class="mb-2 block text-sm font-medium text-base-content/80 dark:text-neutral-300"
					>
						Full name
					</label>
					<input
						id="name"
						type="text"
						placeholder="Enter your full name"
						class="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-base-content placeholder-neutral-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-primary-content dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
						bind:value={name}
						required
						autocomplete="name"
					/>
				</div>

				<!-- Email Field -->
				<div>
					<label
						for="email"
						class="mb-2 block text-sm font-medium text-base-content/80 dark:text-neutral-300"
					>
						Email address
					</label>
					<input
						id="email"
						type="email"
						placeholder="Enter your email"
						class="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-base-content placeholder-neutral-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-primary-content dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</div>

				<!-- Password Field -->
				<div>
					<label
						for="password"
						class="mb-2 block text-sm font-medium text-base-content/80 dark:text-neutral-300"
					>
						Password
					</label>
					<input
						id="password"
						type="password"
						placeholder="Create a password (min 6 characters)"
						class="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-base-content placeholder-neutral-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-primary-content dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
						bind:value={password}
						required
						autocomplete="new-password"
					/>
				</div>

				<!-- Confirm Password Field -->
				<div>
					<label
						for="confirmPassword"
						class="mb-2 block text-sm font-medium text-base-content/80 dark:text-neutral-300"
					>
						Confirm password
					</label>
					<input
						id="confirmPassword"
						type="password"
						placeholder="Confirm your password"
						class="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-base-content placeholder-neutral-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-primary-content dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
						bind:value={confirmPassword}
						required
						autocomplete="new-password"
					/>
				</div>

				<!-- Error Alert -->
				{#if error}
					<div
						class="rounded-lg border border-error/20 bg-error/10 p-4 dark:border-red-800 dark:bg-red-900/30"
					>
						<div class="flex items-center space-x-2">
							<svelte:component
								this={icons.AlertCircle}
								size={16}
								class="text-red-500 dark:text-red-400"
							/>
							<span class="text-sm text-error dark:text-red-300">{error}</span>
						</div>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg border border-transparent bg-primary px-4 py-3 text-sm font-medium text-primary-content transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:hover:bg-primary dark:focus:ring-offset-neutral-800"
				>
					{#if loading}
						<div class="flex items-center justify-center space-x-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
							></div>
							<span>Creating account...</span>
						</div>
					{:else}
						Create account
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-base-300 dark:border-neutral-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-base-100 px-2 text-base-content/60 dark:bg-neutral-800 dark:text-base-content/50">
						Already have an account?
					</span>
				</div>
			</div>

			<!-- Sign In Link -->
			<div class="text-center">
				<a
					href="/login"
					class="text-sm font-medium text-info transition-colors hover:text-primary dark:text-blue-400 dark:hover:text-blue-300"
				>
					Sign in to your account
				</a>
			</div>
		</div>
	</div>
</div>
