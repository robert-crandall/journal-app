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

<div class="mx-auto w-full max-w-md p-4">
	<h2 class="mb-6 text-center text-2xl font-bold">Create an Account</h2>

	{#if !registrationEnabled}
		<div class="alert alert-warning mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/></svg
			>
			<span>Registration is currently disabled</span>
		</div>
	{/if}

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
			<label for="name" class="label">
				<span class="label-text">Full Name</span>
			</label>
			<input
				type="text"
				id="name"
				bind:value={name}
				on:blur={validateName}
				placeholder="Enter your full name"
				class="input input-bordered w-full"
				disabled={loading || !registrationEnabled}
				min="1"
				max="100"
			/>
			{#if nameError}
				<label class="label">
					<span class="label-text-alt text-error">{nameError}</span>
				</label>
			{/if}
		</div>

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
				disabled={loading || !registrationEnabled}
			/>
			{#if emailError}
				<label class="label">
					<span class="label-text-alt text-error">{emailError}</span>
				</label>
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
				disabled={loading || !registrationEnabled}
				min="6"
			/>
			{#if passwordError}
				<label class="label">
					<span class="label-text-alt text-error">{passwordError}</span>
				</label>
			{/if}
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
				Register
			</button>
		</div>

		<div class="mt-4 text-center">
			<p>Already have an account? <a href="/login" class="link link-primary">Log in</a></p>
		</div>
	</form>
</div>
