<script lang="ts">
	import TaskCard from '$lib/components/TaskCard.svelte';
	import XPProgress from '$lib/components/XPProgress.svelte';
	import { showXPNotification } from '$lib/stores/notifications';
	import { PlusCircle, BookOpen, Target, Sword, Users } from 'lucide-svelte';

	// Mock data - this will be replaced with real API calls
	let todaysTasks = [
		{
			id: '1',
			title: 'Take a 30-minute nature walk in a new trail',
			description: 'Explore the hiking trail behind the community center and take photos of interesting plants or wildlife.',
			type: 'ai' as const,
			status: 'pending' as 'pending' | 'completed' | 'overdue',
			xpReward: 75,
			targetStats: ['Adventure', 'Physical Health'],
			deadline: null
		},
		{
			id: '2',
			title: 'Play board game with youngest son',
			description: 'Choose a strategy game that will challenge him and create some quality bonding time.',
			type: 'ai' as const,
			status: 'pending' as 'pending' | 'completed' | 'overdue',
			xpReward: 60,
			targetStats: ['Family Time', 'Social'],
			deadline: null
		},
		{
			id: '3',
			title: 'Review weekly quest progress',
			description: 'Check in on the "Outdoor Skills Mastery" quest and plan next steps.',
			type: 'quest' as const,
			status: 'pending' as 'pending' | 'completed' | 'overdue',
			xpReward: 25,
			targetStats: ['Adventure'],
			deadline: '2 days remaining'
		}
	];

	const activeExperiment = {
		title: '30-Day Morning Routine',
		description: 'Establishing a consistent morning routine with meditation, journaling, and exercise.',
		progress: 18,
		totalDays: 30,
		status: 'active' as const
	};

	const activeQuest = {
		title: 'Outdoor Skills Mastery',
		description: 'Develop confidence in outdoor activities through hiking, camping, and navigation skills.',
		progress: 65,
		deadline: '15 days remaining'
	};

	const characterStats = [
		{
			name: 'Physical Health',
			currentLevel: 3,
			currentXP: 268,
			xpForNextLevel: 300,
			totalXP: 868,
			levelTitle: 'Steady Strength',
			color: 'success' as const
		},
		{
			name: 'Adventure',
			currentLevel: 2,
			currentXP: 150,
			xpForNextLevel: 200,
			totalXP: 350,
			levelTitle: 'Trail Seeker',
			color: 'warning' as const
		},
		{
			name: 'Family Time',
			currentLevel: 4,
			currentXP: 89,
			xpForNextLevel: 400,
			totalXP: 1289,
			levelTitle: 'Family Champion',
			color: 'primary' as const
		}
	];

	function handleTaskComplete(taskId: string) {
		// Mock task completion - in real app this would call API
		const task = todaysTasks.find(t => t.id === taskId);
		if (task) {
			task.status = 'completed';
			showXPNotification(task.targetStats[0], task.xpReward || 0);
		}
	}

	function handleStartJournal() {
		// Navigate to journal - for now just show notification
		showXPNotification('Mental Health', 10);
	}
</script>

<svelte:head>
	<title>D&D Life - Dashboard</title>
	<meta name="description" content="Your personal gamification dashboard" />
</svelte:head>	<div class="space-y-8">
		<!-- Page header -->
		<div class="text-center">
			<h1 class="text-3xl font-bold mb-2" style="color: rgb(var(--color-text-primary))">Your Adventure Dashboard</h1>
			<p style="color: rgb(var(--color-text-secondary))">Today's progress at a glance</p>
		</div>

		<!-- Main content grid - mobile stacks, desktop 2-column -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Left column -->
		<div class="space-y-6">
			<!-- Today's Tasks -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold flex items-center gap-2" style="color: rgb(var(--color-text-primary))">
						<Target class="h-5 w-5" />
						Today's Tasks
					</h2>
					<span class="text-sm" style="color: rgb(var(--color-text-tertiary))">
						{todaysTasks.filter(t => t.status === 'completed').length} / {todaysTasks.length} completed
					</span>
				</div>
				<div class="space-y-4">
					{#each todaysTasks as task}
						<TaskCard
							title={task.title}
							description={task.description}
							type={task.type}
							status={task.status}
							xpReward={task.xpReward}
							targetStats={task.targetStats}
							deadline={task.deadline}
							onComplete={() => handleTaskComplete(task.id)}
						/>
					{/each}
				</div>
			</section>

			<!-- Active Quest -->
			<section>
				<h2 class="text-xl font-semibold mb-4 flex items-center gap-2" style="color: rgb(var(--color-text-primary))">
					<Sword class="h-5 w-5" />
					Active Quest
				</h2>
				<div class="card card-warning">
					<div class="mb-3">
						<h3 class="text-lg font-semibold mb-1" style="color: rgb(var(--color-text-primary))">
							{activeQuest.title}
						</h3>
						<p class="text-sm mb-3" style="color: rgb(var(--color-text-secondary))">
							{activeQuest.description}
						</p>
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm" style="color: rgb(var(--color-text-tertiary))">Progress</span>
							<span class="text-sm" style="color: rgb(var(--color-text-tertiary))">{activeQuest.progress}%</span>
						</div>
						<div class="xp-progress h-2">
							<div
								class="xp-progress-bar"
								style="width: {activeQuest.progress}%; background-color: rgb(var(--color-warning-500))"
							></div>
						</div>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-xs" style="color: rgb(var(--color-text-tertiary))">{activeQuest.deadline}</span>
						<button class="btn btn-secondary text-sm px-3 py-1">
							View Details
						</button>
					</div>
				</div>
			</section>

			<!-- Running Experiment -->
			<section>
				<h2 class="text-xl font-semibold mb-4 flex items-center gap-2" style="color: rgb(var(--color-text-primary))">
					<Users class="h-5 w-5" />
					Running Experiment
				</h2>
				<div class="card card-info">
					<div class="mb-3">
						<h3 class="text-lg font-semibold mb-1" style="color: rgb(var(--color-text-primary))">
							{activeExperiment.title}
						</h3>
						<p class="text-sm mb-3" style="color: rgb(var(--color-text-secondary))">
							{activeExperiment.description}
						</p>
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm" style="color: rgb(var(--color-text-tertiary))">Day {activeExperiment.progress} of {activeExperiment.totalDays}</span>
							<span class="text-sm" style="color: rgb(var(--color-text-tertiary))">{Math.round((activeExperiment.progress / activeExperiment.totalDays) * 100)}%</span>
						</div>
						<div class="xp-progress h-2">
							<div
								class="xp-progress-bar"
								style="width: {(activeExperiment.progress / activeExperiment.totalDays) * 100}%; background-color: rgb(var(--color-info-500))"
							></div>
						</div>
					</div>
				</div>
			</section>
		</div>

		<!-- Right column -->
		<div class="space-y-6">
			<!-- Journal Entry -->
			<section>
				<h2 class="text-xl font-semibold mb-4 flex items-center gap-2" style="color: rgb(var(--color-text-primary))">
					<BookOpen class="h-5 w-5" />
					Today's Journal
				</h2>
				<div class="card">
					<div class="text-center py-8">
						<BookOpen class="h-12 w-12 mx-auto mb-4" style="color: rgb(var(--color-text-tertiary))" />
						<h3 class="text-lg font-medium mb-2" style="color: rgb(var(--color-text-primary))">
							How was your day?
						</h3>
						<p class="text-sm mb-6" style="color: rgb(var(--color-text-secondary))">
							Reflect on today's adventures and progress
						</p>
						<button 
							onclick={handleStartJournal}
							class="btn btn-primary touch-target"
						>
							<PlusCircle class="h-4 w-4 mr-2" />
							Start Journal Entry
						</button>
					</div>
				</div>
			</section>

			<!-- Character Stats -->
			<section>
				<h2 class="text-xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
					Your Character Stats
				</h2>
				<div class="space-y-4">
					{#each characterStats as stat}
						<XPProgress
							statName={stat.name}
							currentLevel={stat.currentLevel}
							currentXP={stat.currentXP}
							xpForNextLevel={stat.xpForNextLevel}
							totalXP={stat.totalXP}
							levelTitle={stat.levelTitle}
							color={stat.color}
							size="sm"
						/>
					{/each}
				</div>
				<div class="mt-4">
					<button class="btn btn-secondary w-full touch-target">
						View All Stats
					</button>
				</div>
			</section>
		</div>
	</div>
</div>
