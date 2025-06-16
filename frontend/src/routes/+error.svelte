<script lang="ts">
  import { page } from '$app/stores';
  import { Home, ArrowLeft } from 'lucide-svelte';

  let status = $derived($page.status);
  let error = $derived($page.error);

  function getErrorMessage(status: number) {
    switch (status) {
      case 404:
        return 'Page not found';
      case 403:
        return 'Access forbidden';
      case 500:
        return 'Internal server error';
      default:
        return 'Something went wrong';
    }
  }

  function getErrorDescription(status: number) {
    switch (status) {
      case 404:
        return "The page you're looking for doesn't exist or has been moved.";
      case 403:
        return "You don't have permission to access this resource.";
      case 500:
        return 'Our servers are experiencing issues. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
</script>

<svelte:head>
  <title>Error {status} - Journal App</title>
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="text-center max-w-md">
    <!-- Error illustration -->
    <div class="mb-8">
      <div class="text-9xl font-bold text-primary/20">
        {status}
      </div>
    </div>

    <!-- Error details -->
    <div class="space-y-4">
      <h1 class="text-3xl font-bold">
        {getErrorMessage(status)}
      </h1>
      
      <p class="text-base-content/70">
        {getErrorDescription(status)}
      </p>

      {#if error?.message && error.message !== getErrorMessage(status)}
        <div class="alert alert-error">
          <span class="text-sm">{error.message}</span>
        </div>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
      <button
        class="btn btn-outline"
        onclick={() => history.back()}
      >
        <ArrowLeft size={20} />
        Go Back
      </button>
      
      <a href="/" class="btn btn-primary">
        <Home size={20} />
        Go Home
      </a>
    </div>

    <!-- Help text -->
    <div class="mt-8 text-sm text-base-content/60">
      <p>
        If this problem persists, please contact support.
      </p>
    </div>
  </div>
</div>
