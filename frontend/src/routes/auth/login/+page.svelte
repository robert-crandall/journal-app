<script lang="ts">
	import { auth } from '$lib/auth.js';
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleLogin(event: Event) {
		event.preventDefault();
		
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		isLoading = true;
		error = '';

		try {
			await auth.login(email, password);
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			isLoading = false;
		}
	}

	function clearError() {
		error = '';
	}
</script>

<svelte:head>
	<title>Login - Journal</title>
</svelte:head>

<div class="card bg-base-100 shadow-xl animate-fade-in">
	<div class="card-body">
		<h1 class="card-title text-2xl mb-6 justify-center">Welcome Back</h1>
		
		{#if error}
			<Alert message={error} type="error" onDismiss={clearError} class="mb-4" />
		{/if}

		<form onsubmit={handleLogin} class="space-y-4">
			<div class="form-control">
				<label class="label" for="email">
					<span class="label-text">Email</span>
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					class="input input-bordered focus-ring"
					placeholder="Enter your email"
					required
					disabled={isLoading}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="password">
					<span class="label-text">Password</span>
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="input input-bordered focus-ring"
					placeholder="Enter your password"
					required
					disabled={isLoading}
				/>
			</div>

			<div class="form-control mt-6">
				<button 
					type="submit" 
					class="btn btn-primary"
					disabled={isLoading || !email || !password}
				>
					{#if isLoading}
						<LoadingSpinner size="sm" />
						Signing In...
					{:else}
						Sign In
					{/if}
				</button>
			</div>
		</form>

		<div class="divider">OR</div>

		<div class="text-center">
			<p class="text-base-content/70">Don't have an account?</p>
			<a href="/auth/register" class="link link-primary font-medium">
				Create one here
			</a>
		</div>
	</div>
</div>
