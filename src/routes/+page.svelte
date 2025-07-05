<script lang="ts">
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
</script>

<svelte:head>
	<title>Example App - Home</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
	<div class="navbar bg-base-100 shadow-lg">
		<div class="flex-1">
			<a href="/" class="btn btn-ghost text-xl">Example App</a>
		</div>
		<div class="flex-none gap-2">
			<ThemeSelector />
			<a href="/login" class="btn btn-ghost">Sign In</a>
			<a href="/register" class="btn btn-primary">Get Started</a>
		</div>
	</div>

	<div class="hero min-h-[calc(100vh-4rem)]">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<h1 class="text-5xl font-bold">Welcome to Example App</h1>
				<p class="py-6">
					A modern, secure example application built with SvelteKit. Create, save, and organize your
					thoughts with markdown support.
				</p>
				<div class="flex justify-center gap-4">
					<a href="/register" class="btn btn-primary">Create Account</a>
					<a href="/login" class="btn btn-outline">Sign In</a>
				</div>
			</div>
		</div>
	</div>
</div>
