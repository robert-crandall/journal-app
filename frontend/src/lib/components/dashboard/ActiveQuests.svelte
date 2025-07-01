<!-- Task 5.4: ActiveQuests component with progress indicators -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../../api/client';
	import DashboardCard from './DashboardCard.svelte';
	import type { quests, tasks } from '../../../../../backend/src/db/schema';
	
	// Types
	type Quest = typeof quests.$inferSelect;
	type Task = typeof tasks.$inferSelect;
	
	interface QuestWithProgress extends Quest {
		completedTasks: number;
		totalTasks: number;
		progressPercentage: number;
		nextTask?: Task | null;
		isCompleted: boolean;
		statusText: string;
		urgencyLevel: 'low' | 'medium' | 'high';
	}

	// State using Svelte 5 runes
	let activeQuests = $state<QuestWithProgress[]>([]);
	let isLoading = $state(true);
	let error = $state<string>('');
	let focusedQuest = $state<QuestWithProgress | null>(null);

	// Calculate quest urgency based on end date and progress
	function calculateUrgency(quest: Quest, progressPercentage: number): 'low' | 'medium' | 'high' {
		if (!quest.endDate) return 'low';
		
		const now = new Date();
		const endDate = new Date(quest.endDate);
		const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
		
		// High urgency: less than 3 days and less than 75% complete
		if (daysUntilEnd <= 3 && progressPercentage < 75) return 'high';
		
		// Medium urgency: less than 7 days and less than 50% complete
		if (daysUntilEnd <= 7 && progressPercentage < 50) return 'medium';
		
		return 'low';
	}

	// Get status text based on quest state
	function getStatusText(quest: QuestWithProgress): string {
		if (quest.isCompleted) return 'Quest Complete!';
		if (quest.completedTasks === 0) return 'Ready to start';
		if (quest.progressPercentage >= 75) return 'Almost finished!';
		if (quest.progressPercentage >= 50) return 'Making good progress';
		return 'Just getting started';
	}

	// Load active quests on mount
	onMount(async () => {
		try {
			isLoading = true;
			error = '';
			
			// Get active quests
			const questsResponse = await api.getQuests();
			
			if (questsResponse.success && questsResponse.data) {
				// Filter for active quests and enhance with progress data
				const activeQuestData = await Promise.all(
					questsResponse.data
						.filter(quest => quest.status === 'active')
						.map(async (quest) => {
							try {
								// Get tasks for this quest
								const tasksResponse = await api.getTasks();
								let questTasks: Task[] = [];
								
								if (tasksResponse.success && tasksResponse.data) {
									questTasks = tasksResponse.data.filter(task => 
										task.sourceId === quest.id && task.source === 'quest'
									);
								}
								
								const totalTasks = questTasks.length;
								const completedTasks = questTasks.filter(task => 
									task.status === 'completed'
								).length;
								
								const progressPercentage = totalTasks > 0 
									? Math.round((completedTasks / totalTasks) * 100) 
									: 0;
								
								const nextTask = questTasks.find(task => 
									task.status === 'pending'
								) || null;
								
								const isCompleted = quest.status === 'completed' || 
									(totalTasks > 0 && completedTasks === totalTasks);
								
								const urgencyLevel = calculateUrgency(quest, progressPercentage);
								
								const questWithProgress: QuestWithProgress = {
									...quest,
									completedTasks,
									totalTasks,
									progressPercentage,
									nextTask,
									isCompleted,
									statusText: '',
									urgencyLevel
								};
								
								questWithProgress.statusText = getStatusText(questWithProgress);
								
								return questWithProgress;
							} catch (err) {
								console.error(`Error processing quest ${quest.id}:`, err);
								return null;
							}
						})
				);
				
				// Filter out failed quest processing and sort by urgency and progress
				activeQuests = activeQuestData
					.filter((quest): quest is QuestWithProgress => quest !== null)
					.sort((a, b) => {
						// Sort by urgency first (high -> medium -> low)
						const urgencyOrder = { high: 3, medium: 2, low: 1 };
						const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
						if (urgencyDiff !== 0) return urgencyDiff;
						
						// Then by progress (less complete first to encourage finishing)
						return a.progressPercentage - b.progressPercentage;
					});
				
				// Set the first quest as focused
				focusedQuest = activeQuests[0] || null;
			} else {
				error = questsResponse.error || 'No quests found';
			}
		} catch (err) {
			console.error('Error loading active quests:', err);
			error = 'Failed to load quests';
		} finally {
			isLoading = false;
		}
	});

	// Get card status based on quest urgency and progress
	let cardStatus = $derived(() => {
		if (!focusedQuest) return 'neutral';
		if (focusedQuest.isCompleted) return 'completed';
		if (focusedQuest.urgencyLevel === 'high') return 'error';
		if (focusedQuest.urgencyLevel === 'medium') return 'warning';
		return 'active';
	});

	// Format end date for display
	function formatEndDate(endDate: string | Date | null): string {
		if (!endDate) return '';
		
		const date = new Date(endDate);
		const now = new Date();
		const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		
		if (daysUntil < 0) return 'Overdue!';
		if (daysUntil === 0) return 'Due today';
		if (daysUntil === 1) return 'Due tomorrow';
		if (daysUntil <= 7) return `Due in ${daysUntil} days`;
		
		return date.toLocaleDateString(undefined, { 
			month: 'short', 
			day: 'numeric' 
		});
	}
</script>

<DashboardCard title="Active Quest" status={cardStatus()} class="active-quests">
	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading active quests...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button onclick={() => window.location.reload()} class="retry-button">
				Try Again
			</button>
		</div>
	{:else if activeQuests.length === 0}
		<div class="empty-state">
			<p>No active quests yet.</p>
			<a href="/quests" class="create-link">Start a quest →</a>
		</div>
	{:else}
		<div class="active-quests-content">
			{#if focusedQuest}
				<!-- Focused Quest Display -->
				<div class="focused-quest">
					<div class="quest-header">
						<h3 class="quest-title">{focusedQuest.title}</h3>
						{#if focusedQuest.endDate}
							<div class="quest-deadline" class:urgent={focusedQuest.urgencyLevel === 'high'}>
								{formatEndDate(focusedQuest.endDate)}
							</div>
						{/if}
					</div>
					
					{#if focusedQuest.description}
						<p class="quest-description">{focusedQuest.description}</p>
					{/if}
					
					<!-- Progress Display -->
					<div class="quest-progress">
						<div class="progress-header">
							<span class="progress-label">Progress</span>
							<span class="progress-stats">
								{focusedQuest.completedTasks} / {focusedQuest.totalTasks} tasks
							</span>
						</div>
						
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								class:high-urgency={focusedQuest.urgencyLevel === 'high'}
								class:medium-urgency={focusedQuest.urgencyLevel === 'medium'}
								style="width: {focusedQuest.progressPercentage}%"
							></div>
						</div>
						
						<p class="status-text">{focusedQuest.statusText}</p>
					</div>
					
					<!-- Next Task -->
					{#if focusedQuest.nextTask && !focusedQuest.isCompleted}
						<div class="next-task">
							<h4 class="next-task-title">Next up:</h4>
							<p class="next-task-description">{focusedQuest.nextTask.title}</p>
							
							<a href="/tasks/{focusedQuest.nextTask.id}" class="start-task-button">
								Start Task →
							</a>
						</div>
					{:else if focusedQuest.isCompleted}
						<div class="quest-completed">
							<p class="completion-message">🎉 Quest completed! Great work!</p>
							<a href="/quests/{focusedQuest.id}" class="view-rewards-link">
								View Rewards →
							</a>
						</div>
					{/if}
					
					<a href="/quests/{focusedQuest.id}" class="view-quest-link">
						View Full Quest →
					</a>
				</div>
			{/if}

			<!-- All Active Quests (if more than one) -->
			{#if activeQuests.length > 1}
				<div class="all-quests">
					<h4 class="all-quests-title">Other Active Quests</h4>
					<div class="quests-list">
						{#each activeQuests.slice(1, 4) as quest (quest.id)}
							<button 
								class="quest-item" 
								class:urgent={quest.urgencyLevel === 'high'}
								onclick={() => focusedQuest = quest}
							>
								<div class="quest-item-header">
									<span class="quest-item-title">{quest.title}</span>
									{#if quest.endDate}
										<span class="quest-item-deadline">{formatEndDate(quest.endDate)}</span>
									{/if}
								</div>
								
								<div class="quest-item-progress">
									<div class="mini-progress-bar">
										<div 
											class="mini-progress-fill" 
											style="width: {quest.progressPercentage}%"
										></div>
									</div>
									<span class="quest-item-stats">
										{quest.completedTasks}/{quest.totalTasks}
									</span>
								</div>
							</button>
						{/each}
					</div>
					
					{#if activeQuests.length > 4}
						<a href="/quests" class="view-all-quests-link">
							View All ({activeQuests.length - 3} more) →
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</DashboardCard>

<style>
	.loading-state,
	.error-state,
	.empty-state {
		text-align: center;
		padding: 2rem 0;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--color-base-300, #d1d5db);
		border-top: 2px solid var(--color-primary, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-message {
		color: var(--color-error, #ef4444);
		margin-bottom: 1rem;
	}

	.retry-button,
	.create-link {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: 500;
		text-decoration: none;
		display: inline-block;
		transition: background-color 0.15s ease-in-out;
	}

	.retry-button:hover,
	.create-link:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.active-quests-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.focused-quest {
		text-align: center;
	}

	.quest-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		gap: 1rem;
	}

	.quest-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0;
		text-align: left;
		flex: 1;
	}

	.quest-deadline {
		background: var(--color-base-200, #e5e7eb);
		color: var(--color-base-content, #1f2937);
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		white-space: nowrap;
	}

	.quest-deadline.urgent {
		background: var(--color-error, #ef4444);
		color: var(--color-error-content, #ffffff);
	}

	.quest-description {
		color: var(--color-base-content-secondary, #6b7280);
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		text-align: left;
		line-height: 1.4;
	}

	.quest-progress {
		margin-bottom: 1.5rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.progress-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-base-content, #1f2937);
	}

	.progress-stats {
		font-size: 0.875rem;
		color: var(--color-base-content-secondary, #6b7280);
	}

	.progress-bar {
		width: 100%;
		height: 0.75rem;
		background: var(--color-base-200, #e5e7eb);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary, #3b82f6);
		border-radius: 9999px;
		transition: width 0.3s ease-in-out;
	}

	.progress-fill.high-urgency {
		background: var(--color-error, #ef4444);
	}

	.progress-fill.medium-urgency {
		background: var(--color-warning, #f59e0b);
	}

	.status-text {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin: 0;
		font-style: italic;
	}

	.next-task {
		background: var(--color-base-50, #f9fafb);
		border: 1px solid var(--color-base-200, #e5e7eb);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
		text-align: left;
	}

	.next-task-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 0.5rem 0;
	}

	.next-task-description {
		font-size: 0.875rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.start-task-button {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		display: inline-block;
		cursor: pointer;
		transition: background-color 0.15s ease-in-out;
	}

	.start-task-button:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.quest-completed {
		background: var(--color-success-content, #dcfce7);
		border: 1px solid var(--color-success, #22c55e);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.completion-message {
		font-size: 0.875rem;
		color: var(--color-success, #22c55e);
		font-weight: 500;
		margin: 0 0 0.75rem 0;
	}

	.view-rewards-link,
	.view-quest-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: color 0.15s ease-in-out;
	}

	.view-rewards-link:hover,
	.view-quest-link:hover {
		color: var(--color-primary-focus, #2563eb);
		text-decoration: underline;
	}

	.all-quests-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 0.75rem 0;
		text-align: left;
	}

	.quests-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.quest-item {
		background: var(--color-base-50, #f9fafb);
		border: 1px solid var(--color-base-200, #e5e7eb);
		border-radius: 0.5rem;
		padding: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		width: 100%;
	}

	.quest-item:hover {
		background: var(--color-base-100, #f3f4f6);
		border-color: var(--color-primary, #3b82f6);
	}

	.quest-item.urgent {
		border-color: var(--color-error, #ef4444);
		background: var(--color-error-content, #fef2f2);
	}

	.quest-item-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.quest-item-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-base-content, #1f2937);
		flex: 1;
	}

	.quest-item-deadline {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		white-space: nowrap;
	}

	.quest-item-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mini-progress-bar {
		flex: 1;
		height: 0.25rem;
		background: var(--color-base-200, #e5e7eb);
		border-radius: 9999px;
		overflow: hidden;
	}

	.mini-progress-fill {
		height: 100%;
		background: var(--color-primary, #3b82f6);
		border-radius: 9999px;
		transition: width 0.3s ease-in-out;
	}

	.quest-item-stats {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		white-space: nowrap;
	}

	.view-all-quests-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		text-align: center;
		display: block;
		transition: color 0.15s ease-in-out;
	}

	.view-all-quests-link:hover {
		color: var(--color-primary-focus, #2563eb);
		text-decoration: underline;
	}

	/* Mobile optimizations */
	@media (max-width: 767px) {
		.quest-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.quest-item {
			min-height: 44px; /* iOS touch target */
		}

		.quest-item-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
