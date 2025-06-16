<script lang="ts">
  import { journalApi, passwordResetRequestSchema } from '$lib/api/client';
  import { Mail, ArrowLeft } from 'lucide-svelte';

  let email = $state('');
  let isLoading = $state(false);
  let isSuccess = $state(false);
  let errors = $state<Record<string, string>>({});

  async function handleSubmit() {
    if (isLoading) return;
    
    isLoading = true;
    errors = {};

    try {
      // Validate form data
      const validatedData = passwordResetRequestSchema.parse({ email });
      
      // Request password reset
      const response = await journalApi.requestPasswordReset(validatedData.email);
      
      if (response.success) {
        isSuccess = true;
      } else {
        errors.general = response.error || 'Failed to send reset email';
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
</script>

<svelte:head>
  <title>Reset Password - Journal App</title>
</svelte:head>

<div class="min-h-[70vh] flex items-center justify-center">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold">Reset Password</h1>
        <p class="text-base-content/70">
          {#if isSuccess}
            Check your email for reset instructions
          {:else}
            Enter your email to receive reset instructions
          {/if}
        </p>
      </div>

      {#if isSuccess}
        <!-- Success state -->
        <div class="text-center">
          <div class="mb-6">
            <Mail size={64} class="text-success mx-auto mb-4" />
            <p class="text-base-content/70">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          
          <div class="space-y-4">
            <p class="text-sm text-base-content/60">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <button
              class="btn btn-outline btn-block"
              onclick={() => { isSuccess = false; email = ''; }}
            >
              Try different email
            </button>
            
            <a href="/login" class="btn btn-primary btn-block">
              <ArrowLeft size={20} />
              Back to Sign In
            </a>
          </div>
        </div>
      {:else}
        <!-- Form state -->
        <form onsubmit={handleSubmit}>
          <!-- Email -->
          <div class="form-control">
            <label class="label" for="email">
              <span class="label-text">Email Address</span>
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
                Sending...
              {:else}
                <Mail size={20} />
                Send Reset Link
              {/if}
            </button>
          </div>
        </form>

        <!-- Back to login -->
        <div class="divider"></div>
        <div class="text-center">
          <a href="/login" class="btn btn-ghost">
            <ArrowLeft size={20} />
            Back to Sign In
          </a>
        </div>
      {/if}
    </div>
  </div>
</div>
