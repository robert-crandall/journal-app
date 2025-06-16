<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { journalApi, registerSchema } from '$lib/api/client';
  import { Eye, EyeOff, UserPlus } from 'lucide-svelte';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let isLoading = $state(false);
  let errors = $state<Record<string, string>>({});

  async function handleSubmit() {
    if (isLoading) return;
    
    isLoading = true;
    errors = {};

    // Check if passwords match
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isLoading = false;
      return;
    }

    try {
      // Validate form data
      const validatedData = registerSchema.parse({ name, email, password });
      
      // Attempt registration
      const response = await journalApi.register(validatedData);
      
      if (response.success && response.data) {
        // Store auth state
        await authStore.login(response.data.user, response.data.token);
        
        // Redirect to context setup
        goto('/context');
      } else {
        errors.general = response.error || 'Registration failed';
      }
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        error.issues.forEach((issue: any) => {
          errors[issue.path[0]] = issue.message;
        });
      } else {
        errors.general = error.message || 'An unexpected error occurred';
      }
    } finally {
      isLoading = false;
    }
  }

  function togglePassword() {
    showPassword = !showPassword;
  }

  function toggleConfirmPassword() {
    showConfirmPassword = !showConfirmPassword;
  }
</script>

<svelte:head>
  <title>Sign Up - Journal App</title>
</svelte:head>

<div class="min-h-[70vh] flex items-center justify-center">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold">Create Account</h1>
        <p class="text-base-content/70">Join Journal App today</p>
      </div>

      <form onsubmit={handleSubmit}>
        <!-- Name -->
        <div class="form-control">
          <label class="label" for="name">
            <span class="label-text">Full Name</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            class="input input-bordered"
            class:input-error={errors.name}
            bind:value={name}
            required
          />
          {#if errors.name}
            <div class="label">
              <span class="label-text-alt text-error">{errors.name}</span>
            </div>
          {/if}
        </div>

        <!-- Email -->
        <div class="form-control">
          <label class="label" for="email">
            <span class="label-text">Email</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            class="input input-bordered"
            class:input-error={errors.email}
            bind:value={email}
            required
          />
          {#if errors.email}
            <div class="label">
              <span class="label-text-alt text-error">{errors.email}</span>
            </div>
          {/if}
        </div>

        <!-- Password -->
        <div class="form-control">
          <label class="label" for="password">
            <span class="label-text">Password</span>
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              class="input input-bordered w-full pr-10"
              class:input-error={errors.password}
              bind:value={password}
              required
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              onclick={togglePassword}
            >
              {#if showPassword}
                <EyeOff size={20} class="text-base-content/40" />
              {:else}
                <Eye size={20} class="text-base-content/40" />
              {/if}
            </button>
          </div>
          {#if errors.password}
            <div class="label">
              <span class="label-text-alt text-error">{errors.password}</span>
            </div>
          {/if}
        </div>

        <!-- Confirm Password -->
        <div class="form-control">
          <label class="label" for="confirmPassword">
            <span class="label-text">Confirm Password</span>
          </label>
          <div class="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              class="input input-bordered w-full pr-10"
              class:input-error={errors.confirmPassword}
              bind:value={confirmPassword}
              required
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              onclick={toggleConfirmPassword}
            >
              {#if showConfirmPassword}
                <EyeOff size={20} class="text-base-content/40" />
              {:else}
                <Eye size={20} class="text-base-content/40" />
              {/if}
            </button>
          </div>
          {#if errors.confirmPassword}
            <div class="label">
              <span class="label-text-alt text-error">{errors.confirmPassword}</span>
            </div>
          {/if}
        </div>

        <!-- General error -->
        {#if errors.general}
          <div class="alert alert-error mb-4">
            <span>{errors.general}</span>
          </div>
        {/if}

        <!-- Submit button -->
        <div class="form-control mt-6">
          <button
            type="submit"
            class="btn btn-primary"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading loading-spinner loading-sm"></span>
              Creating account...
            {:else}
              <UserPlus size={20} />
              Create Account
            {/if}
          </button>
        </div>
      </form>

      <!-- Sign in link -->
      <div class="divider"></div>
      <div class="text-center">
        <p class="text-sm text-base-content/70">
          Already have an account?
          <a href="/login" class="link link-primary">Sign in</a>
        </p>
      </div>
    </div>
  </div>
</div>
