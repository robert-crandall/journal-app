<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { LogIn, UserPlus, Zap } from 'lucide-svelte';

	// State
	let email = '';
	let password = '';
	let name = '';
	let isRegistering = false;

	// Login function
	async function handleLogin() {
		const result = await authStore.login(email, password);
		if (result.success) {
			goto('/');
		}
	}

	// Register function
	async function handleRegister() {
		const result = await authStore.register(email, name, password);
		if (result.success) {
			goto('/');
		}
	}

	// Demo user function
	async function handleDemoUser() {
		const result = await authStore.createDemoUser();
		if (result.success) {
			goto('/');
		}
	}

	// Handle form submission
	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (isRegistering) {
			await handleRegister();
		} else {
			await handleLogin();
		}
	}
</script>

<svelte:head>
	<title>{isRegistering ? 'Register' : 'Login'} - Life Quest</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="bg-card p-8 rounded-lg border border-border shadow-lg">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-foreground mb-2">
					{isRegistering ? 'Create Account' : 'Welcome Back'}
				</h1>
				<p class="text-muted-foreground">
					{isRegistering ? 'Start your adventure today' : 'Continue your quest'}
				</p>
			</div>

			<!-- Error display -->
			{#if $authStore.error}
				<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
					<p class="text-destructive text-sm">{$authStore.error}</p>
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-4">
				{#if isRegistering}
					<div>
						<label for="name" class="block text-sm font-medium text-foreground mb-2">
							Name
						</label>
						<input
							id="name"
							type="text"
							bind:value={name}
							required
							class="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="Your name"
						/>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium text-foreground mb-2">
						Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						placeholder="your@email.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-foreground mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
						placeholder="••••••••"
					/>
				</div>

				<button
					type="submit"
					disabled={$authStore.loading}
					class="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
				>
					{#if $authStore.loading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
					{:else if isRegistering}
						<UserPlus class="w-4 h-4 mr-2" />
					{:else}
						<LogIn class="w-4 h-4 mr-2" />
					{/if}
					{isRegistering ? 'Create Account' : 'Sign In'}
				</button>
			</form>

			<!-- Demo user option -->
			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-border"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-card text-muted-foreground">Or</span>
					</div>
				</div>

				<button
					type="button"
					onclick={handleDemoUser}
					disabled={$authStore.loading}
					class="w-full mt-4 flex items-center justify-center px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
				>
					<Zap class="w-4 h-4 mr-2" />
					Try Demo Account
				</button>
			</div>

			<!-- Toggle between login/register -->
			<div class="mt-6 text-center">
				<p class="text-muted-foreground text-sm">
					{isRegistering ? 'Already have an account?' : "Don't have an account?"}
					<button
						type="button"
						onclick={() => {
							isRegistering = !isRegistering;
							authStore.setError(null);
						}}
						class="text-primary hover:text-primary/80 font-medium ml-1"
					>
						{isRegistering ? 'Sign in' : 'Create account'}
					</button>
				</p>
			</div>
		</div>
	</div>
</div>
