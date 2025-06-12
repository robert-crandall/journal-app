<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Send, Sparkles, Save, ArrowLeft } from 'lucide-svelte';
	import type { ConversationMessage } from '$lib/types.js';
	
	let currentMessage = $state('');
	let conversation: ConversationMessage[] = $state([]);
	let followUpQuestions: string[] = $state([]);
	let isLoading = $state(false);
	let isProcessing = $state(false);
	let entryId = $state('');
	let isCompleted = $state(false);
	
	let messageInput: HTMLTextAreaElement;
	
	onMount(async () => {
		// Get initial prompt from GPT
		try {
			const response = await fetch('/api/journal/prompt');
			if (response.ok) {
				const data = await response.json();
				currentMessage = data.prompt;
			}
		} catch (error) {
			console.error('Error getting initial prompt:', error);
		}
	});
	
	async function startConversation() {
		if (!currentMessage.trim()) return;
		
		isLoading = true;
		try {
			// Create new journal entry
			const response = await fetch('/api/journal', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					initialContent: currentMessage
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				entryId = data.entry.id;
				
				// Add message to conversation
				conversation = [{
					role: 'user',
					content: currentMessage,
					timestamp: new Date()
				}];
				
				// Get follow-up questions
				await getFollowUpQuestions();
				currentMessage = '';
			}
		} catch (error) {
			console.error('Error starting conversation:', error);
		} finally {
			isLoading = false;
		}
	}
	
	async function addMessage() {
		if (!currentMessage.trim() || !entryId) return;
		
		isLoading = true;
		try {
			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'add_message',
					message: currentMessage
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				conversation = data.conversationData;
				followUpQuestions = data.followUpQuestions;
				currentMessage = '';
			}
		} catch (error) {
			console.error('Error adding message:', error);
		} finally {
			isLoading = false;
		}
	}
	
	async function getFollowUpQuestions() {
		if (!entryId) return;
		
		try {
			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'get_follow_up_questions'
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				followUpQuestions = data.followUpQuestions;
			}
		} catch (error) {
			console.error('Error getting follow-up questions:', error);
		}
	}
	
	async function useFollowUpQuestion(question: string) {
		currentMessage = question;
		followUpQuestions = [];
		
		// Add as assistant message first
		await addAssistantMessage(question);
		
		// Focus on input
		messageInput?.focus();
	}
	
	async function addAssistantMessage(message: string) {
		if (!entryId) return;
		
		try {
			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'add_assistant_message',
					message: message
				})
			});
			
			if (response.ok) {
				const data = await response.json();
				conversation = data.conversationData;
			}
		} catch (error) {
			console.error('Error adding assistant message:', error);
		}
	}
	
	async function processEntry() {
		if (!entryId) return;
		
		isProcessing = true;
		try {
			const response = await fetch(`/api/journal/${entryId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'process_entry'
				})
			});
			
			if (response.ok) {
				isCompleted = true;
				// Redirect to the processed entry
				goto(`/journal/${entryId}`);
			}
		} catch (error) {
			console.error('Error processing entry:', error);
		} finally {
			isProcessing = false;
		}
	}
	
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (conversation.length === 0) {
				startConversation();
			} else {
				addMessage();
			}
		}
	}
	
	function formatTime(date: Date) {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<svelte:head>
	<title>New Journal Entry - Journal App</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/journal" class="btn btn-ghost btn-sm">
				<ArrowLeft size={16} />
				Back to Journal
			</a>
			<div class="divider divider-horizontal"></div>
			<h1 class="text-2xl font-bold">New Journal Entry</h1>
		</div>
		
		{#if conversation.length > 0 && !isCompleted}
			<button 
				class="btn btn-primary gap-2"
				onclick={processEntry}
				disabled={isProcessing}
			>
				{#if isProcessing}
					<span class="loading loading-spinner loading-sm"></span>
					Processing...
				{:else}
					<Sparkles size={16} />
					Complete Entry
				{/if}
			</button>
		{/if}
	</div>

	<!-- Conversation -->
	<div class="card bg-base-100 border border-base-300">
		<div class="card-body">
			{#if conversation.length === 0}
				<!-- Starting prompt -->
				<div class="space-y-4">
					<div class="text-center py-8">
						<h2 class="text-lg font-semibold mb-2">Let's start your journal entry</h2>
						<p class="text-base-content/70">Share what's on your mind today</p>
					</div>
				</div>
			{:else}
				<!-- Conversation messages -->
				<div class="space-y-4 max-h-96 overflow-y-auto">
					{#each conversation as message}
						<div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
							<div class="chat-bubble {message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
								{message.content}
							</div>
							<div class="chat-footer opacity-50 text-xs">
								{formatTime(new Date(message.timestamp))}
							</div>
						</div>
					{/each}
				</div>
				
				<!-- Follow-up questions -->
				{#if followUpQuestions.length > 0}
					<div class="divider">Follow-up Questions</div>
					<div class="flex flex-wrap gap-2">
						{#each followUpQuestions as question}
							<button 
								class="btn btn-outline btn-sm"
								onclick={() => useFollowUpQuestion(question)}
							>
								{question}
							</button>
						{/each}
					</div>
				{/if}
			{/if}
			
			<!-- Message input -->
			<div class="divider"></div>
			<div class="flex gap-2">
				<textarea
					bind:this={messageInput}
					bind:value={currentMessage}
					onkeypress={handleKeyPress}
					placeholder={conversation.length === 0 ? "What's on your mind today?" : "Continue the conversation..."}
					class="textarea textarea-bordered flex-1 resize-none"
					rows="3"
					disabled={isLoading || isProcessing}
				></textarea>
				<button 
					class="btn btn-primary btn-square"
					onclick={conversation.length === 0 ? startConversation : addMessage}
					disabled={!currentMessage.trim() || isLoading || isProcessing}
				>
					{#if isLoading}
						<span class="loading loading-spinner loading-sm"></span>
					{:else}
						<Send size={16} />
					{/if}
				</button>
			</div>
			
			<div class="text-xs text-base-content/50 mt-2">
				Press Enter to send, Shift+Enter for new line
			</div>
		</div>
	</div>
	
	<!-- Instructions -->
	<div class="alert alert-info">
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>
		<div>
			<h3 class="font-bold">How it works:</h3>
			<div class="text-sm">
				Start by sharing what's on your mind. I'll ask follow-up questions to help you reflect deeper. 
				When you're ready, click "Complete Entry" to generate insights and extract key themes.
			</div>
		</div>
	</div>
</div>
