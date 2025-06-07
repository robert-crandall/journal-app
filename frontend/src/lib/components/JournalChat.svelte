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
	<div class="bg-base-200 p-4 rounded-t-lg border-b">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold flex items-center gap-2">
				<Bot size={20} />
				AI Journal Session
			</h2>
			<div class="flex items-center gap-2">
				{#if journalStatus === 'completed'}
					<div class="badge badge-success gap-1">
						<CheckCircle size={12} />
						Completed
					</div>
				{:else if journalStatus === 'in_progress'}
					<div class="badge badge-primary">
						In Progress ({followupCount}/{maxFollowups} follow-ups)
					</div>
				{:else}
					<div class="badge badge-ghost">New Session</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chat Messages -->
	<div class="flex-1 overflow-y-auto p-4 space-y-4 bg-base-100">
		{#if messages.length === 0 && journalStatus === 'new'}
			<div class="text-center py-8 text-base-content/60">
				<Bot size={48} class="mx-auto mb-4 opacity-50" />
				<p class="text-lg mb-2">Start your journal session</p>
				<p class="text-sm">Share what's on your mind, and I'll help you explore your thoughts with thoughtful questions.</p>
			</div>
		{/if}

		{#each messages as message (message.timestamp)}
			<div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
				<div class="chat-image avatar">
					<div class="w-10 rounded-full bg-{message.role === 'user' ? 'primary' : 'secondary'} flex items-center justify-center">
						{#if message.role === 'user'}
							<User size={16} class="text-primary-content" />
						{:else}
							<Bot size={16} class="text-secondary-content" />
						{/if}
					</div>
				</div>
				<div class="chat-header">
					{message.role === 'user' ? 'You' : 'AI Assistant'}
					<time class="text-xs opacity-50 ml-1">
						{formatTimestamp(message.timestamp)}
					</time>
				</div>
				<div class="chat-bubble {message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
					{#if message.content.includes('**Journal Summary:**')}
						{@html message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
					{:else}
						{message.content}
					{/if}
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="chat chat-start">
				<div class="chat-image avatar">
					<div class="w-10 rounded-full bg-secondary flex items-center justify-center">
						<Loader2 size={16} class="text-secondary-content animate-spin" />
					</div>
				</div>
				<div class="chat-header">
					AI Assistant
				</div>
				<div class="chat-bubble chat-bubble-secondary">
					<div class="flex items-center gap-2">
						<span class="loading loading-dots loading-sm"></span>
						Thinking...
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input Area -->
	{#if journalStatus !== 'completed'}
		<div class="bg-base-200 p-4 rounded-b-lg border-t">
			<div class="flex gap-2">
				<div class="flex-1">
					<textarea
						bind:value={currentInput}
						on:keydown={handleKeydown}
						placeholder={journalStatus === 'new' 
							? "What's on your mind today? Share your thoughts..." 
							: "Share your response..."}
						class="textarea textarea-bordered w-full resize-none"
						rows="3"
						disabled={isLoading}
					></textarea>
				</div>
				<div class="flex flex-col gap-2">
					{#if journalStatus === 'new'}
						<button
							on:click={startJournal}
							disabled={!currentInput.trim() || isLoading}
							class="btn btn-primary"
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
							class="btn btn-primary btn-sm"
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
								class="btn btn-success btn-sm"
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
								class="btn btn-ghost btn-sm"
							>
								Finish Early
							</button>
						{/if}
					{/if}
				</div>
			</div>
			
			{#if journalStatus === 'in_progress'}
				<div class="text-xs text-base-content/60 mt-2">
					Press Enter to send, Shift+Enter for new line
					{#if followupCount < maxFollowups}
						• {maxFollowups - followupCount} follow-up question{maxFollowups - followupCount !== 1 ? 's' : ''} remaining
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
