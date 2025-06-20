<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { tasksApi, statsApi, journalsApi, userApi, adhocTasksApi } from '$lib/api';
	import { goto } from '$app/navigation';
	import * as icons from 'lucide-svelte';

	// Helper function to get icon component
	function getIconComponent(iconName: string) {
		if (!iconName) return icons.Target;

		// Convert kebab-case to PascalCase for Lucide components
		const componentName = iconName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join('');

		return (icons as any)[componentName] || icons.Target;
	}

	let tasks: any[] = [];
	let dailyTasks: any[] = [];
	let adhocTasks: any[] = [];
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
	let saveMessage = '';

	onMount(() => {
		// Redirect if not logged in
		const unsubscribe = auth.subscribe((state) => {
			if (!state.user && !state.loading) {
				goto('/login');
			}
		});

		async function loadData() {
			try {
				const [tasksData, dailyTasksData, adhocTasksData, statsData, journalsData, userResponse] =
					await Promise.all([
						tasksApi.getAll(),
						tasksApi.getDailyTasks(),
						adhocTasksApi.getAll(),
						statsApi.getAll(),
						journalsApi.getAll(),
						userApi.getMe()
					]);

				tasks = tasksData.tasks
					.filter((task: any) => !task.completedAt && task.origin !== 'gpt')
					.slice(0, 5);
				dailyTasks = dailyTasksData.tasks || [];
				adhocTasks = adhocTasksData.adhocTasks || [];
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

	async function completeTask(taskId: string) {
		try {
			// Find the task to get its stat info before completing
			const taskToComplete = tasks.find((t) => t.id === taskId);

			await tasksApi.complete(taskId, { status: 'complete' });
			// Refresh tasks
			const tasksData = await tasksApi.getAll();
			tasks = tasksData.tasks
				.filter((task: any) => !task.completedAt && task.origin !== 'gpt')
				.slice(0, 5);

			// If the task has a stat, increment it
			if (taskToComplete?.stat) {
				await statsApi.increment(taskToComplete.stat.id, 1);
				// Refresh stats
				const statsData = await statsApi.getAll();
				stats = statsData.slice(0, 4);
			}

			showSaveMessage('Task completed ✓');
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
			showSaveMessage(`Task ${status} ✓`);
		} catch (error) {
			console.error('Failed to complete daily task:', error);
		}
	}

	async function submitTaskFeedback(taskId: string) {
		try {
			// Check if this is an ad hoc task
			if (taskId.endsWith('_adhoc')) {
				const adhocTaskId = taskId.replace('_adhoc', '');
				await submitAdhocTaskExecution(adhocTaskId);
			} else {
				// Regular task completion
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
				showSaveMessage('Task completed ✓');
			}
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

	async function executeAdhocTask(adhocTaskId: string) {
		try {
			// Show feedback form for ad hoc task execution
			showTaskFeedback = adhocTaskId + '_adhoc';
		} catch (error) {
			console.error('Failed to execute ad hoc task:', error);
		}
	}

	async function submitAdhocTaskExecution(adhocTaskId: string) {
		try {
			const result = await adhocTasksApi.execute(adhocTaskId, {
				feedback: taskFeedbackData.feedback || undefined,
				emotionTag: taskFeedbackData.emotionTag || undefined,
				moodScore: taskFeedbackData.moodScore || undefined
			});

			// Refresh stats
			const statsData = await statsApi.getAll();
			stats = statsData.slice(0, 4);

			// Reset form and close modal
			cancelTaskFeedback();

			showSaveMessage(`${result.stat.name} +${result.xpAwarded} XP ✓`);
		} catch (error) {
			console.error('Failed to execute ad hoc task:', error);
		}
	}

	function cancelTaskFeedback() {
		showTaskFeedback = '';
		taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
	}

	function showSaveMessage(message: string) {
		saveMessage = message;
		setTimeout(() => (saveMessage = ''), 3000);
	}

	function closeModal(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			showTaskFeedback = '';
			taskFeedbackData = { feedback: '', emotionTag: '', moodScore: 0 };
		}
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="bg-base-200 min-h-screen">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="space-y-4 text-center">
				<div class="border-primary inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
				<p class="text-base-content/70 text-sm">Loading your command center...</p>
			</div>
		</div>
	{:else}
		<!-- Save Message -->
		{#if saveMessage}
			<div
				class="border-success/20 bg-success/10 text-success fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg transition-opacity"
			>
				<svelte:component this={icons.CheckCircle} class="h-4 w-4" />
				{saveMessage}
			</div>
		{/if}

		<!-- Main Content -->
		<main class="mx-auto max-w-6xl space-y-8 px-4 py-6">
			<!-- Welcome Hero Section -->
			<section class="space-y-4 text-center">
				<div class="mb-2 flex items-center justify-center gap-4">
					<div
						class="from-primary to-secondary text-primary-content flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold shadow-lg"
					>
						{(userData?.name || 'U').charAt(0).toUpperCase()}
					</div>
					<div class="text-left">
						<h1 class="text-base-content text-4xl font-bold">
							Welcome back, {userData?.name || 'User'}! 👋
						</h1>
						<p class="text-base-content/70 mt-1 text-lg">
							{#if userData?.className}
								Ready to focus on <span class="text-primary font-semibold"
									>{userData.className}</span
								> today?
							{:else}
								Ready to make today count?
							{/if}
						</p>
					</div>
				</div>

				<!-- Quick Overview Stats -->
				<div class="flex justify-center gap-8 text-center">
					<div class="space-y-1">
						<div class="text-info text-3xl font-bold">
							{dailyTasks.filter((t) => !t.completedAt).length}
						</div>
						<div class="text-base-content/60 text-sm">Priority Tasks</div>
					</div>
					<div class="space-y-1">
						<div class="text-success text-3xl font-bold">{tasks.length}</div>
						<div class="text-base-content/60 text-sm">Active Goals</div>
					</div>
					<div class="space-y-1">
						<div class="text-secondary text-3xl font-bold">
							{stats.reduce((sum, stat) => sum + stat.level, 0)}
						</div>
						<div class="text-base-content/60 text-sm">Total Levels</div>
					</div>
				</div>
			</section>

			<!-- Today's Priority -->
			{#if dailyTasks.filter((t) => !t.completedAt).length > 0}
				<section
					class="border-primary/20 from-primary/5 to-secondary/5 rounded-2xl border bg-gradient-to-r p-8"
				>
					<div class="mb-6 text-center">
						<h2
							class="text-base-content mb-2 flex items-center justify-center gap-2 text-2xl font-bold"
						>
							<svelte:component this={icons.Zap} class="text-warning h-7 w-7" />
							Today's Priority
						</h2>
						<p class="text-base-content/70">Focus on what matters most right now</p>
					</div>

					<!-- Featured Priority Task -->
					{#each dailyTasks.filter((t) => !t.completedAt).slice(0, 3) as task}
						<div class="border-primary/30 bg-base-100 mb-6 rounded-xl border-2 p-6 shadow-sm">
							<div class="mb-4 text-center">
								<h3 class="text-base-content mb-2 text-xl font-bold">{task.title}</h3>
								{#if task.description}
									<p class="text-base-content/70 leading-relaxed">{task.description}</p>
								{/if}

								<div class="mt-4 flex justify-center gap-3">
									{#if task.focus}
										<span class="bg-info/10 text-info rounded-full px-3 py-1 text-sm font-medium">
											<svelte:component this={icons.Focus} class="mr-1 inline h-4 w-4" />
											{task.focus.name}
										</span>
									{/if}
									{#if task.stat}
										<span
											class="bg-secondary/10 text-secondary rounded-full px-3 py-1 text-sm font-medium"
										>
											<svelte:component this={icons.TrendingUp} class="mr-1 inline h-4 w-4" />
											+{task.stat.name}
										</span>
									{/if}
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
								<button
									onclick={() => completeDailyTask(task.id, 'complete')}
									class="btn btn-success flex items-center justify-center gap-2 px-8 py-3 font-semibold shadow-lg transition-all hover:scale-105"
								>
									<svelte:component this={icons.Check} class="h-5 w-5" />
									Complete
								</button>
								<button
									onclick={() => completeDailyTask(task.id, 'skipped')}
									class="btn btn-warning flex items-center justify-center gap-2 px-6 py-3 font-medium transition-all"
								>
									<svelte:component this={icons.Clock} class="h-4 w-4" />
									Skip for Now
								</button>
								<button
									onclick={() => completeDailyTask(task.id, 'failed')}
									class="btn btn-neutral flex items-center justify-center gap-2 px-6 py-3 font-medium transition-all"
								>
									<svelte:component this={icons.X} class="h-4 w-4" />
									Can't Do Today
								</button>
							</div>
						</div>
					{/each}

					<!-- Remaining Priority Tasks Preview -->
					{#if dailyTasks.filter((t) => !t.completedAt).length > 1}
						<div class="text-center">
							<p class="text-base-content/60 mb-3 text-sm">
								{dailyTasks.filter((t) => !t.completedAt).length - 1} more priority task{dailyTasks.filter(
									(t) => !t.completedAt
								).length > 2
									? 's'
									: ''} waiting
							</p>
							<div class="flex justify-center gap-2">
								{#each dailyTasks.filter((t) => !t.completedAt).slice(1, 4) as task}
									<div
										class="border-primary/20 bg-base-100 text-base-content/70 rounded-lg border px-4 py-2 text-sm"
									>
										{task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
									</div>
								{/each}
								{#if dailyTasks.filter((t) => !t.completedAt).length > 4}
									<div class="bg-base-200 text-base-content/50 rounded-lg px-4 py-2 text-sm">
										+{dailyTasks.filter((t) => !t.completedAt).length - 4} more
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</section>
			{:else}
				<!-- All Priority Tasks Complete -->
				<section
					class="border-success/20 from-success/5 to-success/10 rounded-2xl border bg-gradient-to-r p-8 text-center"
				>
					<div
						class="bg-success/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
					>
						<svelte:component this={icons.Trophy} class="text-success h-10 w-10" />
					</div>
					<h2 class="text-success mb-2 text-2xl font-bold">🎉 All Priorities Complete!</h2>
					<p class="text-success/80 mb-6">
						You've conquered today's most important tasks. What's next?
					</p>
				</section>
			{/if}

			<!-- Dashboard Grid -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<!-- Left Column: Active Goals & Progress -->
				<div class="space-y-8 lg:col-span-2">
					<!-- Active Goals -->
					<div class="border-base-300 bg-base-100 rounded-xl border shadow-sm">
						<div class="border-base-300 border-b p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="bg-info/10 flex h-10 w-10 items-center justify-center rounded-lg">
										<svelte:component this={icons.Target} class="text-info h-5 w-5" />
									</div>
									<div>
										<h2 class="text-base-content text-xl font-bold">Active Goals</h2>
										<p class="text-base-content/50 text-sm">
											{tasks.length} goal{tasks.length !== 1 ? 's' : ''} in progress
										</p>
									</div>
								</div>
								<a
									href="/tasks"
									class="text-info hover:text-info/80 flex items-center gap-1 text-sm font-medium transition-colors"
								>
									Manage Goals
									<svelte:component this={icons.ArrowRight} class="h-4 w-4" />
								</a>
							</div>
						</div>

						<div class="p-6">
							{#if tasks.length === 0}
								<div class="space-y-4 py-12 text-center">
									<div
										class="bg-base-200 mx-auto flex h-16 w-16 items-center justify-center rounded-xl"
									>
										<svelte:component this={icons.Target} class="text-base-content/40 h-8 w-8" />
									</div>
									<div>
										<h3 class="text-base-content text-lg font-semibold">Ready to grow?</h3>
										<p class="text-base-content/60 text-sm">
											Set your first goal to start building momentum
										</p>
									</div>
									<a
										href="/tasks"
										class="bg-info text-info-content hover:bg-info/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-colors"
									>
										<svelte:component this={icons.Plus} class="h-4 w-4" />
										Create First Goal
									</a>
								</div>
							{:else}
								<div class="space-y-4">
									{#each tasks as task}
										<div
											class="group border-base-300 hover:border-primary/30 rounded-lg border p-4 transition-all hover:shadow-md"
										>
											<div class="flex items-start justify-between gap-4">
												<div class="flex-1 space-y-2">
													<h4
														class="text-base-content group-hover:text-primary font-semibold transition-colors"
													>
														{task.title}
													</h4>
													{#if task.description}
														<p class="text-base-content/60 text-sm leading-relaxed">
															{task.description}
														</p>
													{/if}
													<div class="flex flex-wrap gap-2">
														{#if task.focus}
															<span
																class="bg-info/10 text-info rounded-md px-2 py-1 text-xs font-medium"
															>
																{task.focus.name}
															</span>
														{/if}
														{#if task.stat}
															<span
																class="bg-success/10 text-success rounded-md px-2 py-1 text-xs font-medium"
															>
																+{task.stat.name}
															</span>
														{/if}
													</div>
												</div>
												<button
													onclick={() => completeTask(task.id)}
													class="bg-success text-success-content hover:bg-success/90 flex items-center gap-2 rounded-lg px-4 py-2 font-medium shadow-sm transition-all hover:scale-105"
												>
													<svelte:component this={icons.Check} class="h-4 w-4" />
													Done
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Your Progress -->
					<div class="border-base-300 bg-base-100 rounded-xl border shadow-sm">
						<div class="border-base-300 border-b p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div
										class="bg-secondary/10 flex h-10 w-10 items-center justify-center rounded-lg"
									>
										<svelte:component this={icons.TrendingUp} class="text-secondary h-5 w-5" />
									</div>
									<div>
										<h2 class="text-base-content text-xl font-bold">Your Progress</h2>
										<p class="text-base-content/50 text-sm">Track your growth journey</p>
									</div>
								</div>
								<a
									href="/stats"
									class="text-secondary hover:text-secondary/80 flex items-center gap-1 text-sm font-medium transition-colors"
								>
									View Details
									<svelte:component this={icons.ArrowRight} class="h-4 w-4" />
								</a>
							</div>
						</div>

						<div class="p-6">
							{#if stats.length === 0}
								<div class="space-y-4 py-8 text-center">
									<div
										class="bg-base-200 mx-auto flex h-16 w-16 items-center justify-center rounded-xl"
									>
										<svelte:component
											this={icons.TrendingUp}
											class="text-base-content/40 h-8 w-8"
										/>
									</div>
									<div>
										<h3 class="text-base-content text-lg font-semibold">
											Start tracking your growth
										</h3>
										<p class="text-base-content/60 text-sm">
											Create stats to measure progress in different areas
										</p>
									</div>
									<a
										href="/stats"
										class="bg-secondary text-secondary-content hover:bg-secondary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
									>
										<svelte:component this={icons.Plus} class="h-4 w-4" />
										Create Stats
									</a>
								</div>
							{:else}
								<div class="grid gap-4 sm:grid-cols-2">
									{#each stats as stat}
										<div
											class="border-secondary/20 from-secondary/5 to-accent/5 rounded-lg border bg-gradient-to-br p-4"
										>
											<div class="mb-3 flex items-center gap-3">
												<div
													class="bg-secondary/10 flex h-10 w-10 items-center justify-center rounded-lg"
												>
													<svelte:component
														this={getIconComponent(stat.icon)}
														class="text-secondary h-5 w-5"
													/>
												</div>
												<div class="flex-1">
													<h4 class="text-base-content font-bold">{stat.name}</h4>
													<p class="text-base-content/60 text-sm">Level {stat.level}</p>
												</div>
												<div class="text-right">
													<div class="text-secondary text-xl font-bold">{stat.level}</div>
												</div>
											</div>

											<!-- Mini Progress Bar -->
											<div class="space-y-1">
												<div class="bg-base-300 h-2 overflow-hidden rounded-full">
													<div
														class="from-secondary to-accent h-2 rounded-full bg-gradient-to-r transition-all duration-500"
														style="width: {Math.min(
															100,
															Math.max(0, ((stat.xp - (stat.level - 1) * 100) / 100) * 100)
														)}%;"
													></div>
												</div>
												<p class="text-base-content/50 text-xs">
													{Math.min(
														100,
														Math.max(0, ((stat.xp - (stat.level - 1) * 100) / 100) * 100)
													).toFixed(0)}% to Level {stat.level + 1}
												</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Right Column: Journal & Quick Actions -->
				<div class="space-y-8">
					<!-- Recent Journal Entries -->
					<div class="border-base-300 bg-base-100 rounded-xl border shadow-sm">
						<div class="border-base-300 border-b p-6">
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="bg-warning/10 flex h-10 w-10 items-center justify-center rounded-lg">
										<svelte:component this={icons.Edit3} class="text-warning h-5 w-5" />
									</div>
									<div>
										<h2 class="text-base-content text-xl font-bold">Journal</h2>
									</div>
								</div>
							</div>
							<div class="text-center">
								<a
									href="/journals/chat"
									class="bg-accent text-accent-content hover:bg-accent/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
								>
									<svelte:component this={icons.MessageCircle} class="h-4 w-4" />
									Write New Entry
								</a>
							</div>
						</div>

						<div class="p-6">
							{#if recentJournals.length === 0}
								<div class="space-y-4 py-8 text-center">
									<div
										class="bg-base-200 mx-auto flex h-16 w-16 items-center justify-center rounded-xl"
									>
										<svelte:component this={icons.Edit3} class="text-base-content/40 h-8 w-8" />
									</div>
									<div>
										<h3 class="text-base-content text-lg font-semibold">Start journaling</h3>
										<p class="text-base-content/60 text-sm">
											Capture your thoughts and reflections
										</p>
									</div>
								</div>
							{:else}
								<div class="space-y-4">
									{#each recentJournals as journal}
										<a
											href="/journals/{journal.id}"
											class="border-base-300 hover:border-warning/30 block cursor-pointer rounded-lg border p-4 transition-all hover:shadow-sm"
										>
											<p class="text-base-content mb-3 text-sm leading-relaxed">
												{journal.content.length > 100
													? journal.content.substring(0, 100) + '...'
													: journal.content}
											</p>
											<div class="flex items-center justify-between">
												<span class="text-base-content/50 text-xs">
													{new Date(journal.date).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
														hour: 'numeric',
														minute: '2-digit'
													})}
												</span>
												{#if journal.mood}
													<span
														class="bg-warning/10 text-warning rounded-full px-2 py-1 text-xs font-medium"
													>
														{journal.mood}
													</span>
												{/if}
											</div>
										</a>
									{/each}
									<div class="pt-2 text-center">
										<a
											href="/journals"
											class="text-warning hover:text-warning/80 flex items-center justify-center gap-1 text-sm font-medium transition-colors"
										>
											View All Entries
											<svelte:component this={icons.ArrowRight} class="h-4 w-4" />
										</a>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Quick Navigation -->
					<div class="border-base-300 bg-base-100 rounded-xl border p-6 shadow-sm">
						<h3 class="text-base-content mb-4 text-center text-lg font-semibold">Quick Actions</h3>
						<div class="space-y-3">
							<a
								href="/tasks"
								class="border-base-300 bg-base-100 hover:border-primary/20 hover:bg-primary/5 flex items-center gap-3 rounded-lg border p-3 transition-colors"
							>
								<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
									<svelte:component this={icons.Plus} class="text-info h-5 w-5" />
								</div>
								<div>
									<div class="text-base-content font-medium">Create Goal</div>
									<div class="text-base-content/70 text-sm">Set new objectives</div>
								</div>
							</a>
							<a
								href="/focuses"
								class="border-base-300 bg-base-100 hover:border-accent/20 hover:bg-accent/5 flex items-center gap-3 rounded-lg border p-3 transition-colors"
							>
								<div class="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-lg">
									<svelte:component this={icons.Focus} class="text-accent h-5 w-5" />
								</div>
								<div>
									<div class="text-base-content font-medium">Focus Areas</div>
									<div class="text-base-content/70 text-sm">Manage priorities</div>
								</div>
							</a>
							<a
								href="/settings"
								class="border-base-300 bg-base-100 hover:bg-base-200 flex items-center gap-3 rounded-lg border p-3 transition-colors"
							>
								<div class="bg-base-200 flex h-10 w-10 items-center justify-center rounded-lg">
									<svelte:component this={icons.Settings} class="text-base-content/70 h-5 w-5" />
								</div>
								<div>
									<div class="text-base-content font-medium">Settings</div>
									<div class="text-base-content/70 text-sm">Customize profile</div>
								</div>
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Anytime Tasks Section -->
			{#if adhocTasks.length > 0}
				<section class="mt-8">
					<div class="border-base-300 bg-base-100 rounded-xl border shadow-sm">
						<div class="border-base-300 border-b p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div
										class="bg-secondary/10 flex h-10 w-10 items-center justify-center rounded-lg"
									>
										<svelte:component this={icons.Zap} class="text-secondary h-5 w-5" />
									</div>
									<div>
										<h2 class="text-base-content text-xl font-bold">Anytime Tasks</h2>
										<p class="text-base-content/60 text-sm">
											Quick actions you can complete anytime
										</p>
									</div>
								</div>
								<a
									href="/adhoc-tasks"
									class="text-secondary hover:text-secondary flex items-center gap-1 text-sm font-medium transition-colors"
								>
									Manage Library
									<svelte:component this={icons.ArrowRight} class="h-4 w-4" />
								</a>
							</div>
						</div>

						<div class="p-6">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each adhocTasks.slice(0, 6) as adhocTask}
									<button
										onclick={() => executeAdhocTask(adhocTask.id)}
										class="group border-base-300 hover:border-secondary/30 hover:bg-secondary/5 flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:shadow-md"
									>
										<div
											class="bg-secondary/10 group-hover:bg-secondary/20 flex h-12 w-12 items-center justify-center rounded-lg"
										>
											{#if adhocTask.iconId}
												<svelte:component
													this={getIconComponent(adhocTask.iconId)}
													class="text-secondary h-6 w-6"
												/>
											{:else}
												<svelte:component this={icons.Target} class="text-secondary h-6 w-6" />
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<h3 class="text-base-content group-hover:text-secondary font-semibold">
												{adhocTask.name}
											</h3>
											{#if adhocTask.description}
												<p class="text-base-content/70 mt-1 line-clamp-2 text-sm">
													{adhocTask.description}
												</p>
											{/if}
											<div class="mt-2 flex items-center gap-2">
												<span
													class="bg-secondary/10 text-secondary rounded-full px-2 py-1 text-xs font-medium"
												>
													{adhocTask.linkedStat.name}
												</span>
												<span class="text-secondary text-xs font-medium">
													+{adhocTask.xpValue} XP
												</span>
											</div>
										</div>
									</button>
								{/each}
							</div>

							{#if adhocTasks.length > 6}
								<div class="mt-4 text-center">
									<a
										href="/adhoc-tasks"
										class="text-secondary hover:text-secondary inline-flex items-center gap-1 text-sm font-medium transition-colors"
									>
										View All {adhocTasks.length} Tasks
										<svelte:component this={icons.ArrowRight} class="h-4 w-4" />
									</a>
								</div>
							{/if}
						</div>
					</div>
				</section>
			{/if}
		</main>
	{/if}
</div>

<!-- Task Feedback Modal -->
{#if showTaskFeedback}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		onclick={closeModal}
	>
		<div class="bg-base-100 w-full max-w-md rounded-lg shadow-xl">
			<div class="border-base-300 border-b p-6">
				<div class="flex items-center justify-between">
					<h3 class="text-base-content text-xl font-semibold">
						{showTaskFeedback.endsWith('_adhoc') ? 'Complete Anytime Task' : 'Task Feedback'}
					</h3>
					<button
						onclick={cancelTaskFeedback}
						class="text-base-content/50 hover:text-base-content/70 transition-colors"
					>
						<svelte:component this={icons.X} class="h-6 w-6" />
					</button>
				</div>
			</div>

			<div class="space-y-4 p-6">
				<div>
					<label class="text-base-content mb-2 block text-sm font-semibold">
						How did it go? <span class="text-base-content/70 text-sm font-normal italic"
							>(optional)</span
						>
					</label>
					<textarea
						bind:value={taskFeedbackData.feedback}
						placeholder="Reflect on your experience..."
						class="border-base-300 min-h-20 w-full resize-y rounded-lg border p-3 text-sm leading-relaxed transition-colors focus:border-blue-500 focus:outline-none"
					></textarea>
				</div>

				<div>
					<label class="text-base-content mb-2 block text-sm font-semibold">
						Emotion Tag <span class="text-base-content/70 text-sm font-normal italic"
							>(optional)</span
						>
					</label>
					<select
						bind:value={taskFeedbackData.emotionTag}
						class="border-base-300 w-full rounded-lg border p-3 text-sm transition-colors focus:border-blue-500 focus:outline-none"
					>
						<option value="">Select an emotion</option>
						<option value="accomplished">Accomplished</option>
						<option value="energized">Energized</option>
						<option value="focused">Focused</option>
						<option value="challenged">Challenged</option>
						<option value="frustrated">Frustrated</option>
						<option value="overwhelmed">Overwhelmed</option>
						<option value="peaceful">Peaceful</option>
						<option value="motivated">Motivated</option>
					</select>
				</div>

				<div>
					<label class="text-base-content mb-2 block text-sm font-semibold">
						Mood Score (1-5) <span class="text-base-content/70 text-sm font-normal italic"
							>(optional)</span
						>
					</label>
					<input
						type="range"
						min="0"
						max="5"
						bind:value={taskFeedbackData.moodScore}
						class="bg-base-300 h-2 w-full cursor-pointer appearance-none rounded-lg"
					/>
					<div class="text-base-content/70 mt-1 flex justify-between text-xs">
						<span>None</span>
						<span>Great (5)</span>
					</div>
					{#if taskFeedbackData.moodScore > 0}
						<p class="text-base-content/80 mt-2 text-center text-sm">
							Score: {taskFeedbackData.moodScore}
						</p>
					{/if}
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<button
						onclick={cancelTaskFeedback}
						class="border-base-300 text-base-content/80 hover:bg-base-200 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={() => submitTaskFeedback(showTaskFeedback)}
						class="bg-success text-primary-content hover:bg-success/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
					>
						{showTaskFeedback.endsWith('_adhoc') ? 'Complete & Earn XP' : 'Complete Task'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
