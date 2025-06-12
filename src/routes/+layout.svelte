<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { BookOpen, BarChart3, Target, User, Menu, X, LogIn, ListChecks } from 'lucide-svelte';
	
	let { data, children } = $props();
	let sidebarOpen = $state(false);
	
	const navigation = [
		{ name: 'Journal', href: '/journal', icon: BookOpen },
		{ name: 'Experiments', href: '/experiments', icon: Target },
		{ name: 'Tasks', href: '/tasks', icon: ListChecks },
		{ name: 'Character Stats', href: '/stats', icon: BarChart3 },
		{ name: 'Profile', href: '/profile', icon: User }
	];
	
	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<!-- Mobile sidebar overlay -->
{#if sidebarOpen}
	<div class="fixed inset-0 z-40 bg-black/50 lg:hidden" onclick={closeSidebar}></div>
{/if}

<div class="min-h-screen bg-base-100">
	<!-- Mobile header -->
	<div class="navbar bg-base-100 border-b border-base-300 lg:hidden">
		<div class="navbar-start">
			<button class="btn btn-ghost btn-square" onclick={() => sidebarOpen = !sidebarOpen}>
				{#if sidebarOpen}
					<X size={20} />
				{:else}
					<Menu size={20} />
				{/if}
			</button>
		</div>
		<div class="navbar-center">
			<h1 class="text-lg font-semibold">Journal App</h1>
		</div>
		<div class="navbar-end">
			{#if data.user}
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
						<div class="w-8 rounded-full bg-base-300 flex items-center justify-center">
							<User size={16} />
						</div>
					</div>
					<ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
						<li><a href="/profile">Profile</a></li>
						<li><a href="/auth/logout">Logout</a></li>
					</ul>
				</div>
			{:else}
				<a href="/auth/login" class="btn btn-ghost btn-sm">
					<LogIn size={16} class="mr-1" />
					Login
				</a>
			{/if}
		</div>
	</div>

	<div class="flex">
		<!-- Sidebar -->
		<aside class="drawer-side lg:drawer-open">
			<div class="min-h-screen w-64 bg-base-200 border-r border-base-300 
			           fixed inset-y-0 left-0 transform {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
			           lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 lg:static">
				
				<!-- Logo/Title -->
				<div class="p-6 border-b border-base-300 hidden lg:block">
					<h1 class="text-xl font-bold text-base-content">Journal App</h1>
				</div>
				
				<!-- Navigation -->
				<nav class="p-4 mt-4 lg:mt-0">
					<ul class="menu menu-vertical">
						{#each navigation as item}
							<li>
								<a 
									href={item.href}
									class="flex items-center gap-3 p-3 rounded-lg transition-colors
									       {$page.url.pathname.startsWith(item.href) ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}"
									onclick={closeSidebar}
								>
									<svelte:component this={item.icon} size={20} />
									{item.name}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
				
				<!-- User menu for desktop -->
				<div class="absolute bottom-0 left-0 right-0 p-4 border-t border-base-300 hidden lg:block">
					{#if data.user}
						<div class="dropdown dropdown-top w-full">
							<div tabindex="0" role="button" class="btn btn-ghost w-full justify-start">
								<div class="avatar">
									<div class="w-8 rounded-full bg-base-300 flex items-center justify-center">
										<User size={16} />
									</div>
								</div>
								<span>{data.user.username}</span>
							</div>
							<ul tabindex="0" class="menu menu-sm dropdown-content mb-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
								<li><a href="/profile">Profile</a></li>
								<li><a href="/auth/logout">Logout</a></li>
							</ul>
						</div>
					{:else}
						<a href="/auth/login" class="btn btn-ghost w-full justify-start">
							<LogIn size={16} class="mr-2" />
							<span>Login</span>
						</a>
					{/if}
				</div>
			</div>
		</aside>

		<!-- Main content -->
		<main class="flex-1 lg:ml-0">
			<div class="container mx-auto px-4 py-6 max-w-7xl">
				{@render children()}
			</div>
		</main>
	</div>
</div>
