<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { journalsApi } from '$lib/api';
	import { User, Bot, Send, CheckCircle, Loader2 } from 'lucide-svelte';

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
	let journalStatus: 'new' | 'in_progress' | 'completed' = 'new';
	let currentJournalId: string | null = journalId;
	let followupCount = 0;
	let maxFollowups = 3;
	let canSubmit = false;

	// Initialize with existing journal if provided
	if (existingJournal) {
		currentJournalId = existingJournal.id;
		journalStatus = existingJournal.status || 'new';
		messages = existingJournal.conversationHistory || [];
		followupCount = existingJournal.followupCount || 0;
		maxFollowups = existingJournal.maxFollowups || 3;
		canSubmit = journalStatus === 'in_progress' && messages.length > 0;
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
			messages = [...messages, {
				role: 'user',
				content: currentInput,
				timestamp: new Date().toISOString()
			}];

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
			messages = [...messages, {
				role: 'assistant',
				content: response.question,
				timestamp: new Date().toISOString()
			}];

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
			messages = [...messages, {
				role: 'user',
				content: currentInput,
				timestamp: new Date().toISOString()
			}];

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
			
			journalStatus = 'completed';
			
			// Add the summary as an assistant message
			if (response.summary) {
				messages = [...messages, {
					role: 'assistant',
					content: `**Journal Summary:**\n\n${response.summary}`,
					timestamp: new Date().toISOString()
				}];
			}

			// Dispatch event to parent component
			dispatch('journalCompleted', {
				journal: response.journal,
				summary: response.summary,
				extractedTags: response.extractedTags,
				suggestedAttributes: response.suggestedAttributes
			});

		} catch (error) {
			console.error('Failed to submit journal:', error);
			alert('Failed to submit journal. Please try again.');
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

<div class="flex flex-col h-full max-w-4xl mx-auto">
	<!-- Chat Header -->
	<div class="bg-theme-secondary p-4 rounded-t-lg border-b border-theme">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold flex items-center gap-2 text-theme">
				<Bot size={20} />
				AI Journal Session
			</h2>
			<div class="flex items-center gap-2">
				{#if journalStatus === 'completed'}
					<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						<CheckCircle size={12} />
						Completed
					</span>
				{:else if journalStatus === 'in_progress'}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-primary text-white">
						In Progress ({followupCount}/{maxFollowups} follow-ups)
					</span>
				{:else}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">New Session</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chat Messages -->
	<div class="flex-1 overflow-y-auto p-4 space-y-4 bg-theme">
		{#if messages.length === 0 && journalStatus === 'new'}
			<div class="text-center py-8 text-theme-muted">
				<Bot size={48} class="mx-auto mb-4 opacity-50" />
				<p class="text-lg mb-2 text-theme">Start your journal session</p>
				<p class="text-sm">Share what's on your mind, and I'll help you explore your thoughts with thoughtful questions.</p>
			</div>
		{/if}

		{#each messages as message (message.timestamp)}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4">
				<div class="flex {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[80%]">
					<div class="w-10 h-10 rounded-full bg-{message.role === 'user' ? 'theme-primary' : 'theme-secondary'} flex items-center justify-center flex-shrink-0">
						{#if message.role === 'user'}
							<User size={16} class="text-white" />
						{:else}
							<Bot size={16} class="text-white" />
						{/if}
					</div>
					<div class="{message.role === 'user' ? 'text-right' : 'text-left'}">
						<div class="text-xs text-theme-muted mb-1">
							{message.role === 'user' ? 'You' : 'AI Assistant'}
							<span class="ml-1">
								{formatTimestamp(message.timestamp)}
							</span>
						</div>
						<div class="inline-block px-4 py-2 rounded-lg {message.role === 'user' ? 'bg-theme-primary text-white' : 'bg-theme-secondary text-theme'}">
							{#if message.content.includes('**Journal Summary:**')}
								{@html message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
							{:else}
								{message.content}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start mb-4">
				<div class="flex items-start gap-3 max-w-[80%]">
					<div class="w-10 h-10 rounded-full bg-theme-secondary flex items-center justify-center flex-shrink-0">
						<Loader2 size={16} class="text-white animate-spin" />
					</div>
					<div class="text-left">
						<div class="text-xs text-theme-muted mb-1">
							AI Assistant
						</div>
						<div class="inline-block px-4 py-2 rounded-lg bg-theme-secondary text-theme">
							<div class="flex items-center gap-2">
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-current rounded-full animate-bounce"></div>
									<div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
									<div class="w-2 h-2 bg-current rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
								</div>
								Thinking...
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	{#if journalStatus !== 'completed'}
		<div class="bg-theme-secondary p-4 rounded-b-lg border-t border-theme">
			<div class="flex gap-2">
				<div class="flex-1">
					<textarea
						bind:value={currentInput}
						on:keydown={handleKeydown}
						placeholder={journalStatus === 'new' 
							? "What's on your mind today? Share your thoughts..." 
							: "Share your response..."}
						class="w-full px-3 py-2 border border-theme rounded-md bg-theme text-theme placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary resize-none"
						rows="3"
						disabled={isLoading}
					></textarea>
				</div>
				<div class="flex flex-col gap-2">
					{#if journalStatus === 'new'}
						<button
							on:click={startJournal}
							disabled={!currentInput.trim() || isLoading}
							class="px-4 py-2 bg-theme-primary text-white rounded-md hover:bg-theme-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
						>
							{#if isLoading}
								<Loader2 size={16} class="animate-spin" />
							{:else}
								<Send size={16} />
							{/if}
							Start
						</button>
					{:else if journalStatus === 'in_progress'}
						<button
							on:click={sendFollowupResponse}
							disabled={!currentInput.trim() || isLoading}
							class="px-3 py-1.5 bg-theme-primary text-white rounded-md text-sm hover:bg-theme-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
						>
							{#if isLoading}
								<Loader2 size={16} class="animate-spin" />
							{:else}
								<Send size={16} />
							{/if}
							Send
						</button>
						{#if canSubmit && followupCount >= maxFollowups}
							<button
								on:click={submitJournal}
								disabled={isLoading}
								class="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
							>
								{#if isLoading}
									<Loader2 size={16} class="animate-spin" />
								{:else}
									<CheckCircle size={16} />
								{/if}
								Finish
							</button>
						{:else if canSubmit}
							<button
								on:click={submitJournal}
								disabled={isLoading}
								class="px-3 py-1.5 text-theme-muted hover:text-theme hover:bg-theme-secondary rounded-md text-sm transition-colors"
							>
								Finish Early
							</button>
						{/if}
					{/if}
				</div>
			</div>
			
			{#if journalStatus === 'in_progress'}
				<div class="text-xs text-theme-muted mt-2">
					Press Enter to send, Shift+Enter for new line
					{#if followupCount < maxFollowups}
						• {maxFollowups - followupCount} follow-up question{maxFollowups - followupCount !== 1 ? 's' : ''} remaining
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
