<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
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
	<title>Login - Life Quest</title>
</svelte:head>

<div class="min-h-screen bg-theme-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
		<!-- Welcome content -->
		<div class="text-center lg:text-left">
			<h1 class="text-5xl font-bold text-theme mb-6">Welcome back!</h1>
			<p class="text-lg text-theme-muted">
				Continue your journey of personal growth and level up your life.
			</p>
		</div>
		
		<!-- Login form -->
		<div class="bg-theme shadow-xl rounded-md p-8 w-full max-w-sm mx-auto lg:mx-0">
			<form onsubmit={handleLogin} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-theme mb-2">
						Email
					</label>
					<input
						id="email"
						type="email"
						placeholder="email@example.com"
						class="w-full px-3 py-2 border border-theme rounded-md text-theme bg-theme focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={email}
						required
					/>
				</div>
				
				<div>
					<label for="password" class="block text-sm font-medium text-theme mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						placeholder="Password"
						class="w-full px-3 py-2 border border-theme rounded-md text-theme bg-theme focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						bind:value={password}
						required
					/>
				</div>
				
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
						{error}
					</div>
				{/if}
				
				<button 
					type="submit"
					disabled={loading}
					class="w-full bg-theme-primary text-white py-2 px-4 rounded-md font-medium hover:bg-theme-primary-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<div class="flex items-center justify-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Logging in...
						</div>
					{:else}
						Login
					{/if}
				</button>
				
				<div class="relative my-6">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-theme"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-theme text-theme-muted">OR</span>
					</div>
				</div>
				
				<p class="text-center text-sm text-theme-muted">
					Don't have an account?
					<a href="/register" class="text-theme-primary hover:underline font-medium">Sign up</a>
				</p>
			</form>
		</div>
	</div>
</div>
