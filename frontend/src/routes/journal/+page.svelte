<script lang="ts">
	import { onMount } from 'svelte';
	import { Send, MessageCircle, PenTool, Loader2 } from 'lucide-svelte';
	import { api } from '$lib/api/client';
	import MessageBubble from '$lib/components/journal/MessageBubble.svelte';
	import TypingIndicator from '$lib/components/journal/TypingIndicator.svelte';
	
	// Types based on backend journal system
	interface JournalEntry {
		id: string;
		content: string;
		role: 'user' | 'assistant';
		createdAt: string;
	}
	
	interface Conversation {
		id: string;
		isActive: boolean;
		createdAt: string;
		updatedAt: string;
	}

	// Component state
	let currentMessage = $state('');
	let messages: JournalEntry[] = $state([]);
	let activeConversation: Conversation | null = $state(null);
	let isLoading = $state(false);
	let isTyping = $state(false);
	let error = $state('');
	
	// Hardcoded user ID for now - in real app would come from auth
	const userId = 'b8a9c1e2-f3d4-5e6f-7a8b-9c0d1e2f3a4b';
	
	// Chat container reference for auto-scrolling
	let chatContainer: HTMLDivElement;

	onMount(async () => {
		await initializeJournal();
	});

	async function initializeJournal() {
		try {
			isLoading = true;
			error = '';
					// Check if user has an active conversation
		const statusResponse = await api.api.journal.status.$get({
			query: { userId }
		});
		
		if (!statusResponse.ok) {
			throw new Error('Failed to check journal status');
		}
		
		const statusData = await statusResponse.json();
		
		if (!statusData.success) {
			throw new Error(statusData.error || 'Failed to get status');
		}
			
		if (statusData.data.hasActiveConversation) {
				// Continue existing conversation
				await continueExistingConversation();
			} else {
				// Start new conversation
				await startNewConversation();
			}
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to initialize journal';
			console.error('Error initializing journal:', err);
		} finally {
			isLoading = false;
		}
	}
	
	async function continueExistingConversation() {
		try {		const continueResponse = await api.api.journal['quick-continue'].$get({
			query: { userId }
		});
			
			if (!continueResponse.ok) {
				throw new Error('Failed to continue conversation');
			}
					const continueData = await continueResponse.json();
		
		if (!continueData.success) {
			throw new Error(continueData.error || 'Failed to continue conversation');
		}
		
		activeConversation = continueData.data.conversation;
		messages = continueData.data.recentMessages || [];
			
			scrollToBottom();
		} catch (err) {
			console.error('Error continuing conversation:', err);
			// Fall back to starting new conversation
			await startNewConversation();
		}
	}
	
	async function startNewConversation() {
		try {		const startResponse = await api.api.journal['quick-start'].$post({
			json: { userId }
		});
			
			if (!startResponse.ok) {
				throw new Error('Failed to start new conversation');
			}
			
			const startData = await startResponse.json();
			activeConversation = startData.data.conversation;
			
			// Add the opening message from AI
			if (startData.data.openingMessage) {
				messages = [startData.data.openingMessage];
			}
			
			scrollToBottom();
		} catch (err) {
			console.error('Error starting conversation:', err);
			throw err;
		}
	}

	async function sendMessage() {
		if (!currentMessage.trim() || !activeConversation || isLoading) return;
		
		const messageContent = currentMessage.trim();
		currentMessage = '';
		
		// Add user message immediately for better UX
		const userMessage: JournalEntry = {
			id: `temp-${Date.now()}`,
			content: messageContent,
			role: 'user',
			createdAt: new Date().toISOString()
		};
		messages = [...messages, userMessage];
		scrollToBottom();
		
		try {
			isLoading = true;
					// Send user message to backend
		const messageResponse = await api.api.journal.conversations[':id'].messages.$post({
			param: { id: activeConversation.id },
			json: {
				userId,
				content: messageContent,
				role: 'user'
			}
		});
			
			if (!messageResponse.ok) {
				throw new Error('Failed to send message');
			}
					const messageData = await messageResponse.json();
		
		if (!messageData.success) {
			throw new Error(messageData.error || 'Failed to send message');
		}
		
		// Update the temporary message with real ID
		messages = messages.map(msg => 
			msg.id === userMessage.id ? messageData.data.entry : msg
		);
			
			// Show typing indicator
			isTyping = true;
			scrollToBottom();
			
			// Get AI response
			await getAIResponse();
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message';
			console.error('Error sending message:', err);
			
			// Remove the failed message
			messages = messages.filter(msg => msg.id !== userMessage.id);
		} finally {
			isLoading = false;
			isTyping = false;
		}
	}
	
	async function getAIResponse() {
		try {		// Request AI follow-up by sending empty assistant message
		const aiResponse = await api.api.journal.conversations[':id'].messages.$post({
			param: { id: activeConversation!.id },
			json: {
				userId,
				content: '', // Empty content triggers AI response
				role: 'assistant'
			}
		});
			
			if (!aiResponse.ok) {
				throw new Error('Failed to get AI response');
			}
					const aiData = await aiResponse.json();
		
		if (!aiData.success) {
			throw new Error(aiData.error || 'Failed to get AI response');
		}
		
		// Add AI response to messages
		messages = [...messages, aiData.data.entry];
			scrollToBottom();
			
		} catch (err) {
			console.error('Error getting AI response:', err);
			// Don't show error to user for AI responses - just continue without it
		}
	}
	
	async function endConversation() {
		if (!activeConversation || isLoading) return;
		
		try {
			isLoading = true;
					const endResponse = await api.api.journal.conversations[':id'].end.$put({
			param: { id: activeConversation.id },
			json: { userId }
		});
					if (!endResponse.ok) {
			throw new Error('Failed to end conversation');
		}
		
		const endData = await endResponse.json();
		if (!endData.success) {
			throw new Error(endData.error || 'Failed to end conversation');
		}
		
		// Reset state and start new conversation
		activeConversation = null;
		messages = [];
		await startNewConversation();
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to end conversation';
			console.error('Error ending conversation:', err);
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
	
	function scrollToBottom() {
		// Wait for DOM update then scroll
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 10);
	}
</script>

<svelte:head>
	<title>Journal - D&D Life</title>
	<meta name="description" content="Conversational journal with smart AI companion" />
</svelte:head>

<div class="min-h-screen flex flex-col" style="background-color: rgb(var(--color-neutral-50));">
	<!-- Header -->
	<header class="bg-white border-b border-neutral-200 px-4 py-4 md:px-6">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<div class="flex items-center gap-3">
				<MessageCircle class="h-6 w-6" style="color: rgb(var(--color-primary-600))" />
				<div>
					<h1 class="text-xl font-semibold" style="color: rgb(var(--color-text-primary))">
						Journal Conversation
					</h1>
					<p class="text-sm" style="color: rgb(var(--color-text-secondary))">
						Reflect and explore your thoughts with AI guidance
					</p>
				</div>
			</div>
			
			{#if activeConversation}
				<button
					onclick={endConversation}
					disabled={isLoading}
					class="btn btn-secondary text-sm"
				>
					Complete Session
				</button>
			{/if}
		</div>
	</header>

	<!-- Chat Container -->
	<div class="flex-1 flex flex-col max-w-4xl mx-auto w-full">
		<!-- Messages Area -->
		<div 
			bind:this={chatContainer}
			class="flex-1 overflow-y-auto px-4 py-6 md:px-6 space-y-4"
			style="min-height: 0;"
		>
			{#if isLoading && messages.length === 0}
				<div class="flex items-center justify-center py-12">
					<div class="flex flex-col items-center gap-3">
						<Loader2 class="h-8 w-8 animate-spin" style="color: rgb(var(--color-primary-600))" />
						<p class="text-sm" style="color: rgb(var(--color-text-secondary))">
							Starting your journal session...
						</p>
					</div>
				</div>
			{:else if error}
				<div class="flex items-center justify-center py-12">
					<div class="text-center">
						<p class="text-sm text-red-600 mb-4">{error}</p>
						<button 
							onclick={initializeJournal}
							class="btn btn-primary text-sm"
						>
							Try Again
						</button>
					</div>
				</div>
			{:else if messages.length === 0}
				<div class="flex items-center justify-center py-12">
					<div class="text-center">
						<PenTool class="h-12 w-12 mx-auto mb-4" style="color: rgb(var(--color-text-tertiary))" />
						<h3 class="text-lg font-medium mb-2" style="color: rgb(var(--color-text-primary))">
							Ready to Journal
						</h3>
						<p class="text-sm" style="color: rgb(var(--color-text-secondary))">
							Your AI companion is ready to help you reflect
						</p>
					</div>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<MessageBubble {message} />
				{/each}
				
				{#if isTyping}
					<TypingIndicator />
				{/if}
			{/if}
		</div>

		<!-- Input Area -->
		<div class="border-t border-neutral-200 bg-white p-4 md:p-6">
			<div class="flex gap-3">
				<div class="flex-1">
					<textarea
						bind:value={currentMessage}
						onkeydown={handleKeyDown}
						disabled={isLoading || !activeConversation}
						placeholder={isLoading ? "Thinking..." : "Share what's on your mind..."}
						class="w-full px-4 py-3 rounded-xl border border-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
						style="min-height: 52px; max-height: 120px; background-color: rgb(var(--color-neutral-50));"
						rows="1"
					></textarea>
					<div class="flex justify-between items-center mt-2">
						<p class="text-xs" style="color: rgb(var(--color-text-tertiary))">
							Press Enter to send, Shift+Enter for new line
						</p>
						<div class="text-xs" style="color: rgb(var(--color-text-tertiary))">
							{currentMessage.length}/1000
						</div>
					</div>
				</div>
				
				<button
					onclick={sendMessage}
					disabled={!currentMessage.trim() || isLoading || !activeConversation}
					class="btn btn-primary p-3 h-fit disabled:opacity-50 disabled:cursor-not-allowed"
					title="Send message"
				>
					{#if isLoading}
						<Loader2 class="h-5 w-5 animate-spin" />
					{:else}
						<Send class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar for chat container */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: rgb(var(--color-neutral-100));
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgb(var(--color-neutral-400));
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(var(--color-neutral-500));
	}
	
	/* Auto-resize textarea */
	textarea {
		field-sizing: content;
	}
</style>
