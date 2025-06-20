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
	<div class="border-primary-100 from-primary-50 to-secondary-50 border-b bg-gradient-to-r p-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="bg-primary/10 rounded-lg p-2">
					<Bot class="text-info h-5 w-5" />
				</div>
				<h2 class="text-base-content text-xl font-semibold">AI Journal Session</h2>
			</div>
			<div class="flex items-center gap-2">
				{#if journalStatus === 'fully_completed'}
					<div
						class="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
					>
						<CheckCircle class="h-4 w-4" />
						Completed
					</div>
				{:else if journalStatus === 'day_completion'}
					<div
						class="bg-warning/10 text-warning inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
					>
						<Bot class="h-4 w-4" />
						Day Reflection
					</div>
				{:else if journalStatus === 'in_progress'}
					<div
						class="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
					>
						<div class="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
						In Progress ({followupCount}/{maxFollowups} follow-ups)
					</div>
				{:else}
					<div
						class="bg-base-200 text-base-content/70 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
					>
						<Bot class="h-4 w-4" />
						New Session
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chat Messages -->
	<div class="bg-base-100 flex-1 space-y-4 overflow-y-auto p-3 md:space-y-6 md:p-6">
		{#if messages.length === 0 && journalStatus === 'new'}
			<div class="py-8 text-center md:py-12">
				<div
					class="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full md:mb-6 md:h-20 md:w-20"
				>
					<Bot class="text-info h-8 w-8 md:h-10 md:w-10" />
				</div>
				<h3 class="text-base-content mb-2 text-xl font-bold md:mb-3 md:text-2xl">
					Start Your Journal Session
				</h3>
				<p class="text-base-content/70 mx-auto max-w-md text-sm leading-relaxed md:text-base">
					Share what's on your mind, and I'll help you explore your thoughts with thoughtful
					questions and insights.
				</p>
			</div>
		{/if}

		{#each messages as message (message.timestamp)}
			<div class="flex gap-3 md:gap-4 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
				<!-- Avatar -->
				<div class="flex-shrink-0">
					<div
						class="h-8 w-8 rounded-full {message.role === 'user'
							? 'bg-secondary/10'
							: 'bg-primary/10'} flex items-center justify-center md:h-10 md:w-10"
					>
						{#if message.role === 'user'}
							<User class="text-secondary h-4 w-4 md:h-5 md:w-5" />
						{:else}
							<Bot class="text-info h-4 w-4 md:h-5 md:w-5" />
						{/if}
					</div>
				</div>

				<!-- Message Content -->
				<div class="min-w-0 flex-1 md:max-w-3xl">
					<div
						class="mb-1 flex items-center gap-2 md:mb-2 {message.role === 'user'
							? 'justify-end'
							: 'justify-start'}"
					>
						<span class="text-base-content text-xs font-medium md:text-sm">
							{message.role === 'user' ? 'You' : 'AI Assistant'}
						</span>
						<time class="text-base-content/60 text-xs">
							{formatTimestamp(message.timestamp)}
						</time>
					</div>
					<div
						class="rounded-lg p-3 shadow-sm {message.role === 'user'
							? 'bg-secondary text-primary-content ml-2 md:ml-8'
							: 'bg-base-200 text-base-content mr-2 md:mr-8'} md:p-4"
					>
						{#if message.content.includes('**Journal Summary:**')}
							<div
								class="prose max-w-none text-sm {message.role === 'user'
									? 'prose-invert'
									: ''} md:text-base"
							>
								{@html message.content
									.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
									.replace(/\n/g, '<br>')}
							</div>
						{:else}
							<div class="text-sm leading-relaxed whitespace-pre-wrap md:text-base">
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
					<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
						<Loader2 class="text-info h-5 w-5 animate-spin" />
					</div>
				</div>

				<!-- Message Content -->
				<div class="max-w-3xl flex-1">
					<div class="mb-2 flex items-center gap-2">
						<span class="text-base-content text-sm font-medium">AI Assistant</span>
					</div>
					<div class="bg-base-200 text-base-content mr-8 rounded-lg p-4 shadow-sm">
						<div class="flex items-center gap-3">
							<div class="flex gap-1">
								<div class="bg-primary h-2 w-2 animate-bounce rounded-full"></div>
								<div
									class="bg-primary h-2 w-2 animate-bounce rounded-full"
									style="animation-delay: 0.1s"
								></div>
								<div
									class="bg-primary h-2 w-2 animate-bounce rounded-full"
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
		<div class="border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 md:p-6">
			<div class="mx-auto max-w-3xl space-y-4 md:space-y-6">
				<div class="text-center">
					<div
						class="bg-warning/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full md:mb-4 md:h-16 md:w-16"
					>
						<Sparkles class="text-warning h-6 w-6 md:h-8 md:w-8" />
					</div>
					<h3 class="text-base-content mb-1 text-lg font-semibold md:mb-2 md:text-xl">
						Day Reflection
					</h3>
					<p class="text-base-content/70 text-sm md:text-base">
						Before we finish, let's capture a few more details about your day.
					</p>
				</div>

				<div class="space-y-4 md:space-y-6">
					<!-- Day Memory -->
					<div class="space-y-2 md:space-y-3">
						<label for="day-memory" class="text-base-content block text-sm font-medium">
							Is there anything you want to remember from today?
							<span class="text-base-content/60 ml-1 font-normal">(Optional)</span>
						</label>
						<textarea
							id="day-memory"
							bind:value={dayMemory}
							placeholder="Something special, a moment of gratitude, or just something you don't want to forget..."
							class="border-base-300 bg-base-100 w-full resize-none rounded-lg border px-3 py-3 text-base shadow-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none md:px-4"
							rows="3"
							disabled={isLoading}
						></textarea>
						<p class="text-base-content/60 text-xs">
							This won't be analyzed or used for tagging - it's just for you.
						</p>
					</div>

					<!-- Day Rating -->
					<div class="space-y-2 md:space-y-3">
						<label class="text-base-content block text-sm font-medium">
							How would you rate your day overall? (1-5)
							<span class="text-base-content/60 ml-1 font-normal">(Optional)</span>
						</label>
						<div class="flex items-center gap-2 md:gap-3">
							{#each [1, 2, 3, 4, 5] as rating}
								<button
									onclick={() => (dayRating = rating)}
									class="h-10 w-10 rounded-lg border-2 font-semibold transition-all duration-200 md:h-12 md:w-12 {dayRating ===
									rating
										? 'bg-warning text-primary-content scale-105 border-amber-500 shadow-lg'
										: 'border-base-300 bg-base-100 text-base-content/80 hover:bg-warning/10 hover:border-amber-300'}"
									disabled={isLoading}
									aria-label="Rate day as {rating}"
								>
									{rating}
								</button>
							{/each}
							{#if dayRating !== null}
								<button
									onclick={() => (dayRating = null)}
									class="text-base-content/70 hover:bg-base-200 hover:text-base-content rounded-lg px-2 py-1 text-sm transition-colors md:px-3 md:py-2"
									disabled={isLoading}
									aria-label="Clear rating"
								>
									Clear
								</button>
							{/if}
						</div>
						<p class="text-base-content/60 text-xs">Consider your energy, mood, and productivity</p>
					</div>

					<!-- Completion buttons -->
					<div class="border-warning/20 flex justify-end border-t pt-3 md:pt-4">
						<button
							onclick={completeDayReflection}
							disabled={isLoading}
							class="btn btn-primary flex items-center gap-2"
						>
							{#if isLoading}
								<Loader2 class="h-4 w-4 animate-spin md:h-5 md:w-5" />
								Saving...
							{:else}
								<CheckCircle class="h-4 w-4 md:h-5 md:w-5" />
								Complete Journal
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else if journalStatus !== 'fully_completed'}
		<div class="border-base-300 bg-base-200 border-t p-3 md:p-6">
			<div class="mx-auto max-w-3xl">
				<div class="flex flex-col gap-3 md:flex-row md:gap-4">
					<div class="flex-1">
						<textarea
							bind:value={currentInput}
							onkeydown={handleKeydown}
							placeholder={journalStatus === 'new'
								? "What's on your mind today?"
								: 'Share your response...'}
							class="border-base-300 bg-base-100 w-full resize-none rounded-lg border px-3 py-3 text-base shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none md:px-4"
							rows="3"
							disabled={isLoading}
						></textarea>
					</div>
					<div class="flex flex-row gap-2 md:flex-col md:gap-3">
						{#if journalStatus === 'new'}
							<button
								onclick={startJournal}
								disabled={!currentInput.trim() || isLoading}
								class="btn btn-primary btn-sm md:btn-md flex flex-1 items-center justify-center gap-2 md:px-6 md:py-3"
							>
								{#if isLoading}
									<Loader2 class="h-4 w-4 animate-spin md:h-5 md:w-5" />
								{:else}
									<Send class="h-4 w-4 md:h-5 md:w-5" />
								{/if}
								<span class="hidden md:inline">Start Session</span>
								<span class="md:hidden">Start</span>
							</button>
						{:else if journalStatus === 'in_progress'}
							<button
								onclick={sendFollowupResponse}
								disabled={!currentInput.trim() || isLoading}
								class="btn btn-primary btn-sm md:btn-md flex flex-1 items-center justify-center gap-2 md:px-4 md:py-2"
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
									class="btn btn-success btn-sm md:btn-md md:bg-success md:text-primary-content md:hover:bg-success/90 flex flex-1 items-center justify-center gap-2 md:rounded-lg md:px-4 md:py-2 md:font-medium md:transition-colors"
								>
									{#if isLoading}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<CheckCircle class="h-4 w-4" />
									{/if}
									<span class="hidden md:inline">Finish Session</span>
									<span class="md:hidden">Finish</span>
								</button>
							{:else if canSubmit}
								<button
									onclick={submitJournal}
									disabled={isLoading}
									class="btn btn-ghost btn-sm md:text-base-content/70 md:hover:bg-base-200 md:hover:text-base-content md:rounded-lg md:px-4 md:py-2 md:font-medium md:transition-colors"
								>
									<span class="hidden md:inline">Finish Early</span>
									<span class="md:hidden">Finish</span>
								</button>
							{/if}
						{/if}
					</div>
				</div>

				{#if journalStatus === 'in_progress'}
					<div
						class="text-base-content/70 mt-3 text-sm md:mt-4 md:flex md:items-center md:justify-between"
					>
						<span class="hidden md:block">Press Enter to send, Shift+Enter for new line</span>
						{#if followupCount < maxFollowups}
							<span class="text-info block text-center text-xs font-medium md:text-sm">
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
