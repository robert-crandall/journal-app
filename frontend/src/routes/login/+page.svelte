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

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
				<svelte:component this={icons.Zap} size={32} class="text-white" />
			</div>
			<h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">Welcome back</h1>
			<p class="text-neutral-600 dark:text-neutral-300">
				Continue your personal growth journey
			</p>
		</div>

		<!-- Login Form -->
		<div class="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-8">
			<form on:submit={handleLogin} class="space-y-6">
				<!-- Email Field -->
				<div>
					<label for="email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
						Email address
					</label>
					<input
						id="email"
						type="email"
						placeholder="Enter your email"
						class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						placeholder="Enter your password"
						class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
						bind:value={password}
						required
						autocomplete="current-password"
					/>
				</div>
				
				<!-- Error Alert -->
				{#if error}
					<div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
						<div class="flex items-center space-x-2">
							<svelte:component this={icons.AlertCircle} size={16} class="text-red-500 dark:text-red-400" />
							<span class="text-sm text-red-700 dark:text-red-300">{error}</span>
						</div>
					</div>
				{/if}
				
				<!-- Submit Button -->
				<button 
					type="submit"
					disabled={loading}
					class="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if loading}
						<div class="flex items-center justify-center space-x-2">
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
					<div class="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
						Don't have an account?
					</span>
				</div>
			</div>

			<!-- Sign Up Link -->
			<div class="text-center">
				<a 
					href="/register" 
					class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
				>
					Create an account
				</a>
			</div>
		</div>
	</div>
</div>
