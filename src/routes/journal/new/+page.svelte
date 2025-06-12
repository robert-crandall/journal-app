<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Send, Sparkles, Save, ArrowLeft, Award } from 'lucide-svelte';
	import type { ConversationMessage } from '$lib/types.js';
	import StatSelector from '$lib/components/stats/StatSelector.svelte';
	
	let currentMessage = $state('');
	let conversation: ConversationMessage[] = $state([]);
	let followUpQuestions: string[] = $state([]);
	let isLoading = $state(false);
	let isProcessing = $state(false);
	let entryId = $state('');
	let isCompleted = $state(false);
	let showProcessingDialog = $state(false);
	
	// Character stat selection
	let selectedStats: { id: string; name: string; xpAmount: number }[] = $state([]);
	let savingStats = $state(false);
	
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
				conversation = data.conversationData;
				followUpQuestions = data.followUpQuestions;
			}
		} catch (error) {
			console.error('Error getting follow-up questions:', error);
		}
	}
	
	async function addFollowUp(question: string) {
		isLoading = true;
		try {
			// Add assistant message with the question
			const assistantResponse = await fetch(`/api/journal/${entryId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'add_assistant_message',
					message: question
				})
			});
			
			if (assistantResponse.ok) {
				const data = await assistantResponse.json();
				conversation = data.conversationData;
				followUpQuestions = [];
			}
		} catch (error) {
			console.error('Error adding assistant message:', error);
		} finally {
			isLoading = false;
		}
	}
	
	async function processEntry() {
		if (!entryId) return;
		
		// Show the processing dialog with character stat selection
		showProcessingDialog = true;
	}
	
	async function completeProcessing() {
		isProcessing = true;
		try {
			// First, process the journal entry
			const processResponse = await fetch(`/api/journal/${entryId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'process_entry'
				})
			});
			
			if (!processResponse.ok) {
				throw new Error('Failed to process journal entry');
			}
			
			// Then, if there are selected stats, link them
			if (selectedStats.length > 0) {
				savingStats = true;
				
				const statsResponse = await fetch(`/api/journal/${entryId}/stats`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						stats: selectedStats
					})
				});
				
				if (!statsResponse.ok) {
					throw new Error('Failed to save character stats');
				}
			}
			
			isCompleted = true;
			// Redirect to the processed entry
			goto(`/journal/${entryId}`);
		} catch (error) {
			console.error('Error processing entry:', error);
		} finally {
			isProcessing = false;
			savingStats = false;
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
				on:click={processEntry}
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
	
	<!-- Chat Area -->
	<div class="bg-base-100 border border-base-300 rounded-xl overflow-hidden">
		<!-- Conversation Area -->
		<div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
			{#if conversation.length === 0}
				<div class="alert">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					<span>Start writing to begin your journal entry</span>
				</div>
			{:else}
				{#each conversation as message}
					<div class="chat chat-{message.role === 'user' ? 'end' : 'start'}">
						<div class="chat-header">
							{message.role === 'user' ? 'You' : 'Journal'}
							<time class="text-xs opacity-50 ml-2">{formatTime(new Date(message.timestamp))}</time>
						</div>
						<div class="chat-bubble chat-bubble-{message.role === 'user' ? 'primary' : 'neutral'}">
							{#each message.content.split('\n') as line}
								{line}
								<br />
							{/each}
						</div>
					</div>
				{/each}
				
				{#if isLoading}
					<div class="flex justify-center items-center p-4">
						<span class="loading loading-dots loading-md"></span>
					</div>
				{/if}
				
				<!-- Follow-up question suggestions -->
				{#if followUpQuestions.length > 0 && !isLoading}
					<div class="flex flex-col space-y-2 pt-4">
						<div class="text-sm font-medium text-base-content/70">Suggested follow-up questions:</div>
						<div class="flex flex-wrap gap-2">
							{#each followUpQuestions as question}
								<button 
									class="btn btn-sm btn-outline"
									on:click={() => addFollowUp(question)}
								>
									{question}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
		
		<!-- Input Area -->
		<div class="border-t border-base-300 p-4">
			<div class="flex items-center gap-2">
				<textarea
					bind:this={messageInput}
					bind:value={currentMessage}
					on:keypress={handleKeyPress}
					placeholder={conversation.length === 0 ? "What's on your mind today?" : "Continue the conversation..."}
					class="textarea textarea-bordered flex-1 resize-none"
					rows="3"
					disabled={isLoading || isProcessing}
				></textarea>
				<button 
					class="btn btn-primary btn-square"
					on:click={conversation.length === 0 ? startConversation : addMessage}
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
				When you're ready, click "Complete Entry" to generate insights, extract key themes, and gain XP for your character stats.
			</div>
		</div>
	</div>
</div>

<!-- Processing Dialog with Character Stat Selection -->
{#if showProcessingDialog}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="modal-box max-w-xl">
			<h3 class="font-bold text-lg mb-4 flex items-center gap-2">
				<Award size={20} />
				Assign XP to Character Stats
			</h3>
			
			<div class="py-2 mb-4">
				<p class="text-base-content/80 text-sm">
					Link this journal entry to character stats to gain XP and track your growth.
					Select which areas of personal development this entry relates to.
				</p>
			</div>
			
			<div class="border border-base-300 rounded-lg bg-base-200 p-4">
				<StatSelector bind:selectedStats={selectedStats} />
			</div>
			
			<div class="modal-action">
				<button 
					class="btn btn-ghost" 
					on:click={() => showProcessingDialog = false}
					disabled={isProcessing || savingStats}
				>
					Cancel
				</button>
				<button 
					class="btn btn-primary" 
					on:click={completeProcessing}
					disabled={isProcessing || savingStats}
				>
					{#if isProcessing || savingStats}
						<span class="loading loading-spinner loading-sm"></span>
						Processing...
					{:else}
						Complete Journal Entry
						{#if selectedStats.length > 0}
							(+{selectedStats.reduce((sum, stat) => sum + stat.xpAmount, 0)} XP)
						{/if}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
