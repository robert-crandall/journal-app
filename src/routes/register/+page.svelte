<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Register - Example App</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen items-center justify-center p-4">
	<div class="card bg-base-100 w-full max-w-md shadow-xl">
		<div class="card-body">
			<h1 class="card-title mb-6 text-center text-2xl font-bold">Create Account</h1>

			{#if form?.error}
				<div class="alert alert-error mb-4" role="alert">
					<span>{form.error}</span>
				</div>
			{/if}

			<form method="POST" use:enhance class="space-y-4">
				<div class="form-control">
					<label for="name" class="label">
						<span class="label-text">Name</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						class="input input-bordered w-full"
						required
						placeholder="Enter your name"
					/>
				</div>

				<div class="form-control">
					<label for="email" class="label">
						<span class="label-text">Email</span>
					</label>
					<input
						type="text"
						id="email"
						name="email"
						class="input input-bordered w-full"
						required
						placeholder="Enter your email address"
					/>
				</div>

				<div class="form-control">
					<label for="password" class="label">
						<span class="label-text">Password</span>
					</label>
					<input
						type="password"
						id="password"
						name="password"
						class="input input-bordered w-full"
						required
						placeholder="Enter your password"
					/>
					<div class="label">
						<span class="label-text-alt">Must be at least 8 characters</span>
					</div>
				</div>

				<div class="form-control mt-6">
					<button type="submit" class="btn btn-primary w-full"> Create Account </button>
				</div>
			</form>

			<div class="divider">Already have an account?</div>

			<div class="text-center">
				<a href="/login" class="link link-primary">Sign in here</a>
			</div>
		</div>
	</div>
</div>
