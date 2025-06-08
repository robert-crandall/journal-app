<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

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
	<title>Sign Up - Life Quest</title>
</svelte:head>

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center lg:text-left">
			<h1 class="text-5xl font-bold">Start Your Quest!</h1>
			<p class="py-6">
				Join Life Quest and begin transforming your personal growth with RPG-style mechanics and AI
				insights.
			</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<form class="card-body" onsubmit={handleRegister}>
				<div class="form-control">
					<label class="label" for="name">
						<span class="label-text">Name</span>
					</label>
					<input
						id="name"
						type="text"
						placeholder="Your name"
						class="input input-bordered"
						bind:value={name}
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						type="email"
						placeholder="email@example.com"
						class="input input-bordered"
						bind:value={email}
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						placeholder="Password (min 6 characters)"
						class="input input-bordered"
						bind:value={password}
						required
					/>
				</div>
				<div class="form-control">
					<label class="label" for="confirmPassword">
						<span class="label-text">Confirm Password</span>
					</label>
					<input
						id="confirmPassword"
						type="password"
						placeholder="Confirm password"
						class="input input-bordered"
						bind:value={confirmPassword}
						required
					/>
				</div>

				{#if error}
					<div class="alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<div class="form-control mt-6">
					<button class="btn btn-primary" class:loading disabled={loading}>
						{loading ? '' : 'Sign Up'}
					</button>
				</div>

				<div class="divider">OR</div>

				<p class="text-center">
					Already have an account?
					<a href="/login" class="link link-primary">Login</a>
				</p>
			</form>
		</div>
	</div>
</div>
