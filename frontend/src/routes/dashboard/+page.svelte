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

<div class="min-h-screen bg-neutral-50">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="space-y-4 text-center">
				<div
					class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"
				></div>
				<p class="text-sm text-neutral-600">Loading your command center...</p>
			</div>
		</div>
	{:else}
		<!-- Save Message -->
		{#if saveMessage}
			<div
				class="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg transition-opacity"
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
						class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg"
					>
						{(userData?.name || 'U').charAt(0).toUpperCase()}
					</div>
					<div class="text-left">
						<h1 class="text-4xl font-bold text-neutral-900">
							Welcome back, {userData?.name || 'User'}! 👋
						</h1>
						<p class="mt-1 text-lg text-neutral-600">
							{#if userData?.className}
								Ready to focus on <span class="font-semibold text-blue-700"
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
						<div class="text-3xl font-bold text-blue-600">
							{dailyTasks.filter((t) => !t.completedAt).length}
						</div>
						<div class="text-sm text-neutral-600">Priority Tasks</div>
					</div>
					<div class="space-y-1">
						<div class="text-3xl font-bold text-green-600">{tasks.length}</div>
						<div class="text-sm text-neutral-600">Active Goals</div>
					</div>
					<div class="space-y-1">
						<div class="text-3xl font-bold text-purple-600">
							{stats.reduce((sum, stat) => sum + stat.level, 0)}
						</div>
						<div class="text-sm text-neutral-600">Total Levels</div>
					</div>
				</div>
			</section>

			<!-- Today's Priority -->
			{#if dailyTasks.filter((t) => !t.completedAt).length > 0}
				<section
					class="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8"
				>
					<div class="mb-6 text-center">
						<h2
							class="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-neutral-900"
						>
							<svelte:component this={icons.Zap} class="h-7 w-7 text-yellow-500" />
							Today's Priority
						</h2>
						<p class="text-neutral-600">Focus on what matters most right now</p>
					</div>

					<!-- Featured Priority Task -->
					{#each dailyTasks.filter((t) => !t.completedAt).slice(0, 1) as task}
						<div class="mb-6 rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm">
							<div class="mb-4 text-center">
								<h3 class="mb-2 text-xl font-bold text-neutral-900">{task.title}</h3>
								{#if task.description}
									<p class="leading-relaxed text-neutral-600">{task.description}</p>
								{/if}

								<div class="mt-4 flex justify-center gap-3">
									{#if task.focus}
										<span
											class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
										>
											<svelte:component this={icons.Focus} class="mr-1 inline h-4 w-4" />
											{task.focus.name}
										</span>
									{/if}
									{#if task.stat}
										<span
											class="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
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
									class="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-green-700"
								>
									<svelte:component this={icons.Check} class="h-5 w-5" />
									Complete
								</button>
								<button
									onclick={() => completeDailyTask(task.id, 'skipped')}
									class="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition-all hover:bg-amber-600"
								>
									<svelte:component this={icons.Clock} class="h-4 w-4" />
									Skip for Now
								</button>
								<button
									onclick={() => completeDailyTask(task.id, 'failed')}
									class="flex items-center gap-2 rounded-lg bg-neutral-500 px-6 py-3 font-medium text-white transition-all hover:bg-neutral-600"
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
							<p class="mb-3 text-sm text-neutral-600">
								{dailyTasks.filter((t) => !t.completedAt).length - 1} more priority task{dailyTasks.filter(
									(t) => !t.completedAt
								).length > 2
									? 's'
									: ''} waiting
							</p>
							<div class="flex justify-center gap-2">
								{#each dailyTasks.filter((t) => !t.completedAt).slice(1, 4) as task}
									<div
										class="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm text-neutral-700"
									>
										{task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
									</div>
								{/each}
								{#if dailyTasks.filter((t) => !t.completedAt).length > 4}
									<div class="rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-500">
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
					class="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center"
				>
					<div
						class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
					>
						<svelte:component this={icons.Trophy} class="h-10 w-10 text-green-600" />
					</div>
					<h2 class="mb-2 text-2xl font-bold text-green-900">🎉 All Priorities Complete!</h2>
					<p class="mb-6 text-green-700">
						You've conquered today's most important tasks. What's next?
					</p>
				</section>
			{/if}

			<!-- Dashboard Grid -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<!-- Left Column: Active Goals & Progress -->
				<div class="space-y-8 lg:col-span-2">
					<!-- Active Goals -->
					<div class="rounded-xl border border-neutral-200 bg-white shadow-sm">
						<div class="border-b border-neutral-100 p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
										<svelte:component this={icons.Target} class="h-5 w-5 text-blue-600" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-neutral-900">Active Goals</h2>
										<p class="text-sm text-neutral-500">
											{tasks.length} goal{tasks.length !== 1 ? 's' : ''} in progress
										</p>
									</div>
								</div>
								<a
									href="/tasks"
									class="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
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
										class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100"
									>
										<svelte:component this={icons.Target} class="h-8 w-8 text-neutral-400" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">Ready to grow?</h3>
										<p class="text-sm text-neutral-600">
											Set your first goal to start building momentum
										</p>
									</div>
									<a
										href="/tasks"
										class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
									>
										<svelte:component this={icons.Plus} class="h-4 w-4" />
										Create First Goal
									</a>
								</div>
							{:else}
								<div class="space-y-4">
									{#each tasks as task}
										<div
											class="group rounded-lg border border-neutral-200 p-4 transition-all hover:border-blue-200 hover:shadow-md"
										>
											<div class="flex items-start justify-between gap-4">
												<div class="flex-1 space-y-2">
													<h4
														class="font-semibold text-neutral-900 transition-colors group-hover:text-blue-700"
													>
														{task.title}
													</h4>
													{#if task.description}
														<p class="text-sm leading-relaxed text-neutral-600">
															{task.description}
														</p>
													{/if}
													<div class="flex flex-wrap gap-2">
														{#if task.focus}
															<span
																class="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
															>
																{task.focus.name}
															</span>
														{/if}
														{#if task.stat}
															<span
																class="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
															>
																+{task.stat.name}
															</span>
														{/if}
													</div>
												</div>
												<button
													onclick={() => completeTask(task.id)}
													class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:scale-105 hover:bg-green-700"
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
					<div class="rounded-xl border border-neutral-200 bg-white shadow-sm">
						<div class="border-b border-neutral-100 p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
										<svelte:component this={icons.TrendingUp} class="h-5 w-5 text-purple-600" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-neutral-900">Your Progress</h2>
										<p class="text-sm text-neutral-500">Track your growth journey</p>
									</div>
								</div>
								<a
									href="/stats"
									class="flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
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
										class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100"
									>
										<svelte:component this={icons.TrendingUp} class="h-8 w-8 text-neutral-400" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">
											Start tracking your growth
										</h3>
										<p class="text-sm text-neutral-600">
											Create stats to measure progress in different areas
										</p>
									</div>
									<a
										href="/stats"
										class="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
									>
										<svelte:component this={icons.Plus} class="h-4 w-4" />
										Create Stats
									</a>
								</div>
							{:else}
								<div class="grid gap-4 sm:grid-cols-2">
									{#each stats as stat}
										<div
											class="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4"
										>
											<div class="mb-3 flex items-center gap-3">
												<div
													class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"
												>
													<svelte:component
														this={getIconComponent(stat.icon)}
														class="h-5 w-5 text-purple-600"
													/>
												</div>
												<div class="flex-1">
													<h4 class="font-bold text-neutral-900">{stat.name}</h4>
													<p class="text-sm text-neutral-600">Level {stat.level}</p>
												</div>
												<div class="text-right">
													<div class="text-xl font-bold text-purple-600">{stat.level}</div>
												</div>
											</div>

											<!-- Mini Progress Bar -->
											<div class="space-y-1">
												<div class="h-2 overflow-hidden rounded-full bg-neutral-200">
													<div
														class="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
														style="width: {Math.min(
															100,
															Math.max(0, ((stat.xp - (stat.level - 1) * 100) / 100) * 100)
														)}%;"
													></div>
												</div>
												<p class="text-xs text-neutral-500">
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
					<div class="rounded-xl border border-neutral-200 bg-white shadow-sm">
						<div class="border-b border-neutral-100 p-6">
							<div class="mb-4 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
										<svelte:component this={icons.Edit3} class="h-5 w-5 text-amber-600" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-neutral-900">Journal</h2>
										<p class="text-sm text-neutral-500">Your recent thoughts</p>
									</div>
								</div>
							</div>
							<a
								href="/journals/chat"
								class="flex items-center gap-2 rounded-lg border-2 border-green-300 bg-white px-6 py-3 font-semibold text-green-700 transition-colors hover:bg-green-50"
							>
								<svelte:component this={icons.Plus} class="h-4 w-4" />
								Set New Goals
							</a>
						</div>

						<div class="p-6">
							{#if recentJournals.length === 0}
								<div class="space-y-4 py-8 text-center">
									<div
										class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100"
									>
										<svelte:component this={icons.Edit3} class="h-8 w-8 text-neutral-400" />
									</div>
									<div>
										<h3 class="text-lg font-semibold text-neutral-900">Start journaling</h3>
										<p class="text-sm text-neutral-600">Capture your thoughts and reflections</p>
									</div>
								</div>
							{:else}
								<div class="space-y-4">
									{#each recentJournals as journal}
										<div
											class="rounded-lg border border-neutral-200 p-4 transition-all hover:border-amber-200 hover:shadow-sm"
										>
											<p class="mb-3 text-sm leading-relaxed text-neutral-900">
												{journal.content.length > 100
													? journal.content.substring(0, 100) + '...'
													: journal.content}
											</p>
											<div class="flex items-center justify-between">
												<span class="text-xs text-neutral-500">
													{new Date(journal.date).toLocaleDateString('en-US', {
														month: 'short',
														day: 'numeric',
														hour: 'numeric',
														minute: '2-digit'
													})}
												</span>
												{#if journal.mood}
													<span
														class="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
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
											class="flex items-center justify-center gap-1 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
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
						class="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-6"
					>
						<h3 class="mb-4 text-center text-lg font-semibold text-neutral-900">Quick Actions</h3>
						<div class="space-y-3">
							<a
								href="/tasks"
								class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
							>
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
									<svelte:component this={icons.Plus} class="h-5 w-5 text-blue-600" />
								</div>
								<div>
									<div class="font-medium text-neutral-900">Create Goal</div>
									<div class="text-sm text-neutral-600">Set new objectives</div>
								</div>
							</a>
							<a
								href="/focuses"
								class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
							>
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
									<svelte:component this={icons.Focus} class="h-5 w-5 text-indigo-600" />
								</div>
								<div>
									<div class="font-medium text-neutral-900">Focus Areas</div>
									<div class="text-sm text-neutral-600">Manage priorities</div>
								</div>
							</a>
							<a
								href="/settings"
								class="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50"
							>
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
									<svelte:component this={icons.Settings} class="h-5 w-5 text-neutral-600" />
								</div>
								<div>
									<div class="font-medium text-neutral-900">Settings</div>
									<div class="text-sm text-neutral-600">Customize profile</div>
								</div>
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Anytime Tasks Section -->
			{#if adhocTasks.length > 0}
				<section class="mt-8">
					<div class="rounded-xl border border-neutral-200 bg-white shadow-sm">
						<div class="border-b border-neutral-100 p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
										<svelte:component this={icons.Zap} class="h-5 w-5 text-purple-600" />
									</div>
									<div>
										<h2 class="text-xl font-bold text-neutral-900">Anytime Tasks</h2>
										<p class="text-sm text-neutral-500">Quick actions you can complete anytime</p>
									</div>
								</div>
								<a
									href="/adhoc-tasks"
									class="flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
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
										class="group flex items-start gap-4 rounded-lg border border-neutral-200 p-4 text-left transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-md"
									>
										<div
											class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200"
										>
											{#if adhocTask.iconId}
												<svelte:component
													this={getIconComponent(adhocTask.iconId)}
													class="h-6 w-6 text-purple-600"
												/>
											{:else}
												<svelte:component this={icons.Target} class="h-6 w-6 text-purple-600" />
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<h3 class="font-semibold text-neutral-900 group-hover:text-purple-900">
												{adhocTask.name}
											</h3>
											{#if adhocTask.description}
												<p class="mt-1 line-clamp-2 text-sm text-neutral-600">
													{adhocTask.description}
												</p>
											{/if}
											<div class="mt-2 flex items-center gap-2">
												<span
													class="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"
												>
													{adhocTask.linkedStat.name}
												</span>
												<span class="text-xs font-medium text-purple-600">
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
										class="inline-flex items-center gap-1 text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
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
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="border-b border-neutral-200 p-6">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-semibold text-neutral-800">
						{showTaskFeedback.endsWith('_adhoc') ? 'Complete Anytime Task' : 'Task Feedback'}
					</h3>
					<button
						onclick={cancelTaskFeedback}
						class="text-neutral-400 transition-colors hover:text-neutral-600"
					>
						<svelte:component this={icons.X} class="h-6 w-6" />
					</button>
				</div>
			</div>

			<div class="space-y-4 p-6">
				<div>
					<label class="mb-2 block text-sm font-semibold text-neutral-800">
						How did it go? <span class="text-sm font-normal text-neutral-600 italic"
							>(optional)</span
						>
					</label>
					<textarea
						bind:value={taskFeedbackData.feedback}
						placeholder="Reflect on your experience..."
						class="min-h-20 w-full resize-y rounded-lg border border-neutral-300 p-3 text-sm leading-relaxed transition-colors focus:border-blue-500 focus:outline-none"
					></textarea>
				</div>

				<div>
					<label class="mb-2 block text-sm font-semibold text-neutral-800">
						Emotion Tag <span class="text-sm font-normal text-neutral-600 italic">(optional)</span>
					</label>
					<select
						bind:value={taskFeedbackData.emotionTag}
						class="w-full rounded-lg border border-neutral-300 p-3 text-sm transition-colors focus:border-blue-500 focus:outline-none"
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
					<label class="mb-2 block text-sm font-semibold text-neutral-800">
						Mood Score (1-10) <span class="text-sm font-normal text-neutral-600 italic"
							>(optional)</span
						>
					</label>
					<input
						type="range"
						min="0"
						max="10"
						bind:value={taskFeedbackData.moodScore}
						class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200"
					/>
					<div class="mt-1 flex justify-between text-xs text-neutral-600">
						<span>None</span>
						<span>Great (10)</span>
					</div>
					{#if taskFeedbackData.moodScore > 0}
						<p class="mt-2 text-center text-sm text-neutral-700">
							Score: {taskFeedbackData.moodScore}
						</p>
					{/if}
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<button
						onclick={cancelTaskFeedback}
						class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
					>
						Cancel
					</button>
					<button
						onclick={() => submitTaskFeedback(showTaskFeedback)}
						class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
					>
						{showTaskFeedback.endsWith('_adhoc') ? 'Complete & Earn XP' : 'Complete Task'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
