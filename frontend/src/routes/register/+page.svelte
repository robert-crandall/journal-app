<script lang="ts">
  import RegisterForm from '$lib/components/auth/RegisterForm.svelte';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { authApi } from '$lib/api/auth';
  import { authStore } from '$lib/stores/auth';
  import { browser } from '$app/environment';

  let loading = false;
  let error: string | null = null;
  let registrationEnabled = true;

  // Check if registration is enabled
  onMount(async () => {
    await checkRegistrationStatus();

    // Add event listener for test override detection
    if (browser) {
      window.addEventListener('focus', checkRegistrationStatus);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('focus', checkRegistrationStatus);
    }
  });

  async function checkRegistrationStatus() {
    try {
      // Check for test override
      if (browser && (window as any).__TEST_DISABLE_REGISTRATION) {
        registrationEnabled = false;
        return;
      }

      const status = await authApi.getRegistrationStatus();
      registrationEnabled = status.enabled;
    } catch (err) {
      console.error('Failed to check registration status', err);
    }
  }

  // Handle registration
  async function handleRegister(event: CustomEvent<{ name: string; email: string; password: string }>) {
    loading = true;
    error = null;
    authStore.setLoading(true);

    try {
      const response = await authApi.register(event.detail);

      // Update auth store with user and token
      authStore.setAuth(response.user, response.token);

      // Redirect to home page or dashboard
      goto('/');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      error = errorMessage;
      authStore.setError(errorMessage);
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Register | LifeQuest</title>
</svelte:head>

<main class="hero min-h-screen">
  <div class="hero-content flex-col lg:flex-row-reverse">
    <div class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="card-body">
        <!-- Logo at the top -->
        <div class="mb-4 text-center">
          <a href="/" class="btn btn-ghost text-gradient text-2xl font-bold"> LifeQuest </a>
        </div>

        <RegisterForm {loading} {error} {registrationEnabled} on:register={handleRegister} />
      </div>
    </div>
  </div>
</main>
