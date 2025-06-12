<script>
  import { goto } from '$app/navigation';
  
  function handleLogout() {
    fetch('/api/auth/logout', {
      method: 'POST',
    }).then(() => {
      goto('/auth/login');
    });
  }
  
  // Auto-logout on page load
  handleLogout();
</script>

<svelte:head>
	<title>Logging Out - Journal App</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4">
  <div class="text-center">
    <span class="loading loading-spinner loading-lg"></span>
    <p class="mt-4 text-lg">Logging you out...</p>
  </div>
</div>
