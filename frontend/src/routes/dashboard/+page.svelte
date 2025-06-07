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
			
			// Optimistically update UI - remove the task immediately
			tasks = tasks.filter(t => t.id !== taskId);
			
			await tasksApi.complete(taskId, { status: 'complete' });
			
			// Refresh tasks and stats
			const [tasksData, statsData] = await Promise.all([
				tasksApi.getAll(),
				...(taskToComplete?.stat ? [statsApi.getAll()] : [])
			]);
			
			tasks = tasksData.tasks.filter((task: any) => !task.completedAt && task.origin !== 'gpt').slice(0, 5);
			
			// If the task had a stat, increment it and refresh stats
			if (taskToComplete?.stat) {
				await statsApi.increment(taskToComplete.stat.id, 1);
				const updatedStatsData = await statsApi.getAll();
				stats = updatedStatsData.slice(0, 4);
			}
		} catch (error) {
			console.error('Failed to complete task:', error);
			// Refresh tasks to restore correct state on error
			const tasksData = await tasksApi.getAll();
			tasks = tasksData.tasks.filter((task: any) => !task.completedAt && task.origin !== 'gpt').slice(0, 5);
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
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center space-y-4">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
			<p class="text-gray-600">Loading your dashboard...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-50">
		<!-- Header Section -->
		<div class="bg-white border-b border-gray-200">
			<div class="container mx-auto px-4 py-6">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 class="text-3xl font-bold text-gray-900 mb-2">
							Welcome back, {userData?.name || 'User'}
						</h1>
						<p class="text-sm text-gray-600">
							{#if userData?.className}
								Focused on <span class="font-medium text-blue-600">{userData.className}</span> development
							{:else}
								Ready to continue your personal development journey
							{/if}
						</p>
					</div>
					
					{#if userData?.className}
						<div class="bg-white rounded-md shadow-md border-l-4 border-blue-500 p-4">
							<h3 class="font-semibold text-gray-900 mb-1">{userData.className}</h3>
							{#if userData.classDescription}
								<p class="text-sm text-gray-600 mb-3">{userData.classDescription}</p>
							{/if}
							<a href="/settings" class="text-xs text-blue-600 hover:text-blue-700 transition-colors">Edit profile</a>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="container mx-auto px-4 py-6">
			<!-- Daily Focus Section -->
			{#if dailyTasks.length > 0}
				<div class="mb-8">
					<div class="bg-white rounded-md shadow-md border-l-4 border-blue-500 p-6">
						<div class="flex items-center gap-3 mb-6">
							<svelte:component this={icons.Target} class="w-6 h-6 text-blue-600" />
							<div>
								<h2 class="text-xl font-semibold text-gray-900">Today's Focus</h2>
								<p class="text-sm text-gray-600">Your personalized daily objectives</p>
							</div>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each dailyTasks as task}
								<div class="bg-gray-50 rounded-md border-l-4 border-{task.source === 'primary' ? 'blue-500' : 'green-500'} p-4">
									<div class="flex items-center justify-between mb-3">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {task.source === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
											{task.source === 'primary' ? 'Primary' : 'Connection'}
										</span>
										{#if task.status !== 'pending'}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {task.status === 'complete' ? 'bg-green-100 text-green-800' : task.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
												{task.status === 'complete' ? 'Complete ✓' : task.status === 'skipped' ? 'Skipped' : 'Struggled'}
											</span>
										{/if}
									</div>
									
									<h3 class="font-semibold text-gray-900 mb-2">{task.title}</h3>
									<p class="text-sm text-gray-600 mb-4">{task.description}</p>
									
									{#if task.status === 'pending'}
										<div class="flex gap-2">
											<button 
												class="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
												onclick={() => completeDailyTask(task.id, 'complete')}
											>
												Complete
											</button>
											<button 
												class="bg-yellow-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors"
												onclick={() => completeDailyTask(task.id, 'skipped')}
												title="Skip this task"
											>
												Skip
											</button>
											<button 
												class="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
												onclick={() => completeDailyTask(task.id, 'failed')}
												title="Mark as struggled with"
											>
												Struggled
											</button>
										</div>
									{:else if task.feedback || task.emotionTag}
										<div class="bg-white rounded-md p-3 border border-gray-200">
											{#if task.feedback}
												<p class="text-sm text-gray-700"><span class="font-medium">Notes:</span> {task.feedback}</p>
											{/if}
											{#if task.emotionTag}
												<p class="text-sm text-gray-700 mt-1"><span class="font-medium">Feeling:</span> {task.emotionTag}</p>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<div class="mb-8">
					<div class="bg-white rounded-md shadow-md border-l-4 border-yellow-500 p-6 text-center">
						<svelte:component this={icons.Target} class="w-12 h-12 text-yellow-500 mx-auto mb-4" />
						<h2 class="text-xl font-semibold text-gray-900 mb-2">Ready for today's focus?</h2>
						<p class="text-sm text-gray-600 mb-4">Generate personalized objectives to guide your development</p>
						<button 
							class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
							onclick={() => refreshDailyTasks()}
						>
							Generate daily focus
						</button>
					</div>
				</div>
			{/if}

			<!-- Main Dashboard Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Left Column - Tasks & Progress -->
				<div class="lg:col-span-2 space-y-6">
					<!-- Active Tasks -->
					<div class="bg-white rounded-md shadow-md border-l-4 border-green-500 p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
									<svelte:component this={icons.CheckSquare} class="w-5 h-5 text-green-600" />
									Active Tasks
								</h2>
								<p class="text-sm text-gray-600">Your current goals and commitments</p>
							</div>
							<a href="/tasks" class="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1">
								<svelte:component this={icons.Settings} class="w-4 h-4" />
								Manage
							</a>
						</div>
						
						{#if tasks.length === 0}
							<div class="text-center py-8 border border-gray-200 rounded-md bg-gray-50">
								<svelte:component this={icons.Target} class="w-10 h-10 text-gray-400 mx-auto mb-3" />
								<p class="text-sm text-gray-600 mb-4">Ready to set some meaningful goals?</p>
								<a href="/tasks" class="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
									<svelte:component this={icons.Plus} class="w-4 h-4" />
									Create first task
								</a>
							</div>
						{:else}
							<div class="space-y-3">
								{#each tasks as task}
									<div class="bg-gray-50 rounded-md border-l-4 border-blue-400 p-4 hover:bg-gray-100 transition-colors">
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h3 class="font-semibold text-gray-900">{task.title}</h3>
												{#if task.description}
													<p class="text-sm text-gray-600 mt-1">{task.description}</p>
												{/if}
												<div class="flex gap-2 mt-2">
													{#if task.focus}
														<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{task.focus.name}</span>
													{/if}
													{#if task.stat}
														<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">+{task.stat.name}</span>
													{/if}
												</div>
											</div>
											<button
												class="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
												onclick={(e) => {e.preventDefault(); e.stopPropagation(); completeTask(task.id);}}
											>
												<svelte:component this={icons.Check} class="w-4 h-4" />
												Done
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Performance Metrics -->
					<div class="bg-white rounded-md shadow-md border-l-4 border-purple-500 p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
									<svelte:component this={icons.BarChart3} class="w-5 h-5 text-purple-600" />
									Performance Metrics
								</h2>
								<p class="text-sm text-gray-600">Your growing strengths and abilities</p>
							</div>
							<a href="/stats" class="bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1">
								<svelte:component this={icons.TrendingUp} class="w-4 h-4" />
								View all
							</a>
						</div>
						
						{#if stats.length === 0}
							<div class="text-center py-6 border border-gray-200 rounded-md bg-gray-50">
								<svelte:component this={icons.TrendingUp} class="w-10 h-10 text-gray-400 mx-auto mb-3" />
								<p class="text-sm text-gray-600 mb-4">Track your progress with custom metrics</p>
								<a href="/stats" class="inline-flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
									<svelte:component this={icons.Plus} class="w-4 h-4" />
									Create metrics
								</a>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								{#each stats as stat}
									<div class="bg-gray-50 rounded-md border-l-4 border-gray-400 p-4">
										<div class="flex items-center gap-3 mb-3">
											<svelte:component this={getIconComponent(stat.icon)} class="w-6 h-6 text-gray-600" />
											<div class="flex-1">
												<h3 class="font-semibold text-gray-900">{stat.name}</h3>
												<div class="flex justify-between text-sm text-gray-600">
													<span>Level {stat.level}</span>
													<span>{stat.xp} points</span>
												</div>
											</div>
										</div>
										
										<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
											<div 
												class="bg-purple-600 h-3 rounded-full transition-all duration-500"
												style="width: {Math.min(100, Math.max(0, (stat.xp - ((stat.level - 1) * 100)) / 100 * 100))}%"
											>
											</div>
										</div>
										
										{#if stat.xp >= stat.level * 100}
											<div class="text-xs text-green-600 mt-2 flex items-center gap-1">
												<svelte:component this={icons.Award} class="w-3 h-3" />
												Ready to advance!
											</div>
										{:else}
											<div class="text-xs text-gray-600 mt-2">
												{stat.level * 100 - stat.xp} points to level {stat.level + 1}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Column - Journal & Quick Actions -->
				<div class="space-y-6">
					<!-- Quick Actions -->
					<div class="bg-white rounded-md shadow-md border-l-4 border-blue-500 p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<svelte:component this={icons.Zap} class="w-5 h-5 text-blue-600" />
							Quick Actions
						</h2>
						<div class="grid grid-cols-2 gap-3">
							<a href="/journals" class="bg-blue-600 text-white rounded-md p-3 text-center hover:bg-blue-700 transition-colors">
								<svelte:component this={icons.BookOpen} class="w-5 h-5 mx-auto mb-1" />
								<span class="text-xs font-medium">Journal</span>
							</a>
							<a href="/tasks" class="bg-green-600 text-white rounded-md p-3 text-center hover:bg-green-700 transition-colors">
								<svelte:component this={icons.Plus} class="w-5 h-5 mx-auto mb-1" />
								<span class="text-xs font-medium">Add Task</span>
							</a>
							<a href="/stats" class="bg-purple-600 text-white rounded-md p-3 text-center hover:bg-purple-700 transition-colors">
								<svelte:component this={icons.BarChart3} class="w-5 h-5 mx-auto mb-1" />
								<span class="text-xs font-medium">Progress</span>
							</a>
							<a href="/potions" class="bg-yellow-600 text-white rounded-md p-3 text-center hover:bg-yellow-700 transition-colors">
								<svelte:component this={icons.Lightbulb} class="w-5 h-5 mx-auto mb-1" />
								<span class="text-xs font-medium">Insights</span>
							</a>
						</div>
					</div>

					<!-- Recent Journal Entries -->
					<div class="bg-white rounded-md shadow-md border-l-4 border-blue-500 p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<h2 class="text-xl font-semibold text-gray-900">Recent Reflections</h2>
								<p class="text-sm text-gray-600">Your journal entries</p>
							</div>
							<a href="/journals" class="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1">
								<svelte:component this={icons.Edit3} class="w-4 h-4" />
								Write
							</a>
						</div>
						
						{#if recentJournals.length === 0}
							<div class="text-center py-6">
								<svelte:component this={icons.Edit3} class="w-10 h-10 text-gray-400 mx-auto mb-3" />
								<p class="text-sm text-gray-600 mb-4">Begin capturing your thoughts and experiences</p>
								<a href="/journals" class="inline-flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
									<svelte:component this={icons.Edit3} class="w-4 h-4" />
									Start journaling
								</a>
							</div>
						{:else}
							<div class="space-y-3">
								{#each recentJournals as journal}
									<a href="/journals" class="block bg-gray-50 rounded-md border-l-4 border-blue-300 p-4 hover:bg-gray-100 transition-colors">
										<p class="text-sm text-gray-700 line-clamp-3 mb-2">{journal.content}</p>
										<div class="flex justify-between items-center text-xs text-gray-500">
											<span>{new Date(journal.date).toLocaleDateString('en-US', { 
												weekday: 'short', 
												month: 'short', 
												day: 'numeric' 
											})}</span>
											{#if journal.mood}
												<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs">{journal.mood}</span>
											{/if}
										</div>
									</a>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Focus Area Information -->
					{#if userData?.className}
						{@const classDef = findClassByName(userData.className)}
						{#if classDef && classDef.recommended_stats.length > 0}
							<div class="bg-white rounded-md shadow-md border-l-4 border-green-500 p-6">
								<h2 class="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
									<svelte:component this={icons.Target} class="w-5 h-5 text-green-600" />
									Development Focus
								</h2>
								<p class="text-sm text-gray-600 mb-4">
									Recommended growth areas for <span class="font-medium text-green-700">{userData.className}</span>:
								</p>
								<div class="flex flex-wrap gap-2 mb-4">
									{#each classDef.recommended_stats as statName}
										{@const hasThisStat = stats.some(s => s.name === statName)}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {hasThisStat ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} gap-1">
											{statName}
											{#if hasThisStat}<svelte:component this={icons.Check} class="w-3 h-3" />{/if}
										</span>
									{/each}
								</div>
								{#if stats.length > 0}
									<div class="text-xs text-gray-600">
										<p><span class="font-medium">Active metrics:</span> 
										{stats.slice(0, 3).map(s => `${s.name} (Lv${s.level})`).join(', ')}
										{#if stats.length > 3}and {stats.length - 3} more{/if}</p>
									</div>
								{/if}
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
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={cancelTaskFeedback}
		onkeydown={(e) => e.key === 'Escape' && cancelTaskFeedback()}
	>
		<!-- Modal Content -->
		<div 
			class="bg-white rounded-md shadow-md max-w-md w-full" 
			role="document" 
		>
			<div 
				class="p-6" 
				onclick={stopPropagation}
				onkeydown={stopPropagation}
				role="button"
				tabindex="0"
			>
				<div class="text-center mb-6">
					<svelte:component this={icons.CheckCircle} class="w-12 h-12 text-green-600 mx-auto mb-3" />
					<h3 class="text-xl font-semibold text-gray-900 mb-2">Task Completed ✓</h3>
					<p class="text-sm text-gray-600">Take a moment to reflect on this accomplishment</p>
				</div>
				
				<div class="space-y-5">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2" for="emotion-select">
							How are you feeling?
						</label>
						<select 
							id="emotion-select"
							bind:value={taskFeedbackData.emotionTag} 
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						>
							<option value="">Optional - choose if helpful</option>
							<option value="accomplished">Accomplished & proud</option>
							<option value="energized">Energized & motivated</option>
							<option value="peaceful">Peaceful & calm</option>
							<option value="joy">Joyful & happy</option>
							<option value="connected">Connected & loved</option>
							<option value="neutral">Neutral or unchanged</option>
							<option value="tired">Tired or drained</option>
							<option value="frustrated">Frustrated</option>
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-3" for="mood-score">
							Energy level after completing this?
						</label>
						<div class="flex items-center justify-between">
							<span class="text-xs text-gray-500">Low</span>
							<div class="flex gap-2">
								{#each [1, 2, 3, 4, 5] as score}
									<label class="cursor-pointer">
										<input 
											type="radio" 
											name="mood-score"
											bind:group={taskFeedbackData.moodScore}
											value={score} 
											class="w-4 h-4 text-blue-600 focus:ring-blue-500"
										>
									</label>
								{/each}
								<span class="ml-2 text-xs text-gray-500">or</span>
								<label class="cursor-pointer flex items-center ml-1">
									<input 
										type="radio" 
										name="mood-score"
										bind:group={taskFeedbackData.moodScore}
										value={0} 
										class="w-3 h-3 text-gray-400"
									>
									<span class="ml-1 text-xs text-gray-500">skip</span>
								</label>
							</div>
							<span class="text-xs text-gray-500">High</span>
						</div>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2" for="feedback-textarea">
							Any thoughts to capture?
						</label>
						<textarea 
							id="feedback-textarea"
							bind:value={taskFeedbackData.feedback}
							class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
							placeholder="What worked well? What was challenging? Any insights about your progress?"
							rows="3"
						></textarea>
					</div>
				</div>
				
				<div class="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
					<button class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors" onclick={cancelTaskFeedback}>
						Skip reflection
					</button>
					<button class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2" onclick={() => submitTaskFeedback(showTaskFeedback)}>
						Save ✓
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
