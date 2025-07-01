<script lang="ts">
  import { apiClient } from '$lib/api/client';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { RegisterRequest } from '$lib/api/client';

  // Form state using Svelte 5 runes
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state('');

  // Validation state
  let nameError = $state('');
  let emailError = $state('');
  let passwordError = $state('');

  // Form validation using derived state
  let nameValid = $derived(validateName(name));
  let emailValid = $derived(validateEmail(email));
  let passwordValid = $derived(validatePassword(password));
  let formValid = $derived(nameValid && emailValid && passwordValid && 
                           name.length > 0 && email.length > 0 && password.length > 0);

  // Validation functions
  function validateName(name: string): boolean {
    if (!name) return false;
    return name.length >= 1 && name.length <= 100;
  }

  function validateEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  // Real-time validation effects
  $effect(() => {
    if (name.length > 0 && !nameValid) {
      if (name.length > 100) {
        nameError = 'Name cannot exceed 100 characters';
      } else {
        nameError = 'Name is required';
      }
    } else {
      nameError = '';
    }
  });

  $effect(() => {
    if (email.length > 0 && !emailValid) {
      emailError = 'Please enter a valid email address';
    } else {
      emailError = '';
    }
  });

  $effect(() => {
    if (password.length > 0 && !passwordValid) {
      passwordError = 'Password must be at least 6 characters';
    } else {
      passwordError = '';
    }
  });

  // Form submission handler
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!formValid) {
      error = 'Please fix the form errors above';
      return;
    }

    try {
      isLoading = true;
      error = '';

      const registerData: RegisterRequest = {
        name: name.trim(),
        email: email.trim(),
        password
      };

      const response = await apiClient.register(registerData);

      if (response.success && response.data) {
        // Update auth store with user and token
        authStore.setAuth(response.data.user, response.data.token);
        
        // Redirect to dashboard
        await goto('/', { replaceState: true });
      } else {
        error = response.error || 'Registration failed. Please try again.';
      }
    } catch (err) {
      console.error('Registration error:', err);
      error = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  // Clear errors when user starts typing
  $effect(() => {
    if (name || email || password) {
      error = '';
    }
  });

  // Focus name input on mount
  let nameInput: HTMLInputElement;
  onMount(() => {
    nameInput?.focus();
  });
</script>

<div class="mx-auto w-full max-w-md p-4">
	<h2 class="mb-6 text-center text-2xl font-bold">Create an Account</h2>

	<form onsubmit={handleSubmit} class="space-y-6" novalidate>
		<!-- Name Field -->
		<div class="form-control">
			<label class="label" for="name">
				<span class="label-text">Full Name</span>
			</label>
			<input
				bind:this={nameInput}
				bind:value={name}
				type="text"
				id="name"
				name="name"
				autocomplete="name"
				required
				class="input input-bordered w-full"
				class:input-error={nameError}
				placeholder="Enter your full name"
				disabled={isLoading}
				maxlength="100"
			/>
			{#if nameError}
				<div class="label">
					<span class="label-text-alt text-error">{nameError}</span>
				</div>
			{/if}
		</div>

		<!-- Email Field -->
		<div class="form-control">
			<label class="label" for="email">
				<span class="label-text">Email</span>
			</label>
			<input
				bind:value={email}
				type="email"
				id="email"
				name="email"
				autocomplete="email"
				required
				class="input input-bordered w-full"
				class:input-error={emailError}
				placeholder="Enter your email"
				disabled={isLoading}
			/>
			{#if emailError}
				<div class="label">
					<span class="label-text-alt text-error">{emailError}</span>
				</div>
			{/if}
		</div>

		<!-- Password Field -->
		<div class="form-control">
			<label class="label" for="password">
				<span class="label-text">Password</span>
			</label>
			<input
				bind:value={password}
				type="password"
				id="password"
				name="password"
				autocomplete="new-password"
				required
				class="input input-bordered w-full"
				class:input-error={passwordError}
				placeholder="Enter your password (min 6 characters)"
				disabled={isLoading}
				minlength="6"
			/>
			{#if passwordError}
				<div class="label">
					<span class="label-text-alt text-error">{passwordError}</span>
				</div>
			{/if}
		</div>

		<!-- Form Error -->
		{#if error}
			<div class="alert alert-error">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{error}</span>
			</div>
		{/if}

		<!-- Submit Button -->
		<button
			type="submit"
			disabled={!formValid || isLoading}
			class="btn btn-primary w-full"
			class:loading={isLoading}
		>
			{#if isLoading}
				<span class="loading loading-spinner loading-sm"></span>
				Creating account...
			{:else}
				Create Account
			{/if}
		</button>

		<!-- Login Link -->
		<div class="text-center">
			<p class="text-sm">
				Already have an account?
				<a href="/login" class="link link-primary">Sign in here</a>
			</p>
			<p class="text-sm mt-2">
				<a href="/" class="link link-secondary">← Back to Home</a>
			</p>
		</div>
	</form>
</div>
