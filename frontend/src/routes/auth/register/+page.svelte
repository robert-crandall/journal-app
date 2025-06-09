<script lang="ts">
	import { auth } from '$lib/auth.js';
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let timezone = $state(Intl.DateTimeFormat().resolvedOptions().timeZone);
	let isLoading = $state(false);
	let error = $state('');

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
			error = 'Password must be at least 6 characters long';
			return;
		}

		isLoading = true;
		error = '';

		try {
			await auth.register(email, password, name, timezone);
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registration failed';
		} finally {
			isLoading = false;
		}
	}

	function clearError() {
		error = '';
	}
</script>

<svelte:head>
	<title>Register - Journal</title>
</svelte:head>

<div class="card bg-base-100 shadow-xl animate-fade-in">
	<div class="card-body">
		<h1 class="card-title text-2xl mb-6 justify-center">Create Account</h1>
		
		{#if error}
			<Alert message={error} type="error" onDismiss={clearError} class="mb-4" />
		{/if}

		<form onsubmit={handleRegister} class="space-y-4">
			<div class="form-control">
				<label class="label" for="name">
					<span class="label-text">Full Name</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					class="input input-bordered focus-ring"
					placeholder="Enter your full name"
					required
					disabled={isLoading}
				/>
			</div>

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
					placeholder="Create a password"
					required
					disabled={isLoading}
					minlength="6"
				/>
				<div class="label">
					<span class="label-text-alt">At least 6 characters</span>
				</div>
			</div>

			<div class="form-control">
				<label class="label" for="confirmPassword">
					<span class="label-text">Confirm Password</span>
				</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					class="input input-bordered focus-ring"
					placeholder="Confirm your password"
					required
					disabled={isLoading}
				/>
			</div>

			<div class="form-control">
				<label class="label" for="timezone">
					<span class="label-text">Timezone</span>
				</label>
				<input
					id="timezone"
					type="text"
					bind:value={timezone}
					class="input input-bordered focus-ring"
					placeholder="Your timezone"
					disabled={isLoading}
				/>
				<div class="label">
					<span class="label-text-alt">Used for scheduling and timestamps</span>
				</div>
			</div>

			<div class="form-control mt-6">
				<button 
					type="submit" 
					class="btn btn-primary"
					disabled={isLoading || !name || !email || !password || !confirmPassword}
				>
					{#if isLoading}
						<LoadingSpinner size="sm" />
						Creating Account...
					{:else}
						Create Account
					{/if}
				</button>
			</div>
		</form>

		<div class="divider">OR</div>

		<div class="text-center">
			<p class="text-base-content/70">Already have an account?</p>
			<a href="/auth/login" class="link link-primary font-medium">
				Sign in here
			</a>
		</div>
	</div>
</div>
