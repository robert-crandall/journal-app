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
		moodScore: 0
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

	function stopPropagation(e: Event) {
		e.stopPropagation();
	}
</script>

<svelte:head>
	<title>Dashboard - Personal Growth Journal</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center space-y-4">
			<span class="loading loading-spinner loading-lg text-primary"></span>
			<p class="text-base-content/60">Loading your dashboard...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-200">
		<!-- Header Section -->
		<div class="bg-base-100 border-b border-base-300">
			<div class="container mx-auto px-6 py-8">
				<div class="flex flex-col lg:flex-row items-start justify-between gap-6">
					<div>
						<h1 class="text-3xl font-bold text-base-content mb-2">
							Welcome back, {userData?.name || 'User'}
						</h1>
						<p class="text-base-content/70">
							{#if userData?.className}
								Your focus area: <span class="font-semibold text-primary">{userData.className}</span>
							{:else}
								Ready to continue your personal development journey?
							{/if}
						</p>
					</div>
					
					{#if userData?.className}
						<div class="card bg-base-100 shadow-md border border-primary/20">
							<div class="card-body p-4 text-center">
								<h3 class="font-semibold text-primary">{userData.className}</h3>
								{#if userData.classDescription}
									<p class="text-sm text-base-content/70">{userData.classDescription}</p>
								{/if}
								<div class="mt-2">
									<a href="/settings" class="btn btn-ghost btn-xs">Edit Profile</a>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="container mx-auto px-6 py-8">
			<!-- Daily Focus Section -->
			{#if dailyTasks.length > 0}
				<div class="mb-8">
					<div class="card bg-base-100 shadow-md border-l-4 border-primary">
						<div class="card-body">
							<div class="flex items-center gap-3 mb-4">
								<svelte:component this={icons.Target} class="w-6 h-6 text-primary" />
								<div>
									<h2 class="card-title">Today's Focus</h2>
									<p class="text-sm text-base-content/60">Your personalized daily objectives</p>
								</div>
							</div>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each dailyTasks as task}
									<div class="card bg-base-100 shadow-sm border-l-4 border-{task.source === 'primary' ? 'primary' : 'secondary'}">
										<div class="card-body p-4">
											<div class="flex items-center justify-between mb-2">
												<span class="badge badge-{task.source === 'primary' ? 'primary' : 'secondary'}">
													{task.source === 'primary' ? 'Primary' : 'Connection'}
												</span>
												{#if task.status !== 'pending'}
													<span class="badge badge-{task.status === 'complete' ? 'success' : task.status === 'skipped' ? 'warning' : 'error'}">
														{task.status === 'complete' ? 'Complete' : task.status === 'skipped' ? 'Skipped' : 'Failed'}
													</span>
												{/if}
											</div>
											
											<h3 class="font-semibold mb-2">{task.title}</h3>
											<p class="text-sm text-base-content/70 mb-4">{task.description}</p>
											
											{#if task.status === 'pending'}
												<div class="flex gap-2">
													<button 
														class="btn btn-success btn-sm flex-1"
														onclick={() => completeDailyTask(task.id, 'complete')}
													>
														Complete
													</button>
													<button 
														class="btn btn-warning btn-sm"
														onclick={() => completeDailyTask(task.id, 'skipped')}
														title="Skip this task"
													>
														Skip
													</button>
													<button 
														class="btn btn-error btn-sm"
														onclick={() => completeDailyTask(task.id, 'failed')}
														title="Mark as failed"
													>
														Failed
													</button>
												</div>
											{:else if task.feedback || task.emotionTag}
												<div class="bg-base-200 rounded-lg p-3">
													{#if task.feedback}
														<p class="text-sm text-base-content/80"><span class="font-semibold">Notes:</span> {task.feedback}</p>
													{/if}
													{#if task.emotionTag}
														<p class="text-sm text-base-content/80 mt-1"><span class="font-semibold">Status:</span> {task.emotionTag}</p>
													{/if}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="mb-8">
					<div class="card bg-base-100 shadow-md border-l-4 border-warning">
						<div class="card-body text-center py-8">
							<svelte:component this={icons.Target} class="w-12 h-12 text-warning mx-auto mb-4" />
							<h2 class="card-title justify-center mb-2">Ready for Today's Focus?</h2>
							<p class="text-base-content/70 mb-4">Create some intentional objectives to support your development.</p>
							<button 
								class="btn btn-primary"
								onclick={() => refreshDailyTasks()}
							>
								Generate Daily Focus
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Main Dashboard Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<!-- Left Column - Tasks & Progress -->
				<div class="lg:col-span-8 space-y-6">
					<!-- Active Tasks -->
					<div class="card bg-base-100 shadow-xl border-l-4 border-secondary">
						<div class="card-body">
							<div class="flex items-center justify-between mb-4">
								<div class="flex items-center gap-3">
									<svelte:component this={icons.CheckSquare} class="w-6 h-6 text-secondary" />
									<div>
										<h2 class="card-title">Active Tasks</h2>
										<p class="text-sm text-base-content/60">Your current goals and commitments</p>
									</div>
								</div>
								<a href="/tasks" class="btn btn-secondary btn-sm gap-2">
									<svelte:component this={icons.Settings} class="w-4 h-4" />
									Manage Tasks
								</a>
							</div>
							
							{#if tasks.length === 0}
								<div class="text-center py-8">
									<svelte:component this={icons.Target} class="w-12 h-12 text-base-content/40 mx-auto mb-4" />
									<h3 class="text-lg font-semibold mb-2">No active tasks yet</h3>
									<p class="text-base-content/60 mb-4">When you're ready, create some meaningful goals to work toward.</p>
									<a href="/tasks" class="btn btn-outline gap-2">
										<svelte:component this={icons.Plus} class="w-4 h-4" />
										Create First Task
									</a>
								</div>
							{:else}
								<div class="space-y-3">								{#each tasks as task}
									<a href="/tasks" class="card bg-base-200 hover:bg-base-300 transition-all border-l-4 border-accent block">
										<div class="card-body p-4">
											<div class="flex items-center justify-between">
												<div class="flex-1">
													<h3 class="font-semibold text-base-content">{task.title}</h3>
													{#if task.description}
														<p class="text-sm text-base-content/70 mt-1">{task.description}</p>
													{/if}
													<div class="flex gap-2 mt-2">
														{#if task.focus}
															<span class="badge badge-primary badge-sm">{task.focus.name}</span>
														{/if}
														{#if task.stat}
															<span class="badge badge-info badge-sm">+{task.stat.name}</span>
														{/if}
													</div>
												</div>
												<button
													class="btn btn-success btn-sm gap-1 hover:scale-105 transition-transform"
													onclick={(e) => {e.preventDefault(); e.stopPropagation(); completeTask(task.id);}}
												>
													<svelte:component this={icons.Check} class="w-4 h-4" />
													Complete
												</button>
											</div>
										</div>
									</a>
								{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Performance Metrics -->
					<div class="card bg-base-100 shadow-xl border-l-4 border-info">
						<div class="card-body">
							<div class="flex items-center justify-between mb-4">
								<div class="flex items-center gap-3">
									<svelte:component this={icons.BarChart3} class="w-6 h-6 text-info" />
									<div>
										<h2 class="card-title">Performance Metrics</h2>
										<p class="text-sm text-base-content/60">Your growing strengths and abilities</p>
									</div>
								</div>
								<a href="/stats" class="btn btn-info btn-sm gap-2">
									<svelte:component this={icons.TrendingUp} class="w-4 h-4" />
									View All
								</a>
							</div>
							
							{#if stats.length === 0}
								<div class="text-center py-6">
									<svelte:component this={icons.TrendingUp} class="w-10 h-10 text-base-content/40 mx-auto mb-3" />
									<h3 class="font-semibold mb-2">No metrics yet</h3>
									<p class="text-base-content/60 mb-4">Create some metrics to track your growth areas.</p>
									<a href="/stats" class="btn btn-outline btn-sm gap-2">
										<svelte:component this={icons.Plus} class="w-4 h-4" />
										Create Metrics
									</a>
								</div>
							{:else}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									{#each stats as stat}
										<div class="card bg-base-200 border-l-4 border-{stat.color || 'neutral'}">
											<div class="card-body p-4">
												<div class="flex items-center gap-3 mb-3">
													<svelte:component this={getIconComponent(stat.icon)} class="w-6 h-6 text-{stat.color || 'neutral'}" />
													<div class="flex-1">
														<h3 class="font-semibold">{stat.name}</h3>
														<div class="flex justify-between text-sm text-base-content/60">
															<span>Level {stat.level}</span>
															<span>{stat.xp} points</span>
														</div>
													</div>
												</div>
												
												<div class="w-full bg-base-300 rounded-full h-3 overflow-hidden">
													<div 
														class="bg-{stat.color || 'primary'} h-3 rounded-full transition-all duration-500 relative"
														style="width: {Math.min(100, Math.max(0, (stat.xp - ((stat.level - 1) * 100)) / 100 * 100))}%"
													>
														<div class="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
													</div>
												</div>
												
												{#if stat.xp >= stat.level * 100}
													<div class="text-xs text-success mt-2 flex items-center gap-1">
														<svelte:component this={icons.Award} class="w-3 h-3" />
														Ready to advance!
													</div>
												{:else}
													<div class="text-xs text-base-content/60 mt-2">
														{stat.level * 100 - stat.xp} points to next level
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right Column - Journal & Quick Actions -->
				<div class="lg:col-span-4 space-y-6">
					<!-- Quick Actions -->
					<div class="card bg-gradient-to-br from-accent/10 to-primary/10 shadow-xl border border-accent/30">
						<div class="card-body">
							<h2 class="card-title text-accent mb-4 flex items-center gap-2">
								<svelte:component this={icons.Zap} class="w-5 h-5" />
								Quick Actions
							</h2>
							<div class="grid grid-cols-2 gap-3">
								<a href="/journals" class="btn btn-accent btn-sm gap-2 flex-col h-16">
									<svelte:component this={icons.BookOpen} class="w-5 h-5" />
									<span class="text-xs">Journal</span>
								</a>
								<a href="/tasks" class="btn btn-secondary btn-sm gap-2 flex-col h-16">
									<svelte:component this={icons.Plus} class="w-5 h-5" />
									<span class="text-xs">Add Task</span>
								</a>
								<a href="/stats" class="btn btn-info btn-sm gap-2 flex-col h-16">
									<svelte:component this={icons.BarChart3} class="w-5 h-5" />
									<span class="text-xs">Metrics</span>
								</a>
								<a href="/potions" class="btn btn-warning btn-sm gap-2 flex-col h-16">
									<svelte:component this={icons.Lightbulb} class="w-5 h-5" />
									<span class="text-xs">Insights</span>
								</a>
							</div>
						</div>
					</div>

					<!-- Recent Journal Entries -->
					<div class="card bg-base-100 shadow-xl border-l-4 border-accent">
						<div class="card-body">
							<div class="flex items-center justify-between mb-4">
								<div class="flex items-center gap-3">
									<svelte:component this={icons.FileText} class="w-6 h-6 text-accent" />
									<div>
										<h2 class="card-title">Recent Reflections</h2>
										<p class="text-sm text-base-content/60">Your journal entries</p>
									</div>
								</div>
								<a href="/journals" class="btn btn-accent btn-sm gap-2">
									<svelte:component this={icons.Edit3} class="w-4 h-4" />
									Write
								</a>
							</div>
							
							{#if recentJournals.length === 0}
								<div class="text-center py-6">
									<svelte:component this={icons.Edit3} class="w-10 h-10 text-base-content/40 mx-auto mb-3" />
									<h3 class="font-semibold mb-2">Start journaling</h3>
									<p class="text-base-content/60 mb-4">Reflect on your thoughts, experiences, and growth.</p>
									<a href="/journals" class="btn btn-outline btn-sm gap-2">
										<svelte:component this={icons.Edit3} class="w-4 h-4" />
										Write First Entry
									</a>
								</div>
							{:else}
								<div class="space-y-3">
									{#each recentJournals as journal}
										<a href="/journals" class="card bg-base-200 hover:bg-base-300 transition-all border-l-4 border-accent/50 block">
											<div class="card-body p-4">
												<p class="text-sm text-base-content/80 line-clamp-3 mb-2">{journal.content}</p>
												<div class="flex justify-between items-center text-xs text-base-content/60">
													<span>{new Date(journal.date).toLocaleDateString('en-US', { 
														weekday: 'short', 
														month: 'short', 
														day: 'numeric' 
													})}</span>
													{#if journal.mood}
														<span class="badge badge-ghost badge-xs">{journal.mood}</span>
													{/if}
												</div>
											</div>
										</a>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Focus Area Information -->
					{#if userData?.className}
						{@const classDef = findClassByName(userData.className)}
						{#if classDef && classDef.recommended_stats.length > 0}
							<div class="card bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl border border-primary/20">
								<div class="card-body">
									<h2 class="card-title text-primary mb-3 flex items-center gap-2">
										<svelte:component this={icons.Target} class="w-5 h-5" />
										Development Focus
									</h2>
									<p class="text-sm text-base-content/70 mb-4">
										Recommended growth areas for your <span class="font-semibold text-primary">{userData.className}</span> focus:
									</p>
									<div class="flex flex-wrap gap-2">
										{#each classDef.recommended_stats as statName}
											{@const hasThisStat = stats.some(s => s.name === statName)}
											<span class="badge {hasThisStat ? 'badge-primary' : 'badge-outline'} gap-1">
												{statName}
												{#if hasThisStat}<svelte:component this={icons.Check} class="w-3 h-3" />{/if}
											</span>
										{/each}
									</div>
									{#if stats.length > 0}
										<div class="mt-4 text-xs text-base-content/60">
											<p><span class="font-semibold">Your active metrics:</span> 
											{stats.slice(0, 3).map(s => `${s.name} (Lv${s.level})`).join(', ')}
											{#if stats.length > 3}and {stats.length - 3} more{/if}</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Task Feedback Modal -->
{#if showTaskFeedback}
	<div 
		class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={cancelTaskFeedback}
		onkeydown={(e) => e.key === 'Escape' && cancelTaskFeedback()}
	>
		<div class="card bg-base-100 shadow-2xl max-w-md w-full border border-primary/20" role="document">
			<div class="card-body">
				<div class="text-center mb-6">
					<svelte:component this={icons.CheckCircle} class="w-12 h-12 text-success mx-auto mb-2" />
					<h3 class="text-xl font-bold">Task Completed</h3>
					<p class="text-base-content/70">How did completing this task feel?</p>
				</div>
				
				<div class="space-y-4">
					<div>
						<label class="label" for="emotion-select">
							<span class="label-text font-medium">What emotion did this bring up?</span>
						</label>
						<select 
							id="emotion-select"
							bind:value={taskFeedbackData.emotionTag} 
							class="select select-bordered w-full focus:select-primary"
						>
							<option value="">Choose how you felt (optional)</option>
							<option value="joy">Joyful & Happy</option>
							<option value="accomplished">Accomplished & Proud</option>
							<option value="peaceful">Peaceful & Calm</option>
							<option value="energized">Energized & Motivated</option>
							<option value="connected">Connected & Loved</option>
							<option value="frustrated">Frustrated or Annoyed</option>
							<option value="tired">Tired or Drained</option>
							<option value="neutral">Neutral or Unchanged</option>
						</select>
					</div>
					
					<div>
						<label class="label" for="mood-score">
							<span class="label-text font-medium">How was your energy level?</span>
						</label>
						<div class="flex items-center justify-between gap-3 py-2">
							<span class="text-sm text-base-content/60">Low</span>
							<div class="flex gap-3">
								{#each [1, 2, 3, 4, 5] as score}
									<label class="cursor-pointer hover:scale-110 transition-transform">
										<input 
											type="radio" 
											name="mood-score"
											bind:group={taskFeedbackData.moodScore}
											value={score} 
											class="radio radio-primary"
										>
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
									<span class="ml-1 text-xs text-base-content/60">Skip</span>
								</label>
							</div>
							<span class="text-sm text-base-content/60">High</span>
						</div>
					</div>
					
					<div>
						<label class="label" for="feedback-textarea">
							<span class="label-text font-medium">Any reflections to capture?</span>
						</label>
						<textarea 
							id="feedback-textarea"
							bind:value={taskFeedbackData.feedback}
							class="textarea textarea-bordered w-full focus:textarea-primary" 
							placeholder="What worked well? What was challenging? How do you feel about your progress?"
							rows="3"
						></textarea>
					</div>
				</div>
				
				<div class="flex gap-3 justify-end mt-6">
					<button class="btn btn-ghost" onclick={cancelTaskFeedback}>
						Skip for now
					</button>
					<button class="btn btn-primary gap-2" onclick={() => submitTaskFeedback(showTaskFeedback)}>
						<svelte:component this={icons.Save} class="w-4 h-4" />
						Save Reflection
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
