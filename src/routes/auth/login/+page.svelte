<script lang="ts">
	import { goto } from '$app/navigation';
	import { Lock, Mail } from 'lucide-svelte';
	
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let submitting = $state(false);
	
	async function handleLogin() {
		try {
			submitting = true;
			error = '';
			
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					password
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				error = data.error || 'Failed to login';
				return;
			}
			
			// Redirect to dashboard on successful login
			goto('/');
		} catch (err) {
			console.error('Login error:', err);
			error = 'An unexpected error occurred';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Journal App</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
	<div class="w-full max-w-md p-6 bg-base-100 rounded-lg shadow-lg border border-base-300">
		<div class="text-center mb-6">
			<h1 class="text-3xl font-bold text-base-content">Welcome Back</h1>
			<p class="text-base-content/70 mt-1">Login to continue your journey</p>
		</div>
		
		{#if error}
			<div class="alert alert-error mb-4">
				<span>{error}</span>
			</div>
		{/if}
		
		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
			<div class="form-control">
				<label for="email" class="label">
					<span class="label-text">Email</span>
				</label>
				<div class="relative">
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70">
						<Mail size={18} />
					</div>
					<input 
						type="email" 
						id="email"
						class="input input-bordered w-full pl-10" 
						placeholder="your@email.com"
						bind:value={email}
						required
					/>
				</div>
			</div>
			
			<div class="form-control">
				<label for="password" class="label">
					<span class="label-text">Password</span>
				</label>
				<div class="relative">
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70">
						<Lock size={18} />
					</div>
					<input 
						type="password" 
						id="password"
						class="input input-bordered w-full pl-10" 
						placeholder="Password"
						bind:value={password}
						required
					/>
				</div>
			</div>
			
			<div class="form-control mt-6">
				<button 
					type="submit" 
					class="btn btn-primary w-full" 
					disabled={submitting}
				>
					{#if submitting}
						<span class="loading loading-spinner loading-sm"></span>
						Logging in...
					{:else}
						Login
					{/if}
				</button>
			</div>
			
			<div class="text-center text-sm mt-4">
				Don't have an account yet? 
				<a href="/auth/register" class="text-primary hover:underline">Register</a>
			</div>
		</form>
	</div>
</div>
