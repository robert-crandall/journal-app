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

	async function createJournal() {
		try {
			await journalsApi.create({
				content: journalContent
			});

			// Reset form and close modal
			journalContent = '';
			journalMood = '';

			// Refresh journals
			const journalsData = await journalsApi.getAll();
			recentJournals = journalsData.journals.slice(0, 3);

			showSaveMessage('Journal entry created ✓');
		} catch (error) {
			console.error('Failed to create journal entry:', error);
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

<div class="min-h-screen bg-base-200">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="space-y-4 text-center">
				<div
					class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary"
				></div>
				<p class="text-sm text-base-content/70">Loading your command center...</p>
			</div>
		</div>
	{:else}
		<!-- Save Message -->
		{#if saveMessage}
			<div
				class="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-success shadow-lg transition-opacity"
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
						class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl font-bold text-primary-content shadow-lg"
					>
						{(userData?.name || 'U').charAt(0).toUpperCase()}
					</div>
					<div class="text-left">
						<h1 class="text-4xl font-bold text-base-content">
							Welcome back, {userData?.name || 'User'}! 👋
						</h1>
						<p class="mt-1 text-lg text-base-content/70">
							{#if userData?.className}
								Ready to focus on <span class="font-semibold text-primary"
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
						<div class="text-3xl font-bold text-info">
							{dailyTasks.filter((t) => !t.completedAt).length}
						</div>
						<div class="text-sm text-base-content/60">Priority Tasks</div>
					</div>
					<div class="space-y-1">
						<div class="text-3xl font-bold text-success">{tasks.length}</div>
						<div class="text-sm text-base-content/60">Active Goals</div>
					</div>
					<div class="space-y-1">
						<div class="text-3xl font-bold text-secondary">
							{stats.reduce((sum, stat) => sum + stat.level, 0)}
						</div>
						<div class="text-sm text-base-content/60">Total Levels</div>
					</div>
				</div>
			</section>

			<!-- Today's Priority -->
			{#if dailyTasks.filter((t) => !t.completedAt).length > 0}
				<section
					class="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-8"
				>
					<div class="mb-6 text-center">
						<h2
							class="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-base-content"
						>
							<svelte:component this={icons.Zap} class="h-7 w-7 text-warning" />
							Today's Priority
						</h2>
						<p class="text-base-content/70">Focus on what matters most right now</p>
					</div>

					<!-- Featured Priority Task -->
					{#each dailyTasks.filter((t) => !t.completedAt).slice(0, 1) as task}
						<div class="mb-6 rounded-xl border-2 border-primary/30 bg-base-100 p-6 shadow-sm">
							<div class="mb-4 text-center">
								<h3 class="mb-2 text-xl font-bold text-base-content">{task.title}</h3>
								{#if task.description}
									<p class="leading-relaxed text-base-content/70">{task.description}</p>
								{/if}

								<div class="mt-4 flex justify-center gap-3">
									{#if task.focus}
										<span
											class="rounded-full bg-info/10 px-3 py-1 text-sm font-medium text-info"
										>
											<svelte:component this={icons.Focus} class="mr-1 inline h-4 w-4" />
											{task.focus.name}
										</span>
									{/if}
									{#if task.stat}
										<span
											class="rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary"
										>
											<svelte:component this={icons.TrendingUp} class="mr-1 inline h-4 w-4" />
											+{task.stat.name}
										</span>
									{/if}
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex flex-col sm:flex-row gap-4">
								<button
									onclick={() => completeDailyTask(task.id, 'complete')}
									class="flex items-center gap-2 rounded-lg bg-success px-8 py-3 font-semibold text-success-content shadow-lg transition-all hover:scale-105 hover:bg-success/90"
								>
									<svelte:component this={icons.Check} class="h-5 w-5" />
									Complete
								</button>
								<button
									onclick={() => completeDailyTask(task.id, 'skipped')}
									class="flex items-center gap-2 rounded-lg bg-warning px-6 py-3 font-medium text-warning-content transition-all hover:bg-warning/90"
								>
									<svelte:component this={icons.Clock} class="h-4 w-4" />
									Skip for Now
								</button>
								<button
									onclick={() => completeDailyTask(task.id, 'failed')}
									class="flex items-center gap-2 rounded-lg bg-neutral px-6 py-3 font-medium text-neutral-content transition-all hover:bg-neutral/90"
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
							<p class="mb-3 text-sm text-base-content/60">
								{dailyTasks.filter((t) => !t.completedAt).length - 1} more priority task{dailyTasks.filter(
									(t) => !t.completedAt
								).length > 2
									? 's'
									: ''} waiting
							</p>
							<div class="flex justify-center gap-2">
								{#each dailyTasks.filter((t) => !t.completedAt).slice(1, 4) as task}
									<div
										class="rounded-lg border border-primary/20 bg-base-100 px-4 py-2 text-sm text-base-content/70"
									>
										{task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
									</div>
								{/each}
								{#if dailyTasks.filter((t) => !t.completedAt).length > 4}
									<div class="rounded-lg bg-base-200 px-4 py-2 text-sm text-base-content/50">
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
					class="rounded-2xl border border-success/20 bg-gradient-to-r from-success/5 to-success/10 p-8 text-center"
				>
					<div
						class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"
					>
						<svelte:component this={icons.Trophy} class="h-10 w-10 text-success" />
					</div>
					<h2 class="mb-2 text-2xl font-bold text-success">🎉 All Priorities Complete!</h2>
					<p class="mb-6 text-success/80">
						You've conquered today's most important tasks. What's next?
					</p>
				</section>
			{/if}

			<!-- Dashboard Grid -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<!-- Left Column: Active Goals & Progress -->
				<div class="space-y-8 lg:col-span-2">
					<!-- Active Goals -->
					<div class="rounded-xl border border-base-300 bg-base-100 shadow-sm">
						<div class="border-b border-base-300 p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
										<svelte:component this={icons.Target} class="h-5 w-5 text-info" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-base-content">Active Goals</h2>
										<p class="text-sm text-base-content/50">
											{tasks.length} goal{tasks.length !== 1 ? 's' : ''} in progress
										</p>
									</div>
								</div>
								<a
									href="/tasks"
									class="flex items-center gap-1 text-sm font-medium text-info transition-colors hover:text-info/80"
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
										class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-base-200"
									>
										<svelte:component this={icons.Target} class="h-8 w-8 text-base-content/40" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-base-content">Ready to grow?</h3>
										<p class="text-sm text-base-content/60">
											Set your first goal to start building momentum
										</p>
									</div>
									<a
										href="/tasks"
										class="inline-flex items-center gap-2 rounded-lg bg-info px-6 py-3 font-semibold text-info-content transition-colors hover:bg-info/90"
									>
										<svelte:component this={icons.Plus} class="h-4 w-4" />
										Create First Goal
									</a>
								</div>
							{:else}
								<div class="space-y-4">
									{#each tasks as task}
										<div
											class="group rounded-lg border border-base-300 p-4 transition-all hover:border-primary/30 hover:shadow-md"
										>
											<div class="flex items-start justify-between gap-4">
												<div class="flex-1 space-y-2">
													<h4
														class="font-semibold text-base-content transition-colors group-hover:text-primary"
													>
														{task.title}
													</h4>
													{#if task.description}
														<p class="text-sm leading-relaxed text-base-content/60">
															{task.description}
														</p>
													{/if}
													<div class="flex flex-wrap gap-2">
														{#if task.focus}
															<span
																class="rounded-md bg-info/10 px-2 py-1 text-xs font-medium text-info"
															>
																{task.focus.name}
															</span>
														{/if}
														{#if task.stat}
															<span
																class="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success"
															>
																+{task.stat.name}
															</span>
														{/if}
													</div>
												</div>
												<button
													onclick={() => completeTask(task.id)}
													class="flex items-center gap-2 rounded-lg bg-success px-4 py-2 font-medium text-success-content shadow-sm transition-all hover:scale-105 hover:bg-success/90"
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
					<div class="rounded-xl border border-base-300 bg-base-100 shadow-sm">
						<div class="border-b border-base-300 p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
										<svelte:component this={icons.TrendingUp} class="h-5 w-5 text-secondary" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-base-content">Your Progress</h2>
										<p class="text-sm text-base-content/50">Track your growth journey</p>
									</div>
								</div>
								<a
									href="/stats"
									class="flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
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
										class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-base-200"
									>
										<svelte:component this={icons.TrendingUp} class="h-8 w-8 text-base-content/40" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-base-content">
											Start tracking your growth
										</h3>
										<p class="text-sm text-base-content/60">
											Create stats to measure progress in different areas
										</p>
									</div>
									<a
										href="/stats"
										class="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-medium text-secondary-content transition-colors hover:bg-secondary/90"
									>
										<svelte:component this={icons.Plus} class="h-4 w-4" />
										Create Stats
									</a>
								</div>
							{:else}
								<div class="grid gap-4 sm:grid-cols-2">
									{#each stats as stat}
										<div
											class="rounded-lg border border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5 p-4"
										>
											<div class="mb-3 flex items-center gap-3">
												<div
													class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10"
												>
													<svelte:component
														this={getIconComponent(stat.icon)}
														class="h-5 w-5 text-secondary"
													/>
												</div>
												<div class="flex-1">
													<h4 class="font-bold text-base-content">{stat.name}</h4>
													<p class="text-sm text-base-content/60">Level {stat.level}</p>
												</div>
												<div class="text-right">
													<div class="text-xl font-bold text-secondary">{stat.level}</div>
												</div>
											</div>

											<!-- Mini Progress Bar -->
											<div class="space-y-1">
												<div class="h-2 overflow-hidden rounded-full bg-base-300">
													<div
														class="h-2 rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
														style="width: {Math.min(
															100,
															Math.max(0, ((stat.xp - (stat.level - 1) * 100) / 100) * 100)
														)}%;"
													></div>
												</div>
												<p class="text-xs text-base-content/50">
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
					<div class="rounded-xl border border-base-300 bg-base-100 shadow-sm">
						<div class="border-b border-base-300 p-6">
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
										<svelte:component this={icons.Edit3} class="h-5 w-5 text-warning" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-base-content">Journal</h2>
										<p class="text-sm text-base-content/50">Your recent thoughts</p>
									</div>
								</div>
							</div>
							<div class="text-center">
								<a
									href="/journals/chat"
									class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-content transition-colors hover:bg-accent/90"
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
										class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-base-200"
									>
										<svelte:component this={icons.Edit3} class="h-8 w-8 text-base-content/40" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-base-content">Start journaling</h3>
										<p class="text-sm text-base-content/60">Capture your thoughts and reflections</p>
									</div>
								</div>
							{:else}
								<div class="space-y-4">
									{#each recentJournals as journal}
										<div
											class="rounded-lg border border-base-300 p-4 transition-all hover:border-warning/30 hover:shadow-sm"
										>
											<p class="mb-3 text-sm leading-relaxed text-base-content">
												{journal.content.length > 100
													? journal.content.substring(0, 100) + '...'
													: journal.content}
											</p>
											<div class="flex items-center justify-between">
												<span class="text-xs text-base-content/50">
													{new Date(journal.date).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
														hour: 'numeric',
														minute: '2-digit'
													})}
												</span>
												{#if journal.mood}
													<span
														class="rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning"
													>
														{journal.mood}
													</span>
												{/if}
											</div>
										</div>
									{/each}
									<div class="pt-2 text-center">
										<a
											href="/journals"
											class="flex items-center justify-center gap-1 text-sm font-medium text-warning transition-colors hover:text-warning/80"
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
					<div
						class="rounded-xl border border-base-300 bg-base-100 shadow-sm p-6"
					>
						<h3 class="mb-4 text-center text-lg font-semibold text-base-content">Quick Actions</h3>
						<div class="space-y-3">
							<a
								href="/tasks"
								class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3 transition-colors hover:border-primary/20 hover:bg-primary/5"
							>
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									<svelte:component this={icons.Plus} class="h-5 w-5 text-info" />
								</div>
								<div>
									<div class="font-medium text-base-content">Create Goal</div>
									<div class="text-sm text-base-content/70">Set new objectives</div>
								</div>
							</a>
							<a
								href="/focuses"
								class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3 transition-colors hover:border-accent/20 hover:bg-accent/5"
							>
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
									<svelte:component this={icons.Focus} class="h-5 w-5 text-accent" />
								</div>
								<div>
									<div class="font-medium text-base-content">Focus Areas</div>
									<div class="text-sm text-base-content/70">Manage priorities</div>
								</div>
							</a>
							<a
								href="/settings"
								class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3 transition-colors hover:bg-base-200"
							>
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-base-200">
									<svelte:component this={icons.Settings} class="h-5 w-5 text-base-content/70" />
								</div>
								<div>
									<div class="font-medium text-base-content">Settings</div>
									<div class="text-sm text-base-content/70">Customize profile</div>
								</div>
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Anytime Tasks Section -->
			{#if adhocTasks.length > 0}
				<section class="mt-8">
					<div class="rounded-xl border border-base-300 bg-base-100 shadow-sm">
						<div class="border-b border-base-300 p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
										<svelte:component this={icons.Zap} class="h-5 w-5 text-secondary" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-base-content">Anytime Tasks</h2>
										<p class="text-sm text-base-content/60">Quick actions you can complete anytime</p>
									</div>
								</div>
								<a
									href="/adhoc-tasks"
									class="flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-secondary"
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
										class="group flex items-start gap-4 rounded-lg border border-base-300 p-4 text-left transition-all hover:border-secondary/30 hover:bg-secondary/5 hover:shadow-md"
									>
										<div
											class="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-secondary/20"
										>
											{#if adhocTask.iconId}
												<svelte:component
													this={getIconComponent(adhocTask.iconId)}
													class="h-6 w-6 text-secondary"
												/>
											{:else}
												<svelte:component this={icons.Target} class="h-6 w-6 text-secondary" />
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<h3 class="font-semibold text-base-content group-hover:text-secondary">
												{adhocTask.name}
											</h3>
											{#if adhocTask.description}
												<p class="mt-1 line-clamp-2 text-sm text-base-content/70">
													{adhocTask.description}
												</p>
											{/if}
											<div class="mt-2 flex items-center gap-2">
												<span
													class="rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary"
												>
													{adhocTask.linkedStat.name}
												</span>
												<span class="text-xs font-medium text-secondary">
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
										class="inline-flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-secondary"
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
		<div class="w-full max-w-md rounded-lg bg-base-100 shadow-xl">
			<div class="border-b border-base-300 p-6">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-semibold text-base-content">
						{showTaskFeedback.endsWith('_adhoc') ? 'Complete Anytime Task' : 'Task Feedback'}
					</h3>
					<button
						onclick={cancelTaskFeedback}
						class="text-base-content/50 transition-colors hover:text-base-content/70"
					>
						<svelte:component this={icons.X} class="h-6 w-6" />
					</button>
				</div>
			</div>

			<div class="space-y-4 p-6">
				<div>
					<label class="mb-2 block text-sm font-semibold text-base-content">
						How did it go? <span class="text-sm font-normal text-base-content/70 italic"
							>(optional)</span
						>
					</label>
					<textarea
						bind:value={taskFeedbackData.feedback}
						placeholder="Reflect on your experience..."
						class="min-h-20 w-full resize-y rounded-lg border border-base-300 p-3 text-sm leading-relaxed transition-colors focus:border-blue-500 focus:outline-none"
					></textarea>
				</div>

				<div>
					<label class="mb-2 block text-sm font-semibold text-base-content">
						Emotion Tag <span class="text-sm font-normal text-base-content/70 italic">(optional)</span>
					</label>
					<select
						bind:value={taskFeedbackData.emotionTag}
						class="w-full rounded-lg border border-base-300 p-3 text-sm transition-colors focus:border-blue-500 focus:outline-none"
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
					<label class="mb-2 block text-sm font-semibold text-base-content">
						Mood Score (1-10) <span class="text-sm font-normal text-base-content/70 italic"
							>(optional)</span
						>
					</label>
					<input
						type="range"
						min="0"
						max="10"
						bind:value={taskFeedbackData.moodScore}
						class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-base-300"
					/>
					<div class="mt-1 flex justify-between text-xs text-base-content/70">
						<span>None</span>
						<span>Great (10)</span>
					</div>
					{#if taskFeedbackData.moodScore > 0}
						<p class="mt-2 text-center text-sm text-base-content/80">
							Score: {taskFeedbackData.moodScore}
						</p>
					{/if}
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<button
						onclick={cancelTaskFeedback}
						class="rounded-lg border border-base-300 px-4 py-2 text-sm font-medium text-base-content/80 transition-colors hover:bg-base-200"
					>
						Cancel
					</button>
					<button
						onclick={() => submitTaskFeedback(showTaskFeedback)}
						class="rounded-lg bg-success px-4 py-2 text-sm font-medium text-primary-content transition-colors hover:bg-success/90"
					>
						{showTaskFeedback.endsWith('_adhoc') ? 'Complete & Earn XP' : 'Complete Task'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
