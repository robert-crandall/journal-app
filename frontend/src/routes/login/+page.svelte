<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { journalApi, loginSchema } from '$lib/api/client';
  import { Eye, EyeOff, LogIn } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let isLoading = $state(false);
  let errors = $state<Record<string, string>>({});

  async function handleSubmit() {
    if (isLoading) return;
    
    isLoading = true;
    errors = {};

    try {
      // Validate form data
      const validatedData = loginSchema.parse({ email, password });
      
      // Attempt login
      const response = await journalApi.login(validatedData);
      
      if (response.success && response.data) {
        // Store auth state
        await authStore.login(response.data.user, response.data.token);
        
        // Redirect to home
        goto('/');
      } else {
        errors.general = response.error || 'Login failed';
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
</script>

<svelte:head>
  <title>Sign In - Journal App</title>
</svelte:head>

<div class="min-h-[70vh] flex items-center justify-center">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold">Welcome Back</h1>
        <p class="text-base-content/70">Sign in to your account</p>
      </div>

      <form onsubmit={handleSubmit}>
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
              Signing in...
            {:else}
              <LogIn size={20} />
              Sign In
            {/if}
          </button>
        </div>

        <!-- Forgot password link -->
        <div class="text-center mt-4">
          <a href="/forgot-password" class="link link-primary text-sm">
            Forgot your password?
          </a>
        </div>
      </form>

      <!-- Sign up link -->
      <div class="divider"></div>
      <div class="text-center">
        <p class="text-sm text-base-content/70">
          Don't have an account?
          <a href="/register" class="link link-primary">Sign up</a>
        </p>
      </div>
    </div>
  </div>
</div>
