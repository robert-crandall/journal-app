<!-- Task 5.2: TaskSummary component showing daily task overview -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../../api/client';
	import DashboardCard from './DashboardCard.svelte';
	import type { tasks, taskCompletions } from '../../../../../backend/src/db/schema';
	
	// Types
	type Task = typeof tasks.$inferSelect;
	type TaskCompletion = typeof taskCompletions.$inferSelect;
	
	interface TaskWithCompletion extends Task {
		completion?: TaskCompletion;
		isCompleted: boolean;
	}

	// State using Svelte 5 runes
	let tasksToday = $state<TaskWithCompletion[]>([]);
	let isLoading = $state(true);
	let error = $state<string>('');
	let totalTasks = $derived(tasksToday.length);
	let completedTasks = $derived(tasksToday.filter(task => task.isCompleted).length);
	let completionPercentage = $derived(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

	// Load tasks on mount
	onMount(async () => {
		try {
			isLoading = true;
			error = '';
			
			const response = await api.getTasks();
			
			if (response.success && response.data) {
				// Filter for today's tasks and add completion status
				const today = new Date().toISOString().split('T')[0];
				tasksToday = response.data
					.filter(task => {
						// Check if task is due today or overdue
						if (!task.dueDate) return false;
						const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
						return taskDate === today;
					})
					.map(task => ({
						...task,
						isCompleted: task.status === 'completed'
					}));
			} else {
				error = response.error || 'Failed to load tasks';
			}
		} catch (err) {
			console.error('Error loading tasks:', err);
			error = 'Failed to load tasks';
		} finally {
			isLoading = false;
		}
	});

	// Task completion handler
	async function completeTask(taskId: string) {
		try {
			const response = await api.completeTask(taskId);
			
			if (response.success) {
				// Update local state optimistically
				tasksToday = tasksToday.map(task => 
					task.id === taskId 
						? { ...task, isCompleted: true, status: 'completed' }
						: task
				);
			} else {
				error = response.error || 'Failed to complete task';
			}
		} catch (err) {
			console.error('Error completing task:', err);
			error = 'Failed to complete task';
		}
	}

	// Get status for card based on completion
	let cardStatus = $derived(() => {
		if (totalTasks === 0) return 'neutral';
		if (completedTasks === totalTasks) return 'completed';
		if (completedTasks > 0) return 'active';
		return 'pending';
	});
</script>

<DashboardCard title="Today's Challenges" status={cardStatus()} class="task-summary">
	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading today's tasks...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button onclick={() => window.location.reload()} class="retry-button">
				Try Again
			</button>
		</div>
	{:else if totalTasks === 0}
		<div class="empty-state">
			<p>No tasks scheduled for today.</p>
			<p class="empty-subtitle">Enjoy your free day! 🎉</p>
		</div>
	{:else}
		<div class="task-summary-content">
			<!-- Progress Overview -->
			<div class="progress-overview">
				<div class="progress-stats">
					<span class="stat-number">{completedTasks}</span>
					<span class="stat-separator">/</span>
					<span class="stat-total">{totalTasks}</span>
					<span class="stat-label">completed</span>
				</div>
				
				<!-- Progress Bar -->
				<div class="progress-bar">
					<div 
						class="progress-fill" 
						style="width: {completionPercentage}%"
					></div>
				</div>
				
				<div class="progress-percentage">{completionPercentage}%</div>
			</div>

			<!-- Task List -->
			{#if tasksToday.length > 0}
				<div class="task-list">
					{#each tasksToday.slice(0, 3) as task (task.id)}
						<div class="task-item" class:completed={task.isCompleted}>
							<div class="task-content">
								<h4 class="task-title">{task.title}</h4>
								{#if task.description}
									<p class="task-description">{task.description}</p>
								{/if}
								{#if task.estimatedXp}
									<span class="xp-reward">+{task.estimatedXp} XP</span>
								{/if}
							</div>
							
							{#if !task.isCompleted}
								<button 
									class="complete-button"
									onclick={() => completeTask(task.id)}
									aria-label="Complete {task.title}"
								>
									Complete
								</button>
							{:else}
								<div class="completed-badge">✓</div>
							{/if}
						</div>
					{/each}
					
					{#if tasksToday.length > 3}
						<div class="more-tasks">
							<a href="/tasks" class="view-all-link">
								View all {tasksToday.length} tasks →
							</a>
						</div>
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

	.retry-button {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.15s ease-in-out;
	}

	.retry-button:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.empty-subtitle {
		color: var(--color-base-content-secondary, #6b7280);
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.task-summary-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.progress-overview {
		margin-bottom: 1.5rem;
	}

	.progress-stats {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
		font-weight: 600;
	}

	.stat-number {
		font-size: 2rem;
		color: var(--color-primary, #3b82f6);
	}

	.stat-separator {
		font-size: 1.5rem;
		color: var(--color-base-content-secondary, #6b7280);
	}

	.stat-total {
		font-size: 1.5rem;
		color: var(--color-base-content, #1f2937);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin-left: 0.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 0.5rem;
		background: var(--color-base-200, #e5e7eb);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary, #3b82f6), var(--color-success, #10b981));
		border-radius: 9999px;
		transition: width 0.3s ease-in-out;
	}

	.progress-percentage {
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-base-content, #1f2937);
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: var(--color-base-50, #f9fafb);
		border: 1px solid var(--color-base-200, #e5e7eb);
		border-radius: 0.5rem;
		transition: all 0.15s ease-in-out;
	}

	.task-item:hover {
		background: var(--color-base-100, #f3f4f6);
	}

	.task-item.completed {
		opacity: 0.7;
		background: var(--color-success-content, #f0fdf4);
		border-color: var(--color-success, #10b981);
	}

	.task-content {
		flex: 1;
		min-width: 0;
	}

	.task-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}

	.task-description {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}

	.xp-reward {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-warning, #f59e0b);
		background: var(--color-warning-content, #fffbeb);
		border: 1px solid var(--color-warning, #f59e0b);
		border-radius: 9999px;
		padding: 0.125rem 0.5rem;
	}

	.complete-button {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		border: none;
		border-radius: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s ease-in-out;
		min-width: 44px; /* iOS touch target */
		min-height: 32px;
	}

	.complete-button:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.completed-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: var(--color-success, #10b981);
		color: var(--color-success-content, #ffffff);
		border-radius: 50%;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.more-tasks {
		text-align: center;
		padding: 0.75rem 0;
	}

	.view-all-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: color 0.15s ease-in-out;
	}

	.view-all-link:hover {
		color: var(--color-primary-focus, #2563eb);
		text-decoration: underline;
	}

	/* Mobile optimizations */
	@media (max-width: 767px) {
		.task-item {
			padding: 0.75rem;
		}

		.complete-button {
			padding: 0.5rem;
			min-width: 44px;
			min-height: 44px;
		}
	}
</style>
