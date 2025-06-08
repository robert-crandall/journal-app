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

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center lg:text-left">
			<h1 class="text-5xl font-bold">Welcome back!</h1>
			<p class="py-6">Continue your journey of personal growth and level up your life.</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<form class="card-body" onsubmit={handleLogin}>
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
						placeholder="Password"
						class="input input-bordered"
						bind:value={password}
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
						{loading ? '' : 'Login'}
					</button>
				</div>

				<div class="divider">OR</div>

				<p class="text-center">
					Don't have an account?
					<a href="/register" class="link link-primary">Sign up</a>
				</p>
			</form>
		</div>
	</div>
</div>
