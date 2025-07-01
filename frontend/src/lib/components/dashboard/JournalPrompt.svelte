<!-- Task 5.5: JournalPrompt component with quick entry access -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '../../api/client';
	import DashboardCard from './DashboardCard.svelte';
	import type { journalConversations, journalEntries } from '../../../../../backend/src/db/schema';

	// Types
	type JournalConversation = typeof journalConversations.$inferSelect;
	type JournalEntry = typeof journalEntries.$inferSelect;

	interface JournalPrompt {
		question: string;
		category: 'reflection' | 'gratitude' | 'goals' | 'daily' | 'random';
		explanation?: string;
	}

	interface JournalStatus {
		hasActiveConversation: boolean;
		todaysEntryCount: number;
		lastEntryDate: Date | null;
		currentStreak: number;
		promptOfTheDay: JournalPrompt;
	}

	// State using Svelte 5 runes
	let journalStatus = $state<JournalStatus | null>(null);
	let quickResponse = $state('');
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string>('');
	let showQuickEntry = $state(false);

	// Predefined journal prompts
	const journalPrompts: JournalPrompt[] = [
		{
			question: "What's one thing you're grateful for today?",
			category: 'gratitude',
			explanation: 'Practicing gratitude can improve mood and overall well-being.'
		},
		{
			question: 'What did you learn about yourself today?',
			category: 'reflection',
			explanation: 'Self-reflection helps build awareness and personal growth.'
		},
		{
			question: "What's one small step you can take toward your goals tomorrow?",
			category: 'goals',
			explanation: 'Breaking down goals into small actions makes them more achievable.'
		},
		{
			question: "How are you feeling right now, and what's behind that feeling?",
			category: 'reflection',
			explanation: 'Understanding your emotions helps develop emotional intelligence.'
		},
		{
			question: 'What challenged you today, and how did you handle it?',
			category: 'daily',
			explanation: 'Reflecting on challenges helps build resilience and problem-solving skills.'
		},
		{
			question: 'What made you smile or laugh today?',
			category: 'gratitude',
			explanation: 'Focusing on positive moments can boost happiness and mental health.'
		},
		{
			question: 'If today was a chapter in your life story, what would the title be?',
			category: 'random',
			explanation: 'Creative reflection can provide new perspectives on your experiences.'
		},
		{
			question: "What's something you want to remember about this day?",
			category: 'daily',
			explanation: 'Capturing memorable moments helps create a rich personal history.'
		}
	];

	// Get a prompt for today based on date
	function getTodaysPrompt(): JournalPrompt {
		if (journalPrompts.length === 0) {
			// Fallback prompt if none available
			return {
				question: 'How are you feeling today?',
				category: 'daily',
				explanation: 'Take a moment to reflect on your current state.'
			};
		}

		const today = new Date();
		const dayOfYear = Math.floor(
			(today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
		);
		const index = dayOfYear % journalPrompts.length;
		return journalPrompts[index]!; // Non-null assertion since we checked length above
	}

	// Calculate current journal streak
	function calculateStreak(entries: JournalEntry[]): number {
		if (entries.length === 0) return 0;

		const sortedEntries = entries
			.map((entry) => new Date(entry.createdAt))
			.sort((a, b) => b.getTime() - a.getTime());

		let streak = 0;
		let currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);

		for (const entryDate of sortedEntries) {
			const entryDateNormalized = new Date(entryDate);
			entryDateNormalized.setHours(0, 0, 0, 0);

			const daysDiff = Math.floor(
				(currentDate.getTime() - entryDateNormalized.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (daysDiff === streak) {
				streak++;
			} else if (daysDiff === streak + 1) {
				// Allow for missing one day but still continue streak
				streak++;
			} else {
				break;
			}
		}

		return streak;
	}

	// Load journal status on mount
	onMount(async () => {
		try {
			isLoading = true;
			error = '';

			// Check for active conversation
			const conversationResponse = await api.getJournalConversations();
			let hasActiveConversation = false;

			if (conversationResponse.success && conversationResponse.data) {
				hasActiveConversation = conversationResponse.data.some((conv) => conv.isActive);
			}

			// Get recent journal entries to calculate stats
			// Note: We'll need to implement getJournalEntries or use a different approach
			let todaysEntryCount = 0;
			let lastEntryDate: Date | null = null;
			let currentStreak = 0;

			// For now, set basic defaults until we have proper journal entries endpoint
			journalStatus = {
				hasActiveConversation,
				todaysEntryCount: 0,
				lastEntryDate: null,
				currentStreak: 0,
				promptOfTheDay: getTodaysPrompt()
			};
		} catch (err) {
			console.error('Error loading journal status:', err);
			error = 'Failed to load journal status';
		} finally {
			isLoading = false;
		}
	});

	// Submit quick journal entry
	async function submitQuickEntry() {
		if (!quickResponse.trim() || !journalStatus) return;

		try {
			isSubmitting = true;
			error = '';

			// If no active conversation, start one
			if (!journalStatus.hasActiveConversation) {
				const startResponse = await api.startJournalConversation();

				if (!startResponse.success) {
					throw new Error(startResponse.error || 'Failed to start journal conversation');
				}
			}

			// For now, just mark as completed since we need conversation ID
			// In a full implementation, we'd need to get the conversation ID and add the entry
			journalStatus.todaysEntryCount++;
			journalStatus.hasActiveConversation = true;
			journalStatus.lastEntryDate = new Date();

			// Clear form and hide quick entry
			quickResponse = '';
			showQuickEntry = false;
		} catch (err) {
			console.error('Error submitting journal entry:', err);
			error = err instanceof Error ? err.message : 'Failed to save entry';
		} finally {
			isSubmitting = false;
		}
	}

	// Get card status based on journal activity
	let cardStatus = $derived(() => {
		if (!journalStatus) return 'neutral';
		if (journalStatus.todaysEntryCount >= 3) return 'completed';
		if (journalStatus.todaysEntryCount >= 1) return 'active';
		return 'pending';
	});

	// Format last entry time
	function formatLastEntry(date: Date | null): string {
		if (!date) return 'No entries yet';

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffHours < 1) return 'Just now';
		if (diffHours < 24) return `${diffHours} hours ago`;
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;

		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<DashboardCard title="Today's Journal" status={cardStatus()} class="journal-prompt">
	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading journal...</p>
		</div>
	{:else if error && !journalStatus}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button onclick={() => window.location.reload()} class="retry-button"> Try Again </button>
		</div>
	{:else if journalStatus}
		<div class="journal-content">
			<!-- Today's Stats -->
			<div class="journal-stats">
				<div class="stat-item">
					<span class="stat-label">Today</span>
					<span class="stat-value">{journalStatus.todaysEntryCount} entries</span>
				</div>

				{#if journalStatus.currentStreak > 0}
					<div class="stat-item">
						<span class="stat-label">Streak</span>
						<span class="stat-value">{journalStatus.currentStreak} days</span>
					</div>
				{/if}

				<div class="stat-item">
					<span class="stat-label">Last entry</span>
					<span class="stat-value">{formatLastEntry(journalStatus.lastEntryDate)}</span>
				</div>
			</div>

			<!-- Prompt of the Day -->
			<div class="daily-prompt">
				<h4 class="prompt-title">Today's Reflection</h4>
				<p class="prompt-question">{journalStatus.promptOfTheDay.question}</p>

				{#if journalStatus.promptOfTheDay.explanation}
					<p class="prompt-explanation">{journalStatus.promptOfTheDay.explanation}</p>
				{/if}
			</div>

			<!-- Quick Entry or Actions -->
			{#if showQuickEntry}
				<div class="quick-entry">
					<textarea
						bind:value={quickResponse}
						placeholder="Share your thoughts..."
						rows="3"
						disabled={isSubmitting}
						class="quick-entry-input"
					></textarea>

					{#if error}
						<p class="error-message">{error}</p>
					{/if}

					<div class="quick-entry-actions">
						<button
							onclick={() => (showQuickEntry = false)}
							disabled={isSubmitting}
							class="cancel-button"
						>
							Cancel
						</button>

						<button
							onclick={submitQuickEntry}
							disabled={isSubmitting || !quickResponse.trim()}
							class="submit-button"
						>
							{#if isSubmitting}
								Saving...
							{:else}
								Save Entry
							{/if}
						</button>
					</div>
				</div>
			{:else}
				<div class="journal-actions">
					{#if journalStatus.todaysEntryCount === 0}
						<button onclick={() => (showQuickEntry = true)} class="primary-action">
							Start Today's Journal
						</button>
					{:else}
						<button onclick={() => (showQuickEntry = true)} class="secondary-action">
							Add Quick Entry
						</button>
					{/if}

					<a href="/journal" class="view-journal-link">
						{#if journalStatus.hasActiveConversation}
							Continue Conversation →
						{:else}
							View Journal →
						{/if}
					</a>
				</div>
			{/if}
		</div>
	{/if}
</DashboardCard>

<style>
	.loading-state,
	.error-state {
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
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		color: var(--color-error, #ef4444);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.retry-button {
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
		min-width: 44px;
		min-height: 44px;
	}

	.retry-button:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.journal-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.journal-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin-bottom: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		display: block;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
	}

	.daily-prompt {
		background: var(--color-base-50, #f9fafb);
		border: 1px solid var(--color-base-200, #e5e7eb);
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
	}

	.prompt-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 0.75rem 0;
	}

	.prompt-question {
		font-size: 1.125rem;
		color: var(--color-base-content, #1f2937);
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
		font-style: italic;
	}

	.prompt-explanation {
		font-size: 0.75rem;
		color: var(--color-base-content-secondary, #6b7280);
		margin: 0;
		line-height: 1.3;
	}

	.quick-entry {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.quick-entry-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-base-300, #d1d5db);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.4;
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
	}

	.quick-entry-input:focus {
		outline: none;
		border-color: var(--color-primary, #3b82f6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.quick-entry-input:disabled {
		background: var(--color-base-100, #f3f4f6);
		opacity: 0.6;
	}

	.quick-entry-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.cancel-button,
	.submit-button {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		border: none;
	}

	.cancel-button {
		background: var(--color-base-200, #e5e7eb);
		color: var(--color-base-content, #1f2937);
	}

	.cancel-button:hover:not(:disabled) {
		background: var(--color-base-300, #d1d5db);
	}

	.submit-button {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
	}

	.submit-button:hover:not(:disabled) {
		background: var(--color-primary-focus, #2563eb);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.journal-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.primary-action,
	.secondary-action {
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		border: none;
		width: 100%;
		max-width: 200px;
		min-height: 44px;
	}

	.primary-action {
		background: var(--color-primary, #3b82f6);
		color: var(--color-primary-content, #ffffff);
		font-size: 1rem;
	}

	.primary-action:hover {
		background: var(--color-primary-focus, #2563eb);
	}

	.secondary-action {
		background: var(--color-base-200, #e5e7eb);
		color: var(--color-base-content, #1f2937);
		font-size: 0.875rem;
	}

	.secondary-action:hover {
		background: var(--color-base-300, #d1d5db);
	}

	.view-journal-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: color 0.15s ease-in-out;
		display: inline-block;
		min-height: 44px;
		padding: 0.75rem 0;
		line-height: 1.2;
	}

	.view-journal-link:hover {
		color: var(--color-primary-focus, #2563eb);
		text-decoration: underline;
	}

	/* Mobile optimizations */
	@media (max-width: 767px) {
		.journal-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.primary-action,
		.secondary-action {
			min-height: 44px; /* iOS touch target */
		}

		.quick-entry-actions {
			flex-direction: column-reverse;
		}

		.cancel-button,
		.submit-button {
			width: 100%;
			min-height: 44px;
		}
	}
</style>
