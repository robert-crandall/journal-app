<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { tasksApi, statsApi, journalsApi, userApi } from '$lib/api';
	import { goto } from '$app/navigation';
	import * as icons from 'lucide-svelte';
	import { findClassByName } from '$lib/data/classes';
	
	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return icons.Target;
		
		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');
		
		return (icons as any)[componentName] || icons.Target;
	}
	
	let tasks: any[] = [];
	let dailyTasks: any[] = [];
	let stats: any[] = [];
	let recentJournals: any[] = [];
	let userData: any = null;
	let loading = true;
	let showTaskFeedback = '';
	let taskFeedbackData = {
		feedback: '',
		emotionTag: '',
		moodScore: 0 // 1-5 mood/energy rating for A/B testing
	};
	
	onMount(() => {
		// Redirect if not logged in
		const unsubscribe = auth.subscribe((state) => {
			if (!state.user && !state.loading) {
				goto('/login');
			}
		});
		
		async function loadData() {
			try {
				const [tasksData, dailyTasksData, statsData, journalsData, userResponse] = await Promise.all([
					tasksApi.getAll(),
					tasksApi.getDailyTasks(),
					statsApi.getAll(),
					journalsApi.getAll(),
					userApi.getMe()
				]);
				
				tasks = tasksData.tasks.filter((task: any) => !task.completedAt && task.origin !== 'gpt').slice(0, 5);
				dailyTasks = dailyTasksData.tasks || [];
				stats = statsData.slice(0, 4);
				recentJournals = journalsData.journals.slice(0, 3);
				userData = userResponse.user;
			} catch (error) {
				console.error('Failed to load dashboard data:', error);
			} finally {
				loading = false;
			}
		}
		
		loadData();
		
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
			
			await tasksApi.complete(taskId, { status: 'complete' });
			// Refresh tasks
			const tasksData = await tasksApi.getAll();
			tasks = tasksData.tasks.filter((task: any) => !task.completedAt && task.origin !== 'gpt').slice(0, 5);
			
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

	async function completeDailyTask(taskId: string, status: 'complete' | 'skipped' | 'failed') {
		try {
			if (status === 'complete') {
				// Show feedback form for completed tasks
				showTaskFeedback = taskId;
				return;
			}
			
			// For skipped/failed, complete immediately
			await tasksApi.complete(taskId, { status });
			
			// Refresh daily tasks and stats
			await refreshDailyTasks();
		} catch (error) {
			console.error('Failed to complete daily task:', error);
		}
	}

	async function submitTaskFeedback(taskId: string) {
		try {
			await tasksApi.complete(taskId, {
				status: 'complete',
				feedback: taskFeedbackData.feedback,
				emotionTag: taskFeedbackData.emotionTag,
				moodScore: taskFeedbackData.moodScore > 0 ? taskFeedbackData.moodScore : undefined
			});
			
			// Reset feedback form
			showTaskFeedback = '';
			taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
			
			// Refresh daily tasks and stats
			await refreshDailyTasks();
		} catch (error) {
			console.error('Failed to submit task feedback:', error);
		}
	}

	async function refreshDailyTasks() {
		try {
			const [dailyTasksData, statsData] = await Promise.all([
				tasksApi.getDailyTasks(),
				statsApi.getAll()
			]);
			
			dailyTasks = dailyTasksData.tasks || [];
			stats = statsData.slice(0, 4);
		} catch (error) {
			console.error('Failed to refresh data:', error);
		}
	}

	function cancelTaskFeedback() {
		showTaskFeedback = '';
		taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
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
			<!-- Daily Tasks Section -->
			<div class="mb-6">
				<div class="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl border border-primary/20">
					<div class="card-body">
						<h2 class="card-title text-xl mb-4">🌟 Today's Quest</h2>
						
						{#if dailyTasks.length === 0}
							<div class="text-center py-8">
								<p class="text-base-content/60 mb-4">No daily tasks generated yet.</p>
								<button 
									class="btn btn-primary"
									onclick={() => refreshDailyTasks()}
								>
									Generate Today's Tasks
								</button>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each dailyTasks as task}
									<div class="bg-base-100 rounded-lg p-4 border-2 border-{task.source === 'primary' ? 'primary' : 'secondary'}">
										<div class="flex items-center gap-2 mb-2">
											<span class="badge badge-{task.source === 'primary' ? 'primary' : 'secondary'} badge-sm">
												{task.source === 'primary' ? '🎯 Primary' : '💞 Connection'}
											</span>
											{#if task.status === 'complete'}
												<span class="badge badge-success badge-sm">✓ Complete</span>
											{:else if task.status === 'skipped'}
												<span class="badge badge-warning badge-sm">⏭ Skipped</span>
											{:else if task.status === 'failed'}
												<span class="badge badge-error badge-sm">✗ Failed</span>
											{/if}
										</div>
										
										<h3 class="font-semibold mb-2">{task.title}</h3>
										<p class="text-sm text-base-content/80 mb-4">{task.description}</p>
										
										{#if task.status === 'pending'}
											<div class="flex gap-2">
												<button 
													class="btn btn-success btn-sm flex-1"
													onclick={() => completeDailyTask(task.id, 'complete')}
												>
													✓ Complete
												</button>
												<button 
													class="btn btn-warning btn-sm"
													onclick={() => completeDailyTask(task.id, 'skipped')}
												>
													⏭
												</button>
												<button 
													class="btn btn-error btn-sm"
													onclick={() => completeDailyTask(task.id, 'failed')}
												>
													✗
												</button>
											</div>
										{:else if task.feedback || task.emotionTag}
											<div class="mt-2 p-2 bg-base-200 rounded">
												{#if task.feedback}
													<p class="text-xs text-base-content/70"><strong>Feedback:</strong> {task.feedback}</p>
												{/if}
												{#if task.emotionTag}
													<p class="text-xs text-base-content/70"><strong>Emotion:</strong> {task.emotionTag}</p>
												{/if}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
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

				<!-- Right Column -->
				<div>
					<!-- Character Profile -->
					{#if userData?.className}
						{@const classDef = findClassByName(userData.className)}
						<div class="card bg-base-100 shadow-xl mb-6">
							<div class="card-body">
								<div class="flex justify-between items-center">
									<h2 class="card-title">🎭 Character Profile</h2>
									<a href="/settings" class="btn btn-sm btn-ghost">Edit</a>
								</div>
								
								<div class="space-y-3">
									<div>
										<h3 class="font-semibold text-primary">{userData.className}</h3>
										{#if userData.classDescription}
											<p class="text-sm text-base-content/70 italic">"{userData.classDescription}"</p>
										{/if}
									</div>
									
									{#if classDef && classDef.recommended_stats.length > 0}
										<div>
											<h4 class="text-sm font-medium text-base-content/80 mb-2">
												Recommended Stats for a {userData.className}:
											</h4>
											<div class="flex flex-wrap gap-1 mb-3">
												{#each classDef.recommended_stats as statName}
													{@const hasThisStat = stats.some(s => s.name === statName)}
													<span class="badge badge-sm {hasThisStat ? 'badge-primary' : 'badge-outline'}">
														{statName}
														{#if hasThisStat}✓{/if}
													</span>
												{/each}
											</div>
										</div>
									{/if}
									
									{#if stats.length > 0}
										<div>
											<h4 class="text-sm font-medium text-base-content/80 mb-2">
												Your Active Stats:
											</h4>
											<div class="text-sm text-base-content/70">
												{#each stats.slice(0, 3) as stat, i}
													{stat.name} (Lvl {stat.level}){#if i < Math.min(2, stats.length - 1)}, {/if}
												{/each}
												{#if stats.length > 3}
													, and {stats.length - 3} more
												{/if}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- Stats -->
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
												<span class="text-sm text-base-content/60">Level {stat.level}</span>
												<span class="text-xs text-base-content/60">{stat.xp} XP</span>
											</div>
											<div class="w-full bg-gray-200 rounded-full h-2">
												<div 
													class="bg-{stat.color}-500 h-2 rounded-full transition-all duration-300"
													style="width: {Math.min(100, Math.max(0, (stat.xp - ((stat.level - 1) * 100)) / 100 * 100))}%"
												></div>
											</div>
											{#if stat.xp > (stat.level - 1) * 100}
												<div class="text-xs text-green-600 mt-1">Ready to level up!</div>
											{/if}
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

<!-- Task Feedback Modal -->
{#if showTaskFeedback}
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
		role="dialog"
		aria-modal="true"
		onclick={cancelTaskFeedback}
		onkeydown={(e) => e.key === 'Escape' && cancelTaskFeedback()}
	>
		<div class="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold mb-4">🎉 Great job! How did it go?</h3>
			
			<div class="space-y-4">
				<div>
					<label class="label" for="emotion-select">
						<span class="label-text">How did this task make you feel?</span>
					</label>
					<select 
						id="emotion-select"
						bind:value={taskFeedbackData.emotionTag} 
						class="select select-bordered w-full"
					>
						<option value="">Select an emotion (optional)</option>
						<option value="joy">😄 Joyful</option>
						<option value="accomplished">🏆 Accomplished</option>
						<option value="peaceful">😌 Peaceful</option>
						<option value="energized">⚡ Energized</option>
						<option value="connected">💞 Connected</option>
						<option value="frustrated">😤 Frustrated</option>
						<option value="tired">😴 Tired</option>
						<option value="neutral">😐 Neutral</option>
					</select>
				</div>
				
				<div>
					<label class="label" for="mood-score">
						<span class="label-text">How was your energy/mood level? (optional)</span>
					</label>
					<div class="flex items-center gap-3">
						<span class="text-sm text-base-content/60">Low</span>
						<div class="flex gap-2">
							{#each [1, 2, 3, 4, 5] as score}
								<label class="cursor-pointer">
									<input 
										type="radio" 
										name="mood-score"
										bind:group={taskFeedbackData.moodScore}
										value={score} 
										class="radio radio-primary radio-sm"
									>
									<span class="ml-1 text-sm">{score}</span>
								</label>
							{/each}
							<label class="cursor-pointer ml-2">
								<input 
									type="radio" 
									name="mood-score"
									bind:group={taskFeedbackData.moodScore}
									value={0} 
									class="radio radio-sm"
								>
								<span class="ml-1 text-sm text-base-content/60">Skip</span>
							</label>
						</div>
						<span class="text-sm text-base-content/60">High</span>
					</div>
				</div>
				
				<div>
					<label class="label" for="feedback-textarea">
						<span class="label-text">Any thoughts or feedback?</span>
					</label>
					<textarea 
						id="feedback-textarea"
						bind:value={taskFeedbackData.feedback}
						class="textarea textarea-bordered w-full" 
						placeholder="How did it go? What worked well? What was challenging?"
						rows="3"
					></textarea>
				</div>
				
				<div class="flex gap-2 justify-end">
					<button class="btn btn-ghost" onclick={cancelTaskFeedback}>Skip</button>
					<button class="btn btn-primary" onclick={() => submitTaskFeedback(showTaskFeedback)}>
						Submit
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
