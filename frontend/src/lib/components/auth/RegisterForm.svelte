<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let loading = false;
	export let error: string | null = null;
	export let registrationEnabled = true;

	// Form data
	let name = '';
	let email = '';
	let password = '';

	// Form validation
	let nameError = '';
	let emailError = '';
	let passwordError = '';
	let formValid = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		register: { name: string; email: string; password: string };
	}>();

	// Validate form input
	function validateName() {
		if (!name) {
			nameError = 'Name is required';
			return false;
		} else if (name.length > 100) {
			nameError = 'Name cannot exceed 100 characters';
			return false;
		}
		nameError = '';
		return true;
	}

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
		} else if (password.length < 6) {
			passwordError = 'Password must be at least 6 characters';
			return false;
		}
		passwordError = '';
		return true;
	}

	function validateForm() {
		const isNameValid = validateName();
		const isEmailValid = validateEmail();
		const isPasswordValid = validatePassword();
		formValid = isNameValid && isEmailValid && isPasswordValid;
		return formValid;
	}

	// Handle form submission
	function handleSubmit() {
		if (validateForm()) {
			dispatch('register', { name, email, password });
		}
	}
</script>

<div class="w-full max-w-md">
	<div class="mb-6 text-center">
		<h1 class="mb-2 text-3xl font-bold">Create account</h1>
		<p class="text-base-content/70">Join today to get started</p>
	</div>

	{#if !registrationEnabled}
		<div class="alert alert-warning mb-6">
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
				<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
				<path d="M12 9v4"></path>
				<path d="M12 17h.01"></path>
			</svg>
			<span>Registration is currently disabled</span>
		</div>
	{/if}

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
			<label class="label" for="name">
				<span class="label-text">Full Name</span>
			</label>
			<input
				type="text"
				id="name"
				bind:value={name}
				on:blur={validateName}
				placeholder="John Doe"
				class="input input-bordered w-full {nameError ? 'input-error' : ''}"
				disabled={loading || !registrationEnabled}
				min="1"
				max="100"
				autocomplete="name"
			/>
			{#if nameError}
				<label class="label">
					<span class="label-text-alt text-error">{nameError}</span>
				</label>
			{/if}
		</div>

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
				disabled={loading || !registrationEnabled}
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
			</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				on:blur={validatePassword}
				placeholder="••••••••"
				class="input input-bordered w-full {passwordError ? 'input-error' : ''}"
				disabled={loading || !registrationEnabled}
				min="6"
				autocomplete="new-password"
			/>
			<label class="label">
				{#if passwordError}
					<span class="label-text-alt text-error">{passwordError}</span>
				{:else}
					<span class="label-text-alt text-base-content/60">Must be at least 6 characters</span>
				{/if}
			</label>
		</div>

		<div class="form-control mt-6">
			<button
				type="submit"
				class="btn btn-primary w-full"
				disabled={loading || !registrationEnabled}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Create account
			</button>
		</div>

		<div class="divider">or</div>

		<div class="text-center">
			<p class="text-base-content/70">
				Already have an account?
				<a href="/login" class="link link-primary font-medium"> Sign in </a>
			</p>
		</div>
	</form>
</div>
