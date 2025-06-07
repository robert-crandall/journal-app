<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { tasksApi, statsApi, journalsApi } from '$lib/api';
	import { goto } from '$app/navigation';
	import * as icons from 'lucide-svelte';
	
	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return icons.Target;
		
		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');
		
		return icons[componentName] || icons.Target;
	}
	
	let tasks: any[] = [];
	let stats: any[] = [];
	let recentJournals: any[] = [];
	let loading = true;
	
	onMount(async () => {
		// Redirect if not logged in
		const unsubscribe = auth.subscribe((state) => {
			if (!state.user && !state.loading) {
				goto('/login');
			}
		});
		
		try {
			const [tasksData, statsData, journalsData] = await Promise.all([
				tasksApi.getAll(),
				statsApi.getAll(),
				journalsApi.getAll()
			]);
			
			tasks = tasksData.tasks.filter((task: any) => !task.completedAt).slice(0, 5);
			stats = statsData.slice(0, 4);
			recentJournals = journalsData.journals.slice(0, 3);
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			loading = false;
		}
		
		return unsubscribe;
	});
	
	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}
	
	async function completeTask(taskId: string) {
		try {
			// Find the task to get its stat info before completing
			const taskToComplete = tasks.find(t => t.id === taskId);
			
			await tasksApi.complete(taskId);
			// Refresh tasks
			const tasksData = await tasksApi.getAll();
			tasks = tasksData.tasks.filter((task: any) => !task.completedAt).slice(0, 5);
			
			// If the task has a stat, increment it
			if (taskToComplete?.stat) {
				await statsApi.increment(taskToComplete.stat.id, 1);
				// Refresh stats
				const statsData = await statsApi.getAll();
				stats = statsData.slice(0, 4);
			}
		} catch (error) {
			console.error('Failed to complete task:', error);
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Life Quest</title>
</svelte:head>

<div class="container mx-auto p-6">
		{#if loading}
			<div class="flex justify-center">
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else}
			<!-- Welcome Section -->
			<div class="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-lg mb-8">
				<div class="hero-content text-center py-8">
					<div class="max-w-md">
						<h1 class="text-4xl font-bold">Welcome back, {$auth.user?.name}!</h1>
						<p class="py-4">Ready to level up your life today?</p>
					</div>
				</div>
			</div>

			<!-- Dashboard Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Active Tasks -->
				<div class="lg:col-span-2">
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex justify-between items-center">
								<h2 class="card-title">🎯 Active Tasks</h2>
								<a href="/tasks" class="btn btn-sm btn-primary">View All</a>
							</div>
							
							{#if tasks.length === 0}
								<div class="text-center py-8 text-base-content/60">
									<p>No active tasks. Time to create some goals!</p>
									<a href="/tasks" class="btn btn-outline btn-sm mt-2">Create Task</a>
								</div>
							{:else}
								<div class="space-y-3">
									{#each tasks as task}
										<div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
											<div class="flex-1">
												<h3 class="font-medium">{task.title}</h3>
												{#if task.description}
													<p class="text-sm text-base-content/60">{task.description}</p>
												{/if}
												{#if task.focus}
													<span class="badge badge-primary badge-sm mt-1">{task.focus.name}</span>
												{/if}
											</div>
											<button
												class="btn btn-success btn-sm"
												onclick={() => completeTask(task.id)}
											>
												✓
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Stats -->
				<div>
					<div class="card bg-base-100 shadow-xl mb-6">
						<div class="card-body">
							<div class="flex justify-between items-center">
								<h2 class="card-title">📊 Stats</h2>
								<a href="/stats" class="btn btn-sm btn-secondary">Manage</a>
							</div>
							
							{#if stats.length === 0}
								<div class="text-center py-4 text-base-content/60">
									<p>No stats yet.</p>
									<a href="/stats" class="btn btn-outline btn-sm mt-2">Create Stat</a>
								</div>
							{:else}
								<div class="space-y-3">
									{#each stats as stat}
										<div class="p-3 bg-base-200 rounded-lg">
											<div class="flex items-center gap-2 mb-2">
												<svelte:component this={getIconComponent(stat.icon)} class="w-5 h-5" />
												<h3 class="font-medium">{stat.name}</h3>
											</div>
											<div class="flex justify-between items-center mb-2">
												<span class="text-sm text-base-content/60">Level {stat.value}</span>
												<span class="text-xs text-base-content/60">{stat.value}/99</span>
											</div>
											<div class="w-full bg-gray-200 rounded-full h-2">
												<div 
													class="bg-{stat.color}-500 h-2 rounded-full transition-all duration-300"
													style="width: {Math.min(100, Math.max(0, (stat.value / 99) * 100))}%"
												></div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Recent Journal Entries -->
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex justify-between items-center">
								<h2 class="card-title">📔 Recent Journal</h2>
								<a href="/journals" class="btn btn-sm btn-accent">Write</a>
							</div>
							
							{#if recentJournals.length === 0}
								<div class="text-center py-4 text-base-content/60">
									<p>No journal entries yet.</p>
									<a href="/journals" class="btn btn-outline btn-sm mt-2">Start Writing</a>
								</div>
							{:else}
								<div class="space-y-2">
									{#each recentJournals as journal}
										<div class="p-3 bg-base-200 rounded-lg">
											<p class="text-sm line-clamp-3">{journal.content}</p>
											<span class="text-xs text-base-content/60 mt-1 block">
												{new Date(journal.date).toLocaleDateString()}
											</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
