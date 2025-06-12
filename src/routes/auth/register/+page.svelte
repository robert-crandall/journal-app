<script lang="ts">
	import { goto } from '$app/navigation';
	import { User, Mail, Lock } from 'lucide-svelte';
	
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let submitting = $state(false);
	
	async function handleRegister() {
		try {
			submitting = true;
			error = '';
			
			// Validate passwords match
			if (password !== confirmPassword) {
				error = 'Passwords do not match';
				submitting = false;
				return;
			}
			
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username,
					email,
					password
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				error = data.error || 'Failed to create account';
				return;
			}
			
			// Redirect to login on successful registration
			goto('/auth/login');
		} catch (err) {
			console.error('Registration error:', err);
			error = 'An unexpected error occurred';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Register - Journal App</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
	<div class="w-full max-w-md p-6 bg-base-100 rounded-lg shadow-lg border border-base-300">
		<div class="text-center mb-6">
			<h1 class="text-3xl font-bold text-base-content">Create Account</h1>
			<p class="text-base-content/70 mt-1">Start your personal journey today</p>
		</div>
		
		{#if error}
			<div class="alert alert-error mb-4">
				<span>{error}</span>
			</div>
		{/if}
		
		<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-4">
			<div class="form-control">
				<label for="username" class="label">
					<span class="label-text">Username</span>
				</label>
				<div class="relative">
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70">
						<User size={18} />
					</div>
					<input 
						type="text" 
						id="username"
						class="input input-bordered w-full pl-10" 
						placeholder="username"
						bind:value={username}
						required
					/>
				</div>
			</div>
			
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
						placeholder="Password (min 8 characters)"
						minlength="8"
						bind:value={password}
						required
					/>
				</div>
			</div>
			
			<div class="form-control">
				<label for="confirm-password" class="label">
					<span class="label-text">Confirm Password</span>
				</label>
				<div class="relative">
					<div class="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70">
						<Lock size={18} />
					</div>
					<input 
						type="password" 
						id="confirm-password"
						class="input input-bordered w-full pl-10" 
						placeholder="Confirm your password"
						bind:value={confirmPassword}
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
						Creating Account...
					{:else}
						Register
					{/if}
				</button>
			</div>
			
			<div class="text-center text-sm mt-4">
				Already have an account? 
				<a href="/auth/login" class="text-primary hover:underline">Login</a>
			</div>
		</form>
	</div>
</div>
