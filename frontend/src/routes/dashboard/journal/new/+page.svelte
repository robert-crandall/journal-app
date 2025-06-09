<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import api, { type JournalSession, type JournalMessage } from '$lib/api.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let session = $state<JournalSession | null>(null);
	let messages = $state<JournalMessage[]>([]);
	let currentMessage = $state('');
	let isLoading = $state(false);
	let isInitializing = $state(true);
	let error = $state('');
	let messageInput = $state<HTMLTextAreaElement>();

	onMount(async () => {
		try {
			// Start a new journal session
			session = await api.startJournalSession();
			
			// Add initial GPT message
			messages = [{
				id: 'initial',
				session_id: session.id,
				message: "Hi! I'm here to help you journal today. How are you feeling? What's on your mind?",
				role: 'assistant',
				created_at: new Date().toISOString()
			}];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start journal session';
		} finally {
			isInitializing = false;
		}
	});

	async function sendMessage() {
		if (!currentMessage.trim() || !session || isLoading) return;

		const userMessage = currentMessage.trim();
		isLoading = true;
		error = '';

		// Add user message to UI immediately
		const userMsg: JournalMessage = {
			id: `user-${Date.now()}`,
			session_id: session.id,
			message: userMessage,
			role: 'user',
			created_at: new Date().toISOString()
		};
		messages = [...messages, userMsg];
		currentMessage = '';

		try {
			// Send to API and get GPT response
			const response = await api.replyToJournal({
				session_id: session.id,
				message: userMessage
			});

			messages = [...messages, response];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function handleFinishJournal() {
		if (session) {
			goto(`/journal/submit/${session.id}`);
		}
	}

	function clearError() {
		error = '';
	}

	// Auto-focus and auto-resize textarea
	$effect(() => {
		if (messageInput) {
			messageInput.focus();
			messageInput.style.height = 'auto';
			messageInput.style.height = messageInput.scrollHeight + 'px';
		}
	});
</script>

<svelte:head>
	<title>New Journal Entry - Journal</title>
</svelte:head>

{#if isInitializing}
	<div class="flex justify-center items-center min-h-[400px]">
		<div class="text-center">
			<LoadingSpinner size="lg" />
			<p class="mt-4 text-base-content/70">Starting your journal session...</p>
		</div>
	</div>
{:else}
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<div>
				<h1 class="text-2xl font-bold text-base-content">New Journal Entry</h1>
				<p class="text-base-content/70">Let's explore what's on your mind today</p>
			</div>
			<div class="flex gap-2">
				<button 
					class="btn btn-ghost" 
					onclick={() => goto('/')}
				>
					Cancel
				</button>
				<button 
					class="btn btn-primary" 
					onclick={handleFinishJournal}
					disabled={messages.length <= 1}
				>
					Finish & Submit
				</button>
			</div>
		</div>

		{#if error}
			<Alert message={error} type="error" onDismiss={clearError} class="mb-6" />
		{/if}

		<!-- Conversation -->
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body p-0">
				<!-- Messages -->
				<div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
					{#each messages as message}
						<div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
							<div class="chat-image avatar">
								<div class="w-8 rounded-full {message.role === 'user' ? 'bg-primary' : 'bg-secondary'} flex items-center justify-center">
									{#if message.role === 'user'}
										<svg class="w-4 h-4 text-primary-content" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
										</svg>
									{:else}
										<svg class="w-4 h-4 text-secondary-content" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
										</svg>
									{/if}
								</div>
							</div>
							<div class="chat-bubble {message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'} prose-journal">
								{message.message}
							</div>
						</div>
					{/each}

					{#if isLoading}
						<div class="chat chat-start">
							<div class="chat-image avatar">
								<div class="w-8 rounded-full bg-secondary flex items-center justify-center">
									<LoadingSpinner size="sm" />
								</div>
							</div>
							<div class="chat-bubble chat-bubble-secondary">
								<span class="loading-dots">Thinking</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Input -->
				<div class="border-t border-base-300 p-6">
					<div class="flex gap-3">
						<textarea
							bind:this={messageInput}
							bind:value={currentMessage}
							onkeydown={handleKeyDown}
							class="textarea textarea-bordered flex-1 resize-none focus-ring"
							placeholder="Type your thoughts here... (Press Enter to send, Shift+Enter for new line)"
							rows="1"
							disabled={isLoading}
						></textarea>
						<button 
							class="btn btn-primary"
							onclick={sendMessage}
							disabled={!currentMessage.trim() || isLoading}
						>
							{#if isLoading}
								<LoadingSpinner size="sm" />
							{:else}
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
								</svg>
							{/if}
						</button>
					</div>
					<p class="text-xs text-base-content/50 mt-2">
						Have a conversation with AI to explore your thoughts. When you're ready, click "Finish & Submit" to create your journal entry.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
