<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let loading = false;
	export let error: string | null = null;

	// Form data
	let email = '';
	let password = '';
	let rememberMe = false;

	// Form validation
	let emailError = '';
	let passwordError = '';
	let formValid = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		login: { email: string; password: string; rememberMe: boolean };
	}>();

	// Validate form input
	function validateEmail() {
		if (!email) {
			emailError = 'Email is required';
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			emailError = 'Please enter a valid email address';
			return false;
		}
		emailError = '';
		return true;
	}

	function validatePassword() {
		if (!password) {
			passwordError = 'Password is required';
			return false;
		}
		passwordError = '';
		return true;
	}

	function validateForm() {
		const isEmailValid = validateEmail();
		const isPasswordValid = validatePassword();
		formValid = isEmailValid && isPasswordValid;
		return formValid;
	}

	// Handle form submission
	function handleSubmit() {
		if (validateForm()) {
			dispatch('login', { email, password, rememberMe });
		}
	}
</script>

<div class="w-full max-w-md">
	<div class="mb-6 text-center">
		<h1 class="mb-2 text-3xl font-bold">Welcome back</h1>
		<p class="text-base-content/70">Sign in to continue to your account</p>
	</div>

	{#if error}
		<div class="alert alert-error mb-6">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-5 w-5"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" x2="12" y1="8" y2="12" />
				<line x1="12" x2="12.01" y1="16" y2="16" />
			</svg>
			<span>{error}</span>
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="form-control">
			<label class="label" for="email">
				<span class="label-text">Email address</span>
			</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				on:blur={validateEmail}
				placeholder="you@example.com"
				class="input input-bordered w-full {emailError ? 'input-error' : ''}"
				disabled={loading}
				autocomplete="email"
			/>
			{#if emailError}
				<label class="label">
					<span class="label-text-alt text-error">{emailError}</span>
				</label>
			{/if}
		</div>

		<div class="form-control">
			<label class="label" for="password">
				<span class="label-text">Password</span>
				<button type="button" class="label-text-alt link link-primary"> Forgot password? </button>
			</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				on:blur={validatePassword}
				placeholder="••••••••"
				class="input input-bordered w-full {passwordError ? 'input-error' : ''}"
				disabled={loading}
				autocomplete="current-password"
			/>
			{#if passwordError}
				<label class="label">
					<span class="label-text-alt text-error">{passwordError}</span>
				</label>
			{/if}
		</div>

		<div class="form-control">
			<label class="label cursor-pointer">
				<span class="label-text">Remember me for 30 days</span>
				<input
					type="checkbox"
					id="remember"
					bind:checked={rememberMe}
					class="checkbox checkbox-primary"
					disabled={loading}
				/>
			</label>
		</div>

		<div class="form-control mt-6">
			<button type="submit" class="btn btn-primary w-full" disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Sign in
			</button>
		</div>

		<div class="divider">or</div>

		<div class="text-center">
			<p class="text-base-content/70">
				Don't have an account?
				<a href="/register" class="link link-primary font-medium"> Create one now </a>
			</p>
		</div>
	</form>
</div>
