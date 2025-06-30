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

<div class="mx-auto w-full max-w-md p-4">
	<h2 class="mb-6 text-center text-2xl font-bold">Sign In</h2>

	{#if error}
		<div class="alert alert-error mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<span>{error}</span>
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div class="form-control">
			<label for="email" class="label">
				<span class="label-text">Email</span>
			</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				on:blur={validateEmail}
				placeholder="Enter your email address"
				class="input input-bordered w-full"
				disabled={loading}
			/>
			{#if emailError}
				<div class="label">
					<span class="label-text-alt text-error">{emailError}</span>
				</div>
			{/if}
		</div>

		<div class="form-control">
			<label for="password" class="label">
				<span class="label-text">Password</span>
			</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				on:blur={validatePassword}
				placeholder="Enter your password"
				class="input input-bordered w-full"
				disabled={loading}
			/>
			{#if passwordError}
				<div class="label">
					<span class="label-text-alt text-error">{passwordError}</span>
				</div>
			{/if}
		</div>

		<div class="form-control">
			<label class="label cursor-pointer">
				<span class="label-text">Remember me</span>
				<input
					type="checkbox"
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
				Sign In
			</button>
		</div>

		<div class="mt-4 text-center">
			<p>Don't have an account? <a href="/register" class="link link-primary">Create one</a></p>
		</div>
	</form>
</div>
