<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { journalsApi } from '$lib/api';
	import { User, Bot, Send, CheckCircle, Loader2, Sparkles } from 'lucide-svelte';

	export let journalId: string | null = null;
	export let existingJournal: any = null;

	const dispatch = createEventDispatcher();

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		timestamp: string;
	}

	let messages: Message[] = [];
	let currentInput = '';
	let isLoading = false;
	let journalStatus: 'new' | 'in_progress' | 'completed' | 'day_completion' | 'fully_completed' =
		'new';
	let currentJournalId: string | null = journalId;
	let followupCount = 0;
	let maxFollowups = 3;
	let canSubmit = false;

	// Day completion fields
	let dayMemory = '';
	let dayRating: number | null = null;

	// Initialize with existing journal if provided
	if (existingJournal) {
		currentJournalId = existingJournal.id;
		journalStatus = existingJournal.status || 'new';
		messages = existingJournal.conversationHistory || [];
		followupCount = existingJournal.followupCount || 0;
		maxFollowups = existingJournal.maxFollowups || 3;
		canSubmit = journalStatus === 'in_progress' && messages.length > 0;

		// Initialize day completion data if it exists
		dayMemory = existingJournal.dayMemory || '';
		dayRating = existingJournal.dayRating || null;

		// If journal is completed and has day completion data, set status to fully_completed
		if (journalStatus === 'completed' && (existingJournal.dayMemory || existingJournal.dayRating)) {
			journalStatus = 'fully_completed';
		}
	}

	async function startJournal() {
		if (!currentInput.trim()) return;

		isLoading = true;
		try {
			const response = await journalsApi.start({
				content: currentInput,
				date: new Date().toISOString().split('T')[0]
			});

			currentJournalId = response.journal.id;
			journalStatus = 'in_progress';

			// Add the user message to our local state
			messages = [
				...messages,
				{
					role: 'user',
					content: currentInput,
					timestamp: new Date().toISOString()
				}
			];

			currentInput = '';
			canSubmit = true;

			// Automatically get the first follow-up question
			await getFollowupQuestion();
		} catch (error) {
			console.error('Failed to start journal:', error);
			alert('Failed to start journal. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	async function getFollowupQuestion() {
		if (!currentJournalId || followupCount >= maxFollowups) return;

		isLoading = true;
		try {
			const response = await journalsApi.getFollowup(currentJournalId);

			// Add GPT's question to messages
			messages = [
				...messages,
				{
					role: 'assistant',
					content: response.question,
					timestamp: new Date().toISOString()
				}
			];
		} catch (error) {
			console.error('Failed to get follow-up question:', error);
			// Don't show alert for follow-up failures, just continue
		} finally {
			isLoading = false;
		}
	}

	async function sendFollowupResponse() {
		if (!currentInput.trim() || !currentJournalId) return;

		isLoading = true;
		try {
			// Add user's response to local state immediately
			messages = [
				...messages,
				{
					role: 'user',
					content: currentInput,
					timestamp: new Date().toISOString()
				}
			];

			// Send to backend
			await journalsApi.addFollowupResponse(currentJournalId, currentInput);

			followupCount++;
			currentInput = '';

			// Get next follow-up question if we haven't reached the limit
			if (followupCount < maxFollowups) {
				await getFollowupQuestion();
			}
		} catch (error) {
			console.error('Failed to send follow-up response:', error);
			// Remove the message we added optimistically
			messages = messages.slice(0, -1);
			alert('Failed to send response. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	async function submitJournal() {
		if (!currentJournalId) return;

		isLoading = true;
		try {
			const response = await journalsApi.submit(currentJournalId);

			journalStatus = 'day_completion';

			// Add the summary as an assistant message
			if (response.summary) {
				messages = [
					...messages,
					{
						role: 'assistant',
						content: `**Journal Summary:**\n\n${response.summary}`,
						timestamp: new Date().toISOString()
					}
				];
			}
		} catch (error) {
			console.error('Failed to submit journal:', error);
			alert('Failed to submit journal. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	async function completeDayReflection() {
		if (!currentJournalId) return;

		isLoading = true;
		try {
			const response = await journalsApi.completeDay(currentJournalId, {
				dayMemory: dayMemory.trim() || undefined,
				dayRating: dayRating || undefined
			});

			journalStatus = 'fully_completed';

			// Dispatch final completion event to parent component
			dispatch('journalCompleted', {
				journal: response.journal,
				dayMemory: dayMemory.trim() || null,
				dayRating: dayRating
			});
		} catch (error) {
			console.error('Failed to complete day reflection:', error);
			alert('Failed to save day reflection. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (journalStatus === 'new') {
				startJournal();
			} else if (journalStatus === 'in_progress') {
				sendFollowupResponse();
			}
		}
	}

	function formatTimestamp(timestamp: string) {
		return new Date(timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="flex h-full flex-col">
	<!-- Chat Header -->
	<div class="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-primary/10 p-2">
					<Bot class="h-5 w-5 text-info" />
				</div>
				<h2 class="text-xl font-semibold text-base-content">AI Journal Session</h2>
			</div>
			<div class="flex items-center gap-2">
				{#if journalStatus === 'fully_completed'}
					<div
						class="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success"
					>
						<CheckCircle class="h-4 w-4" />
						Completed
					</div>
				{:else if journalStatus === 'day_completion'}
					<div
						class="inline-flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning"
					>
						<Bot class="h-4 w-4" />
						Day Reflection
					</div>
				{:else if journalStatus === 'in_progress'}
					<div
						class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
					>
						<div class="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
						In Progress ({followupCount}/{maxFollowups} follow-ups)
					</div>
				{:else}
					<div
						class="inline-flex items-center gap-1 rounded-full bg-base-200 px-3 py-1 text-sm font-medium text-base-content/70"
					>
						<Bot class="h-4 w-4" />
						New Session
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chat Messages -->
	<div class="flex-1 space-y-6 overflow-y-auto bg-base-100 p-6">
		{#if messages.length === 0 && journalStatus === 'new'}
			<div class="py-12 text-center">
				<div
					class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
				>
					<Bot class="h-10 w-10 text-info" />
				</div>
				<h3 class="mb-3 text-2xl font-bold text-base-content">Start Your Journal Session</h3>
				<p class="mx-auto max-w-md leading-relaxed text-base-content/70">
					Share what's on your mind, and I'll help you explore your thoughts with thoughtful
					questions and insights.
				</p>
			</div>
		{/if}

		{#each messages as message (message.timestamp)}
			<div class="flex gap-4 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
				<!-- Avatar -->
				<div class="flex-shrink-0">
					<div
						class="h-10 w-10 rounded-full {message.role === 'user'
							? 'bg-secondary/10'
							: 'bg-primary/10'} flex items-center justify-center"
					>
						{#if message.role === 'user'}
							<User class="h-5 w-5 text-secondary" />
						{:else}
							<Bot class="h-5 w-5 text-info" />
						{/if}
					</div>
				</div>

				<!-- Message Content -->
				<div class="max-w-3xl flex-1">
					<div
						class="mb-2 flex items-center gap-2 {message.role === 'user'
							? 'justify-end'
							: 'justify-start'}"
					>
						<span class="text-sm font-medium text-base-content">
							{message.role === 'user' ? 'You' : 'AI Assistant'}
						</span>
						<time class="text-xs text-base-content/60">
							{formatTimestamp(message.timestamp)}
						</time>
					</div>
					<div
						class="rounded-lg p-4 {message.role === 'user'
							? 'ml-8 bg-secondary text-primary-content'
							: 'mr-8 bg-base-200 text-base-content'} shadow-sm"
					>
						{#if message.content.includes('**Journal Summary:**')}
							<div class="prose max-w-none {message.role === 'user' ? 'prose-invert' : ''}">
								{@html message.content
									.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
									.replace(/\n/g, '<br>')}
							</div>
						{:else}
							<div class="leading-relaxed whitespace-pre-wrap">
								{message.content}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex gap-4">
				<!-- Avatar -->
				<div class="flex-shrink-0">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						<Loader2 class="h-5 w-5 animate-spin text-info" />
					</div>
				</div>

				<!-- Message Content -->
				<div class="max-w-3xl flex-1">
					<div class="mb-2 flex items-center gap-2">
						<span class="text-sm font-medium text-base-content">AI Assistant</span>
					</div>
					<div class="mr-8 rounded-lg bg-base-200 p-4 text-base-content shadow-sm">
						<div class="flex items-center gap-3">
							<div class="flex gap-1">
								<div class="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
								<div
									class="h-2 w-2 animate-bounce rounded-full bg-primary"
									style="animation-delay: 0.1s"
								></div>
								<div
									class="h-2 w-2 animate-bounce rounded-full bg-primary"
									style="animation-delay: 0.2s"
								></div>
							</div>
							<span class="text-base-content/70">Thinking...</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	{#if journalStatus === 'day_completion'}
		<div class="border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
			<div class="mx-auto max-w-3xl space-y-6">
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10"
					>
						<Sparkles class="h-8 w-8 text-warning" />
					</div>
					<h3 class="mb-2 text-xl font-semibold text-base-content">Day Reflection</h3>
					<p class="text-base-content/70">
						Before we finish, let's capture a few more details about your day.
					</p>
				</div>

				<div class="space-y-6">
					<!-- Day Memory -->
					<div class="space-y-3">
						<label for="day-memory" class="block text-sm font-medium text-base-content">
							Is there anything you want to remember from today?
							<span class="ml-1 font-normal text-base-content/60">(Optional)</span>
						</label>
						<textarea
							id="day-memory"
							bind:value={dayMemory}
							placeholder="Something special, a moment of gratitude, or just something you don't want to forget..."
							class="w-full resize-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
							rows="4"
							disabled={isLoading}
						></textarea>
						<p class="text-xs text-base-content/60">
							This won't be analyzed or used for tagging - it's just for you.
						</p>
					</div>

					<!-- Day Rating -->
					<div class="space-y-3">
						<label class="block text-sm font-medium text-base-content">
							How would you rate your day overall? (1-5)
							<span class="ml-1 font-normal text-base-content/60">(Optional)</span>
						</label>
						<div class="flex items-center gap-3">
							{#each [1, 2, 3, 4, 5] as rating}
								<button
									onclick={() => (dayRating = rating)}
									class="h-12 w-12 rounded-lg border-2 font-semibold transition-all duration-200 {dayRating ===
									rating
										? 'scale-105 border-amber-500 bg-warning text-primary-content shadow-lg'
										: 'border-base-300 bg-base-100 text-base-content/80 hover:border-amber-300 hover:bg-warning/10'}"
									disabled={isLoading}
									aria-label="Rate day as {rating}"
								>
									{rating}
								</button>
							{/each}
							{#if dayRating !== null}
								<button
									onclick={() => (dayRating = null)}
									class="rounded-lg px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content"
									disabled={isLoading}
									aria-label="Clear rating"
								>
									Clear
								</button>
							{/if}
						</div>
						<p class="text-xs text-base-content/60">Consider your energy, mood, and productivity</p>
					</div>

					<!-- Completion buttons -->
					<div class="flex justify-end border-t border-warning/20 pt-4">
						<button
							onclick={completeDayReflection}
							disabled={isLoading}
							class="btn-primary flex items-center gap-2"
						>
							{#if isLoading}
								<Loader2 class="h-5 w-5 animate-spin" />
								Saving...
							{:else}
								<CheckCircle class="h-5 w-5" />
								Complete Journal
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else if journalStatus !== 'fully_completed'}
		<div class="border-t border-base-300 bg-base-200 p-6">
			<div class="mx-auto max-w-3xl">
				<div class="flex gap-4">
					<div class="flex-1">
						<textarea
							bind:value={currentInput}
							onkeydown={handleKeydown}
							placeholder={journalStatus === 'new'
								? "What's on your mind today? Share your thoughts, feelings, or experiences..."
								: 'Share your response to continue the conversation...'}
							class="w-full resize-none rounded-lg border border-base-300 bg-base-100 px-4 py-3 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							rows="4"
							disabled={isLoading}
						></textarea>
					</div>
					<div class="flex flex-col gap-3">
						{#if journalStatus === 'new'}
							<button
								onclick={startJournal}
								disabled={!currentInput.trim() || isLoading}
								class="btn-primary flex items-center gap-2 px-6 py-3"
							>
								{#if isLoading}
									<Loader2 class="h-5 w-5 animate-spin" />
								{:else}
									<Send class="h-5 w-5" />
								{/if}
								Start Session
							</button>
						{:else if journalStatus === 'in_progress'}
							<button
								onclick={sendFollowupResponse}
								disabled={!currentInput.trim() || isLoading}
								class="btn-primary flex items-center gap-2 px-4 py-2"
							>
								{#if isLoading}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Send class="h-4 w-4" />
								{/if}
								Send
							</button>
							{#if canSubmit && followupCount >= maxFollowups}
								<button
									onclick={submitJournal}
									disabled={isLoading}
									class="flex items-center gap-2 rounded-lg bg-success px-4 py-2 font-medium text-primary-content transition-colors hover:bg-success/90"
								>
									{#if isLoading}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<CheckCircle class="h-4 w-4" />
									{/if}
									Finish Session
								</button>
							{:else if canSubmit}
								<button
									onclick={submitJournal}
									disabled={isLoading}
									class="rounded-lg px-4 py-2 font-medium text-base-content/70 transition-colors hover:bg-base-200 hover:text-base-content"
								>
									Finish Early
								</button>
							{/if}
						{/if}
					</div>
				</div>

				{#if journalStatus === 'in_progress'}
					<div class="mt-4 flex items-center justify-between text-sm text-base-content/70">
						<span>Press Enter to send, Shift+Enter for new line</span>
						{#if followupCount < maxFollowups}
							<span class="font-medium text-info">
								{maxFollowups - followupCount} follow-up question{maxFollowups - followupCount !== 1
									? 's'
									: ''} remaining
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
